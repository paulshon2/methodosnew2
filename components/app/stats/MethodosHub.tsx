"use client";
/**
 * 통계방법 라이브러리 — Methodos 43기법을 훑어보고, 기법마다 연결된 분야별 예제를 골라 그 자리에서 실행한다.
 * 계산은 Methodos 파이썬 엔진(R19)과 같은 정의를 옮긴 TypeScript 로 브라우저 안에서 한다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MethodosTabs from "@/components/methodos/MethodosTabs";
import DesignedViz from "@/components/methodos/DesignedViz";
import Note from "@/components/ui/Note";
import { loadMethodosCatalog, loadMethodosVerification, type MCatalog, type MEntry, type MVerification } from "@/lib/methodos/catalog";
import { runInWorker } from "@/lib/methodos/client";
import { hydrateMethodosHistory, useMethodosSession } from "@/lib/methodos/session";
import MethodosResult from "./MethodosResult";

const card = "rounded-2xl border p-4 md:p-5";
const cardStyle = { borderColor: "var(--color-border-tertiary)" };
const LEVELS = ["초급", "중급", "고급"];

interface LibExample { id: string; label: string; csv: string; n: number | null; field: string | null; group: string | null; slots: Record<string, string[]>; options: Record<string, any> }
let libCache: Promise<Record<string, LibExample[]>> | null = null;
const loadLibrary = () => (libCache ??= fetch("/methodos/library.json").then((r) => r.json()));

export default function MethodosHub({ nav }: { nav: (r: string) => void }) {
  const [cat, setCat] = useState<MCatalog | null>(null);
  const [lib, setLib] = useState<Record<string, LibExample[]>>({});
  const [ver, setVer] = useState<MVerification | null>(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [lv, setLv] = useState<string>("전체");
  const [grp, setGrp] = useState<string>("전체");
  const [pickedCode, setPickedCode] = useState<string | null>(null);
  const [exId, setExId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [runErr, setRunErr] = useState("");
  const [ran, setRan] = useState<{ code: string; example: string } | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const { current, addRun, setData } = useMethodosSession();

  useEffect(() => {
    hydrateMethodosHistory();
    loadMethodosCatalog().then(setCat).catch((e) => setErr(String(e?.message || e)));
    loadMethodosVerification().then(setVer);
    loadLibrary().then(setLib).catch(() => setLib({}));
    return () => cancelRef.current?.();
  }, []);

  const groups = useMemo(() => ["전체", ...Array.from(new Set((cat?.items ?? []).map((m) => m.group).filter(Boolean)))], [cat]);
  const shown = useMemo(() => {
    if (!cat) return [] as MEntry[];
    const t = q.trim().toLowerCase();
    return cat.items.filter((m) => (lv === "전체" || m.level === lv) && (grp === "전체" || m.group === grp) && (!t || `${m.code} ${m.name} ${m.english} ${m.group} ${m.question}`.toLowerCase().includes(t)));
  }, [cat, q, lv, grp]);

  const picked = useMemo(() => cat?.items.find((m) => m.code === pickedCode) ?? null, [cat, pickedCode]);
  const examples = useMemo(() => (picked ? lib[picked.code] ?? [] : []), [picked, lib]);
  const example = useMemo(() => examples.find((e) => e.id === exId) ?? examples[0] ?? null, [examples, exId]);
  useEffect(() => { setExId(""); setRunErr(""); }, [pickedCode]);

  const runExample = useCallback(async () => {
    if (!picked || !example) return;
    setRunning(true); setRunErr("");
    try {
      const r = await fetch(`/methodos/data/${encodeURIComponent(example.csv)}`);
      if (!r.ok) throw new Error("예제 자료를 불러오지 못했습니다.");
      const csv = await r.text();
      const { promise, cancel } = runInWorker(picked.code, csv, example.slots, example.options);
      cancelRef.current = cancel;
      const out = await promise;
      setData(csv, example.csv);
      addRun({ code: picked.code, name: out.result.name, source: example.label, ms: out.ms, slots: example.slots, options: example.options, result: out.result });
      setRan({ code: picked.code, example: example.label });
    } catch (e: any) { setRunErr(String(e?.message || e)); } finally { setRunning(false); cancelRef.current = null; }
  }, [picked, example, addRun, setData]);

  if (err) return <div className="p-4 text-red-600">Methodos 기법 목록을 불러오지 못했습니다: {err}</div>;
  if (!cat) return <div className="p-4 text-ink-3">Methodos 기법 목록 불러오는 중…</div>;
  const v = picked ? ver?.items?.[picked.code] : undefined;
  const showRan = ran && picked && ran.code === picked.code && current && current.code === picked.code;

  return (
    <section aria-label="통계방법 라이브러리">
      <MethodosTabs active="library" nav={nav} />
      <div className={`${card} mb-4`} style={{ ...cardStyle, background: "var(--brand-soft)" }}>
        <div className="text-[13px] font-semibold">통계방법 라이브러리 · Methodos 43기법</div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
          기술통계부터 구조방정식·IRT·생존분석·메타분석까지 43가지입니다. 기법을 고르면 설명과 필요한 변수, 그 기법에 연결된 분야별 예제가 나오고, 예제를 그 자리에서 실행할 수 있습니다.
          계산은 <b>이 브라우저 안에서</b> 이루어지며 올린 자료는 서버로 전송되지 않습니다. 계산식은 Methodos 파이썬 엔진(R19)의 정의를 옮겼고 엔진 결과와 대조했습니다
          {ver ? ` (예제 ${Object.values(ver.items).reduce((a, b) => a + b.exampleMatched, 0)}/${Object.values(ver.items).reduce((a, b) => a + b.exampleCells, 0)}칸, 다양한 자료 ${Object.values(ver.items).reduce((a, b) => a + b.casesMatched, 0)}/${Object.values(ver.items).reduce((a, b) => a + b.cases - b.casesEngineError, 0)}건 일치).` : "."}
        </p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input className="inp" style={{ maxWidth: 300 }} placeholder="기법 이름·코드 검색 (예: t검정, M25, 생존)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="기법 검색" />
        {["전체", ...LEVELS].map((l) => <button key={l} type="button" className={`btn btn-sm ${lv === l ? "btn-primary" : ""}`} onClick={() => setLv(l)}>{l}</button>)}
        <select className="inp" style={{ maxWidth: 160 }} value={grp} onChange={(e) => setGrp(e.target.value)} aria-label="분석 갈래">
          {groups.map((g) => <option key={g} value={g}>{g === "전체" ? "분석 갈래 전체" : g}</option>)}
        </select>
        <span className="ty-label text-ink-3">{shown.length}개</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          {LEVELS.filter((l) => lv === "전체" || lv === l).map((l) => {
            const rows = shown.filter((m) => m.level === l);
            if (!rows.length) return null;
            return (
              <div key={l} className="mb-4">
                <h2 className="mb-2 text-[15px] font-semibold">{l} <span className="text-[12px] font-normal text-ink-3">({rows.length})</span></h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {rows.map((m) => (
                    <button key={m.code} type="button" aria-pressed={pickedCode === m.code} className="rounded-xl border p-3 text-left hover:border-[var(--brand)]" style={{ ...cardStyle, borderColor: pickedCode === m.code ? "var(--brand)" : undefined, background: pickedCode === m.code ? "var(--brand-soft)" : "transparent" }} onClick={() => { setPickedCode(m.code); setRan(null); }}>
                      <div className="flex items-center gap-2"><span className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold" style={{ background: "var(--brand-soft)" }}>{m.code}</span><span className="text-[13.5px] font-medium">{m.name}</span></div>
                      <div className="mt-1 text-[11px] text-ink-3">{m.english}</div>
                      <div className="mt-1.5 line-clamp-2 text-[11.5px] text-ink-2">{m.tagline || m.question}</div>
                      <div className="mt-1.5 text-[10.5px] text-ink-3">{m.group}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="xl:sticky xl:top-3 xl:self-start">
          {!picked ? (
            <div className={card} style={cardStyle}><p className="ty-small text-ink-2">왼쪽에서 기법을 고르면 설명·필요한 변수·예제가 여기에 나옵니다.</p></div>
          ) : (
            <div className={card} style={cardStyle}>
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: "var(--brand-soft)" }}>{picked.code}</span><h2 className="text-[17px] font-semibold">{picked.name}</h2></div>
              <div className="text-[11.5px] text-ink-3">{picked.english} · {picked.menuPath} · {picked.level} · 최소 {picked.minCases}사례</div>
              <p className="mt-2 text-[13px] text-ink-2">{picked.tagline || picked.question}</p>
              {picked.box.map((b) => (
                <div key={b.k} className="mt-2"><div className="text-[12px] font-semibold text-ink-2">{b.k}</div><p className="whitespace-pre-line text-[12.5px] leading-relaxed text-ink-2">{b.v}</p></div>
              ))}
              <div className="mt-3 text-[12px] font-semibold text-ink-2">필요한 변수</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12.5px] text-ink-2">
                {picked.slots.map((s) => <li key={s.id}><b>{s.label}</b> {s.min > 0 ? "(필수)" : "(선택)"} — {s.description}</li>)}
              </ul>
              {picked.effectSizes.length > 0 ? <p className="mt-2 text-[12px] text-ink-3">효과크기: {picked.effectSizes.join(" · ")}</p> : null}

              <div className="mt-4 border-t pt-3" style={cardStyle}>
                <div className="text-[13px] font-semibold">예제 ({examples.length || 1})</div>
                {examples.length > 0 ? (
                  <select className="inp mt-1.5" value={example?.id ?? ""} onChange={(e) => { setExId(e.target.value); setRan(null); }} aria-label="예제 고르기">
                    {examples.map((e) => <option key={e.id} value={e.id}>{e.label}{e.n ? ` · ${e.n}사례` : ""}</option>)}
                  </select>
                ) : <p className="ty-small mt-1 text-ink-3">이 기법의 예제를 불러오는 중…</p>}
                {example ? <p className="mt-1.5 text-[11.5px] text-ink-3">변수 배정: {Object.entries(example.slots).map(([k, vs]) => `${picked.slots.find((s) => s.id === k)?.label ?? k}=${vs.slice(0, 4).join("·")}${vs.length > 4 ? "…" : ""}`).join(" / ")}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn btn-primary" disabled={running || !example} onClick={runExample}>{running ? "계산 중…" : "예제 실행"}</button>
                  <button type="button" className="btn" onClick={() => nav(`basic-stats/${picked.code}`)}>이 기법으로 분석 실행 →</button>
                </div>
                {runErr ? <Note level="risk" className="mt-3" title="실행하지 못했습니다">{runErr}</Note> : null}
              </div>
              {v ? <p className="mt-3 text-[11px] text-ink-3">엔진 대조 — 예제 {v.exampleMatched}/{v.exampleCells}칸 · 다양한 자료 {v.casesMatched}/{v.cases - v.casesEngineError}건 일치{v.note ? ` · ${v.note}` : ""}</p> : null}
            </div>
          )}
        </aside>
      </div>

      {showRan && current ? (
        <div className={`${card} mt-4`} style={cardStyle}>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
            <span>예제 「{ran!.example}」 결과</span>
            <button type="button" className="btn btn-sm ml-auto" onClick={() => nav("basic-stats/results")}>통계분석결과에서 보기</button>
            <button type="button" className="btn btn-sm" onClick={() => nav("basic-stats/charts")}>그래프 그리기에서 보기</button>
          </div>
          <MethodosResult res={current.result} ms={current.ms} fileBase={current.code} />
          <DesignedViz result={current.result} slots={current.slots} />
        </div>
      ) : null}
    </section>
  );
}
