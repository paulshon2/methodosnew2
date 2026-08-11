"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store/app-store";
import { aiComplete } from "@/lib/engine";
import {
  loadSsStatsGuide, defaultCsvSample, type SsStatsGuide, type SsPhase, type SsTechnique,
} from "@/lib/ss-stats-guide";
import { runSsAutomation, type SsAutoResult } from "@/lib/ss-stats-automation";
import {
  enrichPrep, enrichDataTask, csvFormatGuide, cleanAutomationProcess,
  DEMO_SURVEY_CSV, DEMO_CODING_TABLE, SS_STATS_GLOSSARY, type EnrichBlock,
} from "@/lib/ss-stats-enrich";
import { getSsTechniqueGlossary, getSsPhaseGlossary } from "@/lib/ss-stats-stage-glossary";
import { buildSsChartSpec } from "@/lib/ss-stats-charts";
import {
  chooseStatsExecMode,
  estimateCsvShape,
  type StatsExecMode,
} from "@/lib/stats-runtime";
import { runViaStatsRuntime } from "@/lib/stats-client";
import { mapSsTechToCode, SERVER_READY_CODES } from "@/lib/stats-technique-map";
import { useAnnotation } from "./annotations";
import CaChart from "./ca-chart";

function levelColor(level: string) {
  if (/자동화/.test(level) && !/반/.test(level)) return { bg: "var(--ok-wash)", color: "var(--ok)" };
  return { bg: "var(--warn-wash)", color: "var(--warn)" };
}

function parseCsvLocal(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
  return { headers, rows };
}

