"use client";
/**
 * 기본통계 스튜디오 — 코딩 메뉴 하위 스토리형 워크벤치
 * v57: 모듈별 데모 12종 · 워크스페이스 저장 · 다중 시각화 · JPEG/PNG/PDF/엑셀 내보내기
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useStore } from "@/store/app-store";
import { aiComplete } from "@/lib/engine";
import {
  loadBasicStatsCurriculum,
  getModule,
  type BsCurriculum,
  type BsModule,
} from "@/lib/basic-stats-guide";
import { runBasicStats, parseCsv, downloadBlob, type BsResult } from "@/lib/basic-stats-engine";
import {
  getDemosForModule,
  previewCsv,
  columnGlossary,
  previewContextBlurb,
  ensurePracticeDemoCsv,
  BASIC_STATS_PRACTICE_N,
  type BsDemo,
} from "@/lib/basic-stats-demos";
import { BasicStatsSampleAccordion } from "./practice-sample-accordion";
import {
  ensureCharts,
  formatStatRows,
  buildFormalResultText,
  buildEasyResultText,
  buildVerifyPlain,
  explainVerifyCheck,
} from "@/lib/basic-stats-explain";
import { exportChartBundle } from "@/lib/viz-export";
import {
  chooseStatsExecMode,
  estimateCsvShape,
  type StatsExecMode,
} from "@/lib/stats-runtime";
import { runViaStatsRuntime } from "@/lib/stats-client";
import { mapBasicStatsModuleToCode, SERVER_READY_CODES } from "@/lib/stats-technique-map";
import {
  type CaChartSpec,
  type CaChartType,
  CA_CHART_META,
  ALL_CATEGORY_TYPES,
  ALL_MATRIX_TYPES,
  ALL_TREND_TYPES,
  ALL_RELATION_TYPES,
} from "@/lib/ca-charts";
import CaChart from "./ca-chart";

type Tab = "overview" | "steps" | "results";

const card = "rounded-2xl border p-4 md:p-5";
const cardStyle = { borderColor: "var(--color-border-tertiary)" };
const h1 = "text-[24px] font-semibold tracking-tight";
const h2 = "text-[16px] font-semibold";
const body = "text-[14px] leading-relaxed text-ink-2";

const CHART_FAMILY_HINTS = [
  "비교(Comparison) · 막대(Bar), 기둥(Column), 롤리팝(Lollipop), 덤벨(Dumbbell)…",
  "분포(Distribution) · 히스토그램(Histogram), 상자(Box), 바이올린(Violin)…",
  "관계(Relationship) · 산점도(Scatter), 거품(Bubble), 레이더(Radar)…",
  "추세(Trend) · 선(Line), 영역(Area), 기울기(Slope)…",
  "구성비(Part-to-Whole) · 원(Pie), 도넛(Donut), 트리맵(Treemap)…",
  "행렬(Matrix) · 히트맵(Heatmap), 상관(Correlation)…",
  "흐름(Flow) · 생키(Sankey), 아크(Arc)…",
  "연결망(Network) · 노드-링크(Node-Link)…",
];

function chartLabel(t: CaChartType) {
  return CA_CHART_META.find((m) => m.type === t)?.name || t;
}

/** 결과 해석·내보내기 — 주 그래프에서 데이터 형태에 맞는 다양한 시각화 후보 생성 */
function diversifyCharts(primary?: CaChartSpec | null): CaChartSpec[] {
  if (!primary?.labels?.length) return [];
  const out: CaChartSpec[] = [{ ...primary, title: primary.title || "주 분석 그래프" }];
  const seen = new Set<CaChartType>([primary.type]);

  let pool: CaChartType[] = [...ALL_CATEGORY_TYPES];
  if (primary.type === "heatmap" || (primary.cols?.length && primary.series.length > 1)) {
    pool = [...ALL_MATRIX_TYPES, "sankey", "arc", "streamgraph", "parallel"];
  } else if (primary.type === "scatter") {
    pool = ["scatter", "bubble", "dotstrip", "radar", "line", ...ALL_CATEGORY_TYPES];
  } else if (primary.type === "line" || primary.type === "area") {
    pool = [...ALL_TREND_TYPES, "bar", "scatter"];
  } else if (primary.type === "network") {
    pool = ["network", ...ALL_RELATION_TYPES];
  } else if (primary.type === "bar" || primary.type === "hbar") {
    pool = [...ALL_CATEGORY_TYPES, "pie", "donut", "treemap", "waffle", "radar", "histogram", "boxplot"];
  }

  for (const t of pool) {
    if (seen.has(t)) continue;
    seen.add(t);
    if (out.length >= 12) break;
    out.push({
      ...primary,
      type: t,
      title: `${primary.title || "결과"} · ${chartLabel(t)}`,
    });
  }
  return out;
}

