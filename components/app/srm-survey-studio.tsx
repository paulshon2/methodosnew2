"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useStore } from "@/store/app-store";
import {
  QUESTION_TYPES,
  SURVEY_MODES,
  SCALES,
  SAMPLING,
  BIASES,
  ANALYSES,
  VARIABLE_TYPES,
  RESEARCH_DESIGNS,
  STANDARD_PROTOCOL,
  ENGINE_CHAIN,
  AUTO_CHAINS,
  PATTERN_LIBRARY,
} from "@/lib/srm-taxonomy";
import {
  SURVEY_ITEM_ENRICH,
  PROTOCOL_ENRICH,
  ENGINE_STEP_ENRICH,
  AUTO_CHAIN_WALKTHROUGHS,
  BIAS_GLOSSARY,
} from "@/lib/survey-enrichment";
import {
  buildEngineChain,
  generateSurveyAi,
  generateFromPatterns,
  parseImportedRows,
  parseImportedText,
  toCsv,
  toRows,
  type SurveyPlan,
  type SurveyQuestion,
} from "@/lib/srm-survey-engine";

type TabId = "overview" | "taxonomy" | "protocol" | "ai" | "editor" | "import" | "patterns";
const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "개요" },
  { id: "taxonomy", label: "분류" },
  { id: "protocol", label: "표준 프로토콜·엔진" },
  { id: "ai", label: "AI 설문 생성" },
  { id: "editor", label: "수동 편집" },
  { id: "import", label: "불러오기" },
  { id: "patterns", label: "문항 패턴" },
];