function toCsv(headers: string[], rows: string[][]) {
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function CsvTable({ csv }: { csv: string }) {
  const { headers, rows } = parseCsvLocal(csv);
  if (!headers.length) return <p className="text-[11px] text-ink-3">표로 볼 데이터가 없습니다.</p>;
  return (
    <div className="overflow-x-auto rounded border" style={{ borderColor: "var(--color-border-tertiary)" }}>
      <table className="tbl text-[11px] w-full min-w-[420px]">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="bg-slate-100 sticky top-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 ? "bg-[var(--wash)]" : ""}>
              {headers.map((_, j) => (
                <td key={j} className={!row[j] ? "bg-amber-50 text-amber-800 italic" : ""}>
                  {row[j] === "" ? "(결측)" : row[j]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnrichPanel({ title, block, accent }: { title: string; block: EnrichBlock; accent: string }) {
  const [practice, setPractice] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  return (
    <div className="mb-3 rounded-lg border p-3" style={{ borderColor: accent, background: "rgba(255,255,255,.7)" }}>
      <div className="font-semibold text-[13px] mb-1.5" style={{ color: accent }}>{title}</div>
      <div className="mb-2">
        <div className="text-[10px] font-semibold text-ink-3 uppercase tracking-wide">쉽게 이해하기</div>
        <p className="text-ink-2 text-[12.5px] leading-relaxed">{block.meaning}</p>
      </div>
      <div className="mb-2">
        <div className="text-[10px] font-semibold text-ink-3">예시 2~3개</div>
        <ol className="list-decimal pl-4 text-[12px] text-ink-2 space-y-1">
          {block.examples.map((ex, i) => <li key={i}>{ex}</li>)}
        </ol>
      </div>
      <div className="mb-2">
        <div className="text-[10px] font-semibold text-ink-3">프로세스 · 테스크</div>
        <ol className="space-y-1.5 mt-1">
          {block.process.map((p, i) => (
            <li key={i} className="flex gap-2 text-[12px]">
              <span className="shrink-0 font-semibold text-[11px] px-1.5 py-0.5 rounded" style={{ background: accent + "22", color: accent }}>{p.step}</span>
              <span className="text-ink-2">{p.task}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="mb-2">
        <div className="text-[10px] font-semibold text-ink-3">샘플 서식 (초보자용)</div>
        <div className="overflow-x-auto mt-1">
          <table className="tbl text-[11px] w-full">
            <thead><tr><th>항목</th><th>안내</th><th>작성 예시</th></tr></thead>
            <tbody>
              {block.sampleForm.map((f) => (
                <tr key={f.field}><td className="font-medium whitespace-nowrap">{f.field}</td><td className="text-ink-3">{f.hint}</td><td>{f.sample}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded border border-dashed p-2.5" style={{ borderColor: accent }}>
        <div className="text-[11px] font-semibold mb-1">예비테스트 기입란</div>
        <p className="text-[11px] text-ink-3 mb-2">{block.practicePrompt}</p>
        <div className="grid md:grid-cols-2 gap-2">
          {block.practiceFields.map((f) => (
            <label key={f.id} className="block text-[11px]">
              <span className="font-medium">{f.label}</span>
              <input
                className="inp w-full mt-0.5 text-[12px]"
                placeholder={f.placeholder}
                value={practice[f.id] || ""}
                onChange={(e) => setPractice((s) => ({ ...s, [f.id]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-sm mt-2"
          onClick={() => setChecked(true)}
        >
          예비테스트 점검
        </button>
        {checked && (
          <p className="text-[11.5px] mt-1.5 text-emerald-700">
            기입 {Object.values(practice).filter(Boolean).length}/{block.practiceFields.length}항 —
            {Object.values(practice).filter(Boolean).length >= Math.ceil(block.practiceFields.length / 2)
              ? " 준비 메모가 충분합니다. 아래 데이터·분석으로 이어가세요."
              : " 빈 칸을 더 채운 뒤 다시 점검해 보세요."}
          </p>
        )}
      </div>
    </div>
  );
}

function CodingConverter({
  rawCsv, onApply,
}: {
  rawCsv: string;
  onApply: (csv: string) => void;
}) {
  const [codingText, setCodingText] = useState(DEMO_CODING_TABLE);
  const [source, setSource] = useState(rawCsv || DEMO_SURVEY_CSV);
  const [out, setOut] = useState("");
  const [mode, setMode] = useState<"decode" | "encode">("decode");
  const [msg, setMsg] = useState("");

  useEffect(() => { setSource(rawCsv || DEMO_SURVEY_CSV); }, [rawCsv]);

  const runConvert = () => {
    const codeMap = new Map<string, Map<string, string>>(); // var -> code -> label (decode) or label -> code
    parseCsvLocal(codingText).rows.forEach((r) => {
      const [v, code, label] = r;
      if (!v || code === undefined) return;
      if (!codeMap.has(v)) codeMap.set(v, new Map());
      if (mode === "decode") codeMap.get(v)!.set(code, label || code);
      else codeMap.get(v)!.set(label || code, code);
    });
    const { headers, rows } = parseCsvLocal(source);
    const converted = rows.map((row) =>
      row.map((cell, i) => {
        const h = headers[i];
        const m = codeMap.get(h);
        if (!m || cell === "") return cell;
        return m.get(cell) ?? cell;
      }),
    );
    const csv = toCsv(headers, converted);
    setOut(csv);
    setMsg(mode === "decode" ? "숫자→라벨 변환 완료. ‘분석 데이터로 적용’을 누르면 CSV에 반영됩니다." : "라벨→숫자 변환 완료.");
  };

  return (
    <div className="mb-3 rounded-lg border p-3 bg-sky-50/40" style={{ borderColor: "var(--info)" }}>
      <div className="font-semibold text-[13px] text-sky-800 mb-1">변수값 코딩표 변환기</div>
      <p className="text-[11.5px] text-ink-2 mb-2">
        전체 응답 원자료와 코딩표(변수,코드,라벨)를 넣으면 숫자↔라벨을 변환합니다. 코딩표가 없으면 숫자 의미를 알 수 없어 오분류 위험이 있습니다.
      </p>
      <div className="flex flex-wrap gap-2 mb-2">
        <button type="button" className={`btn btn-sm ${mode === "decode" ? "btn-primary" : ""}`} onClick={() => setMode("decode")}>숫자 → 라벨</button>
        <button type="button" className={`btn btn-sm ${mode === "encode" ? "btn-primary" : ""}`} onClick={() => setMode("encode")}>라벨 → 숫자</button>
        <button type="button" className="btn btn-sm" onClick={() => { setSource(DEMO_SURVEY_CSV); setCodingText(DEMO_CODING_TABLE); }}>예시 불러오기</button>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        <label className="block text-[11px]">
          <span className="font-semibold">원자료 CSV</span>
          <textarea className="inp w-full font-mono text-[10.5px] min-h-[110px] mt-0.5" value={source} onChange={(e) => setSource(e.target.value)} />
        </label>
        <label className="block text-[11px]">
          <span className="font-semibold">코딩표 (변수,코드,라벨)</span>
          <textarea className="inp w-full font-mono text-[10.5px] min-h-[110px] mt-0.5" value={codingText} onChange={(e) => setCodingText(e.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <button type="button" className="btn btn-sm btn-primary" onClick={runConvert}>변환 실행</button>
        {out && <button type="button" className="btn btn-sm" onClick={() => { onApply(out); setMsg("분석용 CSV에 적용했습니다."); }}>분석 데이터로 적용</button>}
      </div>
      {msg && <p className="text-[11px] text-sky-800 mt-1">{msg}</p>}
      {out && (
        <div className="mt-2">
          <div className="text-[10px] font-semibold text-ink-3 mb-1">변환 결과 미리보기</div>
          <CsvTable csv={out} />
        </div>
      )}
    </div>
  );
}

function FileImportBar({ onCsv }: { onCsv: (csv: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");

  const handleFile = async (file: File) => {
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith(".csv") || name.endsWith(".txt") || name.endsWith(".tsv")) {
        const text = await file.text();
        const csv = name.endsWith(".tsv") ? text.replace(/\t/g, ",") : text;
        onCsv(csv.trim());
        setStatus(`불러옴: ${file.name} (${csv.trim().split(/\n/).length}행)`);
        return;
      }
      if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        onCsv(csv.trim());
        setStatus(`엑셀 불러옴: ${file.name} · 시트 ${wb.SheetNames[0]}`);
        return;
      }
      setStatus("CSV 또는 Excel(.xlsx) 파일만 지원합니다.");
    } catch (e) {
      setStatus(`불러오기 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,.tsv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <button type="button" className="btn btn-sm" onClick={() => inputRef.current?.click()}>
        엑셀·CSV 불러오기
      </button>
      <button type="button" className="btn btn-sm" onClick={() => { onCsv(DEMO_SURVEY_CSV); setStatus("예시 설문 원자료를 넣었습니다."); }}>
        예시 데이터 넣기
      </button>
      {status && <span className="text-[11px] text-ink-3">{status}</span>}
    </div>
  );
}

function TechniqueCard({
  phaseId, tech, settings, pid, open, onToggle,
}: {
  phaseId: string;
  tech: SsTechnique;
  settings: ReturnType<typeof useStore.getState>["settings"];
  pid: string;
  open: boolean;
  onToggle: () => void;
}) {
  const getCa = useStore((s) => s.getCa);
  const setCa = useStore((s) => s.setCa);
  const storeKey = `${phaseId}::${tech.id}`;
  const saved = getCa(pid)[storeKey] as { csv?: string; result?: SsAutoResult; aiSample?: string; aiInterp?: string } | undefined;

  const guide = csvFormatGuide(tech, phaseId);
  const initialCsv = saved?.csv || (guide.demoCsv && /빈도/.test(tech.name) ? guide.demoCsv : defaultCsvSample(phaseId, tech));

  const [csv, setCsv] = useState(initialCsv);
  const stageGloss = useMemo(() => getSsTechniqueGlossary(phaseId, tech), [phaseId, tech]);
  const [result, setResult] = useState<SsAutoResult | null>(saved?.result || null);
  const [busy, setBusy] = useState<"" | "run" | "sample" | "interp">("");
  const [analysisCol, setAnalysisCol] = useState("");
  const [execMode, setExecMode] = useState<StatsExecMode | null>(null);
  const [execNote, setExecNote] = useState("");

  const prepBlock = useMemo(() => enrichPrep(tech), [tech]);
  const dataBlock = useMemo(() => enrichDataTask(tech), [tech]);
  const autoText = useMemo(() => cleanAutomationProcess(tech.automationProcess), [tech.automationProcess]);

  const { headers } = useMemo(() => parseCsvLocal(csv), [csv]);
  const runCsv = useMemo(() => {
    if (!analysisCol || !headers.includes(analysisCol)) return csv;
    const { headers: h, rows } = parseCsvLocal(csv);
    const idx = h.indexOf(analysisCol);
    if (idx < 0) return csv;
    return toCsv([analysisCol], rows.map((r) => [r[idx] ?? ""]));
  }, [csv, analysisCol, headers]);

  const chartSpec = useMemo(
    () => (open ? buildSsChartSpec(phaseId, tech.name, runCsv, result) : null),
    [open, phaseId, tech.name, runCsv, result],
  );

  const persist = (patch: Record<string, unknown>) => {
    setCa(pid, { [storeKey]: { ...saved, csv, result, ...patch } });
  };

  const run = async () => {
    setBusy("run");
    setExecNote("");
    try {
      const shape = estimateCsvShape(runCsv);
      const code = mapSsTechToCode(phaseId, tech.name);
      const mode = chooseStatsExecMode({
        techniqueCode: code,
        n: shape.n,
        p: shape.p,
        bootstrapB: code === "E-06" ? 5000 : 0,
      });
      setExecMode(mode);

      if (mode !== "browser" && SERVER_READY_CODES.has(code)) {
        const { headers: h, rows } = parseCsvLocal(runCsv);
        let payload: Record<string, unknown> = { headers: h, rows };
        if (code === "E-02" || code === "E-01") {
          payload = {
            headers: h,
            rows,
            yCol: h[h.length - 1],
            xCols: h.slice(0, -1),
            intercept: true,
          };
        } else if (code === "B-03") {
          const numIdx = h
            .map((_, i) => i)
            .filter((i) => rows.every((r) => Number.isFinite(parseFloat(r[i] ?? ""))));
          payload = {
            X: rows.map((r) => numIdx.map((i) => parseFloat(r[i]))),
            useCorrelation: true,
          };
        } else if (code === "E-06" && h.length >= 3) {
          const xi = 0;
          const mi = 1;
          const yi = 2;
          const x: number[] = [];
          const m: number[] = [];
          const y: number[] = [];
          for (const r of rows) {
            const xv = parseFloat(r[xi]);
            const mv = parseFloat(r[mi]);
            const yv = parseFloat(r[yi]);
            if ([xv, mv, yv].every(Number.isFinite)) {
              x.push(xv);
              m.push(mv);
              y.push(yv);
            }
          }
          payload = { x, m, y, B: 2000, seed: 42 };
        }
        const remote = await runViaStatsRuntime({
          techniqueCode: code,
          n: shape.n,
          p: shape.p,
          bootstrapB: code === "E-06" ? Number((payload as { B?: number }).B ?? 2000) : 0,
          payload,
        });
        if (remote.ok) {
          const r: SsAutoResult = {
            summary: `${tech.name} · 서버(${remote.exec}) · ${code}`,
            interpretation: `실행위치 ${remote.exec}.\n${JSON.stringify(remote.result).slice(0, 2000)}`,
            stats: remote.result as Record<string, number | string | boolean>,
          };
          setResult(r);
          persist({ csv, result: r });
          setExecNote(`서버 경로: ${remote.exec}`);
          return;
        }
        setExecNote(`서버 실패 → 브라우저 폴백`);
      } else if (mode !== "browser") {
        setExecNote(`권장=${mode} (${code}) · stats-core 미이식이라 브라우저 계산`);
      }

      const local = runSsAutomation(phaseId, tech.name, runCsv);
      setResult(local);
      persist({ csv, result: local });
    } finally {
      setBusy("");
    }
  };

  const aiSample = async () => {
    setBusy("sample");
    const prompt = `사회과학 통계 분석용 CSV 샘플 데이터만 출력하세요(설명 없이). 기법: ${tech.name}. 준비사항: ${tech.prep}. 필요 데이터: ${tech.dataTask}. 헤더 포함 8~15행, 쉼표 구분.`;
    const text = await aiComplete(prompt, settings);
    const sample = (text || "").replace(/```[a-z]*\n?/gi, "").trim();
    if (sample.includes(",")) {
      setCsv(sample);
      persist({ csv: sample, aiSample: sample });
    }
    setBusy("");
  };

  const aiInterp = async () => {
    setBusy("interp");
    const base = result ? JSON.stringify(result, null, 0).slice(0, 4000) : csv.slice(0, 2000);
    const prompt = `다음 ${tech.name} 분석 결과를 논문 「결과」절에 넣을 수 있는 한국어 해석문 2~3문단으로 작성하세요. 반자동화 항목이면 연구자가 추가로 판단해야 할 점을 bullet으로 덧붙이세요.\n\n${base}`;
    const text = await aiComplete(prompt, settings);
    persist({ aiInterp: text || "(AI 키 미설정 — 설정에서 API 키를 등록하세요.)" });
    setBusy("");
  };

  const lc = levelColor(tech.automationLevel);

  return (
    <div className="border rounded-lg mb-2" style={{ borderColor: "var(--color-border-tertiary)" }}>
      <button type="button" className="w-full text-left px-3 py-2.5 flex gap-2 items-start" onClick={onToggle}>
        <span className="text-[11px] px-1.5 py-0.5 rounded shrink-0" style={{ background: lc.bg, color: lc.color }}>{tech.automationLevel || "반자동화"}</span>
        <span className="flex-1">
          <strong className="text-[13px]">{tech.name}</strong>
          {tech.category && <span className="text-[11px] text-ink-3 ml-2">{tech.category}</span>}
        </span>
        <span className="text-[11px] text-ink-3">{open ? "접기" : "펼치기"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 text-[12.5px] leading-relaxed">
          {stageGloss.length > 0 && (
            <div className="mb-2 rounded border p-2 text-[11.5px]" style={{ borderColor: "var(--brand)", background: "var(--brand-soft)" }}>
              <div className="font-semibold mb-1" style={{ color: "var(--brand-ink)" }}>이 단계 용어 (왼쪽 주석과 동일)</div>
              <ul className="space-y-1">
                {stageGloss.map((g) => (
                  <li key={g.term}><span className="font-semibold">{g.term}</span><span className="text-ink-2"> · {g.def}</span></li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-ink-2 mb-2">{tech.example}</p>
          <div className="grid md:grid-cols-2 gap-2 mb-2">
            <div className="p-2 rounded" style={{ background: "var(--wash)" }}><div className="text-[10px] font-semibold text-ink-3">쉬운 비유</div>{tech.analogy}</div>
            <div className="p-2 rounded" style={{ background: "var(--wash)" }}><div className="text-[10px] font-semibold text-ink-3">명칭 유래</div>{tech.etymology}</div>
          </div>

          <div className="mb-1"><strong>분석 전 준비</strong><p className="text-ink-2 text-[12px]">{tech.prep}</p></div>
          <EnrichPanel title="분석 전 준비 — 초보자 가이드" block={prepBlock} accent="var(--fam-survey)" />

          <div className="mb-1">
            <strong>필요 데이터·테스크</strong>
            <p className="text-ink-2 text-[12px]">{tech.dataTask}</p>
            <p className="text-[11px] text-ink-3">{tech.dataWhy}</p>
          </div>
          <EnrichPanel title="필요 데이터·테스크 — 초보자 가이드" block={dataBlock} accent="var(--fam-qual)" />

          <FileImportBar onCsv={(c) => { setCsv(c); persist({ csv: c }); }} />
          <CodingConverter rawCsv={csv} onApply={(c) => { setCsv(c); persist({ csv: c }); }} />

          {"keyStats" in tech && tech.keyStats && (
            <div className="mb-2"><strong>주요 통계량</strong><p>{tech.keyStats}</p><p className="text-ink-3">{tech.postHoc}</p></div>
          )}
          <div className="mb-2 text-[11.5px]"><strong>자동화 프로세스</strong><p>{autoText}</p></div>

          <div className="mb-2 rounded-lg border p-2.5" style={{ borderColor: "var(--color-border-secondary)", background: "var(--brand-soft)" }}>
            <label className="text-[12px] font-semibold">데이터 CSV (서식 예시·편집)</label>
            <p className="text-[12px] text-ink-2 mt-1 mb-1.5">{guide.why}</p>
            <ul className="list-disc pl-4 text-[11px] text-ink-3 mb-2">
              {guide.tips.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <div className="text-[10px] font-semibold text-ink-3 mb-1">표로 보기 (시각적 구분 · 빈칸=결측)</div>
            <CsvTable csv={csv} />
            {headers.length > 1 && (
              <label className="block text-[11px] mt-2 mb-1">
                분석에 사용할 열(빈도 등 단변량)
                <select className="inp w-full mt-0.5" value={analysisCol} onChange={(e) => setAnalysisCol(e.target.value)}>
                  <option value="">전체 CSV 그대로</option>
                  {headers.filter((h) => !/^id$/i.test(h)).map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
            )}
            <textarea className="inp w-full font-mono text-[11px] min-h-[100px] mt-2" value={csv} onChange={(e) => setCsv(e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            <button className="btn btn-sm btn-primary" disabled={!!busy} onClick={run}>{busy === "run" ? "계산 중…" : "절차적 자동 분석"}</button>
            <button className="btn btn-sm" disabled={!!busy} onClick={aiSample}>{busy === "sample" ? "작성 중…" : "AI 샘플 CSV 작성"}</button>
            <button className="btn btn-sm" disabled={!!busy || !result} onClick={aiInterp}>{busy === "interp" ? "해석 중…" : "AI 결과 해석"}</button>
          </div>
          {(execMode || execNote) && (
            <p className="text-[11px] text-ink-3 mb-2">
              실행위치: <strong>{execMode || "—"}</strong>
              {execNote ? ` · ${execNote}` : ""}
            </p>
          )}

          {chartSpec && (
            <div className="mb-2">
              <div className="text-[11px] font-semibold mb-1">단계 데이터 시각화</div>
              <CaChart spec={chartSpec} />
            </div>
          )}

          {result && (
            <div className="p-2.5 rounded border" style={{ borderColor: "var(--brand)" }}>
              <div className="font-semibold mb-1">{result.summary}</div>
              <p className="text-ink-2 mb-2">{result.interpretation}</p>
              {result.cols && result.rows && (
                <table className="tbl text-[11px] w-full">
                  <thead><tr>{result.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                  <tbody>{result.rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
                </table>
              )}
            </div>
          )}
          {saved?.aiInterp && <div className="mt-2 p-2 rounded text-[12px]" style={{ background: "var(--brand-soft)" }}>{saved.aiInterp}</div>}
        </div>
      )}
    </div>
  );
}

export default function SsStatsWorkbench({
  pid, title, nav,
}: {
  pid: string;
  title: string;
  nav: (r: string) => void;
}) {
  const settings = useStore((s) => s.settings);
  const { replace } = useAnnotation();
  const [guide, setGuide] = useState<SsStatsGuide | null>(null);
  const [phaseId, setPhaseId] = useState<SsPhase["id"]>("descriptive");
  const [glossOpen, setGlossOpen] = useState(true);
  const [glossQ, setGlossQ] = useState("");
  const [activeTechId, setActiveTechId] = useState<string | null>(null);

  useEffect(() => { loadSsStatsGuide().then(setGuide); }, []);

  const phase = guide?.phases.find((p) => p.id === phaseId);
  const activeTech = phase?.techniques.find((t) => t.id === activeTechId) || null;

  // 왼쪽 「용어 주석」: 펼친 기법 → 해당 단계 용어 / 아니면 페이즈 대표 용어
  useEffect(() => {
    if (activeTech) {
      replace(getSsTechniqueGlossary(phaseId, activeTech));
    } else {
      replace(getSsPhaseGlossary(phaseId));
    }
  }, [phaseId, activeTech, replace]);

  const handlePhase = (id: SsPhase["id"]) => {
    setPhaseId(id);
    setActiveTechId(null);
  };

  const handleTechToggle = (techId: string) => {
    setActiveTechId((prev) => (prev === techId ? null : techId));
  };

  const gloss = useMemo(() => {
    const base = activeTech
      ? getSsTechniqueGlossary(phaseId, activeTech)
      : SS_STATS_GLOSSARY;
    const q = glossQ.trim().toLowerCase();
    if (!q) return base;
    return base.filter((g) => g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q));
  }, [glossQ, phaseId, activeTech]);

  return (
    <div className="text-[14px]">
      <button className="btn btn-sm mb-2.5" onClick={() => nav("methods")}>← 방법</button>
      <h1 className="text-[22px] font-semibold">{title}</h1>
      <p className="text-[13px] text-ink-2 mb-3">
        사회과학 통계분석 — 기초통계·가정검토·추론통계. 각 기법별 준비 설명·샘플 서식·예비테스트 기입란·CSV/엑셀 불러오기·코딩표 변환·표·그래프.
      </p>
      {guide?.overview && (
        <div className="card mb-3 text-[12px] text-ink-2">
          <strong>가이드 개요</strong>
          <ul className="list-disc pl-5 mt-1">
            {Object.entries(guide.overview).map(([k, v]) => <li key={k}><span className="font-medium">{k}:</span> {v.slice(0, 160)}…</li>)}
          </ul>
        </div>
      )}
      <div className="flex gap-1 flex-wrap mb-4">
        {guide?.phases.map((p) => (
          <button key={p.id} className={`btn btn-sm ${phaseId === p.id ? "btn-primary" : ""}`} onClick={() => handlePhase(p.id)}>{p.title}</button>
        ))}
      </div>
      {phase && phase.techniques.map((tech) => (
        <TechniqueCard
          key={tech.id}
          phaseId={phaseId}
          tech={tech}
          settings={settings}
          pid={pid}
          open={activeTechId === tech.id}
          onToggle={() => handleTechToggle(tech.id)}
        />
      ))}

      <div className="mt-6 rounded-lg border p-3" style={{ borderColor: "var(--color-border-secondary)" }}>
        <button type="button" className="w-full text-left flex justify-between items-center" onClick={() => setGlossOpen(!glossOpen)}>
          <strong className="text-[15px]">
            용어주석 {activeTech ? `· ${activeTech.name}` : "(기초·가정·추론 공통)"}
          </strong>
          <span className="text-[12px] text-ink-3">{glossOpen ? "접기" : "펼치기"} · {gloss.length}항</span>
        </button>
        {glossOpen && (
          <div className="mt-2">
            <p className="text-[12px] text-ink-2 mb-2">
              {activeTech
                ? `「${activeTech.name}」 단계에 나오는 학술·통계 용어를 쉬운 예시로 정리했습니다.`
                : "학술·통계 용어를 쉬운 예시와 함께 정리했습니다. 분석 항목을 펼치면 왼쪽 주석과 여기가 그 단계 용어로 바뀝니다."}
            </p>
            <input className="inp w-full mb-2 text-[12px]" placeholder="용어 검색 (예: 결측, VIF, ANOVA)" value={glossQ} onChange={(e) => setGlossQ(e.target.value)} />
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="tbl text-[12px] w-full">
                <thead><tr><th className="whitespace-nowrap w-[28%]">용어</th><th>쉬운 설명 · 예시</th></tr></thead>
                <tbody>
                  {gloss.map((g) => (
                    <tr key={g.term}><th className="text-left align-top font-semibold">{g.term}</th><td className="text-ink-2">{g.def}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
