"use client";
/**
 * Methodos 기법 한 개 — 자료 → 변수·옵션 → 결과.
 * 자료와 계산은 모두 이 브라우저 안에서 이루어진다(웹 워커). 서버로 보내지 않는다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import Note from "@/components/ui/Note";
import MethodosTabs from "@/components/methodos/MethodosTabs";
import DesignedViz from "@/components/methodos/DesignedViz";
import { applyPrep, type PrepOp } from "@/lib/methodos/prep";
import { hydrateMethodosHistory, useMethodosSession } from "@/lib/methodos/session";
import { loadExampleCsv, loadMethodosCatalog, loadMethodosVerification, type MCatalog, type MEntry, type MOption, type MSlot, type MVerification } from "@/lib/methodos/catalog";
import { runInWorker } from "@/lib/methodos/client";
import { parseCSV } from "@/lib/methodos/core";
import type { MResult } from "@/lib/methodos/types";
import MethodosResult from "./MethodosResult";

const card = "rounded-2xl border p-4 md:p-5";
const cardStyle = { borderColor: "var(--color-border-tertiary)" };
const MAX_BYTES = 12 * 1024 * 1024;

type Slots = Record<string, string[]>;

function colKinds(csv: string) {
  try {
    const t = parseCSV(csv);
    const kinds: Record<string, "수치" | "범주"> = {};
    for (const h of t.headers) {
      const vals = t.cols[h].filter((v) => v !== null);
      kinds[h] = vals.length && vals.every((v) => typeof v === "number") ? "수치" : "범주";
    }
    return { headers: t.headers, n: t.n, kinds, rows: t.headers.length ? Array.from({ length: Math.min(6, t.n) }, (_, i) => t.headers.map((h) => t.cols[h][i])) : [], ok: true as const };
  } catch {
    return { headers: [] as string[], n: 0, kinds: {} as Record<string, "수치" | "범주">, rows: [] as unknown[][], ok: false as const };
  }
}

function defaultOptions(entry: MEntry): Record<string, any> {
  const o: Record<string, any> = {};
  for (const op of entry.options) if (op.default !== undefined && op.default !== null && op.type !== "variables") o[op.id] = op.default;
  return o;
}

export default function MethodosStudio({ code, nav }: { code: string; nav: (r: string) => void }) {
  const [entry, setEntry] = useState<MEntry | null>(null);
  const [ver, setVer] = useState<MVerification | null>(null);
  const [err, setErr] = useState("");
  const [cat, setCat] = useState<MCatalog | null>(null);
  const csv = useMethodosSession((s) => s.csv);
  const fileLabel = useMethodosSession((s) => s.fileLabel);
  const setData = useMethodosSession((s) => s.setData);
  const addRun = useMethodosSession((s) => s.addRun);
  const setCsv = (t: string) => setData(t, useMethodosSession.getState().fileLabel);
  const setFileLabel = (l: string) => setData(useMethodosSession.getState().csv, l);
  const [prepLog, setPrepLog] = useState<string[]>([]);
  const [prepErr, setPrepErr] = useState("");
  const [prepOp, setPrepOp] = useState<PrepOp["kind"]>("select");
  const [pv, setPv] = useState({ variable: "", op: "=" as "=", value: "", min: "1", max: "5", map: "", name: "", vars: [] as string[] });
  const [slots, setSlots] = useState<Slots>({});
  const [options, setOptions] = useState<Record<string, any>>({});
  const [hidden, setHidden] = useState<Record<string, any>>({});
  const [running, setRunning] = useState(false);
  const [res, setRes] = useState<{ result: MResult; ms: number } | null>(null);
  const [runErr, setRunErr] = useState("");
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    hydrateMethodosHistory();
    setEntry(null); setRes(null); setRunErr(""); setSlots({}); setOptions({}); setHidden({});
    loadMethodosCatalog().then((c) => {
      setCat(c);
      const e = c.items.find((m) => m.code === code) || null;
      setEntry(e);
      if (e) setOptions(defaultOptions(e));
      else setErr(`알 수 없는 기법입니다: ${code}`);
    }).catch((x) => setErr(String(x?.message || x)));
    loadMethodosVerification().then(setVer);
  }, [code]);

  const info = useMemo(() => (csv ? colKinds(csv) : null), [csv]);

  const applyCsv = useCallback((text: string, label: string) => {
    const t = colKinds(text);
    if (!t.ok || !t.headers.length || !t.n) { setErr("첫 줄을 변수 이름으로 읽지 못했습니다. 쉼표로 구분된 표인지 확인해 주세요."); return; }
    setErr(""); setData(text, label); setPrepLog([]); setSlots({}); setRes(null); setRunErr(""); setHidden({});
    if (entry) setOptions(defaultOptions(entry));
  }, [entry]);

  const loadExample = useCallback(async () => {
    if (!entry) return;
    try {
      const text = await loadExampleCsv(entry);
      const t = colKinds(text);
      setErr(""); setData(text, `${entry.code} 예제 자료`); setPrepLog([]); setRes(null); setRunErr("");
      setSlots(Object.fromEntries(Object.entries(entry.example.slots).filter(([k]) => entry.slots.some((s) => s.id === k))));
      const ex = entry.example.options || {};
      const shown: Record<string, any> = defaultOptions(entry); const hid: Record<string, any> = {};
      for (const [k, v] of Object.entries(ex)) { if (entry.options.some((o) => o.id === k)) shown[k] = v; else hid[k] = v; }
      for (const k of Object.keys(entry.example.slots)) if (!entry.slots.some((s) => s.id === k)) hid[`__slot_${k}`] = entry.example.slots[k];
      setOptions(shown); setHidden(hid);
      void t;
    } catch (e: any) { setErr(String(e?.message || e)); }
  }, [entry]);

  const onFile = useCallback(async (f: File) => {
    if (f.size > MAX_BYTES) { setErr("파일이 12MB를 넘습니다. 필요한 열만 남겨 다시 저장한 뒤 올려 주세요."); return; }
    try {
      let text: string;
      if (/\.xlsx?$/i.test(f.name)) { const wb = XLSX.read(await f.arrayBuffer(), { type: "array" }); text = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]); }
      else {
        const buf = await f.arrayBuffer();
        text = new TextDecoder("utf-8").decode(buf);
        if (text.includes("�")) { try { text = new TextDecoder("euc-kr").decode(buf); } catch { /* keep utf-8 */ } }
      }
      applyCsv(text, f.name);
    } catch { setErr("파일을 읽지 못했습니다."); }
  }, [applyCsv]);

  const missing = useMemo(() => {
    if (!entry) return [] as string[];
    const out: string[] = [];
    for (const s of entry.slots) if ((slots[s.id]?.length ?? 0) < s.min) out.push(`${s.label}${s.min > 1 ? ` (${s.min}개 이상)` : ""}`);
    return out;
  }, [entry, slots]);

  const run = useCallback(() => {
    if (!entry || !csv) return;
    setRunning(true); setRunErr(""); setRes(null);
    const opts: Record<string, any> = { ...hidden };
    for (const k of Object.keys(opts)) if (k.startsWith("__slot_")) delete opts[k];
    Object.assign(opts, options);
    const sl: Slots = { ...slots };
    for (const [k, v] of Object.entries(hidden)) if (k.startsWith("__slot_") && !sl[k.slice(7)]) sl[k.slice(7)] = v;
    const { promise, cancel } = runInWorker(entry.code, csv, sl, opts);
    cancelRef.current = cancel;
    promise.then((r) => { setRes(r); addRun({ code: entry.code, name: r.result.name, source: fileLabel || "붙여넣은 자료", ms: r.ms, slots: sl, options: opts, result: r.result }); }).catch((e) => setRunErr(String(e?.message || e))).finally(() => { setRunning(false); cancelRef.current = null; });
  }, [entry, csv, slots, options, hidden, addRun, fileLabel]);

  useEffect(() => () => { cancelRef.current?.(); }, []);

  if (err && !entry) return <div className="p-4 text-red-600">{err}</div>;
  if (!entry) return <div className="p-4 text-ink-3">기법 정보를 불러오는 중…</div>;

  const v = ver?.items?.[entry.code];

  return (
    <div>
      <MethodosTabs active="run" nav={nav} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label htmlFor="mth-pick" className="ty-label font-bold">기법 고르기</label>
        <select id="mth-pick" className="inp" style={{ maxWidth: 420 }} value={entry.code} onChange={(e) => nav(`basic-stats/${e.target.value}`)}>
          {["초급", "중급", "고급"].map((lv) => (
            <optgroup key={lv} label={lv}>
              {(cat?.items ?? []).filter((m) => m.level === lv).map((m) => <option key={m.code} value={m.code}>{m.code} {m.name}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: "var(--brand-soft)" }}>{entry.code}</span>
        <h1 className="ty-title">{entry.name}</h1>
        <span className="ty-label text-ink-3">{entry.english}</span>
      </div>
      <p className="ty-body mt-1.5 text-ink-2 prose-w">{entry.tagline || entry.question}</p>
      <div className="mt-1 text-[11.5px] text-ink-3">{entry.menuPath} · {entry.level} · 최소 {entry.minCases}사례</div>

      {entry.box.length > 0 && (
        <details className={`${card} mt-3`} style={cardStyle}>
          <summary className="cursor-pointer text-[13px] font-semibold">언제 쓰나 · 자료 모양 · 확인할 조건</summary>
          <div className="mt-2 space-y-2">
            {entry.box.map((b) => (
              <div key={b.k}>
                <div className="text-[12px] font-semibold text-ink-2">{b.k}</div>
                <p className="mt-0.5 whitespace-pre-line text-[12.5px] leading-relaxed text-ink-2">{b.v}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      <section className={`${card} mt-3`} style={cardStyle}>
        <h2 className="ty-section mb-1">① 자료</h2>
        <p className="ty-small mb-3 text-ink-2">올린 자료는 이 브라우저 안에서만 처리되고 서버로 전송되지 않습니다. 첫 줄이 변수 이름인 CSV·Excel 표를 쓰세요.</p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-sm btn-primary" onClick={loadExample}>예제 자료로 시작</button>
          <label className="btn btn-sm cursor-pointer">
            CSV·Excel 올리기
            <input type="file" accept=".csv,.txt,.xlsx,.xls,text/csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />
          </label>
          {fileLabel ? <span className="ty-label text-ink-3">{fileLabel}{info ? ` · ${info.n}행 × ${info.headers.length}열` : ""}</span> : null}
        </div>
        <label className="ty-label mt-3 block font-bold" htmlFor="mth-paste">또는 표를 그대로 붙여넣기</label>
        <textarea id="mth-paste" className="inp mt-1 font-mono" rows={4} placeholder={"ID,집단,점수\n1,A,62\n2,B,55"} value={csv} onChange={(e) => { setCsv(e.target.value); setFileLabel(""); setRes(null); }} />
        {err ? <Note level="risk" className="mt-3" title="자료를 읽지 못했습니다">{err}</Note> : null}
        {info && info.headers.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-xl border" style={cardStyle}>
            <table className="w-full min-w-max border-collapse text-[11.5px]">
              <thead><tr style={{ background: "var(--color-background-secondary)" }}>{info.headers.map((h) => <th key={h} className="px-2 py-1 text-left font-semibold">{h}<span className="ml-1 font-normal text-ink-3">{info.kinds[h]}</span></th>)}</tr></thead>
              <tbody>{info.rows.map((r, i) => <tr key={i} className="border-t" style={cardStyle}>{r.map((c, j) => <td key={j} className="px-2 py-1 tabular-nums">{c === null ? "" : String(c)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      {info && info.headers.length > 0 && (
        <details className={`${card} mt-3`} style={cardStyle}>
          <summary className="cursor-pointer text-[13px] font-semibold">자료 준비 (사례 선택 · 역코딩 · 재부호화 · 중심화 · 표준화 · 로그 · 문항 평균){prepLog.length ? ` — ${prepLog.length}건 적용` : ""}</summary>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <select className="inp" style={{ maxWidth: 160 }} value={prepOp} onChange={(e) => setPrepOp(e.target.value as PrepOp["kind"])} aria-label="준비 작업">
              <option value="select">사례 선택</option><option value="reverse">역코딩</option><option value="recode">재부호화</option><option value="center">평균 중심화</option><option value="standardize">표준화(z)</option><option value="log">자연로그</option><option value="itemMean">문항 평균</option>
            </select>
            {prepOp !== "itemMean" ? (
              <select className="inp" style={{ maxWidth: 180 }} value={pv.variable} onChange={(e) => setPv({ ...pv, variable: e.target.value })} aria-label="변수">
                <option value="">— 변수 —</option>{info.headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            ) : (
              <div className="flex flex-wrap gap-1">{info.headers.map((h) => { const on = pv.vars.includes(h); return <button key={h} type="button" aria-pressed={on} className="rounded-lg border px-2 py-1 text-[12px]" style={{ ...cardStyle, background: on ? "var(--brand-soft)" : "transparent" }} onClick={() => setPv({ ...pv, vars: on ? pv.vars.filter((x) => x !== h) : [...pv.vars, h] })}>{on ? "✓ " : ""}{h}</button>; })}</div>
            )}
            {prepOp === "select" ? (<>
              <select className="inp" style={{ width: 70 }} value={pv.op} onChange={(e) => setPv({ ...pv, op: e.target.value as "=" })} aria-label="비교">{["=", "≠", ">", "≥", "<", "≤"].map((o) => <option key={o}>{o}</option>)}</select>
              <input className="inp" style={{ width: 110 }} placeholder="값" value={pv.value} onChange={(e) => setPv({ ...pv, value: e.target.value })} />
            </>) : null}
            {prepOp === "reverse" ? (<><input className="inp" style={{ width: 70 }} type="number" value={pv.min} onChange={(e) => setPv({ ...pv, min: e.target.value })} aria-label="최소" /><input className="inp" style={{ width: 70 }} type="number" value={pv.max} onChange={(e) => setPv({ ...pv, max: e.target.value })} aria-label="최대" /></>) : null}
            {prepOp === "recode" ? <input className="inp" style={{ width: 200 }} placeholder="1=3; 2=2; 3=1" value={pv.map} onChange={(e) => setPv({ ...pv, map: e.target.value })} /> : null}
            {prepOp !== "select" ? <input className="inp" style={{ width: 130 }} placeholder={prepOp === "itemMean" ? "새 변수 이름" : "새 변수 이름(선택)"} value={pv.name} onChange={(e) => setPv({ ...pv, name: e.target.value })} /> : null}
            <button type="button" className="btn btn-sm btn-primary" onClick={() => {
              try {
                let op: PrepOp;
                if (prepOp === "select") op = { kind: "select", variable: pv.variable, op: pv.op, value: pv.value };
                else if (prepOp === "itemMean") op = { kind: "itemMean", variables: pv.vars, name: pv.name || "문항평균" };
                else if (prepOp === "reverse") op = { kind: "reverse", variable: pv.variable, min: Number(pv.min), max: Number(pv.max), name: pv.name || undefined };
                else if (prepOp === "recode") op = { kind: "recode", variable: pv.variable, map: pv.map, name: pv.name || undefined };
                else op = { kind: prepOp, variable: pv.variable, name: pv.name || undefined } as PrepOp;
                const r = applyPrep(csv, op); setCsv(r.csv); setPrepLog([...prepLog, r.log]); setPrepErr(""); setRes(null);
              } catch (e: any) { setPrepErr(String(e?.message || e)); }
            }}>적용</button>
          </div>
          {prepErr ? <p className="mt-2 text-[12px] text-red-600">{prepErr}</p> : null}
          {prepLog.length ? <ol className="mt-2 list-decimal pl-5 text-[12px] text-ink-2">{prepLog.map((l, i) => <li key={i}>{l}</li>)}</ol> : null}
          <p className="ty-small mt-2 text-ink-3">변환은 이 브라우저의 자료에만 적용되며 원본 파일은 바뀌지 않습니다. 새 변수는 아래 변수 배정에 바로 나타납니다.</p>
        </details>
      )}

      {info && info.headers.length > 0 && (
        <section className={`${card} mt-3`} style={cardStyle}>
          <h2 className="ty-section mb-2">② 변수와 옵션</h2>
          <div className="space-y-4">
            {entry.slots.map((s) => (
              <SlotPicker key={s.id} slot={s} headers={info.headers} kinds={info.kinds} value={slots[s.id] ?? []} onChange={(vv) => { setSlots({ ...slots, [s.id]: vv }); setRes(null); }} />
            ))}
            {entry.options.map((o) => (
              <OptionField key={o.id} opt={o} headers={info.headers} slots={slots} value={options[o.id]} onChange={(vv) => { setOptions({ ...options, [o.id]: vv }); setRes(null); }} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-primary" disabled={running || missing.length > 0} onClick={run}>{running ? "계산 중…" : "분석 실행"}</button>
            {running ? <button type="button" className="btn btn-sm" onClick={() => cancelRef.current?.()}>취소</button> : null}
            {missing.length > 0 ? <span className="ty-label text-ink-3">필요한 변수: {missing.join(", ")}</span> : null}
          </div>
        </section>
      )}

      {runErr ? <Note level="risk" className="mt-3" title="계산하지 못했습니다" fix="변수 배정이 이 기법의 요구와 맞는지, 값이 비어 있거나 모두 같은 변수가 없는지 확인해 주세요.">{runErr}</Note> : null}

      {res && (
        <section className={`${card} mt-3`} style={cardStyle}>
          <MethodosResult res={res.result} ms={res.ms} fileBase={(fileLabel || entry.code).replace(/\.[^.]+$/, "")} />
          <DesignedViz result={res.result} slots={slots} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm" onClick={() => nav("basic-stats/charts")}>그래프 그리기에서 크게 보기</button>
            <button type="button" className="btn btn-sm" onClick={() => nav("basic-stats/results")}>통계분석결과 기록으로</button>
          </div>
          <div className="mt-4 border-t pt-3 text-[11.5px] text-ink-3" style={cardStyle}>
            {v ? (
              <>엔진 대조 — 예제 {v.exampleMatched}/{v.exampleCells}칸 일치 · 다양한 자료 {v.casesMatched}/{v.cases - v.casesEngineError}건 일치{v.note ? ` · ${v.note}` : ""}. </>
            ) : null}
            계산식은 Methodos 파이썬 엔진(R19)의 정의를 TypeScript 로 옮긴 것입니다. 난수를 쓰는 부분(부트스트랩·다중대체·시작값)은 씨앗값을 고정해도 파이썬과 난수열이 달라 구간 끝점이 조금 다를 수 있습니다.
          </div>
        </section>
      )}
    </div>
  );
}

function SlotPicker({ slot, headers, kinds, value, onChange }: { slot: MSlot; headers: string[]; kinds: Record<string, string>; value: string[]; onChange: (v: string[]) => void }) {
  const multi = slot.max === null || slot.max > 1;
  const wantNum = slot.types.some((t) => ["continuous", "integer", "count", "ordinal"].includes(t)) && !slot.types.some((t) => ["categorical", "binary", "nominal"].includes(t));
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-2">
        <label className="text-[13px] font-semibold" htmlFor={`slot-${slot.id}`}>{slot.label}</label>
        <span className="text-[11px] text-ink-3">{slot.min > 0 ? "필수" : "선택"}{multi ? ` · ${slot.min}~${slot.max ?? "여러"}개` : ""}</span>
      </div>
      {slot.description ? <p className="text-[11.5px] text-ink-3">{slot.description}</p> : null}
      {multi ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {headers.map((h) => {
            const on = value.includes(h);
            return (
              <button key={h} type="button" aria-pressed={on} className="rounded-lg border px-2 py-1 text-[12px]" style={{ ...cardStyle, background: on ? "var(--brand-soft)" : "transparent", borderColor: on ? "var(--brand)" : undefined, opacity: wantNum && kinds[h] === "범주" ? 0.55 : 1 }} onClick={() => onChange(on ? value.filter((x) => x !== h) : [...value, h])}>
                {on ? "✓ " : ""}{h}
              </button>
            );
          })}
        </div>
      ) : (
        <select id={`slot-${slot.id}`} className="inp mt-1.5" style={{ maxWidth: 360 }} value={value[0] ?? ""} onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}>
          <option value="">— 선택 —</option>
          {headers.map((h) => <option key={h} value={h}>{h} ({kinds[h]})</option>)}
        </select>
      )}
    </div>
  );
}

function OptionField({ opt, headers, slots, value, onChange }: { opt: MOption; headers: string[]; slots: Slots; value: any; onChange: (v: any) => void }) {
  const label = (
    <div className="flex flex-wrap items-baseline gap-2">
      <label className="text-[13px] font-semibold" htmlFor={`opt-${opt.id}`}>{opt.label}</label>
    </div>
  );
  const help = opt.help ? <p className="text-[11.5px] text-ink-3">{opt.help}</p> : null;
  if (opt.type === "number") {
    return <div>{label}{help}<input id={`opt-${opt.id}`} className="inp mt-1.5" style={{ maxWidth: 200 }} type="number" step={opt.step ?? "any"} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} /></div>;
  }
  if (opt.type === "choice") {
    const idx = Math.max(0, (opt.choices ?? []).findIndex((c) => c.value === value));
    return (
      <div>{label}{help}
        <select id={`opt-${opt.id}`} className="inp mt-1.5" style={{ maxWidth: 420 }} value={idx} onChange={(e) => onChange(opt.choices![Number(e.target.value)].value)}>
          {(opt.choices ?? []).map((c, i) => <option key={i} value={i}>{c.label}</option>)}
        </select>
      </div>
    );
  }
  if (opt.type === "text") {
    return <div>{label}{help}<input id={`opt-${opt.id}`} className="inp mt-1.5" style={{ maxWidth: 320 }} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></div>;
  }
  if (opt.type === "text_lines") {
    const t = Array.isArray(value) ? value.join("\n") : value ?? "";
    return <div>{label}{help}<textarea id={`opt-${opt.id}`} className="inp mt-1.5 font-mono" rows={4} placeholder={"예)\n학습시간 ~ 학업동기\n성적 ~ 학습시간 + 학업동기"} value={t} onChange={(e) => onChange(e.target.value.split(/\r?\n/))} /></div>;
  }
  if (opt.type === "number_list") {
    const t = Array.isArray(value) ? value.join(", ") : value ?? "";
    return <div>{label}{help}<input id={`opt-${opt.id}`} className="inp mt-1.5" style={{ maxWidth: 360 }} placeholder="쉼표로 구분 (예: 0.25, 0.5, 0.75)" value={t} onChange={(e) => onChange(e.target.value)} /></div>;
  }
  if (opt.type === "variables") {
    const cur: string[] = Array.isArray(value) ? value : value ? [value] : [];
    return (
      <div>{label}{help}
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {headers.map((h) => { const on = cur.includes(h); return <button key={h} type="button" aria-pressed={on} className="rounded-lg border px-2 py-1 text-[12px]" style={{ ...cardStyle, background: on ? "var(--brand-soft)" : "transparent", borderColor: on ? "var(--brand)" : undefined }} onClick={() => onChange(on ? cur.filter((x) => x !== h) : [...cur, h])}>{on ? "✓ " : ""}{h}</button>; })}
        </div>
      </div>
    );
  }
  if (opt.type === "variable_blocks") {
    const pool = slots.predictors ?? [];
    const blocks: string[][] = Array.isArray(value) && value.length ? value : pool.length ? [pool] : [];
    return (
      <div>{label}{help}
        {blocks.map((b, bi) => (
          <div key={bi} className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11.5px] font-semibold">단계 {bi + 1}</span>
            {pool.map((h) => { const on = b.includes(h); return <button key={h} type="button" aria-pressed={on} className="rounded-lg border px-2 py-1 text-[12px]" style={{ ...cardStyle, background: on ? "var(--brand-soft)" : "transparent", borderColor: on ? "var(--brand)" : undefined }} onClick={() => onChange(blocks.map((x, xi) => (xi === bi ? (on ? x.filter((y) => y !== h) : [...x, h]) : x)))}>{on ? "✓ " : ""}{h}</button>; })}
          </div>
        ))}
        <div className="mt-1.5 flex gap-2">
          <button type="button" className="btn btn-sm" onClick={() => onChange([...blocks, []])}>단계 추가</button>
          {blocks.length > 1 ? <button type="button" className="btn btn-sm" onClick={() => onChange(blocks.slice(0, -1))}>마지막 단계 삭제</button> : null}
        </div>
      </div>
    );
  }
  if (opt.type === "factor_map") {
    const pool = slots.items ?? [];
    const map: Record<string, string[]> = value && typeof value === "object" && Object.keys(value).length ? value : pool.length ? { F1: pool } : {};
    const names = Object.keys(map);
    return (
      <div>{label}{help}
        {names.map((fn) => (
          <div key={fn} className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <input className="inp" style={{ width: 110 }} value={fn} aria-label="요인 이름" onChange={(e) => { const nm = e.target.value || fn; const next: Record<string, string[]> = {}; for (const k of names) next[k === fn ? nm : k] = map[k]; onChange(next); }} />
            {pool.map((h) => { const on = map[fn].includes(h); return <button key={h} type="button" aria-pressed={on} className="rounded-lg border px-2 py-1 text-[12px]" style={{ ...cardStyle, background: on ? "var(--brand-soft)" : "transparent", borderColor: on ? "var(--brand)" : undefined }} onClick={() => onChange({ ...map, [fn]: on ? map[fn].filter((y) => y !== h) : [...map[fn], h] })}>{on ? "✓ " : ""}{h}</button>; })}
          </div>
        ))}
        <div className="mt-1.5 flex gap-2">
          <button type="button" className="btn btn-sm" onClick={() => onChange({ ...map, [`F${names.length + 1}`]: [] })}>요인 추가</button>
          {names.length > 1 ? <button type="button" className="btn btn-sm" onClick={() => { const next = { ...map }; delete next[names[names.length - 1]]; onChange(next); }}>마지막 요인 삭제</button> : null}
        </div>
      </div>
    );
  }
  return null;
}