function download(name: string, data: string | Uint8Array, mime: string) {
  const blob = new Blob([data as any], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

const card = "rounded-2xl border p-5 md:p-6";
const cardStyle = { borderColor: "var(--color-border-tertiary)" };
const chip = "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px]";
const chipStyle = { borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" };
const body = "text-[15px] leading-relaxed text-ink-2";
const h1 = "text-[26px] font-semibold tracking-tight";
const h2 = "text-[18px] font-semibold";

const DEFAULT_PLAN: SurveyPlan = {
    title: "원격수업 만족도 조사",
    purpose: "원격수업 만족 요인을 파악하고 개선 우선순위를 도출",
    respondent: "원격수업 수강 대학생",
    modeId: "web",
    samplingId: "stratified",
    analysisId: "cfa",
    count: 30,
    points: 5,
    topic: "원격수업 만족도",
    biasChecks: ["social_desirability", "acquiescence", "primacy", "nonresponse"],
    researchQuestions: "원격수업 품질 요인이 만족·재수강 의도에 어떤 영향을 미치는가?",
    population: "국내 4년제 대학 원격수업 수강생",
    inclusion: "최근 한 학기 원격수업 1과목 이상 수강",
    geography: "전국",
    timeframe: "2026-1학기",
    constructs: "강의품질, 플랫폼사용성, 상호작용, 만족, 재수강의도",
    hypothesis: "상호작용↑ → 만족↑ → 재수강의도↑",
    incentive: "추첨 기프티콘",
    language: "한국어",
    notes: "",
};

export default function SrmSurveyStudio({ nav: _nav }: { nav?: (r: string) => void }) {
  const settings = useStore((s) => s.settings);
  const savedSurvey = useStore((s) => s.menuArtifacts?.survey);
  const setSurveySession = useStore((s) => s.setSurveySession);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  const [tab, setTab] = useState<TabId>("overview");

  // AI plan state
  const [plan, setPlan] = useState<SurveyPlan>(() => (savedSurvey?.plan as SurveyPlan) || DEFAULT_PLAN);
  const [items, setItems] = useState<SurveyQuestion[]>(() => (savedSurvey?.items as SurveyQuestion[]) || []);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<"" | "ai" | "pattern" | "manual" | "import">(() => {
    const r = savedSurvey?.results as { source?: "" | "ai" | "pattern" | "manual" | "import" } | undefined;
    return r?.source || "";
  });
  const [note, setNote] = useState(() => {
    const r = savedSurvey?.results as { note?: string } | undefined;
    return r?.note || "";
  });

  useEffect(() => {
    const s = savedSurvey;
    if (!s?.updatedAt) return;
    if (!hydrated.current) {
      hydrated.current = true;
      if (s.plan) setPlan(s.plan as SurveyPlan);
      if (Array.isArray(s.items)) setItems(s.items as SurveyQuestion[]);
      const r = s.results as { source?: "" | "ai" | "pattern" | "manual" | "import"; note?: string } | undefined;
      if (r?.source) setSource(r.source);
      if (r?.note != null) setNote(r.note);
      return;
    }
  }, [savedSurvey?.updatedAt]);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSurveySession({
        plan,
        items,
        results: { source, note },
        updatedAt: Date.now(),
      });
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [plan, items, source, note, setSurveySession]);

  const chain = useMemo(() => buildEngineChain(plan), [plan]);

  async function runAi() {
    setBusy(true); setNote("");
    try {
      const r = await generateSurveyAi(plan, settings);
      setItems(r.items);
      setSource(r.source);
      setNote(r.source === "pattern" ? "AI 키가 없거나 응답 파싱에 실패하여 패턴 라이브러리 기반으로 생성했습니다." : "AI로 생성했습니다.");
      setTab("editor");
    } finally { setBusy(false); }
  }
  function runRule() {
    setItems(generateFromPatterns(plan));
    setSource("pattern");
    setNote("패턴 라이브러리 기반으로 결정적 생성했습니다.");
    setTab("editor");
  }

  /* import handlers */
  const fileRef = useRef<HTMLInputElement>(null);
  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const name = f.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      const parsed = parseImportedRows(rows);
      if (parsed.length) {
        setItems(parsed); setSource("import");
        setNote(`${parsed.length}개 문항을 엑셀에서 불러왔습니다.`);
        setTab("editor");
      } else setNote("엑셀 파싱 결과가 비어 있습니다. 헤더에 stem/문항 열이 있는지 확인하세요.");
    } else {
      const text = await f.text();
      const parsed = parseImportedText(text);
      if (parsed.length) {
        setItems(parsed); setSource("import");
        setNote(`${parsed.length}개 문항을 텍스트에서 불러왔습니다.`);
        setTab("editor");
      } else setNote("텍스트 파싱 결과가 비어 있습니다.");
    }
    e.target.value = "";
  }

  /* editor mutations */
  function upd(no: number, k: keyof SurveyQuestion, v: any) {
    setItems((prev) => prev.map((it) => (it.no === no ? { ...it, [k]: v } : it)));
  }
  function del(no: number) {
    setItems((prev) => prev.filter((it) => it.no !== no).map((it, i) => ({ ...it, no: i + 1 })));
  }
  function move(no: number, dir: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.no === no);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return arr.map((it, i) => ({ ...it, no: i + 1 }));
    });
  }
  function addBlank() {
    setItems((prev) => [
      ...prev,
      {
        no: prev.length + 1, section: "본문항",
        typeId: "likert", typeLabel: "평정척도(등간형)",
        scaleId: "likert_scale", scaleLabel: "평정척도(등간형) 척도",
        points: plan.points, stem: "", responses: `1=매우 반대 … ${plan.points}=매우 동의`,
        srm: "Likert Scale",
      },
    ]);
  }

  function exportXlsx() {
    const rows = toRows(items);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Survey");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    download(`survey-${plan.title}.xlsx`, new Uint8Array(buf), "application/octet-stream");
  }
  function exportCsv() {
    download(`survey-${plan.title}.csv`, toCsv(items), "text/csv;charset=utf-8");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={card} style={cardStyle}>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className={h1} style={{ fontFamily: "var(--font-gothic)" }}>
            설문조사 — 표준 프로토콜 엔진
          </h1>
          <span className={chip} style={chipStyle}>AI 기반 설계</span>
          <span className={chip} style={chipStyle}>수동 편집 · 불러오기 · 내보내기</span>
        </div>
        <p className={`mt-3 ${body}`}>
          문항 유형·조사방식·척도·표집·오차·분석을 표준 프로토콜로 연결하고, AI가 30–100개 문항을 생성합니다.
          제목·주제·연구목적·응답자 맥락이 문항에 반영되며, 수동 편집·엑셀/CSV/텍스트 불러오기를 지원합니다.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-lg px-3.5 py-2 text-[14px] border ${tab === t.id ? "font-semibold" : "text-ink-2"}`}
            style={{ borderColor: "var(--color-border-tertiary)", background: tab === t.id ? "var(--brand-soft)" : "transparent", color: tab === t.id ? "var(--brand-ink)" : undefined }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className={card} style={cardStyle}>
            <h2 className={h2}>Survey Engine 구성</h2>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[12px]">
              {ENGINE_CHAIN.map((s, i) => (
                <span key={i} className={chip} style={chipStyle}>{i + 1}. {s}</span>
              ))}
            </div>
            <p className={`mt-3 ${body}`}>
              위 12단계는 <b>Survey Type</b>에서 시작해 <b>Interpretation</b>까지 자동 연동되며, AI 생성 프롬프트에 반영됩니다.
            </p>
          </div>

          <div className={card} style={cardStyle}>
            <h2 className={h2}>자동 연동 체인 예시</h2>
            <p className={`mt-2 ${body}`}>유형이 척도·분석으로 어떻게 이어지는지, 구체 사례로 따라가 보세요.</p>
            <div className="mt-4 space-y-5">
              {AUTO_CHAINS.map((c) => (
                <div key={c.key} className="rounded-xl border p-4" style={cardStyle}>
                  <div className="text-[16px] font-semibold">{c.label}</div>
                  <div className="mt-2 text-[14px] text-ink-2">{c.chain.join(" → ")}</div>
                  <div className="mt-3 grid md:grid-cols-3 gap-3">
                    {(AUTO_CHAIN_WALKTHROUGHS[c.key] || []).map((w, wi) => (
                      <div key={wi} className="rounded-lg border p-3 bg-[var(--color-background-secondary)]" style={cardStyle}>
                        <div className="text-[14px] font-medium">{w.title}</div>
                        <ol className="mt-2 space-y-1 text-[13px] text-ink-2 list-decimal pl-4">
                          {w.steps.map((s, si) => <li key={si}>{s}</li>)}
                        </ol>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={card} style={cardStyle}>
            <h2 className={h2}>오차·편향 쉬운 설명</h2>
            <div className="mt-3 grid md:grid-cols-2 gap-2">
              {BIAS_GLOSSARY.map((b) => (
                <div key={b.id} className="rounded-lg border px-3 py-2.5" style={cardStyle}>
                  <span className="text-[14px] font-medium">{BIASES.find(x => x.id === b.id)?.label || b.id}</span>
                  <span className="text-[14px] text-ink-2"> — {b.easy}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Taxonomy */}
      {tab === "taxonomy" && (
        <div className="space-y-4">
          {[
            { title: "Question Type (문항 유형)", data: QUESTION_TYPES },
            { title: "Survey Mode (조사방식)", data: SURVEY_MODES },
            { title: "Scale (척도)", data: SCALES },
            { title: "Sampling (표집)", data: SAMPLING },
            { title: "Bias / Error (오차·편향)", data: BIASES },
            { title: "Variable Type (측정수준)", data: VARIABLE_TYPES },
            { title: "Research Design (연구설계)", data: RESEARCH_DESIGNS },
            { title: "Analysis (통계·분석)", data: ANALYSES },
          ].map((sec) => (
            <div key={sec.title} className={card} style={cardStyle}>
              <div className="flex items-center justify-between">
                <h2 className={h2}>{sec.title}</h2>
                <span className="text-[13px] text-ink-3">총 {sec.data.length}개</span>
              </div>
              <div className="mt-2 grid md:grid-cols-2 gap-2">
                {sec.data.map((it) => {
                  const en = SURVEY_ITEM_ENRICH[it.id];
                  return (
                  <div key={it.id} className="rounded-xl border p-3.5" style={cardStyle}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-semibold">{it.label}</span>
                      <span className="text-[13px] text-ink-3">({it.labelEn})</span>
                    </div>
                    <div className="mt-1.5 text-[14px] text-ink-2">{en?.usage || it.desc}</div>
                    {en?.detail && <div className="mt-1 text-[13px] text-ink-3">{en.detail}</div>}
                    {en?.examples?.length ? (
                      <ul className="mt-2 space-y-1 text-[13px] text-ink-2 list-disc pl-4">
                        {en.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                      </ul>
                    ) : null}
                  </div>
                );})}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Protocol */}
      {tab === "protocol" && (
        <div className="space-y-4">
          <div className={card} style={cardStyle}>
            <h2 className={h2}>표준 프로토콜 (16단계)</h2>
            <ol className="mt-2 space-y-1.5">
              {STANDARD_PROTOCOL.map((s, i) => {
                const en = PROTOCOL_ENRICH[s.id];
                return (
                <li key={s.id} className="rounded-xl border p-3.5" style={cardStyle}>
                  <div className="text-[15px]"><b>{i + 1}. {s.label}</b> — <span className="text-ink-2">{en?.usage || s.desc}</span></div>
                  {en?.detail && <div className="mt-1 text-[13px] text-ink-3">{en.detail}</div>}
                  {en?.examples && (
                    <ul className="mt-2 text-[13px] text-ink-2 list-disc pl-4 space-y-0.5">
                      {en.examples.map((ex, j) => <li key={j}>{ex}</li>)}
                    </ul>
                  )}
                </li>
              );})}
            </ol>
          </div>

          <div className={card} style={cardStyle}>
            <h2 className={h2}>현재 계획 기반 엔진 체인</h2>
            <div className="mt-2 space-y-1.5">
              {chain.steps.map((s, i) => {
                const en = ENGINE_STEP_ENRICH[i];
                return (
                <div key={i} className="rounded-xl border p-3.5" style={cardStyle}>
                  <div className="text-[15px]"><b>{i + 1}. {s.stage}</b> — <span className="text-ink-2">{s.value}</span></div>
                  {en && <div className="mt-1 text-[14px] text-ink-2">{en.usage}</div>}
                  {en?.examples && (
                    <ul className="mt-2 text-[13px] text-ink-2 list-disc pl-4 space-y-0.5">
                      {en.examples.map((ex, j) => <li key={j}>{ex}</li>)}
                    </ul>
                  )}
                </div>
              );})}
            </div>
            <div className="mt-2 text-[11px] text-ink-3">요약: {chain.summary}</div>
          </div>
        </div>
      )}

      {/* AI */}
      {tab === "ai" && (
        <div className="space-y-4">
          <div className={card} style={cardStyle}>
            <h2 className={h2}>AI 설문지 생성 (표준 프로토콜)</h2>
            <div className="mt-3 grid md:grid-cols-2 gap-3 text-[14px]">
              <label className="block">제목
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.title} onChange={(e) => setPlan({ ...plan, title: e.target.value })} />
              </label>
              <label className="block">주제
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.topic} onChange={(e) => setPlan({ ...plan, topic: e.target.value })} />
              </label>
              <label className="block md:col-span-2">연구목적
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.purpose} onChange={(e) => setPlan({ ...plan, purpose: e.target.value })} />
              </label>
              <label className="block">응답자
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.respondent} onChange={(e) => setPlan({ ...plan, respondent: e.target.value })} />
              </label>
              <label className="block md:col-span-2">연구문제
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.researchQuestions || ""} onChange={(e) => setPlan({ ...plan, researchQuestions: e.target.value })} />
              </label>
              <label className="block">모집단
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.population || ""} onChange={(e) => setPlan({ ...plan, population: e.target.value })} />
              </label>
              <label className="block">포함기준
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.inclusion || ""} onChange={(e) => setPlan({ ...plan, inclusion: e.target.value })} />
              </label>
              <label className="block">지역
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.geography || ""} onChange={(e) => setPlan({ ...plan, geography: e.target.value })} />
              </label>
              <label className="block">조사시점
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.timeframe || ""} onChange={(e) => setPlan({ ...plan, timeframe: e.target.value })} />
              </label>
              <label className="block md:col-span-2">구성개념/변수
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.constructs || ""} onChange={(e) => setPlan({ ...plan, constructs: e.target.value })} />
              </label>
              <label className="block md:col-span-2">가설
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.hypothesis || ""} onChange={(e) => setPlan({ ...plan, hypothesis: e.target.value })} />
              </label>
              <label className="block">인센티브
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.incentive || ""} onChange={(e) => setPlan({ ...plan, incentive: e.target.value })} />
              </label>
              <label className="block">언어
                <input className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.language || ""} onChange={(e) => setPlan({ ...plan, language: e.target.value })} />
              </label>
              <label className="block">조사방식
                <select className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.modeId} onChange={(e) => setPlan({ ...plan, modeId: e.target.value })}>
                  {SURVEY_MODES.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.labelEn})</option>)}
                </select>
              </label>
              <label className="block">표집
                <select className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.samplingId} onChange={(e) => setPlan({ ...plan, samplingId: e.target.value })}>
                  {SAMPLING.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.labelEn})</option>)}
                </select>
              </label>
              <label className="block">권장 분석
                <select className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.analysisId} onChange={(e) => setPlan({ ...plan, analysisId: e.target.value })}>
                  {ANALYSES.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.labelEn})</option>)}
                </select>
              </label>
              <label className="block">문항 수 (30–100)
                <input type="number" min={30} max={100} className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.count} onChange={(e) => setPlan({ ...plan, count: Math.max(30, Math.min(100, Number(e.target.value) || 30)) })} />
              </label>
              <label className="block">Likert 점수
                <select className="mt-1 w-full rounded-md border px-2 py-2 text-[14px]" style={cardStyle}
                  value={plan.points} onChange={(e) => setPlan({ ...plan, points: Number(e.target.value) })}>
                  {[3, 5, 7, 9].map((n) => <option key={n} value={n}>{n}점</option>)}
                </select>
              </label>
            </div>

            <div className="mt-3">
              <div className="text-[12px] text-ink-2 mb-1">오차 점검 (다중선택):</div>
              <div className="flex flex-wrap gap-1.5">
                {BIASES.map((b) => {
                  const on = plan.biasChecks.includes(b.id);
                  return (
                    <button key={b.id} type="button"
                      onClick={() => setPlan({ ...plan, biasChecks: on ? plan.biasChecks.filter((x) => x !== b.id) : [...plan.biasChecks, b.id] })}
                      className={`rounded-md border px-2 py-0.5 text-[11px] ${on ? "font-semibold" : "text-ink-2"}`}
                      style={{ borderColor: "var(--color-border-tertiary)", background: on ? "var(--brand-soft)" : "transparent", color: on ? "var(--brand-ink)" : undefined }}>
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={runAi} disabled={busy}
                className="rounded-md px-3 py-1.5 text-[13px] font-semibold"
                style={{ background: "var(--brand-ink)", color: "var(--on-accent)", opacity: busy ? 0.5 : 1 }}>
                {busy ? "생성 중…" : "AI 생성 실행"}
              </button>
              <button onClick={runRule}
                className="rounded-md border px-3 py-1.5 text-[13px]"
                style={cardStyle}>규칙(패턴) 기반 생성</button>
            </div>
            {note && <div className="mt-2 text-[12px] text-ink-2">{note}</div>}
            <div className="mt-2 text-[11px] text-ink-3">
              팁: 설정에서 AI 공급자·키를 지정하면 표준 프로토콜 프롬프트가 실행됩니다. 키가 없으면 패턴 라이브러리로 자동 폴백합니다. 제목·주제·목적이 문항에 반영됩니다.
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      {tab === "editor" && (
        <div className={card} style={cardStyle}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className={h2}>생성 문항 · 수동 편집</h2>
              <div className="text-[11px] text-ink-3">
                {items.length}개 문항 · 출처: {source === "ai" ? "AI 생성" : source === "pattern" ? "패턴 생성" : source === "import" ? "불러오기" : source === "manual" ? "수동 작성" : "-"}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addBlank} className="rounded-md border px-2.5 py-1 text-[12px]" style={cardStyle}>+ 문항 추가</button>
              <button onClick={exportXlsx} disabled={!items.length} className="rounded-md border px-2.5 py-1 text-[12px]" style={cardStyle}>xlsx 내보내기</button>
              <button onClick={exportCsv} disabled={!items.length} className="rounded-md border px-2.5 py-1 text-[12px]" style={cardStyle}>CSV 내보내기</button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="mt-3 text-[13px] text-ink-2">아직 문항이 없습니다. <b>AI 설문 생성</b> 또는 <b>불러오기</b>로 시작하세요.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {items.map((it) => (
                <div key={it.no} className="rounded-lg border p-3" style={cardStyle}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={chip} style={chipStyle}>#{it.no}</span>
                    <input className="rounded border px-1.5 py-0.5 text-[11px] w-24" style={cardStyle}
                      value={it.section} onChange={(e) => upd(it.no, "section", e.target.value)} placeholder="섹션" />
                    <select className="rounded border px-1.5 py-0.5 text-[11px]" style={cardStyle}
                      value={it.typeId}
                      onChange={(e) => {
                        const t = QUESTION_TYPES.find((v) => v.id === e.target.value)!;
                        upd(it.no, "typeId", t.id); upd(it.no, "typeLabel", t.label); upd(it.no, "srm", t.srm);
                      }}>
                      {QUESTION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <select className="rounded border px-1.5 py-0.5 text-[11px]" style={cardStyle}
                      value={it.scaleId}
                      onChange={(e) => {
                        const s = SCALES.find((v) => v.id === e.target.value)!;
                        upd(it.no, "scaleId", s.id); upd(it.no, "scaleLabel", s.label);
                      }}>
                      {SCALES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    <input type="number" className="rounded border px-1.5 py-0.5 text-[11px] w-16" style={cardStyle}
                      value={it.points} onChange={(e) => upd(it.no, "points", Number(e.target.value))} placeholder="점수" />
                                        <button onClick={() => move(it.no, -1)} className="text-[11px] text-ink-2">↑</button>
                    <button onClick={() => move(it.no, +1)} className="text-[11px] text-ink-2">↓</button>
                    <button onClick={() => del(it.no)} className="text-[11px] text-red-600">삭제</button>
                  </div>
                  <textarea className="mt-2 w-full rounded border px-2 py-1.5 text-[13px]" style={cardStyle}
                    rows={2} value={it.stem} onChange={(e) => upd(it.no, "stem", e.target.value)} placeholder="문항 어간" />
                  <input className="mt-1 w-full rounded border px-2 py-1.5 text-[12px]" style={cardStyle}
                    value={it.responses} onChange={(e) => upd(it.no, "responses", e.target.value)} placeholder="응답 범주 설명" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import */}
      {tab === "import" && (
        <div className={card} style={cardStyle}>
          <h2 className={h2}>불러오기</h2>
          <div className="mt-2 text-[13px] text-ink-2 space-y-1">
            <div>· <b>엑셀/CSV</b>: 첫 행에 <code>no, section, type(유형), scale(척도), points(점수), stem(문항), responses(응답)</code> 컬럼.</div>
            <div>· <b>텍스트</b>: 한 줄에 하나의 문항. 뒤에 <code>[type=likert; scale=likert_scale; points=5; resp=1~5]</code> 형태로 메타데이터를 붙일 수 있습니다.</div>
          </div>
          <div className="mt-3 flex gap-2">
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" onChange={onImport} className="text-[12px]" />
          </div>
          {note && <div className="mt-2 text-[12px] text-ink-2">{note}</div>}
        </div>
      )}

      {/* Patterns */}
      {tab === "patterns" && (
        <div className="space-y-3">
          {QUESTION_TYPES.map((t) => {
            const pats = PATTERN_LIBRARY.filter((p) => p.typeId === t.id);
            if (!pats.length) return null;
            return (
              <div key={t.id} className={card} style={cardStyle}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[17px] font-semibold">{t.label} <span className="text-[13px] text-ink-3">({t.labelEn})</span></h3>
                </div>
                {SURVEY_ITEM_ENRICH[t.id] && (
                  <div className="mt-2 text-[14px] text-ink-2">
                    <div>{SURVEY_ITEM_ENRICH[t.id].usage}</div>
                    <ul className="mt-1.5 list-disc pl-4 text-[13px] space-y-0.5">
                      {SURVEY_ITEM_ENRICH[t.id].examples.map((ex, i) => <li key={i}>{ex}</li>)}
                    </ul>
                  </div>
                )}
                <div className="mt-3 grid md:grid-cols-2 gap-3">
                  {pats.map((p) => (
                    <div key={p.id} className="rounded-xl border p-3.5" style={cardStyle}>
                      <div className="text-[14px] font-semibold">{p.label}</div>
                      <div className="mt-1.5 text-[14px] text-ink-2">{p.stem}</div>
                      <div className="mt-1 text-[13px] text-ink-3">응답: {p.responses}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