function DataPreviewBlock({
  csv,
  demo,
  moduleName,
  moduleId,
  englishName,
}: {
  csv: string;
  demo: BsDemo | null;
  moduleName: string;
  moduleId: string;
  englishName?: string;
}) {
  const prev = previewCsv(csv, 8);
  const gloss = columnGlossary(demo, prev.headers);
  return (
    <div className="space-y-3">
      <p className={`${body} text-ink-2`}>{previewContextBlurb(demo, demo ? undefined : moduleName)}</p>
      {gloss.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={cardStyle}>
          <div className="px-3 py-2 text-[12px] text-ink-3 border-b" style={{ borderColor: "var(--color-border-tertiary)" }}>
            변수 설명 · {demo?.title || `${moduleName} (기본 샘플)`}
          </div>
          <table className="tbl text-[12px] w-full">
            <thead>
              <tr>
                <th>컬럼</th>
                <th>한글명</th>
                <th>의미</th>
              </tr>
            </thead>
            <tbody>
              {gloss.map((g) => (
                <tr key={g.key}>
                  <td className="font-mono text-[11px]">{g.key}</td>
                  <td>{g.label}</td>
                  <td className="text-ink-3">{g.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="rounded-xl border overflow-x-auto" style={cardStyle}>
        <div className="px-3 py-2 text-[12px] text-ink-3 border-b" style={{ borderColor: "var(--color-border-tertiary)" }}>
          데이터 미리보기 · 상위 {prev.rows.length}행 / 전체 {prev.total}행
          {demo ? ` · ${demo.title}` : ""}
          {prev.total >= BASIC_STATS_PRACTICE_N ? " · 연습 표준 n" : ""}
        </div>
        <table className="tbl text-[11px] w-full">
          <thead>
            <tr>
              {prev.headers.map((h, i) => (
                <th key={h}>
                  <span className="block font-medium">{gloss[i]?.label || h}</span>
                  <span className="block font-mono text-[10px] text-ink-3">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prev.rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <BasicStatsSampleAccordion
        moduleId={moduleId}
        moduleName={moduleName}
        englishName={englishName}
        demoTitle={demo?.title}
        csv={csv}
        defaultOpen={prev.total >= BASIC_STATS_PRACTICE_N}
      />
    </div>
  );
}

function DataIO({
  csv,
  setCsv,
  sample,
  moduleId,
  moduleName,
  englishName,
  result,
  demos,
  demoId,
  setDemoId,
  activeDemo,
}: {
  csv: string;
  setCsv: (v: string) => void;
  sample: string;
  moduleId: string;
  moduleName: string;
  englishName?: string;
  result: BsResult | null;
  demos: BsDemo[];
  demoId: string;
  setDemoId: (id: string) => void;
  activeDemo: BsDemo | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (/\.xlsx?$/i.test(f.name)) {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      setCsv(XLSX.utils.sheet_to_csv(sheet));
    } else {
      setCsv(await f.text());
    }
    setDemoId("");
    e.target.value = "";
  }
  function loadPracticeCsv(raw: string, key: string) {
    setCsv(ensurePracticeDemoCsv(raw, moduleId, key));
  }
  function exportCsv() {
    downloadBlob(`basic-stats-${moduleId}.csv`, csv || sample, "text/csv;charset=utf-8");
  }
  function exportJson() {
    const payload = { moduleId, csv, result, exportedAt: new Date().toISOString() };
    downloadBlob(`basic-stats-${moduleId}.json`, JSON.stringify(payload, null, 2), "application/json");
  }
  function exportXlsx() {
    const { headers, rows } = parseCsv(csv || sample);
    const aoa: (string | number)[][] = [headers, ...rows];
    if (result?.table) {
      aoa.push([]);
      aoa.push(["[결과표]"]);
      aoa.push(result.table.cols);
      result.table.rows.forEach((r) => aoa.push(r.map(String)));
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "data");
    const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    downloadBlob(`basic-stats-${moduleId}.xlsx`, new Uint8Array(out), "application/octet-stream");
  }
  const prev = previewCsv(csv || sample, 8);
  return (
    <div className="mb-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={onFile} />
        <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>불러오기</button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            loadPracticeCsv(sample, "curriculum");
            setDemoId("curriculum");
          }}
        >
          기본 데모
        </button>
        <button type="button" className="btn btn-sm" onClick={exportCsv}>CSV</button>
        <button type="button" className="btn btn-sm" onClick={exportXlsx}>엑셀</button>
        <button type="button" className="btn btn-sm" onClick={exportJson}>JSON</button>
        <button type="button" className="btn btn-sm" onClick={() => setPreviewOpen((v) => !v)}>
          {previewOpen ? "미리보기 접기" : "데이터 미리보기"}
        </button>
        <span className="text-[11px] text-ink-3">
          데모 {demos.length}종 · n≈{prev.total}
          {prev.total >= BASIC_STATS_PRACTICE_N ? ` (연습 표준 ${BASIC_STATS_PRACTICE_N}+)` : ""}
        </span>
      </div>
      {demos.length > 0 && (
        <div className="rounded-xl border p-3" style={cardStyle}>
          <div className="text-[13px] font-semibold mb-2">테스트용 데모 데이터 (12종+)</div>
          <p className="text-[11.5px] text-ink-3 mb-2 leading-relaxed">
            각 데모는 자료수집 단계 학습용으로 <b>n≥{BASIC_STATS_PRACTICE_N}</b>행으로 확장됩니다.
            기법별 실전 표준 표본수는 아래 아코디언에 서술되어 있습니다.
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
            {demos.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`btn btn-sm ${demoId === d.id ? "btn-primary" : ""}`}
                title={`${d.desc} · 연습 n≥${BASIC_STATS_PRACTICE_N}`}
                onClick={() => {
                  loadPracticeCsv(d.csv, d.id);
                  setDemoId(d.id);
                }}
              >
                {d.title}
              </button>
            ))}
          </div>
        </div>
      )}
      {previewOpen && (
        <DataPreviewBlock
          csv={csv || sample}
          demo={activeDemo}
          moduleName={moduleName}
          moduleId={moduleId}
          englishName={englishName}
        />
      )}
    </div>
  );
}

function ModuleView({
  mod,
  cur,
  nav,
}: {
  mod: BsModule;
  cur: BsCurriculum;
  nav: (r: string) => void;
}) {
  const settings = useStore((s) => s.settings);
  const setBasicStatsSession = useStore((s) => s.setBasicStatsSession);
  const saved = useStore((s) => s.menuArtifacts?.basicStats?.[mod.id]);
  const demos = useMemo(() => getDemosForModule(mod.id), [mod.id]);
  const [tab, setTab] = useState<Tab>("overview");
  const [stepIdx, setStepIdx] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>(() => saved?.choices || {});
  const [csv, setCsv] = useState(() => {
    const raw = saved?.csv || demos[0]?.csv || mod.sampleCsv;
    const key = saved?.demoId || demos[0]?.id || "curriculum";
    return ensurePracticeDemoCsv(raw, mod.id, key);
  });
  const [result, setResult] = useState<BsResult | null>(() => (saved?.result as BsResult) || null);
  const [busy, setBusy] = useState(false);
  const [aiNote, setAiNote] = useState(() => saved?.aiNote || "");
  const [demoId, setDemoId] = useState(saved?.demoId || demos[0]?.id || "");
  const [execMode, setExecMode] = useState<StatsExecMode | null>(null);
  const [execNote, setExecNote] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);
  const skipReset = useRef(true);

  useEffect(() => {
    if (skipReset.current) {
      skipReset.current = false;
      // 저장된 세션이 미니표(n<100)면 연습 표준으로 보정
      if (csv && previewCsv(csv, 1).total < BASIC_STATS_PRACTICE_N) {
        setCsv(ensurePracticeDemoCsv(csv, mod.id, demoId || "curriculum"));
      }
      return;
    }
    const s = useStore.getState().menuArtifacts?.basicStats?.[mod.id];
    if (s?.csv) {
      const key = s.demoId || "saved";
      setCsv(ensurePracticeDemoCsv(s.csv, mod.id, key));
      setChoices(s.choices || {});
      setResult((s.result as BsResult) || null);
      setAiNote(s.aiNote || "");
      setDemoId(s.demoId || "");
    } else {
      const first = getDemosForModule(mod.id)[0];
      const raw = first?.csv || mod.sampleCsv;
      setCsv(ensurePracticeDemoCsv(raw, mod.id, first?.id || "curriculum"));
      setResult(null);
      setChoices({});
      setAiNote("");
      setDemoId(first?.id || "");
    }
    setStepIdx(0);
    setTab("overview");
  }, [mod.id, mod.sampleCsv]);

  useEffect(() => {
    const t = setTimeout(() => {
      setBasicStatsSession(mod.id, {
        moduleId: mod.id,
        moduleName: mod.name,
        csv,
        choices,
        result: result || undefined,
        aiNote,
        demoId,
        updatedAt: Date.now(),
      });
    }, 500);
    return () => clearTimeout(t);
  }, [mod.id, mod.name, csv, choices, result, aiNote, demoId, setBasicStatsSession]);

  const step = mod.steps[stepIdx];
  const activeDemo = useMemo(
    () => (demoId && demoId !== "curriculum" ? demos.find((d) => d.id === demoId) || null : null),
    [demos, demoId],
  );
  const charts = useMemo(
    () =>
      ensureCharts(
        result?.chart,
        result?.stats,
        csv || mod.sampleCsv,
        mod.displayTitle || mod.formalName || mod.name,
      ),
    [result, csv, mod.displayTitle, mod.formalName, mod.name, mod.sampleCsv],
  );

  async function run() {
    setBusy(true);
    setExecNote("");
    try {
      const shape = estimateCsvShape(csv);
      const code = mapBasicStatsModuleToCode(mod.id);
      const mode = chooseStatsExecMode({
        techniqueCode: code,
        n: shape.n,
        p: shape.p,
        bootstrapB: code === "E-06" ? 5000 : 0,
      });
      setExecMode(mode);

      if (mode !== "browser" && SERVER_READY_CODES.has(code)) {
        const { headers, rows } = parseCsv(csv);
        let payload: Record<string, unknown> = {};
        if (code === "E-02" || code === "E-01") {
          const yCol = headers[headers.length - 1];
          const xCols = headers.slice(0, -1).filter((h) => !/^id$/i.test(h));
          payload = { headers, rows, yCol, xCols, intercept: true };
        } else if (code === "B-03") {
          const numIdx = headers
            .map((_, i) => i)
            .filter((i) => rows.every((r) => Number.isFinite(parseFloat(r[i] ?? ""))));
          const mat = rows
            .map((r) => numIdx.map((i) => parseFloat(r[i])))
            .filter((row) => row.every((v) => Number.isFinite(v)));
          payload = { X: mat, useCorrelation: true };
        } else {
          payload = { headers, rows };
        }
        const remote = await runViaStatsRuntime({
          techniqueCode: code,
          n: shape.n,
          p: shape.p,
          bootstrapB: code === "E-06" ? 5000 : 0,
          payload,
        });
        if (remote.ok) {
          const r = remote.result as Record<string, unknown>;
          setResult({
            summary: `${mod.name} · 서버(${remote.exec}) · ${code}`,
            interpretation: [
              `【실행위치】${remote.exec} (n=${shape.n}, p=${shape.p})`,
              `【stats-core】${JSON.stringify(r).slice(0, 1200)}`,
              "브라우저 폴백 결과가 필요하면 표본을 줄인 뒤 다시 실행하세요.",
            ].join("\n\n"),
            stats: typeof r === "object" && r ? (r as Record<string, number | string | boolean>) : undefined,
          });
          setExecNote(`서버 경로 사용: ${remote.exec}`);
          setTab("results");
          return;
        }
        setExecNote(`서버 실패 → 브라우저 폴백: ${"error" in remote ? remote.error : ""}`);
      } else if (mode !== "browser") {
        setExecNote(
          `권장 실행위치=${mode} (코드 ${code}). stats-core 미이식이라 브라우저에서 계산합니다.`,
        );
      }

      const local = runBasicStats(mod.id, csv, choices);
      setResult(local);
      setTab("results");
    } finally {
      setBusy(false);
    }
  }

  async function aiInterpret() {
    setBusy(true);
    setAiNote("");
    try {
      const prompt =
        `당신은 사회과학 통계 조교입니다. 초보 연구자가 논문에 바로 쓸 수 있게 한국어로 쉽고 풍부하게 해석하세요.\n` +
        `분석: ${mod.name}\n데모: ${activeDemo?.title || "사용자·기본 샘플 데이터"}\n선택: ${JSON.stringify(choices)}\n` +
        `결과요약: ${result?.summary}\n해석초안:\n${result?.interpretation}\n` +
        `표: ${JSON.stringify(result?.table || {}).slice(0, 1500)}\n` +
        `요청: 1) 한 줄 결론 2) 표를 초보자에게 단계별로 설명 3) p=.05 기준 판정 4) 논문 결과 절 문장 예시 2~3문장 5) 한계·주의 6) 다음 분석 제안(스토리).`;
      const text = await aiComplete(prompt, settings);
      setAiNote(text || result?.interpretation || "");
    } catch {
      setAiNote(result?.interpretation || "AI 키가 없으면 규칙 기반 해석을 사용합니다.");
    } finally {
      setBusy(false);
    }
  }

  async function exportViz(format: "png" | "jpeg" | "pdf" | "xlsx") {
    await exportChartBundle({
      container: chartRef.current,
      baseName: `basic-stats-${mod.id}-viz`,
      title: result?.summary || mod.name,
      summaryLines: [
        mod.name,
        result?.interpretation || "",
        ...Object.entries(result?.stats || {}).map(([k, v]) => `${k}: ${v}`),
      ],
      table: result?.table,
      format,
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button type="button" className="btn btn-sm" onClick={() => nav("basic-stats")}>← 기본통계 홈</button>
        <span className="text-[12px] px-2 py-0.5 rounded-full border" style={cardStyle}>
          {mod.group === "sem" || mod.group === "amos" ? "구조방정식 계열" : "기술·추론 계열"}
        </span>
        {saved?.updatedAt && (
          <span className="text-[11px] text-ink-3">워크스페이스 저장됨 · {new Date(saved.updatedAt).toLocaleString("ko-KR")}</span>
        )}
      </div>
      <h1 className={h1} style={{ fontFamily: "var(--font-gothic)" }}>
        {mod.displayTitle || mod.formalName || mod.name}
      </h1>
      {mod.englishName && (
        <p className="text-[13px] text-ink-3 mt-0.5">
          {mod.code ? `${mod.code} · ` : ""}
          {mod.englishName}
        </p>
      )}
      <p className={`${body} mt-1 mb-3`}>{mod.decision || ""}</p>

      <div className="flex gap-1 flex-wrap mb-4">
        {([
          ["overview", "① 개요·예시"],
          ["steps", "② 분석절차단계"],
          ["results", "③ 결과·시각화"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn btn-sm ${tab === id ? "btn-primary" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <DataIO
        csv={csv}
        setCsv={setCsv}
        sample={mod.sampleCsv}
        moduleId={mod.id}
        moduleName={mod.name}
        englishName={mod.englishName}
        result={result}
        demos={demos}
        demoId={demoId}
        setDemoId={setDemoId}
        activeDemo={activeDemo}
      />

      {tab === "overview" && (
        <div className="space-y-4">
          {/* 명칭 유래 — 왜 이런 명칭인가 · 어디에 어떻게 쓰나 */}
          {mod.naming && (
            <section className={card} style={{ ...cardStyle, background: "var(--brand-soft)" }}>
              <h2 className={h2}>이 분석의 이름은 왜 이런가요?</h2>
              <p className={`${body} mt-2`}><b>명칭 유래 · </b>{mod.naming.why}</p>
              <p className={`${body} mt-1.5`}><b>어디에 어떻게 · </b>{mod.naming.use}</p>
              {mod.naming.examples?.length > 0 && (
                <ul className="mt-2 list-disc pl-5 space-y-1 text-[13.5px] text-ink-2">
                  {mod.naming.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                </ul>
              )}
            </section>
          )}

          {(mod.formalName || mod.formula) && (
            <section className={card} style={cardStyle}>
              <h2 className={h2}>정식 명칭 · 핵심 수식</h2>
              <p className={`${body} mt-2`}>
                <b>정식 명칭 · </b>{mod.formalName || mod.name}
                {mod.englishName ? ` · ${mod.englishName}` : ""}
              </p>
              {mod.code && (
                <p className={`${body} mt-1`}>{mod.code}</p>
              )}
              {mod.formula && (
                <pre className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed rounded-xl border p-3 bg-black/[0.02]" style={cardStyle}>
                  {mod.formula}
                </pre>
              )}
              {mod.formulaNote && (
                <div className={`${body} mt-2 rounded-lg border p-3 space-y-2`} style={{ ...cardStyle, background: "var(--brand-soft)" }}>
                  <div className="font-semibold text-[13px]">수식을 쉽게 풀면</div>
                  <p className="whitespace-pre-wrap">{mod.formulaNote}</p>
                </div>
              )}
              {mod.criterion && (
                <p className={`${body} mt-2`}><b>판정 기준 · </b>{mod.criterion}</p>
              )}
            </section>
          )}

          <section className={card} style={cardStyle}>
            <h2 className={h2}>쉬운 개요</h2>
            <p className={`${body} mt-2`}>{mod.overview}</p>
            {mod.overviewEasy && (
              <div className="mt-3 rounded-xl border p-3" style={cardStyle}>
                <div className="text-[13px] font-semibold">이 말이 무슨 뜻인가요? (쉬운 풀이)</div>
                <p className={`${body} mt-1.5`}>{mod.overviewEasy.plain}</p>
                {mod.overviewEasy.examples?.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-[13px] text-ink-2">
                    {mod.overviewEasy.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className={card} style={cardStyle}>
            <h2 className={h2}>프로세스</h2>
            <ol className="mt-2 space-y-3">
              {mod.process.map((p, i) => {
                const det = mod.processDetail?.[i];
                return (
                  <li key={i} className="flex gap-2 text-[14px]">
                    <span
                      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold"
                      style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-ink-2 font-medium">{p}</div>
                      {det && (
                        <div className="mt-1 rounded-lg border p-2.5 text-[13px] text-ink-2" style={cardStyle}>
                          <div>{det.desc}</div>
                          {det.examples?.length > 0 && (
                            <div className="mt-1.5 text-[12px] text-ink-3">
                              예시 — {det.examples.join(" · ")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className={card} style={cardStyle}>
            <h2 className={h2}>쉬운 예시</h2>
            {mod.examplesEasy && mod.examplesEasy.length > 0 ? (
              <ul className="mt-2 space-y-2 text-[14px] text-ink-2">
                {mod.examplesEasy.map((e, i) => (
                  <li key={i} className="rounded-lg border p-2.5" style={cardStyle}>
                    <div className="font-medium">• {e.ex}</div>
                    {e.plain && <div className="mt-1 text-[13px] text-ink-3">→ {e.plain}</div>}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-2 list-disc pl-5 space-y-1.5 text-[14px] text-ink-2">
                {mod.examples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            )}
          </section>
          <button type="button" className="btn btn-primary" onClick={() => setTab("steps")}>
            분석절차단계로 →
          </button>
        </div>
      )}

      {tab === "steps" && step && (
        <div className="space-y-4">
          <div className="flex gap-1 flex-wrap">
            {mod.steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`btn btn-sm ${i === stepIdx ? "btn-primary" : i < stepIdx ? "" : "opacity-70"}`}
                onClick={() => setStepIdx(i)}
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </div>
          <section className={card} style={{ ...cardStyle, borderColor: "var(--brand)" }}>
            <div className="text-[12px] text-ink-3 mb-1">
              단계 {stepIdx + 1} / {mod.steps.length}
            </div>
            <h2 className={h2}>{step.title}</h2>
            <p className="mt-2 text-[14px]"><b>이 단계를 하는 이유:</b> {step.why}</p>
            <p className="mt-1 text-[14px] text-ink-2"><b>다음 단계는:</b> {step.nextWhy}</p>
            <p className="mt-2 text-[13px] rounded-lg p-2.5" style={{ background: "var(--brand-soft)" }}>
              예시 — {step.example}
            </p>
            <div className="mt-3 grid sm:grid-cols-3 gap-2">
              {step.choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="text-left rounded-xl border p-3 text-[13px]"
                  style={{
                    borderColor: choices[step.id] === c.id ? "var(--brand)" : "var(--color-border-tertiary)",
                    background: choices[step.id] === c.id ? "var(--brand-soft)" : "transparent",
                  }}
                  onClick={() => setChoices((s) => ({ ...s, [step.id]: c.id }))}
                >
                  <div className="font-medium">{c.label}</div>
                  {c.hint && <div className="text-[11px] text-ink-3 mt-0.5">{c.hint}</div>}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-sm"
                disabled={stepIdx === 0}
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              >
                이전
              </button>
              {stepIdx < mod.steps.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => setStepIdx((i) => Math.min(mod.steps.length - 1, i + 1))}
                >
                  다음 단계
                </button>
              ) : (
                <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={run}>
                  {busy ? "분석 중…" : "5. 분석 실행 → 6. 결과"}
                </button>
              )}
            </div>
          </section>
          <section className={card} style={cardStyle}>
            <h2 className={h2}>데이터 미리보기</h2>
            <DataPreviewBlock
              csv={csv || mod.sampleCsv}
              demo={activeDemo}
              moduleName={mod.name}
              moduleId={mod.id}
              englishName={mod.englishName}
            />
            <details className="mt-3">
              <summary className="cursor-pointer text-[12px] text-ink-3">CSV 직접 편집</summary>
              <textarea
                className="inp w-full font-mono text-[11px] min-h-[120px] mt-2"
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
              />
            </details>
          </section>
        </div>
      )}

      {tab === "results" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={run}>
              {busy ? "계산 중…" : "다시 분석"}
            </button>
            <button type="button" className="btn btn-sm" disabled={busy || !result} onClick={aiInterpret}>
              AI 해석 문장
            </button>
            <button type="button" className="btn btn-sm" disabled={!result} onClick={() => exportViz("png")}>PNG</button>
            <button type="button" className="btn btn-sm" disabled={!result} onClick={() => exportViz("jpeg")}>JPEG</button>
            <button type="button" className="btn btn-sm" disabled={!result} onClick={() => exportViz("pdf")}>PDF</button>
            <button type="button" className="btn btn-sm" disabled={!result} onClick={() => exportViz("xlsx")}>엑셀</button>
          </div>
          {!result && <p className={body}>아직 결과가 없습니다. 절차 단계에서 실행하거나 다시 분석을 누르세요.</p>}
          {result && (
            <section className={card} style={{ borderColor: "var(--brand)" }}>
              <p className="text-[12px] text-ink-3 mb-1">5. 분석 실행 · 6. 결과 해석·내보내기</p>
              <h2 className={h2}>{result.summary}</h2>
              {activeDemo && (
                <p className="text-[13px] text-ink-3 mt-1">데이터: {activeDemo.title}</p>
              )}

              <div className="mt-3 rounded-xl border p-3" style={{ ...cardStyle, background: "var(--brand-soft)" }}>
                <div className="font-semibold text-[14px] mb-1">정식 결과</div>
                <pre className="whitespace-pre-wrap text-[13px] font-sans leading-relaxed">
                  {buildFormalResultText({
                    moduleName: mod.formalName || mod.name,
                    englishName: mod.englishName,
                    code: mod.code || mod.id,
                    summary: result.summary,
                    stats: result.stats,
                    demoTitle: activeDemo?.title,
                  })}
                </pre>
              </div>

              <div className="mt-3 rounded-xl border p-3" style={cardStyle}>
                <div className="font-semibold text-[14px] mb-1">쉽게 읽는 해석</div>
                <pre className="whitespace-pre-wrap text-[13px] font-sans leading-relaxed text-ink-2">
                  {buildEasyResultText({
                    moduleName: mod.formalName || mod.name,
                    stats: result.stats,
                    interpretation: result.interpretation,
                  })}
                </pre>
                <div className={`${body} mt-3 whitespace-pre-wrap border-t pt-3`} style={{ borderColor: "var(--color-border-tertiary)" }}>
                  {result.interpretation}
                </div>
              </div>

              {result.verify && (
                <div
                  className="mt-3 mb-2 rounded-xl border p-3 text-[13px]"
                  style={{
                    borderColor:
                      result.verify.grade === "pass" ? "var(--ok)" : result.verify.grade === "warn" ? "var(--warn)" : "var(--danger)",
                    background:
                      result.verify.grade === "pass"
                        ? "rgba(34,197,94,.08)"
                        : result.verify.grade === "warn"
                          ? "rgba(234,179,8,.1)"
                          : "rgba(239,68,68,.08)",
                  }}
                >
                  <div className="font-semibold">검증 여과장치</div>
                  <pre className="mt-1 whitespace-pre-wrap text-[12px] font-sans text-ink-2">{buildVerifyPlain(result.verify)}</pre>
                  <ul className="mt-2 space-y-2 text-[12px] text-ink-2 max-h-72 overflow-auto">
                    {result.verify.checks.map((c) => (
                      <li key={c.id} className="rounded-lg border p-2" style={{ ...cardStyle, background: "var(--wash)" }}>
                        <div className="font-medium">
                          {c.ok ? "✓" : "✗"} {c.label}
                        </div>
                        <div className="mt-0.5 text-ink-3 leading-relaxed">{explainVerifyCheck(c)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 rounded-xl border p-3" style={cardStyle}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-[14px]">시각화 · 그래프</h3>
                  <div className="flex flex-wrap gap-1">
                    <button type="button" className="btn btn-sm" disabled={!charts.length} onClick={() => exportViz("png")}>PNG 내보내기</button>
                    <button type="button" className="btn btn-sm" disabled={!charts.length} onClick={() => exportViz("jpeg")}>JPEG 내보내기</button>
                    <button type="button" className="btn btn-sm" disabled={!charts.length} onClick={() => exportViz("pdf")}>PDF 내보내기</button>
                  </div>
                </div>
                <details className="mt-2" open>
                  <summary className="cursor-pointer text-[12px] font-medium text-ink-2">
                    그래프 유형 가이드 (비교·분포·관계·추세 등)
                  </summary>
                  <ul className="mt-2 space-y-1 text-[11px] text-ink-3 list-disc pl-4">
                    {CHART_FAMILY_HINTS.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-ink-3">
                    아래 {charts.length}종 시각화는 같은 결과를 다른 관점(비교·분포·구성비 등)으로 보여 줍니다. PNG/JPEG/PDF로 내보낼 수 있습니다.
                  </p>
                </details>
                <div ref={chartRef} className="mt-3 space-y-4">
                  {charts.length === 0 && (
                    <p className="text-[13px] text-ink-3">표시할 그래프 데이터가 없습니다. 데모를 고른 뒤 다시 분석하세요.</p>
                  )}
                  {charts.map((ch, i) => (
                    <div key={i} className="rounded-xl border p-2" style={cardStyle}>
                      <div className="text-[12px] text-ink-3 px-1 pb-1">{ch.title}</div>
                      <CaChart spec={ch} />
                    </div>
                  ))}
                </div>
              </div>

              {result.table && (
                <div className="overflow-x-auto mt-3">
                  <table className="tbl text-[12px] w-full">
                    <thead>
                      <tr>{result.table.cols.map((c) => <th key={c}>{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {result.table.rows.map((row, i) => (
                        <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result.stats && (
                <div className="mt-4">
                  <h3 className="font-semibold text-[14px] mb-2">결과 수치 · 항목별 설명</h3>
                  <div className="space-y-2">
                    {formatStatRows(result.stats).map((row) => (
                      <div key={row.key} className="rounded-xl border p-3 text-[13px]" style={cardStyle}>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-semibold">{row.name}</span>
                          <span className="font-mono text-[12px] px-2 py-0.5 rounded border" style={cardStyle}>{row.value}</span>
                          <span className="text-[11px] text-ink-3">({row.key})</span>
                        </div>
                        <p className="mt-1 text-[12px] text-ink-2 leading-relaxed">{row.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
          {aiNote && (
            <section className={card} style={{ background: "var(--brand-soft)", ...cardStyle }}>
              <h2 className={h2}>AI 해석</h2>
              <pre className="whitespace-pre-wrap text-[13px] mt-2 font-sans">{aiNote}</pre>
            </section>
          )}
          {!!mod.next.length && (
            <section className={card} style={cardStyle}>
              <h2 className={h2}>스토리 다음 단계</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {mod.next.map((nid) => {
                  const n = getModule(cur, nid);
                  if (!n) return null;
                  return (
                    <button
                      key={nid}
                      type="button"
                      className="btn btn-sm"
                      onClick={() => nav(`basic-stats/${nid}`)}
                    >
                      → {n.name}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function BasicStatsStudio({
  nav,
  sub,
}: {
  nav: (r: string) => void;
  sub?: string;
}) {
  const [cur, setCur] = useState<BsCurriculum | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadBasicStatsCurriculum()
      .then(setCur)
      .catch((e) => setErr(String(e?.message || e)));
  }, []);

  const mod = useMemo(() => {
    if (!cur || !sub) return null;
    if (["basics", "sem-overview", "decision", "hub"].includes(sub)) return null;
    return getModule(cur, sub) || null;
  }, [cur, sub]);

  if (err) return <div className="p-6 text-red-600">커리큘럼 로드 실패: {err}</div>;
  if (!cur) return <div className="p-6 text-ink-3">기본통계 로딩 중…</div>;

  if (mod) return <ModuleView mod={mod} cur={cur} nav={nav} />;

  if (sub === "basics") {
    return (
      <div>
        <button type="button" className="btn btn-sm mb-3" onClick={() => nav("basic-stats")}>← 기본통계 홈</button>
        <h1 className={h1} style={{ fontFamily: "var(--font-gothic)" }}>{cur.basics.title}</h1>
        <p className={`${body} mt-2 mb-4`}>논문 통계의 공통 언어입니다. 가설·척도·표본·코딩을 이해하면 이후 분석이 훨씬 쉽습니다.</p>
        <div className="space-y-3">
          {cur.basics.chapters.map((ch, i) => (
            <section key={ch.id} className={card} style={cardStyle}>
              <h2 className={h2}>{i + 1}. {ch.title}</h2>
              <p className={`${body} mt-2`}>{ch.summary}</p>
              <ul className="mt-2 list-disc pl-5 text-[13px] text-ink-2 space-y-1">
                {ch.examples.map((ex, j) => <li key={j}>{ex}</li>)}
              </ul>
              {ch.detail && (
                <div className="mt-3 rounded-xl border p-3" style={{ ...cardStyle, background: "var(--brand-soft)" }}>
                  <p className="text-[13px] text-ink-2"><b>명칭 유래 · </b>{ch.detail.naming}</p>
                  <p className="mt-1.5 text-[13px] text-ink-2"><b>의미·쓰임 · </b>{ch.detail.meaning}</p>
                  {ch.detail.examples?.length > 0 && (
                    <div className="mt-1.5 text-[12.5px] text-ink-3">예시 — {ch.detail.examples.join(" · ")}</div>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* v53: 모든 척도 전면 서술 */}
        {cur.basics.scales && (
          <section className={`${card} mt-4`} style={cardStyle}>
            <h2 className={h2}>{cur.basics.scales.title}</h2>
            <p className={`${body} mt-1.5`}>{cur.basics.scales.intro}</p>
            <div className="mt-3 grid md:grid-cols-2 gap-2.5">
              {cur.basics.scales.items.map((s, i) => (
                <div key={i} className="rounded-xl border p-3" style={cardStyle}>
                  <div className="font-semibold text-[14px]">{s.name}</div>
                  <p className="mt-1 text-[13px] text-ink-2">{s.desc}</p>
                  <div className="mt-1.5 text-[12.5px] text-ink-3"><b>쓸 수 있는 통계 · </b>{s.stat}</div>
                  {s.examples?.length > 0 && (
                    <div className="mt-1 text-[12.5px] text-ink-3">예시 — {s.examples.join(" · ")}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* v53: 모든 변수 전면 서술 */}
        {cur.basics.variables && (
          <section className={`${card} mt-4`} style={cardStyle}>
            <h2 className={h2}>{cur.basics.variables.title}</h2>
            <p className={`${body} mt-1.5`}>{cur.basics.variables.intro}</p>
            <div className="mt-3 grid md:grid-cols-2 gap-2.5">
              {cur.basics.variables.items.map((v, i) => (
                <div key={i} className="rounded-xl border p-3" style={cardStyle}>
                  <div className="font-semibold text-[14px]">{v.name}</div>
                  <p className="mt-1 text-[13px] text-ink-2">{v.desc}</p>
                  {v.examples?.length > 0 && (
                    <div className="mt-1 text-[12.5px] text-ink-3">예시 — {v.examples.join(" · ")}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={() => nav("basic-stats/decision")}>
            구분도로 분석 고르기 →
          </button>
          <button type="button" className="btn" onClick={() => nav("basic-stats/sem-overview")}>
            SEM 개요 보기
          </button>
        </div>
      </div>
    );
  }

  if (sub === "sem-overview") {
    const s = cur.semOverview;
    return (
      <div>
        <button type="button" className="btn btn-sm mb-3" onClick={() => nav("basic-stats")}>← 기본통계 홈</button>
        <h1 className={h1} style={{ fontFamily: "var(--font-gothic)" }}>{s.title}</h1>
        <p className={`${body} mt-2 mb-4`}>{s.easy}</p>
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          {s.parts.map((p) => (
            <div key={p.name} className={card} style={cardStyle}>
              <div className="font-semibold">{p.name}</div>
              <p className="text-[13px] text-ink-2 mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
        <section className={card} style={cardStyle}>
          <h2 className={h2}>쉬운 예시</h2>
          <ol className="list-decimal pl-5 mt-2 space-y-1 text-[14px] text-ink-2">
            {s.examples.map((ex, i) => <li key={i}>{ex}</li>)}
          </ol>
        </section>
        <section className={`${card} mt-3`} style={cardStyle}>
          <h2 className={h2}>추천순서</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {s.story.map((x, i) => (
              <span key={i} className="text-[12px] rounded-lg border px-2 py-1" style={cardStyle}>
                {i + 1}. {x}
              </span>
            ))}
          </div>
        </section>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={() => nav("basic-stats/cfa")}>
            확인적 요인분석부터 →
          </button>
          <button type="button" className="btn" onClick={() => nav("basic-stats/sem")}>
            SEM 분석 모듈
          </button>
          <button type="button" className="btn" onClick={() => nav("basic-stats/path")}>
            경로분석
          </button>
        </div>
      </div>
    );
  }

  if (sub === "decision") {
    const d = cur.decision;
    return (
      <div>
        <button type="button" className="btn btn-sm mb-3" onClick={() => nav("basic-stats")}>← 기본통계 홈</button>
        <h1 className={h1} style={{ fontFamily: "var(--font-gothic)" }}>{d.title}</h1>
        <p className={`${body} mt-2 mb-2`}>평균/분산 경로를 클릭형으로 단순화했습니다.</p>
        <ul className="text-[13px] text-ink-3 mb-4 list-disc pl-5">
          {d.assumptions.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
        <div className="space-y-2">
          {d.branches.map((b, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left rounded-xl border p-3 hover:bg-[var(--brand-soft)]"
              style={cardStyle}
              onClick={() => nav(`basic-stats/${b.to}`)}
            >
              <div className="text-[12px] text-ink-3">{b.when}</div>
              <div className="font-medium text-[14px] mt-0.5">→ {b.then}</div>
            </button>
          ))}
        </div>

        {/* 구분도 용어 가이드 — 집단·측정·종속·독립·분산이 왜 몇 개 들어가나 */}
        {d.termGuide && d.termGuide.length > 0 && (
          <section className={`${card} mt-5`} style={cardStyle}>
            <h2 className={h2}>구분도 용어 — 왜 이 변수가, 몇 개 들어가나요?</h2>
            <p className={`${body} mt-1`}>구분도에 나오는 <b>분석대상·집단·측정·종속·독립·분산</b>이 무슨 뜻이고, 왜 개수를 따지는지 쉽게 풀었습니다.</p>
            <div className="mt-3 space-y-2.5">
              {d.termGuide.map((t, i) => (
                <div key={i} className="rounded-xl border p-3" style={cardStyle}>
                  <div className="font-semibold text-[14px]">{t.term}</div>
                  <p className="mt-1 text-[13.5px] text-ink-2"><b>뜻 · </b>{t.meaning}</p>
                  <p className="mt-1 text-[13.5px] text-ink-2"><b>왜 개수를 따지나 · </b>{t.why}</p>
                  {t.examples?.length > 0 && (
                    <div className="mt-1.5 text-[12.5px] text-ink-3">예시 — {t.examples.join(" · ")}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8개 분석 명칭 유래 */}
        {d.analysisNaming && d.analysisNaming.length > 0 && (
          <section className={`${card} mt-4`} style={cardStyle}>
            <h2 className={h2}>이 분석들은 왜 이런 이름인가요?</h2>
            <p className={`${body} mt-1`}>구분도가 가리키는 <b>8가지 분석</b>의 명칭 유래와 쓰임을 쉬운 예시와 함께 정리했습니다.</p>
            <div className="mt-3 grid md:grid-cols-2 gap-2.5">
              {d.analysisNaming.map((a, i) => (
                <div key={i} className="rounded-xl border p-3" style={cardStyle}>
                  <div className="font-semibold text-[14px]">{a.name}</div>
                  <p className="mt-1 text-[13px] text-ink-2"><b>명칭 · </b>{a.why}</p>
                  <p className="mt-1 text-[13px] text-ink-2"><b>쓰임 · </b>{a.use}</p>
                  {a.examples?.length > 0 && (
                    <div className="mt-1.5 text-[12.5px] text-ink-3">예시 — {a.examples.join(" · ")}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // Hub
  const classic = cur.modules.filter((m) => m.group === "classic" || m.group === "spss");
  const sem = cur.modules.filter((m) => m.group === "sem" || m.group === "amos");

  return (
    <div>
      <h1 className={h1} style={{ fontFamily: "var(--font-gothic)" }}>기본통계</h1>
      <p className={`${body} mt-2 mb-4`}>
        논문 통계 기본 지식부터 기술·추론 분석과 구조방정식까지, 스토리처럼 이어지는 분석절차형 워크벤치입니다.
        쉬운 선택지로 단계마다 이유와 다음 단계를 안내합니다.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {cur.story.map((s) => (
          <button
            key={s.id}
            type="button"
            className="rounded-xl border px-3 py-2 text-left text-[13px]"
            style={cardStyle}
            onClick={() => {
              if (s.id === "basics") nav("basic-stats/basics");
              else if (s.id === "sem_overview") nav("basic-stats/sem-overview");
              else if (s.id === "decision") nav("basic-stats/decision");
              else if (s.id === "classic" || s.id === "spss") nav("basic-stats/A-01");
              else if (s.id === "sem" || s.id === "amos") nav("basic-stats/cfa");
              else nav("basic-stats");
            }}
          >
            <div className="font-medium">{s.label}</div>
            <div className="text-[11px] text-ink-3">{s.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-5">
        <button type="button" className={`${card} text-left`} style={cardStyle} onClick={() => nav("basic-stats/basics")}>
          <div className="font-semibold text-[15px]">📖 논문 통계 기본 지식</div>
          <p className="text-[13px] text-ink-2 mt-1">가설·유의수준·척도·표본·코딩·분석 선택</p>
        </button>
        <button type="button" className={`${card} text-left`} style={cardStyle} onClick={() => nav("basic-stats/sem-overview")}>
          <div className="font-semibold text-[15px]">🔗 구조방정식모델 개요</div>
          <p className="text-[13px] text-ink-2 mt-1">측정·구조·적합도를 쉬운 예시로</p>
        </button>
      </div>

      <h2 className={`${h2} mb-2`}>기술·추론 분석 <span className="text-[12px] font-normal text-ink-3">({classic.length})</span></h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-5">
        {classic.map((m) => (
          <button
            key={m.id}
            type="button"
            className="text-left rounded-xl border p-3 hover:border-[var(--brand)]"
            style={cardStyle}
            onClick={() => nav(`basic-stats/${m.id}`)}
          >
            <div className="font-medium text-[13.5px]">{m.displayTitle || m.formalName || m.name}</div>
            <div className="text-[11px] text-ink-3 mt-1 line-clamp-2">
              {m.code ? `${m.code} · ` : ""}
              {m.englishName || (m.overview || "").slice(0, 72)}
            </div>
          </button>
        ))}
      </div>

      <h2 className={`${h2} mb-2`}>구조방정식 · 잠재변수 모형 <span className="text-[12px] font-normal text-ink-3">({sem.length})</span></h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {sem.map((m) => (
          <button
            key={m.id}
            type="button"
            className="text-left rounded-xl border p-3 hover:border-[var(--brand)]"
            style={cardStyle}
            onClick={() => nav(`basic-stats/${m.id}`)}
          >
            <div className="font-medium text-[13.5px]">{m.displayTitle || m.formalName || m.name}</div>
            <div className="text-[11px] text-ink-3 mt-1 line-clamp-2">
              {m.code ? `${m.code} · ` : ""}
              {m.englishName || (m.overview || "").slice(0, 72)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
