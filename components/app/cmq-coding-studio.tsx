"use client";
/**
 * CmqCodingStudio v58
 * ═════════════════════════════════════════════════════════════════════
 * 코딩 메뉴 — 5개 탭 스토리 UI. 사이드바 서브 트리 없음.
 * 표준 프로세스: 개요·프로토콜 → 코드북 준비 → 파이프라인 실행 → 개별 조율
 *              → AI 기반 질적연구 표준 코딩북 만들기 및 해석
 *
 *   ① 개요 · 표준 프로토콜   → 무엇을 왜 하는가(개념·20단계 로드맵·실행모드)
 *   ② Codebook             → 분석 기준서 준비(템플릿·AI 생성·수동 추가)
 *   ③ AI 파이프라인(전체)   → 원자료 → 클린징 → 자동 실행 → 결과 & 해석 리포트
 *                              (+ Computational Analytics·Evidence·자체 시각화)
 *   ④ AI 변환기(개별)      → 9개 카드 단계별 실행 · 수동 편집 · 재실행
 *   ⑤ AI 표준 코딩북·해석   → 원자료→계산→추론→코드북 + Evidence/해석 리포트
 *                              (+ 자체 데이터시각화)
 * 탭은 동일한 `proj: CodingProject` 상태를 공유. 스토어에 자동 동기화.
 * 모든 실행 버튼은 (a) 필요 전제조건 검사, (b) busy·progress 상태 관리,
 * (c) 결과 검증 및 명시적 성공/실패 노트를 갖는다.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Play, Sparkles, Wand2, Layers, Layers3, BookOpen, FileText, Upload,
  Download, RotateCcw, ChevronRight, ChevronDown, CheckCircle2, Circle,
  BookMarked,
} from "lucide-react";
import { useStore } from "@/store/app-store";
import { useRegistry } from "@/lib/use-registry";
import {
  FIRST_CYCLE_FAMILIES, FIRST_CYCLE_METHODS, SECOND_CYCLE_METHODS,
  CODING_PROTOCOL, DATA_SOURCE_TYPES, UNITIZATION_LEVELS, STAGE_TRANSFORMERS,
} from "@/lib/cmq-taxonomy";
import { CODING_METHOD_ENRICH } from "@/lib/coding-enrichment";
import {
  emptyProject, migrateCmqProject, analyzeCorpus, cleanupToSegments,
  firstCycleCodeWithMode, recode, categorize, patternize,
  themeize, conceptualize, theorize,
  parseImportedRows, parseImportedText, toCsvCoded, toRowsCoded, toCsvCodebook,
  runDataCleaning, runFullPipeline, runQuickTextMining, aiGenerateCodebook, applyManualRules,
  aggregateCategoryStats, deriveMetaCategories, deriveDiscourseThemes,
  buildPipelineInsight, buildPipelineRuleInterpretation,
  type CodingProject,
  type CodeRow,
  type CodedSegment,
} from "@/lib/cmq-engine";
import {
  INTEGRATED_PROTOCOL, EXECUTION_MODES, MODE_EASY, DATA_CLEANING_PROTOCOL,
  CODEBOOK_FIELDS, CODEBOOK_TEMPLATES, codebookToCsv, codebookFromCsv,
  type CodebookEntry, type ExecutionMode, type ProgressEvent,
} from "@/lib/coding-standards";
import {
  CODEBOOK_LINKAGE_PRINCIPLES,
  FIRST_CYCLE_CODEBOOK_TEMPLATES,
  SECOND_CYCLE_CODEBOOK_TEMPLATES,
  FIRST_CYCLE_DRAFT_FIELDS,
  SECOND_CYCLE_DRAFT_FIELDS,
  emptyFirstDraftForm,
  emptySecondDraftForm,
  type CycleCodebookEntry,
} from "@/lib/coding-cycle-codebook";
import { aiComplete } from "@/lib/engine";
import { extractFile } from "@/lib/ca-automation";
import {
  emptyStandardAiCodebook,
  type StandardAiCodebookState,
} from "@/lib/ai-standard-codebook";
import AiProgressBar from "./ai-progress-bar";
import AiStandardCodebookPanel from "./ai-standard-codebook-panel";
import CodingAnalyticsViz from "./coding-analytics-viz";
import { getFirstCycleDemo } from "@/lib/coding-first-cycle-demos";
import { listMethodDemoSources } from "@/lib/coding-method-demo-sources";

/** 개요 탭에 표시할 1차 코딩 방법(속성→OCM, CMQ 전체) */
const OVERVIEW_CODING_IDS = [
  "attribute", "magnitude", "subcoding", "simultaneous",
  "descriptive", "in_vivo", "process", "initial",
  "emotion", "values", "versus", "evaluation",
  "dramaturgical", "motif", "narrative", "verbal_exchange",
  "holistic", "provisional", "hypothesis",
  "protocol", "domain_taxonomy", "causation", "occampasing",
];
const CODEBOOK_FIRST_METHOD_IDS = OVERVIEW_CODING_IDS;

type OverviewTestSession = {
  methodId: string;
  sourceTitle?: string;
  firstDone: boolean;
  secondMethodId?: string;
  secondDone: boolean;
  processSteps: string[];
  coded: CodedSegment[];
  codebook: CodeRow[];
  refinedCodes: CodeRow[];
  aiSource: string;
};

/* ──────────────────────────────────────────────────────────────── */
/* 스타일 & 헬퍼                                                    */
/* ──────────────────────────────────────────────────────────────── */
const card = "rounded-2xl border p-5 md:p-6";
const cardStyle = { borderColor: "var(--color-border-tertiary)" };
const softStyle = { borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" };
const chip = "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12.5px]";
const body = "text-[14.5px] leading-relaxed text-ink-2";
const h1 = "text-[26px] font-semibold tracking-tight";
const h2 = "text-[18px] font-semibold";
const h3 = "text-[15px] font-semibold";
const btnPrimary = "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold";
const btnGhost = "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12.5px]";

function download(name: string, data: string | Uint8Array, mime: string) {
  const blob = new Blob([data as any], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

type TabId = "overview" | "codebook" | "pipeline" | "individual" | "standard_codebook";
const TABS: { id: TabId; label: string; icon: any; sub: string }[] = [
  { id: "overview",          label: "1. 개요 · 표준 프로토콜", icon: BookOpen,   sub: "무엇을 · 왜 · 어떤 순서로" },
  { id: "codebook",          label: "2. Codebook 준비",        icon: Layers,     sub: "분석 기준서 만들기" },
  { id: "pipeline",          label: "3. AI 파이프라인 실행",    icon: Play,       sub: "한 번에 자동 실행 → 해석" },
  { id: "individual",        label: "4. AI 변환기 개별 조율",   icon: Wand2,      sub: "단계별 실행 · 수동 편집" },
  { id: "standard_codebook", label: "5. AI 기반 질적연구 표준 코딩북 만들기및 해석", icon: BookMarked, sub: "원자료→계산→추론→코드북" },
];

/* ──────────────────────────────────────────────────────────────── */
/* 메인 컴포넌트                                                    */
/* ──────────────────────────────────────────────────────────────── */
export default function CmqCodingStudio({ nav: _nav }: { nav?: (r: string) => void }) {
  const settings = useStore((s) => s.settings);
  const setCmqProject = useStore((s) => s.setCmqProject);
  const cmqInStore = useStore((s) => s.cmqProject);
  const workspaceEpoch = useStore((s) => s.workspaceEpoch);
  const _reg = useRegistry();

  const [tab, setTab] = useState<TabId>("overview");
  const [proj, setProj] = useState<CodingProject>(() => {
    try {
      if (cmqInStore && typeof cmqInStore === "object") {
        return migrateCmqProject(cmqInStore);
      }
    } catch { /* fallthrough */ }
    return emptyProject();
  });
  const [busy, setBusy] = useState<string>("");
  const [note, setNote] = useState<{ kind: "info" | "ok" | "warn" | "err"; msg: string } | null>(null);
  const [prog, setProg] = useState<ProgressEvent | null>(null);
  const [interpretation, setInterpretation] = useState<string>(() => {
    try {
      return String((cmqInStore as any)?.interpretation || "");
    } catch { return ""; }
  });
  const [openCodingId, setOpenCodingId] = useState<string | null>("attribute");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [testBusy, setTestBusy] = useState("");
  const [overviewTest, setOverviewTest] = useState<OverviewTestSession | null>(null);
  const [openDemoSourceId, setOpenDemoSourceId] = useState<string | null>(null);
  const [openSecondCodingId, setOpenSecondCodingId] = useState<string | null>("pattern");

  // v50: 디바운스 자동동기화 + 해석 리포트 영속 (QuotaExceeded 방지)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        setCmqProject({ ...proj, interpretation });
      } catch (e: any) {
        say("warn", "자동저장 지연: " + (e?.message || e));
      }
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [proj, interpretation, setCmqProject]);

  // v57: .mos 불러오기 후 스토어 스냅샷을 UI에 재적용
  useEffect(() => {
    if (!workspaceEpoch) return;
    try {
      const snap = useStore.getState().cmqProject;
      if (snap && typeof snap === "object") {
        setProj(migrateCmqProject(snap));
        if ((snap as any).interpretation) setInterpretation(String((snap as any).interpretation));
      }
    } catch { /* noop */ }
  }, [workspaceEpoch]);

  const say = (kind: "info" | "ok" | "warn" | "err", msg: string) => setNote({ kind, msg });

  function setField<K extends keyof CodingProject>(k: K, v: CodingProject[K]) {
    setProj((p) => ({ ...p, [k]: v }));
  }

  /** 개요 탭 — 1차 코딩 방법별 데모/실제 데이터 테스트 (이 페이지에서 과정·결과 표시) */
  async function runOverviewMethodTest(methodId: string, rawText: string, sourceTitle?: string) {
    if (!rawText.trim()) {
      say("warn", "데모 또는 불러오기 데이터가 필요합니다.");
      return;
    }
    setTestBusy(methodId);
    const steps: string[] = [];
    try {
      steps.push("① 데이터 클린징");
      const clean = await runDataCleaning(rawText, {}, (e) => setProg(e));
      const analysisText = clean.analysisText || rawText;
      steps.push(`② 클린징 완료 · 분석용 ${analysisText.length.toLocaleString()}자`);
      const base: CodingProject = {
        ...proj,
        raw: analysisText,
        rawOriginal: rawText,
        cleanedPreview: clean.cleaned,
        firstMethodIds: [methodId],
        executionMode: (proj.executionMode || "discovery") as ExecutionMode,
        refinedCodes: [],
      };
      const withSegs: CodingProject = {
        ...base,
        segments: cleanupToSegments(base),
      };
      steps.push(`③ 세그먼트 분할 · ${withSegs.segments.length}개 (단위: ${withSegs.unitLevel || "문장"})`);
      steps.push(`④ 1차 코딩 실행 · 방법 ${methodId}`);
      const r = await firstCycleCodeWithMode(withSegs, settings, (e) => setProg(e));
      steps.push(`⑤ 1차 완료 · 코드북 ${r.codebook.length}항 · 엔진 ${r.source}`);
      const nextProj: CodingProject = {
        ...withSegs,
        coded: r.coded,
        codebook: r.codebook,
        firstMethodIds: [methodId],
        secondMethodIds: [],
        refinedCodes: [],
      };
      setProj(nextProj);
      setOverviewTest({
        methodId,
        sourceTitle,
        firstDone: true,
        secondDone: false,
        secondMethodId: undefined,
        processSteps: steps,
        coded: r.coded,
        codebook: r.codebook,
        refinedCodes: [],
        aiSource: r.source,
      });
      say("ok", `1차 테스트 완료 · 세그먼트 ${r.coded.length} · 코드 ${r.codebook.length} (개요 탭에서 결과 확인)`);
    } catch (e: any) {
      say("err", "테스트 실패: " + (e?.message || e));
    } finally {
      setTestBusy("");
      setProg(null);
    }
  }

  /** 개요 탭 — 1차 결과를 바탕으로 2차(재코딩) 실행 */
  async function runOverviewSecondCycle(secondMethodId: string, firstMethodId: string) {
    if (!overviewTest?.firstDone || overviewTest.methodId !== firstMethodId) {
      say("warn", "먼저 이 방법의 1차 코딩 테스트를 완료하세요.");
      return;
    }
    if (!proj.codebook.length) {
      say("warn", "1차 코드북이 비어 있습니다.");
      return;
    }
    setTestBusy(`2nd-${secondMethodId}`);
    try {
      const label = SECOND_CYCLE_METHODS.find((m) => m.id === secondMethodId)?.label || secondMethodId;
      const steps = [
        ...overviewTest.processSteps,
        `⑥ 2차 코딩 선택 · ${label}`,
      ];
      setProg({ phase: "2차 코딩", percent: 40 });
      const p2: CodingProject = {
        ...proj,
        secondMethodIds: [secondMethodId],
        secondMethodId,
      };
      const r = await recode(p2, settings);
      steps.push(`⑦ 2차 완료 · 정련코드 ${r.refined.length}항 · 엔진 ${r.source}`);
      setProj((p) => ({
        ...p,
        secondMethodIds: [secondMethodId],
        secondMethodId,
        refinedCodes: r.refined,
      }));
      setOverviewTest({
        ...overviewTest,
        secondMethodId,
        secondDone: true,
        refinedCodes: r.refined,
        processSteps: steps,
      });
      say("ok", `2차 코딩(${label}) 완료 · 정련코드 ${r.refined.length}개`);
    } catch (e: any) {
      say("err", "2차 코딩 실패: " + (e?.message || e));
    } finally {
      setTestBusy("");
      setProg(null);
    }
  }

  async function onOverviewImport(e: React.ChangeEvent<HTMLInputElement>, methodId: string) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const name = f.name.toLowerCase();
      let text = "";
      if (/\.(xlsx|xls|csv)$/i.test(name)) {
        const buf = await f.arrayBuffer();
        if (name.endsWith(".csv")) text = new TextDecoder().decode(buf);
        else {
          const wb = XLSX.read(buf);
          text = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
        }
      } else if (/\.(pdf|docx?)$/i.test(name)) {
        const doc = await extractFile(f);
        text = doc.text || "";
      } else {
        text = await f.text();
      }
      if (text.trim().length < 40) {
        say("warn", "추출된 텍스트가 너무 짧습니다.");
        return;
      }
      await runOverviewMethodTest(methodId, text);
    } catch (err: any) {
      say("err", "불러오기 실패: " + (err?.message || err));
    }
  }

  /* ─── 진행 요약 (진척도 표시용) ─── */
  const checklist = useMemo(() => ({
    hasCodebook: ((proj.aiCodebook?.length ?? 0) + (proj.aiCodebookSecond?.length ?? 0)) > 0,
    hasRaw: (proj.raw || "").trim().length > 0,
    hasSegments: (proj.segments || []).length > 0,
    hasCoded: (proj.coded || []).length > 0,
    hasCategories: (proj.categories || []).length > 0,
    hasThemes: (proj.themes || []).length > 0,
    hasConcepts: (proj.concepts || []).length > 0,
    hasTheory: (proj.theory || []).length > 0,
  }), [proj]);
  const stepsDone = Object.values(checklist).filter(Boolean).length;
  const codebookTotal = (proj.aiCodebook?.length || 0) + (proj.aiCodebookSecond?.length || 0);

  /* ─── v53: 결과 요약 집계(범주 빈도/밀도 · 상위범주(메타) · 상위주제(담론)) ─── */
  const catStats = useMemo(() => aggregateCategoryStats(proj), [proj]);
  const metaCats = useMemo(() => deriveMetaCategories(proj), [proj]);
  const discourses = useMemo(() => deriveDiscourseThemes(proj), [proj]);

  /* ─── busy wrapper ─── */
  async function withProg(id: string, fn: () => Promise<void> | void) {
    setBusy(id);
    setProg({ phase: "시작", percent: 3 });
    try { await fn(); }
    catch (e: any) {
      console.error("[MethodOS] run error", id, e);
      say("err", `실행 오류 · ${id}: ${e?.message || String(e)}`);
    }
    finally { setBusy(""); setProg(null); }
  }

  /* ══════════════════════════════════════════════════════════════
     ▓ 전체 파이프라인 실행 (탭 ③)
     ══════════════════════════════════════════════════════════════ */
  async function runFull() {
    if (!(proj.raw || "").trim()) {
      say("warn", "원자료가 비어있습니다. '원자료' 영역에 붙여넣거나 파일을 불러오세요.");
      return;
    }
    await withProg("all", async () => {
      const p8 = await runFullPipeline(proj, settings, (e) => setProg(e));
      setProj(p8);
      say("ok",
        `전체 파이프라인 완료 · 실행모드=${p8.executionMode} · ` +
        `세그먼트 ${p8.segments.length} · 코드 ${p8.codebook.length} · ` +
        `범주 ${p8.categories.length} · 테마 ${p8.themes.length} · ` +
        `개념 ${p8.concepts.length} · 이론 ${p8.theory.length}`);
      await generateInterpretation(p8);
    });
  }

  /* ── v53: 옵션 5-2 — 빠른 텍스트마이닝(원자료→가벼운 클린징→범주·패턴→결과 요약) ── */
  async function runQuick() {
    if (!(proj.raw || "").trim()) {
      say("warn", "원자료가 비어있습니다. '원자료' 영역에 붙여넣거나 파일을 불러오세요.");
      return;
    }
    await withProg("quick", async () => {
      const p = await runQuickTextMining(proj, settings, (e) => setProg(e));
      setProj(p);
      say("ok",
        `빠른 텍스트마이닝 완료 · 세그먼트 ${p.segments.length} · 코드 ${p.codebook.length} · ` +
        `범주 ${p.categories.length} · 패턴 ${p.patterns.length} → 결과 요약(6️⃣)에 연동`);
    });
  }

  function buildRuleInterpretation(p: CodingProject): string {
    const withInsight = p.pipelineInsight?.analytics
      ? p
      : { ...p, pipelineInsight: buildPipelineInsight(p) };
    return buildPipelineRuleInterpretation(withInsight);
  }

  async function generateInterpretation(p: CodingProject = proj) {
    if (!p.themes.length && !p.categories.length && !(p.pipelineInsight?.codebook?.length)) {
      setInterpretation("");
      return;
    }
    setBusy("interpret");
    try {
      const insight = p.pipelineInsight?.analytics ? p.pipelineInsight : buildPipelineInsight(p);
      const p2 = { ...p, pipelineInsight: insight };
      const prompt =
        `당신은 사회과학 질적연구 조교입니다. 아래 코딩·Evidence 결과를 초보 연구자가 바로 쓸 수 있도록 한국어로 정밀한 해석 리포트를 작성하세요.\n` +
        `반드시 다음 7개 섹션을 포함하세요 (⑤ AI 표준 코딩북과 동일 수준):\n` +
        `1) 연구 프레임 2) 자료·코딩 규모 3) 핵심 발견 4) 테마/범주 해석\n` +
        `5) 개념·이론·Evidence 6) 잠정 답변 7) 후속 체크리스트.\n` +
        `근거 없는 확대해석은 금지. Evidence Package의 인용문을 적극 활용.\n\n` +
        `[연구질문] ${p2.question || "(미입력)"}\n[연구목적] ${p2.purpose || "(미입력)"}\n` +
        `[규모] raw=${(p2.raw || "").length} segs=${p2.segments.length} coded=${p2.coded.length} codes=${p2.codebook.length}\n` +
        `[계산 상위용어]\n${(insight.analytics?.frequency || []).slice(0, 12).map((f) => `- ${f.term} (${f.count})`).join("\n")}\n\n` +
        `[Evidence]\n${insight.evidence.slice(0, 8).map((e) => `- ${e.candidateCode}: ${(e.representativeQuotes[0] || "").slice(0, 100)}`).join("\n")}\n\n` +
        `[AI코드]\n${insight.codebook.slice(0, 10).map((c) => `- ${c.codeName} f=${c.frequency} sal=${c.salienceScore}`).join("\n")}\n\n` +
        `[범주 ${p2.categories.length}개]\n${p2.categories.slice(0, 10).map((c) => `- ${c.label}: ${c.codes.slice(0, 6).join(", ")}`).join("\n")}\n\n` +
        `[테마 ${p2.themes.length}개]\n${p2.themes.slice(0, 10).map((t) => `- ${t.sentence}`).join("\n")}\n\n` +
        `[개념 ${p2.concepts.length}개]\n${p2.concepts.slice(0, 8).map((c) => `- ${c.label}: ${c.definition}`).join("\n")}\n\n` +
        `[이론 진술 ${p2.theory.length}개]\n${p2.theory.slice(0, 8).map((t) => `- ${t.statement}`).join("\n")}`;
      const ai = await aiComplete(prompt, settings);
      if (ai && ai.trim()) {
        setInterpretation(ai.trim());
        if (!p.pipelineInsight?.analytics) setProj(p2);
      } else {
        setInterpretation(buildRuleInterpretation(p2));
        if (!p.pipelineInsight?.analytics) setProj(p2);
      }
    } catch (e: any) {
      const insight = p.pipelineInsight || buildPipelineInsight(p);
      const p2 = { ...p, pipelineInsight: insight };
      setInterpretation(buildRuleInterpretation(p2));
      if (!p.pipelineInsight?.analytics) setProj(p2);
      say("warn", "AI 해석 실패 → 규칙 기반 리포트로 대체: " + (e?.message || e));
    } finally {
      setBusy("");
    }
  }

  /* ── v53: 최종 해석 리포트 내보내기 (.md 대신 PDF / 엑셀) ── */
  function exportInterpretationXlsx() {
    if (!interpretation.trim()) { say("warn", "먼저 해석 리포트를 생성하세요."); return; }
    const wb = XLSX.utils.book_new();

    // 1) 리포트 본문(섹션·내용)
    const lines = interpretation.split("\n");
    const rows: any[][] = [["섹션", "내용"]];
    let section = "";
    for (const raw of lines) {
      const line = raw.replace(/\r$/, "");
      const h = line.match(/^#{1,6}\s+(.*)$/);
      if (h) { section = h[1].trim(); rows.push([section, ""]); }
      else if (line.trim()) rows.push([section, line.replace(/^[-*]\s?/, "").trim()]);
    }
    const wsReport = XLSX.utils.aoa_to_sheet(rows);
    wsReport["!cols"] = [{ wch: 22 }, { wch: 90 }];
    XLSX.utils.book_append_sheet(wb, wsReport, "해석리포트");

    // 2) 범주 빈도/밀도 집계
    const stats = aggregateCategoryStats(proj);
    if (stats.length) {
      const sRows = [["범주", "코드수", "부여빈도", "밀도(%)"],
        ...stats.map((s) => [s.label, s.codeCount, s.freq, s.densityPct])];
      const ws = XLSX.utils.aoa_to_sheet(sRows);
      ws["!cols"] = [{ wch: 32 }, { wch: 8 }, { wch: 10 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws, "범주빈도밀도");
    }
    // 3) 상위범주(메타)
    const metas = deriveMetaCategories(proj);
    if (metas.length) {
      const mRows = [["상위범주(메타)", "빈도", "포함 범주"],
        ...metas.map((m) => [m.label, m.freq, m.members.join(" · ")])];
      const ws = XLSX.utils.aoa_to_sheet(mRows);
      ws["!cols"] = [{ wch: 26 }, { wch: 8 }, { wch: 70 }];
      XLSX.utils.book_append_sheet(wb, ws, "상위범주(메타)");
    }
    // 4) 상위주제(담론)
    const disc = deriveDiscourseThemes(proj);
    if (disc.length) {
      const dRows = [["상위주제(담론)", "근거"],
        ...disc.map((x) => [x.statement, x.basis.join(" · ")])];
      const ws = XLSX.utils.aoa_to_sheet(dRows);
      ws["!cols"] = [{ wch: 70 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, ws, "상위주제(담론)");
    }
    // 5) Evidence Packages (v56)
    const insight = proj.pipelineInsight;
    if (insight?.evidence?.length) {
      const eRows = [
        ["Code ID", "후보코드", "대표인용", "문맥", "관련개념"],
        ...insight.evidence.map((e) => [
          e.codeId, e.candidateCode,
          (e.representativeQuotes || []).join(" | "),
          e.context,
          (e.relatedConcepts || []).join(", "),
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(eRows), "Evidence");
    }
    if (insight?.codebook?.length) {
      const cRows = [
        ["Code ID", "Code Name", "Frequency", "TF-IDF", "Salience", "Pattern", "Quotes"],
        ...insight.codebook.map((c) => [
          c.codeId, c.codeName, c.frequency, c.tfidf, c.salienceScore,
          c.pattern, (c.representativeQuotes || []).join(" | "),
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cRows), "AI코드북");
    }

    const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    download(`report-${proj.title || "project"}.xlsx`, new Uint8Array(out), "application/octet-stream");
    say("ok", "엑셀 리포트(.xlsx) 저장 — 해석·범주빈도·상위범주·상위주제·Evidence 시트 포함");
  }

  function exportInterpretationPdf() {
    if (!interpretation.trim()) { say("warn", "먼저 해석 리포트를 생성하세요."); return; }
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // 마크다운 → 간단 HTML
    const bodyHtml = interpretation.split("\n").map((raw) => {
      const line = raw.replace(/\r$/, "");
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) { const lv = Math.min(h[1].length, 3); return `<h${lv}>${esc(h[2])}</h${lv}>`; }
      if (/^[-*]\s+/.test(line)) return `<li>${esc(line.replace(/^[-*]\s+/, ""))}</li>`;
      if (line.trim()) return `<p>${esc(line)}</p>`;
      return "";
    }).join("\n");

    const stats = aggregateCategoryStats(proj);
    const metas = deriveMetaCategories(proj);
    const disc = deriveDiscourseThemes(proj);
    const statTable = stats.length ? `<h2>부록 A. 범주 빈도/밀도</h2>
      <table><tr><th>범주</th><th>코드수</th><th>부여빈도</th><th>밀도(%)</th></tr>
      ${stats.map((s) => `<tr><td>${esc(s.label)}</td><td>${s.codeCount}</td><td>${s.freq}</td><td>${s.densityPct}</td></tr>`).join("")}</table>` : "";
    const metaList = metas.length ? `<h2>부록 B. 상위범주(메타)</h2><ul>${metas.map((m) => `<li><b>${esc(m.label)}</b> (빈도 ${m.freq}) — ${esc(m.members.join(" · "))}</li>`).join("")}</ul>` : "";
    const discList = disc.length ? `<h2>부록 C. 상위주제(담론)</h2><ul>${disc.map((x) => `<li>${esc(x.statement)}</li>`).join("")}</ul>` : "";

    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>${esc(proj.title || "해석 리포트")}</title>
<style>
  @page { margin: 18mm; }
  body { font-family: -apple-system, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; color:#1a1a1a; line-height:1.6; font-size:12.5px; }
  h1 { font-size:20px; border-bottom:2px solid #333; padding-bottom:6px; }
  h2 { font-size:15px; margin-top:18px; color:#111; }
  h3 { font-size:13.5px; margin-top:12px; }
  li { margin:2px 0; } p { margin:4px 0; }
  table { border-collapse:collapse; width:100%; margin-top:8px; font-size:11.5px; }
  th,td { border:1px solid #bbb; padding:4px 6px; text-align:left; }
  th { background:#f0f0f0; }
  .meta { color:#666; font-size:11px; margin-bottom:14px; }
</style></head><body>
<h1>${esc(proj.title || "무제 프로젝트")} — 최종 해석 리포트</h1>
<div class="meta">생성 ${new Date().toLocaleString("ko-KR")} · 세그먼트 ${proj.segments.length} · 코드 ${proj.codebook.length} · 범주 ${proj.categories.length} · 패턴 ${proj.patterns.length}</div>
${bodyHtml}
${statTable}${metaList}${discList}
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { say("warn", "팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요."); return; }
    w.document.open(); w.document.write(html); w.document.close();
    say("ok", "PDF 인쇄창이 열렸습니다 — 대상에서 ‘PDF로 저장’을 선택하세요.");
  }

  /* ══════════════════════════════════════════════════════════════
     ▓ 개별 변환기 (탭 ④)
     ══════════════════════════════════════════════════════════════ */
  async function runAnalyze() {
    if (!proj.raw.trim()) return say("warn", "원자료가 필요합니다.");
    await withProg("analyze", async () => {
      setProg({ phase: "원자료 스캔", percent: 40 });
      const r = await analyzeCorpus(proj, settings);
      setProg({ phase: "완료", percent: 100 });
      say("ok", `분석(${r.source}) · 후보코드 ${r.candidateCodes.length}개: ${r.candidateCodes.slice(0, 8).join(", ")}`);
    });
  }
  async function runCleanup() {
    if (!proj.raw.trim()) return say("warn", "원자료가 필요합니다.");
    await withProg("cleanup", async () => {
      // 원문은 보존하고, 클린징은 최초 원문(rawOriginal||raw)에서만 재실행(중첩 오염 방지)
      const source = (proj.rawOriginal || proj.raw).trim() ? (proj.rawOriginal || proj.raw) : proj.raw;
      const r = await runDataCleaning(source, proj.cleaningOptions, (e) => setProg(e));
      const segs = cleanupToSegments({ ...proj, raw: r.analysisText });
      setProj((p) => ({
        ...p,
        rawOriginal: p.rawOriginal || p.raw,
        raw: p.rawOriginal || p.raw, // 원자료 기입란은 원문 유지
        cleanedPreview: r.cleaned,
        segments: segs,
      }));
      say("ok", `데이터 정리 완료 · ${segs.length}개 세그먼트 (단위: ${proj.unitLevel}) · 원문 보존·분석용 분리`);
    });
  }
  async function runFirstCode() {
    if (!proj.segments.length) return say("warn", "먼저 '데이터 정리(2단계)'를 실행하세요.");
    await withProg("first_code", async () => {
      const r = await firstCycleCodeWithMode(proj, settings, (e) => setProg(e));
      let codedNext = r.coded;
      const method0 = proj.firstMethodIds[0] || "descriptive";
      codedNext = applyManualRules(codedNext, proj.manualRules?.coding, method0);
      setProj((p) => ({
        ...p,
        coded: codedNext,
        codebook: r.codebook,
        proposedCodes: r.proposed?.length ? [...(p.proposedCodes || []), ...r.proposed] : (p.proposedCodes || []),
      }));
      const proposedNote = r.proposed?.length ? ` · AI 신규 제안 ${r.proposed.length}개(승인 대기 → 코드북 탭)` : "";
      say("ok", `1차 코딩(${r.source}) · 세그먼트 ${r.coded.length} · 코드 ${r.codebook.length}${proposedNote}`);
    });
  }
  async function runRecode() {
    if (!proj.codebook.length) return say("warn", "먼저 '1차 코딩(3단계)'을 실행하세요.");
    await withProg("recode", async () => {
      setProg({ phase: "코드 정련·통합", percent: 50 });
      const r = await recode(proj, settings);
      setProg({ phase: "완료", percent: 100 });
      setField("refinedCodes", r.refined);
      say("ok", `재코딩(${r.source}) · 정련코드 ${r.refined.length}개`);
    });
  }
  async function runCategorize() {
    if (!proj.codebook.length) return say("warn", "먼저 '1차 코딩'을 실행하세요.");
    await withProg("categorize", async () => {
      setProg({ phase: "범주 도출", percent: 50 });
      const r = await categorize(proj, settings);
      setProg({ phase: "완료", percent: 100 });
      setField("categories", r.categories);
      say("ok", `범주화(${r.source}) · ${r.categories.length}개 범주`);
    });
  }
  async function runPattern() {
    if (!proj.categories.length) return say("warn", "먼저 '범주화'를 실행하세요.");
    await withProg("pattern", async () => {
      setProg({ phase: "패턴 도출", percent: 50 });
      const r = await patternize(proj, settings);
      setProg({ phase: "완료", percent: 100 });
      setField("patterns", r.patterns);
      say("ok", `패턴 분석(${r.source}) · ${r.patterns.length}개 패턴`);
    });
  }
  async function runTheme() {
    if (!proj.categories.length) return say("warn", "먼저 '범주화'를 실행하세요.");
    await withProg("theme", async () => {
      setProg({ phase: "테마 문장 생성", percent: 50 });
      const r = await themeize(proj, settings);
      setProg({ phase: "완료", percent: 100 });
      setField("themes", r.themes);
      say("ok", `Theme(${r.source}) · ${r.themes.length}개 테마 문장`);
    });
  }
  async function runConcept() {
    if (!proj.themes.length) return say("warn", "먼저 'Theme'을 실행하세요.");
    await withProg("concept", async () => {
      setProg({ phase: "개념 승격", percent: 50 });
      const r = await conceptualize(proj, settings);
      setProg({ phase: "완료", percent: 100 });
      setField("concepts", r.concepts);
      say("ok", `Concept(${r.source}) · ${r.concepts.length}개 개념`);
    });
  }
  async function runTheory() {
    if (!proj.concepts.length) return say("warn", "먼저 'Concept'을 실행하세요.");
    await withProg("theory", async () => {
      setProg({ phase: "이론 진술 생성", percent: 50 });
      const r = await theorize(proj, settings);
      setProg({ phase: "완료", percent: 100 });
      setField("theory", r.theory);
      say("ok", `Theory(${r.source}) · ${r.theory.length}개 이론 진술`);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     ▓ 파일 I/O
     ══════════════════════════════════════════════════════════════ */
  const rawFileRef = useRef<HTMLInputElement>(null);
  async function onImportRaw(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const name = f.name.toLowerCase();
      // PDF / DOCX / XLSX / CSV / TXT — 통합 추출 후 클린징 준비
      if (name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".doc")
        || name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")
        || name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".json")) {
        let text = "";
        let codedFromRows: ReturnType<typeof parseImportedRows> = [];
        if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
          const buf = await f.arrayBuffer();
          const wb = XLSX.read(buf, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          codedFromRows = parseImportedRows(rows);
          // 시트 전체를 원자료 텍스트로도 보존
          text = XLSX.utils.sheet_to_csv(ws);
          if (!text.trim() && codedFromRows.length) {
            text = codedFromRows.map((c) => c.text).join("\n");
          }
        } else if (name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".doc")) {
          const doc = await extractFile(f);
          text = doc.text || "";
          if (doc.chars < 40 && name.endsWith(".pdf")) {
            say("warn", "스캔 PDF로 보입니다. OCR이 필요할 수 있습니다. 추출된 텍스트가 매우 적습니다.");
          }
        } else {
          text = await f.text();
        }
        text = (text || "").replace(/\r\n/g, "\n").trim();
        if (!text && !codedFromRows.length) {
          say("warn", "파일에서 텍스트를 추출하지 못했습니다.");
          e.target.value = "";
          return;
        }
        // 불러오기: 원문은 raw에 보존, 클린징 결과는 표시용·분석용으로 분리
        const cleaned = await runDataCleaning(text || codedFromRows.map((c) => c.text).join("\n"), proj.cleaningOptions);
        const original = text || codedFromRows.map((c) => c.text).join("\n");
        const segs = codedFromRows.length
          ? codedFromRows.map((c) => ({ id: c.id, unit: c.unit, source: c.source, text: c.text }))
          : parseImportedText(cleaned.analysisText, proj.unitLevel);
        setProj((p) => ({
          ...p,
          raw: original,
          rawOriginal: original,
          cleanedPreview: cleaned.cleaned,
          segments: segs.length ? segs : cleanupToSegments({ ...p, raw: cleaned.analysisText }),
          coded: codedFromRows.length ? codedFromRows : p.coded,
        }));
        say("ok", `불러오기 완료 · 원문 ${original.length.toLocaleString()}자 · 세그먼트 ${(segs.length || 0)} · 클린징 ${cleaned.steps.length}단계(원문 보존)`);
      } else {
        say("warn", "지원 형식: PDF, DOCX, XLSX, CSV, TXT, MD");
      }
    } catch (err: any) {
      console.error(err);
      say("err", "파일 불러오기 실패: " + (err?.message || err));
    }
    e.target.value = "";
  }

  async function importForTransformer(file: File, label: string) {
    try {
      const name = file.name.toLowerCase();
      let text = "";
      if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        text = XLSX.utils.sheet_to_csv(ws);
      } else if (name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".doc")) {
        const doc = await extractFile(file);
        text = doc.text || "";
      } else {
        text = await file.text();
      }
      text = (text || "").replace(/\r\n/g, "\n").trim().slice(0, 200000);
      if (!text) {
        say("warn", `[${label}] 추출된 텍스트가 없습니다.`);
        return;
      }
      const cleaned = await runDataCleaning(text, proj.cleaningOptions);
      setProj((p) => {
        const appended = (p.raw ? p.raw + "\n" : "") + text;
        return {
          ...p,
          raw: appended,
          rawOriginal: appended,
          cleanedPreview: (p.cleanedPreview ? p.cleanedPreview + "\n" : "") + cleaned.cleaned,
        };
      });
      say("ok", `[${label}] 원문 추가됨 (${text.length.toLocaleString()}자) · 클린징 미리보기 갱신`);
    } catch (err: any) {
      say("err", `[${label}] 불러오기 실패: ${err?.message || err}`);
    }
  }

  function exportResultsXlsx() {
    if (!proj.coded.length && !proj.categories.length) {
      return say("warn", "내보낼 결과가 없습니다. 파이프라인을 먼저 실행하세요.");
    }
    const wb = XLSX.utils.book_new();
    if (proj.coded.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toRowsCoded(proj.coded)), "coded");
    }
    if (proj.codebook.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["code", "count", "methodId", "protocol", "definition", "example"],
        ...proj.codebook.map((r) => [r.code, r.count, r.methodId, r.cmq, r.definition, r.example]),
      ]), "codebook");
    }
    if (proj.categories.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["id", "label", "codes"],
        ...proj.categories.map((c) => [c.id, c.label, c.codes.join(" | ")]),
      ]), "categories");
    }
    if (proj.themes.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["id", "sentence"],
        ...proj.themes.map((t) => [t.id, t.sentence]),
      ]), "themes");
    }
    if (proj.concepts.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["id", "label", "definition"],
        ...proj.concepts.map((c) => [c.id, c.label, c.definition]),
      ]), "concepts");
    }
    if (proj.theory.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["id", "statement"],
        ...proj.theory.map((t) => [t.id, t.statement]),
      ]), "theory");
    }
    if (interpretation) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["해석 리포트"],
        ...interpretation.split("\n").map((l) => [l]),
      ]), "interpretation");
    }
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    download(`coding-${proj.title || "project"}.xlsx`, new Uint8Array(buf), "application/octet-stream");
    say("ok", "xlsx 내보내기 완료");
  }

  function resetProject() {
    if (typeof window === "undefined") return;
    const ok = window.confirm("현재 코딩 프로젝트를 초기화합니다. 계속할까요?");
    if (!ok) return;
    setProj(emptyProject());
    setInterpretation("");
    say("ok", "코딩 프로젝트 초기화됨 (원자료 비움)");
  }

  /* ══════════════════════════════════════════════════════════════
     ▓ Codebook 관리 (탭 ②) — v54: 1차/2차 분리 · 방법별 템플릿 · 연결성
     ══════════════════════════════════════════════════════════════ */
  const cbFileRef = useRef<HTMLInputElement>(null);
  const [cbCycle, setCbCycle] = useState<1 | 2>(1);
  const [cbMethodFilter, setCbMethodFilter] = useState<string>("descriptive");
  const [firstDraft, setFirstDraft] = useState(() => emptyFirstDraftForm());
  const [secondDraft, setSecondDraft] = useState(() => emptySecondDraftForm());
  const [newEntry, setNewEntry] = useState<CycleCodebookEntry>(() => ({
    id: "", name: "", definition: "", inclusion: "", exclusion: "",
    keywords: [], example: "", version: "v1.0", createdBy: "Researcher", status: "Draft",
    cycle: 1, methodId: "descriptive",
    applicationCriteria: "", notes: "", sourceContext: "",
    linkage: "", validation: "", theoreticalAlignment: "",
  }));
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [cbFormOpen, setCbFormOpen] = useState(false);

  const activeCodebook = cbCycle === 1 ? (proj.aiCodebook || []) : (proj.aiCodebookSecond || []);
  const setActiveCodebook = (list: CodebookEntry[]) => {
    if (cbCycle === 1) setProj((p) => ({ ...p, aiCodebook: list, executionMode: p.executionMode === "discovery" ? "codebook" : p.executionMode }));
    else setProj((p) => ({ ...p, aiCodebookSecond: list, executionMode: p.executionMode === "discovery" ? "codebook" : p.executionMode }));
  };

  const cycleTemplates = cbCycle === 1 ? FIRST_CYCLE_CODEBOOK_TEMPLATES : SECOND_CYCLE_CODEBOOK_TEMPLATES;
  const filteredTemplates = cycleTemplates.filter((t) => !cbMethodFilter || t.methodId === cbMethodFilter);
  const cycleMethods = cbCycle === 1
    ? FIRST_CYCLE_METHODS.filter((m) => CODEBOOK_FIRST_METHOD_IDS.includes(m.id))
    : SECOND_CYCLE_METHODS;

  async function importCodebookFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const nm = f.name.toLowerCase();
      const text = await f.text();
      let list: CodebookEntry[] = [];
      if (nm.endsWith(".json")) {
        const j = JSON.parse(text);
        if (Array.isArray(j)) list = j;
        else if (Array.isArray(j?.first) || Array.isArray(j?.second)) {
          if (Array.isArray(j.first)) setProj((p) => ({ ...p, aiCodebook: j.first }));
          if (Array.isArray(j.second)) setProj((p) => ({ ...p, aiCodebookSecond: j.second }));
          say("ok", `코드북 불러옴 · 1차 ${j.first?.length || 0} · 2차 ${j.second?.length || 0}`);
          e.target.value = "";
          return;
        }
      } else {
        list = codebookFromCsv(text);
      }
      if (list.length) {
        setActiveCodebook(list.map((x) => ({ ...x, cycle: cbCycle })));
        say("ok", `${cbCycle}차 코드북 ${list.length}개 불러옴`);
      } else say("warn", "코드북에 유효한 항목이 없습니다");
    } catch (err: any) {
      say("err", "코드북 파일 파싱 실패: " + (err?.message || err));
    }
    e.target.value = "";
  }
  async function runAiGenerateCodebook(cycle: 1 | 2) {
    const hints = cycle === 1 ? firstDraft : secondDraft;
    const hasHints = Object.values(hints).some((v) => String(v || "").trim());
    if (!proj.raw.trim() && !hasHints) {
      return say("warn", "원자료(탭③) 또는 AI 초안 기입란을 먼저 채워 주세요.");
    }
    await withProg(cycle === 1 ? "gen_codebook" : "gen_codebook_2", async () => {
      const cb = await aiGenerateCodebook(proj.raw, settings, (e) => setProg(e), {
        cycle,
        methodIds: cycle === 1 ? (proj.firstMethodIds || []) : (proj.secondMethodIds || [proj.secondMethodId]),
        draftHints: hints,
        firstCodebook: proj.aiCodebook || [],
        question: proj.question,
        framework: proj.framework,
      });
      if (cycle === 1) {
        setProj((p) => ({
          ...p,
          aiCodebook: cb,
          firstDraftHints: hints,
          executionMode: p.executionMode === "discovery" ? "codebook" : p.executionMode,
        }));
      } else {
        setProj((p) => ({
          ...p,
          aiCodebookSecond: cb,
          secondDraftHints: hints,
          executionMode: p.executionMode === "discovery" ? "codebook" : p.executionMode,
        }));
      }
      say("ok", `AI ${cycle}차 코드북 ${cb.length}개 생성 (연결성 원칙 반영 · Draft · 승인/수정 권장)`);
    });
  }
  function loadTemplate(id: string) {
    const t = [...FIRST_CYCLE_CODEBOOK_TEMPLATES, ...SECOND_CYCLE_CODEBOOK_TEMPLATES, ...CODEBOOK_TEMPLATES.map((x) => ({
      ...x, cycle: 1 as const, methodId: "descriptive", labelEn: x.label, familyId: "legacy",
    }))].find((x) => x.id === id);
    if (!t || !("entries" in t)) return;
    const entries = (t as any).entries as CodebookEntry[];
    const cycle = ((t as any).cycle || 1) as 1 | 2;
    const methodId = (t as any).methodId as string | undefined;
    if (cycle === 1) {
      setProj((p) => ({
        ...p,
        aiCodebook: entries,
        executionMode: (t as any).mode || "codebook",
        firstMethodIds: methodId && !(p.firstMethodIds || []).includes(methodId)
          ? [...(p.firstMethodIds || []), methodId]
          : p.firstMethodIds,
      }));
      setCbCycle(1);
      if (methodId) setCbMethodFilter(methodId);
    } else {
      setProj((p) => {
        const ids = [...(p.secondMethodIds || [])];
        if (methodId && !ids.includes(methodId)) ids.push(methodId);
        return {
          ...p,
          aiCodebookSecond: entries,
          executionMode: (t as any).mode || "codebook",
          secondMethodIds: ids.length ? ids : ["pattern"],
          secondMethodId: ids[0] || "pattern",
        };
      });
      setCbCycle(2);
      if (methodId) setCbMethodFilter(methodId);
    }
    say("ok", `템플릿 '${(t as any).label}' 로드 · ${entries.length}개 코드 · ${cycle}차`);
  }
  function upsertEntry() {
    if (!newEntry.name.trim()) return say("warn", "코드명을 입력하세요");
    const list = [...activeCodebook];
    const entry: CycleCodebookEntry = {
      ...newEntry,
      id: newEntry.id || `${cbCycle === 1 ? "C" : "S"}${String(list.length + 1).padStart(3, "0")}`,
      cycle: cbCycle,
      methodId: newEntry.methodId || cbMethodFilter,
      inclusion: newEntry.inclusion || newEntry.applicationCriteria || "",
      keywords: Array.isArray(newEntry.keywords)
        ? newEntry.keywords
        : String(newEntry.keywords || "").split(/[,|]/).map((s) => s.trim()).filter(Boolean),
    };
    if (editingIdx !== null) { list[editingIdx] = entry; setEditingIdx(null); }
    else list.push(entry);
    setActiveCodebook(list);
    setNewEntry({
      id: "", name: "", definition: "", inclusion: "", exclusion: "",
      keywords: [], example: "", version: "v1.0", createdBy: "Researcher", status: "Draft",
      cycle: cbCycle, methodId: cbMethodFilter,
      applicationCriteria: "", notes: "", sourceContext: "",
      linkage: "", validation: "", theoreticalAlignment: "",
    });
    setCbFormOpen(false);
    say("ok", `${cbCycle}차 코드북 저장 · 총 ${list.length}개`);
  }
  function editEntry(i: number) {
    const list = activeCodebook;
    setNewEntry({ ...list[i], keywords: list[i].keywords || [], cycle: cbCycle });
    setEditingIdx(i);
    setCbFormOpen(true);
  }
  function deleteEntry(i: number) {
    if (!window.confirm(`코드 '${activeCodebook[i].name}' 삭제할까요?`)) return;
    const list = [...activeCodebook]; list.splice(i, 1);
    setActiveCodebook(list);
    say("ok", `삭제됨 · 남은 코드 ${list.length}개`);
  }
  function approveProposed(idx: number) {
    const proposed = [...(proj.proposedCodes || [])];
    const item = proposed.splice(idx, 1)[0]; if (!item) return;
    const approved: CodebookEntry = { ...item, status: "Approved", cycle: 1 };
    setProj((p) => ({ ...p, proposedCodes: proposed, aiCodebook: [...(p.aiCodebook || []), approved] }));
    say("ok", `AI 제안 '${item.name}' 승인됨 → 1차 코드북 반영`);
  }
  function rejectProposed(idx: number) {
    const proposed = [...(proj.proposedCodes || [])];
    proposed.splice(idx, 1);
    setProj((p) => ({ ...p, proposedCodes: proposed }));
    say("info", "제안 거절됨");
  }
  function toggleSecondMethod(id: string) {
    const cur = proj.secondMethodIds || (proj.secondMethodId ? [proj.secondMethodId] : []);
    const on = cur.includes(id);
    const next = on ? cur.filter((x) => x !== id) : [...cur, id];
    const final = next.length ? next : ["pattern"];
    setProj((p) => ({ ...p, secondMethodIds: final, secondMethodId: final[0] }));
  }

  /* ══════════════════════════════════════════════════════════════
     ▓ 수동 편집 (탭 ④ 내부)
     ══════════════════════════════════════════════════════════════ */
  const [editorOpen, setEditorOpen] = useState(false);
  function addSegment() {
    setProj((p) => ({ ...p, segments: [...p.segments, { id: `seg${p.segments.length + 1}`, unit: p.unitLevel, text: "" }] }));
  }
  function updSegText(id: string, t: string) {
    setProj((p) => ({ ...p, segments: p.segments.map((s) => s.id === id ? { ...s, text: t } : s) }));
  }
  function delSegment(id: string) {
    setProj((p) => ({
      ...p,
      segments: p.segments.filter((s) => s.id !== id),
      coded: p.coded.filter((s) => s.id !== id),
    }));
  }
  function addCodedCode(id: string) {
    setProj((p) => ({
      ...p,
      coded: p.coded.map((s) => s.id === id
        ? { ...s, codes: [...s.codes, { code: "새 코드", methodId: p.firstMethodIds[0] || "descriptive" }] }
        : s),
    }));
  }
  function updCodedCode(id: string, idx: number, v: string) {
    setProj((p) => ({
      ...p,
      coded: p.coded.map((s) => s.id === id ? { ...s, codes: s.codes.map((c, i) => i === idx ? { ...c, code: v } : c) } : s),
    }));
  }
  function delCodedCode(id: string, idx: number) {
    setProj((p) => ({
      ...p,
      coded: p.coded.map((s) => s.id === id ? { ...s, codes: s.codes.filter((_, i) => i !== idx) } : s),
    }));
  }

  /* ══════════════════════════════════════════════════════════════
     ▓ RENDER
     ══════════════════════════════════════════════════════════════ */
  const currentMode = EXECUTION_MODES.find((m) => m.id === (proj.executionMode || "hybrid"))
    || EXECUTION_MODES[0];

  const overviewMethods = OVERVIEW_CODING_IDS
    .map((id) => FIRST_CYCLE_METHODS.find((m) => m.id === id))
    .filter(Boolean) as typeof FIRST_CYCLE_METHODS;

  return (
    <div className="space-y-4">
      {/* ═══ 상단 헤더 ═══ */}
      <div className={card} style={cardStyle}>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className={h1} style={{ fontFamily: "var(--font-gothic)" }}>코딩 스튜디오</h1>
          <span className={chip} style={softStyle}>실행모드: {currentMode.label}</span>
          {checklist.hasCodebook && <span className={chip} style={softStyle}>코드북 {codebookTotal}개 (1차 {proj.aiCodebook?.length || 0} · 2차 {proj.aiCodebookSecond?.length || 0})</span>}
          <span className="ml-auto text-[12px] text-ink-3">진행: {stepsDone} / 8 단계</span>
        </div>
        <p className={`mt-2 ${body}`}>
          질적 자료를 <b>표준 프로토콜</b>에 따라 자동 분석하는 도구입니다. 순서대로 진행하면 됩니다 —
          ① 개요를 읽고 실행모드를 선택 → ② 코드북을 준비 → ③ 파이프라인을 실행 → ④ 필요시 개별 조율 →
          ⑤ AI 기반 표준 코딩북·해석(원자료→계산→추론→코드북).
          <b> 초보자면 ① → ③ 또는 ⑤ 순서로 바로 시도해도 됩니다.</b>
        </p>
      </div>

      {/* ═══ 탭 바 ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`rounded-xl border p-3 text-left transition ${active ? "font-semibold" : "text-ink-2"}`}
              style={{
                borderColor: active ? "var(--brand-ink)" : "var(--color-border-tertiary)",
                background: active ? "var(--brand-soft)" : "transparent",
                color: active ? "var(--brand-ink)" : undefined,
              }}>
              <div className="flex items-center gap-2">
                <Icon size={16} />
                <div className="text-[13.5px]">{t.label}</div>
              </div>
              <div className="mt-1 text-[11.5px] text-ink-3">{t.sub}</div>
            </button>
          );
        })}
      </div>

      {/* ═══ 알림 ═══ */}
      {note && (
        <div className={card} style={{
          ...cardStyle,
          background:
            note.kind === "ok" ? "rgba(16,185,129,.08)" :
            note.kind === "warn" ? "rgba(245,158,11,.09)" :
            note.kind === "err" ? "rgba(239,68,68,.08)" :
            "var(--color-background-secondary)",
        }}>
          <div className="flex items-start gap-2">
            <div className="text-[13px] whitespace-pre-wrap text-ink-2 flex-1">{note.msg}</div>
            <button onClick={() => setNote(null)} className="text-[11px] text-ink-3 hover:text-ink-2">닫기</button>
          </div>
        </div>
      )}

      {/* ═══ 전역 진행률 ═══ */}
      {(busy || prog) && (
        <div className={card} style={cardStyle}>
          <AiProgressBar progress={prog} label={busy ? `실행 · ${busy}` : "AI 실행"} />
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          탭 ① 개요 · 표준 프로토콜
          ──────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* 무엇을 · 왜 · 어떤 순서로 */}
          <div className={card} style={cardStyle}>
            <h2 className={h2}>💡 코딩이란 무엇인가?</h2>
            <p className={`mt-2 ${body}`}>
              인터뷰·관찰노트·오픈서베이 응답 같은 <b>이야기(원자료)</b>에서 반복되는 의미 조각에 이름을 붙이고(=코드),
              비슷한 코드끼리 묶고(=범주), 큰 이야기 줄기를 세우는(=테마·개념·이론) 과정입니다.
              MethodOS는 이 과정을 <b>표준 프로토콜 20단계</b>로 정리하고, 각 단계를 <b>AI 변환기</b>가 초안으로 만들어 줍니다.
            </p>
            <div className="mt-3 grid md:grid-cols-3 gap-2 text-[12.5px]">
              <div className="rounded-lg border p-2.5" style={cardStyle}>
                <div className="font-medium">예시 원문</div>
                <div className="mt-1 text-ink-2">"AI 때문에 디자이너가 필요 없어질 것 같아 불안하다."</div>
              </div>
              <div className="rounded-lg border p-2.5" style={cardStyle}>
                <div className="font-medium">→ 1차 코딩</div>
                <div className="mt-1 text-ink-2">코드: <b>Employment Anxiety</b> (일자리 상실 우려)</div>
              </div>
              <div className="rounded-lg border p-2.5" style={cardStyle}>
                <div className="font-medium">→ 범주·테마</div>
                <div className="mt-1 text-ink-2">범주: <b>AI Risk</b> / 테마: <b>"직업 정체성이 위협받는다"</b></div>
              </div>
            </div>
          </div>

          {/* 1차 코딩 방법 설명 · 예시 (CMQ) */}
          <div className={card} style={cardStyle}>
            <h2 className={h2}>📖 1차 코딩 방법 — 설명과 예시</h2>
            <p className="mt-1 text-[13px] text-ink-3">
              문법·요소·정서·언어/문학·탐색·절차 계열의 코딩 방법입니다. 카드를 열어 설명과 4–5개 예시를 확인하세요.
            </p>
            <div className="mt-3 space-y-2">
              {overviewMethods.map((m) => {
                const enrich = CODING_METHOD_ENRICH[m.id];
                const open = openCodingId === m.id;
                const examples = (enrich?.examples || [m.example]).slice(0, 5);
                return (
                  <div key={m.id} className="rounded-xl border overflow-hidden" style={cardStyle}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                      onClick={() => setOpenCodingId(open ? null : m.id)}
                    >
                      {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="font-semibold text-[14px]">{m.label}</span>
                      <span className="text-[12px] text-ink-3">({m.labelEn})</span>
                      <span className="ml-auto text-[11px] text-ink-3">{m.familyId}</span>
                    </button>
                    {open && (
                      <div className="px-3 pb-3 border-t" style={{ borderColor: "var(--color-border-tertiary)" }}>
                        <p className="mt-2 text-[13.5px] text-ink-2 leading-relaxed">{m.easy}</p>
                        {enrich?.usage && <p className="mt-1.5 text-[12.5px] text-ink-3">{enrich.usage}</p>}
                        <div className="mt-2 text-[12px] text-ink-3">적합: {m.bestFor}</div>
                        <div className="mt-2">
                          <div className="text-[12.5px] font-medium mb-1">예시</div>
                          <ul className="list-disc pl-5 space-y-1 text-[13px] text-ink-2">
                            {examples.map((ex, i) => <li key={i}>{ex}</li>)}
                          </ul>
                        </div>
                        {/* v58: 데모(예시별·3쪽) / 실제 데이터 — 개요 탭에서 1·2차 코딩 */}
                        <div className="mt-3 rounded-lg border p-3 space-y-3" style={{ ...softStyle }}>
                          <div className="text-[12.5px] font-semibold">결과 테스트 · 데모 또는 실제 데이터</div>
                          <p className="text-[12px] text-ink-3">
                            각 예시마다 A4 약 3쪽 분량 합성 데모를 열어 확인한 뒤, 이 페이지에서 1차 코딩·2차 코딩까지 실행합니다.
                            (파이프라인 탭으로 이동하지 않습니다.)
                          </p>

                          <div className="space-y-1.5">
                            <div className="text-[12px] font-medium text-ink-2">예시별 데모 데이터 (아코디언)</div>
                            {listMethodDemoSources(m.id).map((src) => {
                              const srcOpen = openDemoSourceId === src.id;
                              return (
                                <div key={src.id} className="rounded-lg border overflow-hidden" style={cardStyle}>
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-[12.5px]"
                                    onClick={() => setOpenDemoSourceId(srcOpen ? null : src.id)}
                                  >
                                    {srcOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    <span className="font-medium">{src.title}</span>
                                    <span className="ml-auto text-[11px] text-ink-3">≈{Math.round(src.chars / 900)}쪽</span>
                                  </button>
                                  {srcOpen && (
                                    <div className="px-2.5 pb-2.5 border-t" style={{ borderColor: "var(--color-border-tertiary)" }}>
                                      <pre className="mt-2 max-h-48 overflow-y-auto text-[11px] whitespace-pre-wrap text-ink-2 leading-relaxed rounded-md p-2" style={softStyle}>
                                        {src.text.slice(0, 2400)}{src.text.length > 2400 ? "\n…(미리보기 — 테스트 시 전문 사용)" : ""}
                                      </pre>
                                      <button
                                        type="button"
                                        disabled={!!testBusy}
                                        className={btnPrimary + " mt-2"}
                                        style={{ background: "var(--brand-ink)", color: "var(--on-accent)", opacity: testBusy ? 0.5 : 1 }}
                                        onClick={() => runOverviewMethodTest(m.id, src.text, src.title)}
                                      >
                                        <Play size={13} /> {testBusy === m.id ? "테스트 중…" : "이 예시 데모로 1차 코딩"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={!!testBusy}
                              className={btnPrimary}
                              style={{ background: "var(--brand-ink)", color: "var(--on-accent)", opacity: testBusy ? 0.5 : 1 }}
                              onClick={() => {
                                const demo = getFirstCycleDemo(m.id);
                                if (!demo) return say("warn", "이 방법의 통합 데모가 없습니다.");
                                runOverviewMethodTest(m.id, demo.text, demo.title);
                              }}
                            >
                              <Play size={13} /> {testBusy === m.id ? "테스트 중…" : "통합 데모로 1차 코딩"}
                            </button>
                            <label className={btnGhost} style={{ ...cardStyle, cursor: "pointer" }}>
                              <Upload size={13} /> 실제 데이터 불러오기
                              <input
                                type="file"
                                className="hidden"
                                accept=".txt,.md,.csv,.xlsx,.xls,.pdf,.docx,.doc"
                                onChange={(e) => onOverviewImport(e, m.id)}
                              />
                            </label>
                          </div>

                          {overviewTest?.methodId === m.id && (
                            <div className="mt-2 space-y-3 rounded-lg border p-3" style={cardStyle}>
                              <div className="text-[13px] font-semibold">
                                코딩 과정 · 결과
                                {overviewTest.sourceTitle && (
                                  <span className="ml-1 text-[12px] font-normal text-ink-3">({overviewTest.sourceTitle})</span>
                                )}
                              </div>
                              {prog && testBusy === m.id && (
                                <AiProgressBar progress={prog} label="1차 코딩 테스트" compact />
                              )}
                              <ol className="list-decimal pl-5 space-y-0.5 text-[12px] text-ink-2">
                                {overviewTest.processSteps.map((s, i) => <li key={i}>{s}</li>)}
                              </ol>

                              {overviewTest.firstDone && (
                                <>
                                  <div className="text-[12.5px] font-medium">1차 코딩 결과 · 세그먼트 {overviewTest.coded.length} · 코드북 {overviewTest.codebook.length}</div>
                                  <div className="max-h-52 overflow-auto rounded border">
                                    <table className="w-full text-[11.5px] border-collapse">
                                      <thead>
                                        <tr className="bg-[var(--color-background-secondary)]">
                                          <th className="text-left p-1.5 border-b w-14">ID</th>
                                          <th className="text-left p-1.5 border-b">발췌</th>
                                          <th className="text-left p-1.5 border-b w-36">코드</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {overviewTest.coded.slice(0, 25).map((row) => (
                                          <tr key={row.id} className="align-top">
                                            <td className="p-1.5 border-b text-ink-3">{row.id}</td>
                                            <td className="p-1.5 border-b text-ink-2">{row.text.slice(0, 120)}{row.text.length > 120 ? "…" : ""}</td>
                                            <td className="p-1.5 border-b font-medium">{row.codes.map((c) => c.code).join(", ") || "—"}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  {overviewTest.codebook.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {overviewTest.codebook.slice(0, 14).map((cb) => (
                                        <span key={cb.code} className={chip} style={softStyle} title={cb.definition}>
                                          {cb.code} <span className="text-ink-3">({cb.count})</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  <div className="pt-2 border-t" style={{ borderColor: "var(--color-border-tertiary)" }}>
                                    <div className="text-[12.5px] font-semibold">2차 코딩으로 이어가기</div>
                                    <p className="text-[12px] text-ink-3 mt-0.5">1차 결과를 바탕으로 재코딩 방법을 선택하세요.</p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {SECOND_CYCLE_METHODS.map((sm) => {
                                        const on = overviewTest.secondMethodId === sm.id;
                                        const running = testBusy === `2nd-${sm.id}`;
                                        return (
                                          <button
                                            key={sm.id}
                                            type="button"
                                            disabled={!!testBusy}
                                            className="rounded-md border px-2 py-1 text-[11px]"
                                            style={{
                                              borderColor: "var(--color-border-tertiary)",
                                              background: on ? "var(--brand-soft)" : "transparent",
                                              color: on ? "var(--brand-ink)" : undefined,
                                              opacity: testBusy && !running ? 0.5 : 1,
                                            }}
                                            onClick={() => runOverviewSecondCycle(sm.id, m.id)}
                                          >
                                            {running ? "실행 중…" : sm.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {overviewTest.secondDone && overviewTest.refinedCodes.length > 0 && (
                                    <div>
                                      <div className="text-[12.5px] font-medium">
                                        2차 코딩 결과 · 정련코드 {overviewTest.refinedCodes.length}
                                        {overviewTest.secondMethodId && (
                                          <span className="text-ink-3 font-normal">
                                            {" "}· {SECOND_CYCLE_METHODS.find((x) => x.id === overviewTest.secondMethodId)?.label}
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-1 max-h-40 overflow-auto rounded border">
                                        <table className="w-full text-[11.5px] border-collapse">
                                          <thead>
                                            <tr className="bg-[var(--color-background-secondary)]">
                                              <th className="text-left p-1.5 border-b">정련코드</th>
                                              <th className="text-left p-1.5 border-b">정의</th>
                                              <th className="text-left p-1.5 border-b w-16">n</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {overviewTest.refinedCodes.slice(0, 20).map((rc) => (
                                              <tr key={rc.code} className="align-top">
                                                <td className="p-1.5 border-b font-medium">{rc.code}</td>
                                                <td className="p-1.5 border-b text-ink-2">{rc.definition?.slice(0, 80)}{(rc.definition?.length || 0) > 80 ? "…" : ""}</td>
                                                <td className="p-1.5 border-b">{rc.count}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2차 코딩 방법 설명 · 예시 */}
          <div className={card} style={cardStyle}>
            <h2 className={h2}>📗 2차 코딩 방법 — 설명과 예시</h2>
            <p className="mt-1 text-[13px] text-ink-3">
              1차 코딩이 끝난 뒤, 위 각 방법의 테스트 패널에서 아래 2차 방법 중 하나를 선택해 이어갈 수 있습니다.
            </p>
            <div className="mt-3 space-y-2">
              {SECOND_CYCLE_METHODS.map((m) => {
                const open = openSecondCodingId === m.id;
                return (
                  <div key={m.id} className="rounded-xl border overflow-hidden" style={cardStyle}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                      onClick={() => setOpenSecondCodingId(open ? null : m.id)}
                    >
                      {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="font-semibold text-[14px]">{m.label}</span>
                      <span className="text-[12px] text-ink-3">({m.labelEn})</span>
                    </button>
                    {open && (
                      <div className="px-3 pb-3 border-t text-[13px] text-ink-2 leading-relaxed" style={{ borderColor: "var(--color-border-tertiary)" }}>
                        <p className="mt-2">{m.easy}</p>
                        <p className="mt-1.5 text-[12.5px] text-ink-3">예시: {m.example}</p>
                        <p className="mt-1 text-[12px] text-ink-3">적합: {m.bestFor}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 표준 프로토콜 20단계 로드맵 */}
          <div className={card} style={cardStyle}>
            <h2 className={h2}>🗺 표준 프로토콜 20단계 로드맵</h2>
            <p className={`mt-1 text-[13px] text-ink-3`}>
              프로젝트 셋업부터 최종 보고까지 전 과정 · 각 단계는 파이프라인 탭에서 자동 실행됩니다.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-[12.5px] border-collapse">
                <thead>
                  <tr className="bg-[var(--color-background-secondary)]">
                    <th className="text-left p-2 border-b w-10">#</th>
                    <th className="text-left p-2 border-b">구분</th>
                    <th className="text-left p-2 border-b">세부단계</th>
                    <th className="text-left p-2 border-b">AI 역할</th>
                    <th className="text-left p-2 border-b">산출물</th>
                  </tr>
                </thead>
                <tbody>
                  {INTEGRATED_PROTOCOL.map((s) => (
                    <tr key={s.step} className="align-top">
                      <td className="p-2 border-b font-semibold">{s.step}</td>
                      <td className="p-2 border-b">{s.section}</td>
                      <td className="p-2 border-b">{s.substep}</td>
                      <td className="p-2 border-b text-ink-2">{s.aiRole}</td>
                      <td className="p-2 border-b text-ink-3">{s.output}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 실행모드 선택 */}
          <div className={card} style={cardStyle}>
            <h2 className={h2}>🎛 실행모드 — 어떻게 시작할지 고르세요</h2>
            <p className={`mt-1 text-[13px] text-ink-3`}>
              같은 표준 프로토콜을 세 가지 방식으로 시작할 수 있습니다. 지금 선택은 파이프라인 탭에서 그대로 사용됩니다.
            </p>
            <div className="mt-3 grid md:grid-cols-3 gap-3">
              {EXECUTION_MODES.map((m) => {
                const easy = MODE_EASY[m.id];
                const active = proj.executionMode === m.id;
                return (
                  <div key={m.id} className="rounded-xl border p-3.5"
                    style={{ borderColor: active ? "var(--brand-ink)" : "var(--color-border-tertiary)", background: active ? "var(--brand-soft)" : "transparent" }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-semibold">{m.label}</span>
                      <span className="text-[11px] text-ink-3">({m.labelEn})</span>
                    </div>
                    <div className="mt-1 text-[13px] text-ink-2">{easy.oneLine}</div>
                    <div className="mt-1 text-[11.5px] text-ink-3">비유: {easy.analogy}</div>
                    <div className="mt-2 text-[11.5px]">
                      <b>추천:</b> {m.bestFor[0]}
                    </div>
                    <button
                      onClick={() => { setField("executionMode", m.id); say("ok", `실행모드 → ${m.label}`); }}
                      className={btnPrimary + " mt-3"}
                      style={{ background: active ? "var(--brand-ink)" : "var(--color-background-secondary)", color: active ? "var(--on-accent)" : "var(--brand-ink)" }}>
                      {active ? "✓ 선택됨" : "이 모드 선택"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 다음 단계 안내 */}
          <div className={card} style={cardStyle}>
            <h2 className={h2}>🎯 다음 단계 — 무엇을 할까요?</h2>
            <div className="mt-2 grid md:grid-cols-2 gap-3">
              <div className="rounded-lg border p-3" style={cardStyle}>
                <div className={h3}>🅐 코드북부터 준비하기 (권장)</div>
                <p className="mt-1 text-[13px] text-ink-2">기존 코드북·템플릿·AI 생성 중에서 골라 <b>분류 기준</b>을 먼저 세팅합니다.</p>
                <button onClick={() => setTab("codebook")} className={btnPrimary + " mt-2"} style={{ background: "var(--brand-ink)", color: "var(--on-accent)" }}>
                  Codebook 준비로 이동 <ChevronRight size={14} />
                </button>
              </div>
              <div className="rounded-lg border p-3" style={cardStyle}>
                <div className={h3}>🅑 바로 파이프라인 실행하기</div>
                <p className="mt-1 text-[13px] text-ink-2">코드북 없이 <b>Discovery 모드</b>로 원자료에서 자동으로 코드북·테마·이론까지 만듭니다.</p>
                <button onClick={() => { setField("executionMode", "discovery"); setTab("pipeline"); }}
                  className={btnPrimary + " mt-2"} style={{ background: "var(--brand-ink)", color: "var(--on-accent)" }}>
                  Discovery로 바로 실행 <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          탭 ② Codebook 준비 — v54: 1차/2차 · 방법별 템플릿 · 연결성 · AI 기입
          ──────────────────────────────────────────────────────── */}
      {tab === "codebook" && (
        <div className="space-y-4">
          <div className={card} style={cardStyle}>
            <h2 className={h2}>📚 Codebook — 1차 · 재코딩(2차) 분석 기준서</h2>
            <p className={`mt-2 ${body}`}>
              Codebook을 <b>1차 코딩</b>과 <b>재코딩(2차 코딩)</b>으로 나눠 준비합니다.
              방법마다 <b>검증된 템플릿(코드 10개 이상)</b>을 로드한 뒤 필요시 수정·추가하고,
              AI 초안은 <b>표1 기입란</b>과 <b>1차↔2차 연결성 원칙</b>을 반영해 생성합니다.
            </p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <button type="button" onClick={() => { setCbCycle(1); setCbMethodFilter("descriptive"); }}
                className={btnGhost} style={{ ...cardStyle, background: cbCycle === 1 ? "var(--brand-soft)" : undefined, color: cbCycle === 1 ? "var(--brand-ink)" : undefined }}>
                🟢 1차 코딩북 ({proj.aiCodebook?.length || 0})
              </button>
              <button type="button" onClick={() => { setCbCycle(2); setCbMethodFilter("pattern"); }}
                className={btnGhost} style={{ ...cardStyle, background: cbCycle === 2 ? "var(--brand-soft)" : undefined, color: cbCycle === 2 ? "var(--brand-ink)" : undefined }}>
                🔵 2차 코딩북 ({proj.aiCodebookSecond?.length || 0})
              </button>
            </div>
          </div>

          <div className={card} style={cardStyle}>
            <h3 className={h3}>1차 ↔ 2차 연결성 원칙</h3>
            <p className="mt-1 text-[12.5px] text-ink-2">템플릿·AI 초안·수동 작성 모두 이 원칙을 따릅니다.</p>
            <div className="mt-3 grid md:grid-cols-2 gap-2">
              {CODEBOOK_LINKAGE_PRINCIPLES.map((pr) => (
                <div key={pr.id} className="rounded-lg border p-3" style={softStyle}>
                  <div className="text-[13px] font-semibold">{pr.title}</div>
                  <div className="mt-1 text-[12px] text-ink-2 leading-relaxed">{pr.body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={card} style={cardStyle}>
            <h3 className={h3}>① {cbCycle === 1 ? "1차" : "2차"} 코딩 방법 선택 · 템플릿 로드</h3>
            <p className="mt-1 text-[12.5px] text-ink-2">
              {cbCycle === 1
                ? "각 1차 코딩마다 검증 템플릿(≥10코드)을 로드하고 필요시 수정합니다."
                : "각 2차(재코딩) 방법마다 검증 템플릿(≥10코드)을 로드합니다. 1차 코드와의 연결(linkage)이 포함됩니다."}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {cycleMethods.map((m) => {
                const on = cbMethodFilter === m.id;
                return (
                  <button key={m.id} type="button" onClick={() => setCbMethodFilter(m.id)}
                    className="rounded-md border px-2 py-0.5 text-[11px]"
                    style={{ borderColor: "var(--color-border-tertiary)", background: on ? "var(--brand-soft)" : "transparent", color: on ? "var(--brand-ink)" : undefined }}>
                    {m.label} <span className="text-ink-3">({m.labelEn})</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid md:grid-cols-2 gap-2">
              {filteredTemplates.map((t) => (
                <button key={t.id} type="button" onClick={() => loadTemplate(t.id)}
                  className="rounded-lg border p-3 text-left" style={cardStyle} title={t.scenario}>
                  <div className="text-[13px] font-semibold">{t.label}</div>
                  <div className="text-[11.5px] text-ink-3">{t.labelEn} · {t.entries.length}개 코드 · {t.familyId}</div>
                  <div className="mt-1 text-[11.5px] text-ink-2 line-clamp-2">{t.scenario}</div>
                </button>
              ))}
              {filteredTemplates.length === 0 && (
                <div className="text-[12px] text-ink-3">해당 방법 템플릿이 없습니다. 다른 방법을 선택하세요.</div>
              )}
            </div>
            {cbCycle === 1 && (
              <div className="mt-3">
                <div className="text-[12px] font-medium mb-1">레거시 주제 템플릿 (참고)</div>
                <div className="flex flex-wrap gap-1">
                  {CODEBOOK_TEMPLATES.map((t) => (
                    <button key={t.id} type="button" onClick={() => loadTemplate(t.id)} className={btnGhost} style={cardStyle} title={t.scenario}>
                      {t.label} <span className="text-ink-3">({t.entries.length})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={card} style={cardStyle}>
            <h3 className={h3}>🅑 AI 초안 생성 — 표1 {cbCycle === 1 ? "1차" : "2차"} 코딩북 작성 항목</h3>
            <p className="mt-1 text-[12.5px] text-ink-2">
              기입란을 채운 뒤 생성하면, AI가 <b>연결성 원칙</b>과 선택 방법을 반영해 초안을 만듭니다.
              {cbCycle === 2 && " 2차는 현재 1차 코드북을 기반으로 생성됩니다."}
            </p>
            <div className="mt-3 space-y-3">
              {(cbCycle === 1 ? FIRST_CYCLE_DRAFT_FIELDS : SECOND_CYCLE_DRAFT_FIELDS).map((f) => {
                const draft = cbCycle === 1 ? firstDraft : secondDraft;
                const setDraft = cbCycle === 1 ? setFirstDraft : setSecondDraft;
                return (
                  <label key={f.key} className="block text-[12.5px]">
                    <div className="font-semibold">{f.label}</div>
                    <div className="text-[11px] text-ink-3">{f.description} · 팁: {f.tip}</div>
                    <div className="text-[11px] text-ink-3 mt-0.5">예시: {f.examples}</div>
                    <textarea
                      className="mt-1 w-full rounded-md border px-2 py-1.5 min-h-[56px]"
                      style={cardStyle}
                      value={draft[f.key] || ""}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                      placeholder={`${f.label}을(를) 기입`}
                    />
                  </label>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <button
                onClick={() => runAiGenerateCodebook(cbCycle)}
                disabled={!!busy}
                className={btnPrimary}
                style={{ background: "var(--brand-ink)", color: "var(--on-accent)", opacity: busy ? 0.5 : 1 }}>
                <Sparkles size={14} />
                {busy === (cbCycle === 1 ? "gen_codebook" : "gen_codebook_2")
                  ? "생성 중…"
                  : `AI로 ${cbCycle}차 초안 생성`}
              </button>
              {!proj.raw.trim() && (
                <span className="text-[11px] text-ink-3">원자료가 없어도 기입란만으로 초안 가능 · 원자료가 있으면 더 정확합니다 (탭③)</span>
              )}
              {cbCycle === 2 && !(proj.aiCodebook?.length) && (
                <span className="text-[11px] text-amber-700">권장: 먼저 1차 코드북을 준비한 뒤 2차 초안을 생성하세요.</span>
              )}
            </div>
          </div>

          <div className={card} style={cardStyle}>
            <h3 className={h3}>🅒 파일 불러오기 · 수동 추가</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={() => cbFileRef.current?.click()} className={btnGhost} style={cardStyle}>
                <Upload size={13} /> {cbCycle}차 불러오기 (.json / .csv)
              </button>
              <button onClick={() => {
                setEditingIdx(null);
                setNewEntry((e) => ({ ...e, cycle: cbCycle, methodId: cbMethodFilter, id: "", name: "" }));
                setCbFormOpen(!cbFormOpen);
              }} className={btnGhost} style={cardStyle}>
                {cbFormOpen ? "폼 닫기" : `+ ${cbCycle}차 코드 수동 추가`}
              </button>
              <input ref={cbFileRef} type="file" accept=".json,.csv" className="hidden" onChange={importCodebookFile} />
            </div>
          </div>

          {cbFormOpen && (
            <div className={card} style={cardStyle}>
              <h3 className={h3}>{editingIdx !== null ? `${cbCycle}차 코드 편집` : `${cbCycle}차 코드 수동 추가`}</h3>
              <div className="mt-2 grid md:grid-cols-2 gap-2 text-[12.5px]">
                <label>Code ID
                  <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                    value={newEntry.id} onChange={(e) => setNewEntry({ ...newEntry, id: e.target.value })} placeholder={cbCycle === 1 ? "C001" : "S001"} />
                </label>
                <label>방법
                  <select className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                    value={newEntry.methodId || cbMethodFilter}
                    onChange={(e) => setNewEntry({ ...newEntry, methodId: e.target.value })}>
                    {cycleMethods.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.labelEn})</option>)}
                  </select>
                </label>
                <label className="md:col-span-2">코드 이름 (Code Name) *
                  <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                    value={newEntry.name} onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                    placeholder={cbCycle === 1 ? "고객불만(Customer Complaint)" : "디지털 적응(Digital Adaptation)"} />
                </label>
                <label className="md:col-span-2">정의 (Definition) *
                  <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                    value={newEntry.definition} onChange={(e) => setNewEntry({ ...newEntry, definition: e.target.value })} />
                </label>
                <label className="md:col-span-2">적용 기준 (Application Criteria)
                  <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                    value={newEntry.applicationCriteria || ""}
                    onChange={(e) => setNewEntry({ ...newEntry, applicationCriteria: e.target.value, inclusion: e.target.value })} />
                </label>
                <label>Inclusion · 포함
                  <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                    value={newEntry.inclusion} onChange={(e) => setNewEntry({ ...newEntry, inclusion: e.target.value })} />
                </label>
                <label>Exclusion · 제외
                  <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                    value={newEntry.exclusion} onChange={(e) => setNewEntry({ ...newEntry, exclusion: e.target.value })} />
                </label>
                <label className="md:col-span-2">예시 (Examples)
                  <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                    value={newEntry.example} onChange={(e) => setNewEntry({ ...newEntry, example: e.target.value })} />
                </label>
                <label className="md:col-span-2">주의사항 (Notes / Caveats)
                  <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                    value={newEntry.notes || ""} onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value, memo: e.target.value })} />
                </label>
                {cbCycle === 1 ? (
                  <label className="md:col-span-2">출처/맥락 (Source / Context)
                    <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                      value={newEntry.sourceContext || ""} onChange={(e) => setNewEntry({ ...newEntry, sourceContext: e.target.value })} />
                  </label>
                ) : (
                  <>
                    <label className="md:col-span-2">연결성 (Linkage to First Cycle Codes)
                      <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                        value={newEntry.linkage || ""} onChange={(e) => setNewEntry({ ...newEntry, linkage: e.target.value })}
                        placeholder="정보탐색 + 학습 + 자기효능감" />
                    </label>
                    <label className="md:col-span-2">검증 기준 (Validation Criteria)
                      <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                        value={newEntry.validation || ""} onChange={(e) => setNewEntry({ ...newEntry, validation: e.target.value })} />
                    </label>
                    <label className="md:col-span-2">이론적 정렬 (Theoretical Alignment)
                      <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                        value={newEntry.theoreticalAlignment || ""} onChange={(e) => setNewEntry({ ...newEntry, theoreticalAlignment: e.target.value })}
                        placeholder="TAM / TPB / SERVQUAL" />
                    </label>
                  </>
                )}
                <label className="md:col-span-2">Keywords (쉼표 구분)
                  <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                    value={Array.isArray(newEntry.keywords) ? newEntry.keywords.join(", ") : String(newEntry.keywords || "")}
                    onChange={(e) => setNewEntry({ ...newEntry, keywords: e.target.value.split(/[,|]/).map((s) => s.trim()).filter(Boolean) })} />
                </label>
              </div>
              <div className="mt-3 flex gap-2 flex-wrap">
                <button onClick={upsertEntry} className={btnPrimary} style={{ background: "var(--brand-ink)", color: "var(--on-accent)" }}>
                  {editingIdx !== null ? "코드 저장" : "코드북에 추가"}
                </button>
                <button onClick={() => { setCbFormOpen(false); setEditingIdx(null); }} className={btnGhost} style={cardStyle}>취소</button>
              </div>
            </div>
          )}

          {activeCodebook.length > 0 && (
            <div className={card} style={cardStyle}>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={h3}>② 현재 {cbCycle}차 코드북 · {activeCodebook.length}개</h3>
                <div className="ml-auto flex gap-1.5">
                  <button onClick={() => download(
                    `codebook-${cbCycle}cycle-${proj.title || "project"}.json`,
                    JSON.stringify({ first: proj.aiCodebook || [], second: proj.aiCodebookSecond || [] }, null, 2),
                    "application/json"
                  )} className={btnGhost} style={cardStyle}><Download size={12} /> JSON(1·2차)</button>
                  <button onClick={() => download(
                    `codebook-${cbCycle}cycle-${proj.title || "project"}.csv`,
                    codebookToCsv(activeCodebook),
                    "text/csv;charset=utf-8"
                  )} className={btnGhost} style={cardStyle}><Download size={12} /> CSV</button>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {activeCodebook.map((e, i) => (
                  <div key={e.id + i} className="rounded-lg border p-2.5" style={cardStyle}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={chip} style={softStyle}>{e.id}</span>
                      <span className="text-[14px] font-semibold">{e.name}</span>
                      {e.methodId && <span className="text-[10px] text-ink-3">{e.methodId}</span>}
                      <span className="text-[11px] rounded px-1.5 py-0.5" style={{ background: e.status === "Approved" ? "var(--ok-wash)" : "var(--warn-wash)", color: "var(--color-text-primary)" }}>
                        {e.status}
                      </span>
                      <div className="ml-auto flex gap-1">
                        <button onClick={() => editEntry(i)} className="text-[11px] text-ink-2 underline">편집</button>
                        <button onClick={() => deleteEntry(i)} className="text-[11px] text-red-600 underline">삭제</button>
                      </div>
                    </div>
                    <div className="mt-1 text-[12.5px] text-ink-2">{e.definition}</div>
                    <div className="text-[11.5px] text-ink-3">
                      적용: {(e as CycleCodebookEntry).applicationCriteria || e.inclusion}
                      {e.exclusion ? ` · 제외: ${e.exclusion}` : ""}
                    </div>
                    {e.example && <div className="text-[11.5px] text-ink-2 mt-0.5">예: {e.example}</div>}
                    {cbCycle === 2 && (e as CycleCodebookEntry).linkage && (
                      <div className="text-[11.5px] text-ink-2 mt-0.5">연결(1차): {(e as CycleCodebookEntry).linkage}</div>
                    )}
                    {cbCycle === 2 && (e as CycleCodebookEntry).theoreticalAlignment && (
                      <div className="text-[11.5px] text-ink-3">이론: {(e as CycleCodebookEntry).theoreticalAlignment}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(proj.proposedCodes?.length || 0) > 0 && (
            <div className={card} style={{ ...cardStyle, background: "rgba(59,130,246,.06)" }}>
              <h3 className={h3}>Hybrid — AI 신규 코드 제안 (승인 대기 {proj.proposedCodes!.length}개)</h3>
              <div className="mt-2 space-y-2">
                {proj.proposedCodes!.map((e, i) => (
                  <div key={e.id + i} className="rounded border p-2.5 flex items-start gap-2" style={cardStyle}>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold">{e.name} <span className="text-[11px] text-ink-3">({e.id})</span></div>
                      <div className="text-[12px] text-ink-2">{e.definition}</div>
                      {e.example && <div className="text-[11px] text-ink-2 mt-0.5">예: {e.example}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => approveProposed(i)} className={btnPrimary + " !py-0.5 !px-2 !text-[11px]"} style={{ background: "var(--brand-ink)", color: "var(--on-accent)" }}>승인</button>
                      <button onClick={() => rejectProposed(i)} className={btnGhost + " !py-0.5 !px-2 !text-[11px] text-red-600"} style={cardStyle}>거절</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-[13px]">
                {checklist.hasCodebook
                  ? `✅ 코드북 준비 · 1차 ${proj.aiCodebook?.length || 0} · 2차 ${proj.aiCodebookSecond?.length || 0} — 파이프라인 실행 가능`
                  : "💡 코드북 없이도 Discovery 모드로 바로 실행 가능합니다."}
              </div>
              <button onClick={() => setTab("pipeline")} className={btnPrimary + " ml-auto"} style={{ background: "var(--brand-ink)", color: "var(--on-accent)" }}>
                파이프라인 실행 <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          탭 ③ AI 파이프라인 실행 (전체 자동)
          ──────────────────────────────────────────────────────── */}
      {tab === "pipeline" && (
        <div className="space-y-4">
          {/* 프로젝트 정보 */}
          <div className={card} style={cardStyle}>
            <h2 className={h2}>1️⃣ 프로젝트 정보</h2>
            <div className="mt-2 grid md:grid-cols-2 gap-2 text-[12.5px]">
              <label>제목
                <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                  value={proj.title} onChange={(e) => setField("title", e.target.value)} placeholder="예: 초등학교 교사 소진 연구" />
              </label>
              <label>연구질문
                <input className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                  value={proj.question} onChange={(e) => setField("question", e.target.value)} placeholder="예: 교사 소진은 어떤 과정으로 진행되는가?" />
              </label>
              <label>자료원
                <select className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                  value={proj.dataSourceId} onChange={(e) => setField("dataSourceId", e.target.value)}>
                  {DATA_SOURCE_TYPES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </label>
              <label>분석단위
                <select className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                  value={proj.unitLevel} onChange={(e) => setField("unitLevel", e.target.value)}>
                  {UNITIZATION_LEVELS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
              </label>
              <label>실행모드
                <select className="mt-1 w-full rounded-md border px-2 py-1.5" style={cardStyle}
                  value={proj.executionMode || "hybrid"} onChange={(e) => setField("executionMode", e.target.value as ExecutionMode)}>
                  {EXECUTION_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </label>
              <div className="md:col-span-2">
                <div className="text-[12px] mb-1">1차 코딩 방법 (다중선택 · 한국어/영어 병기)</div>
                <div className="flex flex-wrap gap-1">
                  {FIRST_CYCLE_METHODS.map((m) => {
                    const on = (proj.firstMethodIds || []).includes(m.id);
                    return (
                      <button key={m.id} type="button"
                        onClick={() => setField("firstMethodIds", on ? proj.firstMethodIds.filter((x) => x !== m.id) : [...(proj.firstMethodIds || []), m.id])}
                        className="rounded-md border px-2 py-0.5 text-[11px]"
                        style={{ borderColor: "var(--color-border-tertiary)", background: on ? "var(--brand-soft)" : "transparent", color: on ? "var(--brand-ink)" : undefined }}>
                        {m.label} <span className="text-ink-3">({m.labelEn})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] mb-1">2차 코딩 방법 (다중선택 · 한국어/영어 병기)</div>
                <div className="flex flex-wrap gap-1">
                  {SECOND_CYCLE_METHODS.map((m) => {
                    const ids = proj.secondMethodIds || (proj.secondMethodId ? [proj.secondMethodId] : []);
                    const on = ids.includes(m.id);
                    return (
                      <button key={m.id} type="button"
                        onClick={() => toggleSecondMethod(m.id)}
                        className="rounded-md border px-2 py-0.5 text-[11px]"
                        style={{ borderColor: "var(--color-border-tertiary)", background: on ? "var(--brand-soft)" : "transparent", color: on ? "var(--brand-ink)" : undefined }}>
                        {m.label} <span className="text-ink-3">({m.labelEn})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 원자료 */}
          <div className={card} style={cardStyle}>
            <h2 className={h2}>2️⃣ 원자료 입력</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className={btnGhost + " cursor-pointer"} style={cardStyle}>
                <Upload size={13} /> PDF/엑셀/텍스트 불러오기
                <input ref={rawFileRef} type="file" accept=".xlsx,.xls,.csv,.txt,.md,.pdf,.docx,.doc,.json" className="hidden" onChange={onImportRaw} />
              </label>
              <button onClick={() => setField("raw", "")} disabled={!proj.raw} className={btnGhost} style={cardStyle}>비우기</button>
              <span className="text-[11.5px] text-ink-3 self-center ml-auto">현재 {(proj.raw || "").length.toLocaleString()}자</span>
            </div>
            <textarea rows={7} className="mt-2 w-full rounded-md border px-2 py-2 text-[13px]" style={cardStyle}
              value={proj.raw} onChange={(e) => setProj((p) => ({ ...p, raw: e.target.value, rawOriginal: e.target.value }))}
              placeholder="인터뷰 전사·관찰노트·문서·오픈서베이 응답 등을 붙여 넣으세요. 또는 위 버튼으로 파일 불러오기." />
            {proj.cleanedPreview ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-[12px] text-ink-3">클린징 미리보기 (표시용 · 원문과 분리)</summary>
                <pre className="mt-1 max-h-40 overflow-auto rounded-md border p-2 text-[11px] whitespace-pre-wrap" style={cardStyle}>
                  {proj.cleanedPreview.slice(0, 4000)}
                  {proj.cleanedPreview.length > 4000 ? "\n…" : ""}
                </pre>
              </details>
            ) : null}
          </div>

          {/* 데이터 클린징 (컴팩트 접힘) */}
          <div className={card} style={cardStyle}>
            <details>
              <summary className="cursor-pointer flex items-center gap-2">
                <ChevronDown size={14} />
                <h2 className={h2 + " inline"}>3️⃣ 데이터 클린징 옵션</h2>
                <span className="text-[11.5px] text-ink-3">
                  ({Object.values(proj.cleaningOptions || {}).filter(Boolean).length}개 활성 / {DATA_CLEANING_PROTOCOL.length}개)
                </span>
              </summary>
              <div className="mt-3 grid md:grid-cols-3 gap-1.5">
                {DATA_CLEANING_PROTOCOL.map((s) => (
                  <label key={s.id} className="flex items-start gap-1.5 text-[11.5px] cursor-pointer" title={`${s.what} · ${s.why}`}>
                    <input type="checkbox" className="mt-0.5"
                      checked={!!(proj.cleaningOptions?.[s.id])}
                      onChange={(e) => setProj((p) => ({ ...p, cleaningOptions: { ...(p.cleaningOptions || {}), [s.id]: e.target.checked } }))} />
                    <span>
                      <span className="font-medium">{s.label}</span>{" "}
                      <span className="text-ink-3">({s.labelEn})</span>
                    </span>
                  </label>
                ))}
              </div>
            </details>
          </div>

          {/* 실행 — 두 가지 옵션(5-1 전체 파이프라인 / 5-2 빠른 텍스트마이닝) */}
          <div className={card} style={{ ...cardStyle, background: "linear-gradient(135deg, rgba(59,130,246,.06), rgba(139,92,246,.06))" }}>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className={h2}>4️⃣ 파이프라인 실행</h2>
              <span className="text-[11.5px] text-ink-3 ml-auto">
                실행모드: <b>{currentMode.label}</b> · {proj.raw.length}자 · 1차 {proj.aiCodebook?.length || 0} · 2차 {proj.aiCodebookSecond?.length || 0}코드
              </span>
            </div>
            <p className="mt-1 text-[12.5px] text-ink-3">
              두 가지 실행 방식 중 하나를 고르세요. 결과는 모두 <b>6️⃣ 결과 요약</b>에 연동됩니다.
            </p>

            <div className="mt-3 grid md:grid-cols-2 gap-3">
              {/* 옵션 5-1 — 전체 파이프라인 (기존 그대로) */}
              <div className="rounded-xl border p-4" style={{ ...cardStyle, background: "var(--color-background-secondary)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold rounded-md px-1.5 py-0.5" style={{ background: "var(--brand-ink)", color: "var(--on-accent)" }}>5-1</span>
                  <h3 className={h3}>전체 파이프라인 실행</h3>
                </div>
                <p className="mt-2 text-[12.5px] text-ink-3">
                  데이터 정리 → 1차 코딩 → 재코딩 → 범주화 → 패턴 → Theme → Concept → Theory 를 순차 자동 실행하고,
                  완료 시 AI가 해석 리포트를 생성합니다.
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button onClick={runFull} disabled={!!busy}
                    className={btnPrimary}
                    style={{ background: "var(--brand-ink)", color: "var(--on-accent)", opacity: busy ? 0.5 : 1 }}>
                    <Play size={14} /> {busy === "all" ? "실행 중…" : "전체 파이프라인 실행"}
                  </button>
                  <button onClick={resetProject} className={btnGhost} style={cardStyle}>
                    <RotateCcw size={13} /> 프로젝트 초기화
                  </button>
                  <button onClick={exportResultsXlsx}
                    disabled={!checklist.hasCoded && !checklist.hasCategories} className={btnGhost} style={cardStyle}>
                    <Download size={13} /> 결과 xlsx 내보내기
                  </button>
                </div>
              </div>

              {/* 옵션 5-2 — 빠른 텍스트마이닝 */}
              <div className="rounded-xl border p-4" style={{ ...cardStyle, background: "var(--color-background-secondary)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold rounded-md px-1.5 py-0.5" style={{ background: "var(--appr-qual)", color: "var(--on-accent)" }}>5-2</span>
                  <h3 className={h3}>빠른 텍스트마이닝 (범주·패턴)</h3>
                </div>
                <p className="mt-2 text-[12.5px] text-ink-3">
                  원자료를 <b>가볍게 클린징</b>한 뒤, 곧바로 <b>AI 기반 텍스트마이닝</b>으로 <b>범주화·패턴</b>을 만들고
                  그 결과를 <b>6️⃣ 결과 요약</b>에 연동합니다. (Theme·Concept·Theory·해석 리포트 단계는 건너뜁니다.)
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button onClick={runQuick} disabled={!!busy}
                    className={btnPrimary}
                    style={{ background: "var(--appr-qual)", color: "var(--on-accent)", opacity: busy ? 0.5 : 1 }}>
                    <Sparkles size={14} /> {busy === "quick" ? "실행 중…" : "빠른 텍스트마이닝 실행"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 진행 체크리스트 */}
          <div className={card} style={cardStyle}>
            <h2 className={h2}>5️⃣ 진행 체크리스트</h2>
            <div className="mt-2 grid md:grid-cols-2 gap-1.5">
              {[
                ["코드북", checklist.hasCodebook, `1차 ${proj.aiCodebook?.length || 0} · 2차 ${proj.aiCodebookSecond?.length || 0}`],
                ["원자료", checklist.hasRaw, `${proj.raw.length}자`],
                ["세그먼트", checklist.hasSegments, `${proj.segments.length}개`],
                ["1차 코딩", checklist.hasCoded, `${proj.coded.length}개`],
                ["범주", checklist.hasCategories, `${proj.categories.length}개`],
                ["테마", checklist.hasThemes, `${proj.themes.length}개`],
                ["개념", checklist.hasConcepts, `${proj.concepts.length}개`],
                ["이론", checklist.hasTheory, `${proj.theory.length}개`],
              ].map(([label, done, extra], i) => (
                <div key={i} className="flex items-center gap-2 text-[13px]">
                  {done ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Circle size={14} className="text-ink-3" />}
                  <span className={done ? "" : "text-ink-3"}>{label}</span>
                  <span className="ml-auto text-[11.5px] text-ink-3">{extra}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 결과 시각화 요약 — v56: ⑤급 Computational Analytics · Evidence · 자체 시각화 */}
          {(checklist.hasCategories || checklist.hasThemes || !!proj.pipelineInsight?.analytics) && (
            <div className={card} style={cardStyle}>
              <h2 className={h2}>6️⃣ 결과 요약</h2>
              <p className="mt-1 text-[12.5px] text-ink-3">
                ⑤ AI 표준 코딩북과 동일 수준으로 <b>Computational Analytics · Evidence · Inference</b>를 산출하고,
                범주 빈도/밀도·상위범주(메타)·상위주제(담론)와 <b>자체 데이터시각화</b>를 함께 제공합니다.
              </p>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px]">
                {[
                  ["원자료", `${(proj.raw || "").length.toLocaleString()}자`],
                  ["세그먼트", `${proj.segments.length}`],
                  ["코드", `${proj.codebook.length}`],
                  ["범주→이론", `${proj.categories.length} / ${proj.themes.length} / ${proj.concepts.length} / ${proj.theory.length}`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border p-2.5" style={softStyle}>
                    <div className="text-ink-3">{k}</div>
                    <div className="mt-0.5 text-[15px] font-semibold">{v}</div>
                  </div>
                ))}
              </div>

              {/* Computational Analytics · Evidence · Inference (⑤급) */}
              {proj.pipelineInsight?.analytics && (
                <div className="mt-4">
                  <div className={h3}>Computational Analytics · Evidence · Inference</div>
                  <div className="mt-2 grid md:grid-cols-3 gap-3">
                    <div className="rounded-xl border p-3" style={softStyle}>
                      <div className="text-[13px] font-semibold">Frequency / TF-IDF</div>
                      <ul className="mt-2 text-[12.5px] text-ink-2 space-y-1 max-h-44 overflow-y-auto">
                        {proj.pipelineInsight.analytics.frequency.slice(0, 12).map((f) => {
                          const quote = proj.pipelineInsight!.evidenceByTerm?.[f.term]?.[0]
                            || proj.pipelineInsight!.evidence.find((e) => e.candidateCode === f.term)?.representativeQuotes?.[0];
                          return (
                            <li key={f.term}>
                              <div>{f.term} · {f.count}회
                                <span className="text-ink-3"> (tfidf {proj.pipelineInsight!.analytics!.tfidf.find((t) => t.term === f.term)?.score ?? "-"})</span>
                              </div>
                              {quote && <div className="text-[11.5px] italic text-ink-3 truncate">근거: “{quote}”</div>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div className="rounded-xl border p-3" style={softStyle}>
                      <div className="text-[13px] font-semibold">Co-occurrence · Cluster</div>
                      <ul className="mt-2 text-[12.5px] text-ink-2 space-y-0.5 max-h-44 overflow-y-auto">
                        {proj.pipelineInsight.analytics.cooccurrence.slice(0, 8).map((p, i) => (
                          <li key={i}>{p.a} ↔ {p.b} ({p.count})</li>
                        ))}
                        {proj.pipelineInsight.analytics.clusters.slice(0, 4).map((c) => {
                          const quote = proj.pipelineInsight!.evidenceByTerm?.[c.members[0]]?.[0];
                          return (
                            <li key={c.id} className="text-ink-3">
                              {c.label}: {c.members.slice(0, 4).join(", ")}
                              {quote && <div className="italic">근거: “{quote}”</div>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div className="rounded-xl border p-3" style={softStyle}>
                      <div className="text-[13px] font-semibold">Evidence Packages</div>
                      <ul className="mt-2 text-[12.5px] text-ink-2 space-y-1 max-h-44 overflow-y-auto">
                        {proj.pipelineInsight.evidence.slice(0, 8).map((e) => (
                          <li key={e.codeId}>
                            <b>{e.codeId} {e.candidateCode}</b>
                            <div className="text-ink-3 truncate">{e.representativeQuotes[0] || "(인용 없음)"}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI Codebook 요약 */}
                  {proj.pipelineInsight.codebook.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[13px] font-semibold">AI Codebook · Pattern / Category / Theme</div>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11.5px]">
                        <span className={chip} style={softStyle}>코드 {proj.pipelineInsight.codebook.length}</span>
                        <span className={chip} style={softStyle}>범주 {proj.pipelineInsight.categories.length}</span>
                        <span className={chip} style={softStyle}>테마 {proj.pipelineInsight.themes.length}</span>
                      </div>
                      <div className="mt-2 space-y-1.5 max-h-[280px] overflow-y-auto">
                        {proj.pipelineInsight.codebook.slice(0, 10).map((c) => (
                          <div key={c.codeId} className="rounded-lg border p-2.5" style={softStyle}>
                            <div className="flex flex-wrap gap-2 items-center text-[13px]">
                              <span className={chip} style={cardStyle}>{c.codeId}</span>
                              <span className="font-semibold">{c.codeName}</span>
                              <span className="text-[11px] text-ink-3">f={c.frequency} · sal={c.salienceScore} · conf={c.aiConfidence}</span>
                            </div>
                            <div className="mt-0.5 text-[12px] text-ink-2">{c.definition}</div>
                            <div className="text-[11.5px] text-ink-3">패턴: {c.pattern}</div>
                            {(c.representativeQuotes || []).slice(0, 2).map((q, i) => (
                              <div key={i} className="text-[12px] italic text-ink-2">근거: “{q}”</div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <CodingAnalyticsViz
                      analytics={proj.pipelineInsight.analytics}
                      evidence={proj.pipelineInsight.evidence}
                      evidenceByTerm={proj.pipelineInsight.evidenceByTerm}
                      title="파이프라인 자체 데이터시각화 · 빈도 · 공출현 · 의미군집"
                    />
                  </div>
                </div>
              )}

              {/* v53: 범주 빈도/밀도 집계 */}
              {catStats.length > 0 && (
                <div className="mt-4">
                  <div className={h3}>범주 빈도 / 밀도 집계 (상위 {Math.min(catStats.length, 12)})</div>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-[12.5px] border-collapse">
                      <thead>
                        <tr className="text-ink-3">
                          <th className="text-left py-1 pr-2">범주</th>
                          <th className="text-right py-1 px-2">코드수</th>
                          <th className="text-right py-1 px-2">부여빈도</th>
                          <th className="text-left py-1 pl-2 w-[42%]">밀도(%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catStats.slice(0, 12).map((s) => {
                          const max = Math.max(...catStats.map((x) => x.freq), 1);
                          const quote = proj.pipelineInsight?.evidenceByTerm?.[s.label.replace(/^주제:/, "")]?.[0]
                            || proj.pipelineInsight?.evidence.find((e) => s.label.includes(e.candidateCode))?.representativeQuotes?.[0];
                          return (
                            <tr key={s.id} className="border-t" style={{ borderColor: "var(--color-border-tertiary)" }}>
                              <td className="py-1 pr-2">
                                <div className="truncate max-w-[180px]" title={s.label}>{s.label}</div>
                                {quote && <div className="text-[11px] italic text-ink-3 truncate max-w-[220px]">근거: “{quote}”</div>}
                              </td>
                              <td className="py-1 px-2 text-right">{s.codeCount}</td>
                              <td className="py-1 px-2 text-right">{s.freq}</td>
                              <td className="py-1 pl-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 rounded bg-[var(--color-background-secondary)] overflow-hidden">
                                    <div className="h-full" style={{ width: `${Math.round((s.freq / max) * 100)}%`, background: "var(--brand-ink)" }} />
                                  </div>
                                  <span className="w-10 text-right text-ink-3">{s.densityPct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* v53: 상위범주(메타) + 상위주제(담론) */}
              {(metaCats.length > 0 || discourses.length > 0) && (
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  {metaCats.length > 0 && (
                    <div>
                      <div className={h3}>상위범주 (메타) · {metaCats.length}</div>
                      <ul className="mt-2 space-y-1.5 text-[13px] text-ink-2">
                        {metaCats.slice(0, 6).map((m) => (
                          <li key={m.id} className="rounded-lg border p-2" style={softStyle}>
                            <div className="font-medium">{m.label} <span className="text-ink-3 text-[11.5px]">· 빈도 {m.freq}</span></div>
                            <div className="text-[11.5px] text-ink-3 mt-0.5">{m.members.join(" · ")}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {discourses.length > 0 && (
                    <div>
                      <div className={h3}>상위주제 (담론) · {discourses.length}</div>
                      <ul className="mt-2 space-y-1.5 text-[13px] text-ink-2 list-disc pl-4">
                        {discourses.slice(0, 8).map((x) => (
                          <li key={x.id}>{x.statement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                {checklist.hasCategories && (
                  <div>
                    <div className={h3}>범주 분포 ({proj.categories.length})</div>
                    <div className="mt-2 space-y-1.5">
                      {proj.categories.slice(0, 10).map((c) => {
                        const n = c.codes.length || 1;
                        const max = Math.max(...proj.categories.map((x) => x.codes.length || 1), 1);
                        return (
                          <div key={c.id} className="flex items-center gap-2 text-[12.5px]">
                            <span className="w-32 truncate" title={c.label}>{c.label}</span>
                            <div className="flex-1 h-2.5 rounded bg-[var(--color-background-secondary)] overflow-hidden">
                              <div className="h-full" style={{ width: `${Math.round((n / max) * 100)}%`, background: "var(--brand-ink)" }} />
                            </div>
                            <span className="w-6 text-right">{n}</span>
                          </div>
                        );
                      })}
                    </div>
                    {proj.codebook.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[12.5px] font-medium">상위 코드</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {[...proj.codebook].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 8).map((c) => {
                            const quote = proj.pipelineInsight?.evidenceByTerm?.[c.code]?.[0]
                              || (c.example ? c.example : "");
                            return (
                              <span key={c.code} className={chip} style={softStyle} title={quote || undefined}>
                                {c.code} · {c.count}
                              </span>
                            );
                          })}
                        </div>
                        <ul className="mt-2 space-y-1 text-[12px] text-ink-2 max-h-36 overflow-y-auto">
                          {[...proj.codebook].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 6).map((c) => {
                            const quote = proj.pipelineInsight?.evidenceByTerm?.[c.code]?.[0] || c.example;
                            return (
                              <li key={`ev-${c.code}`}>
                                <b>{c.code}</b>
                                {quote ? <span className="italic text-ink-3"> — “{quote.slice(0, 100)}”</span> : null}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {checklist.hasThemes && (
                  <div>
                    <div className={h3}>테마 ({proj.themes.length})</div>
                    <ol className="mt-2 space-y-1.5 text-[13px] text-ink-2 list-decimal pl-4">
                      {proj.themes.slice(0, 8).map((t) => <li key={t.id}>{t.sentence}</li>)}
                    </ol>
                  </div>
                )}
                {checklist.hasConcepts && (
                  <div>
                    <div className={h3}>개념 ({proj.concepts.length})</div>
                    <ul className="mt-2 space-y-1.5 text-[13px] text-ink-2 list-disc pl-4">
                      {proj.concepts.slice(0, 6).map((c) => <li key={c.id}><b>{c.label}</b> — {c.definition}</li>)}
                    </ul>
                  </div>
                )}
                {checklist.hasTheory && (
                  <div>
                    <div className={h3}>이론 진술 ({proj.theory.length})</div>
                    <ul className="mt-2 space-y-1.5 text-[13px] text-ink-2 list-disc pl-4">
                      {proj.theory.slice(0, 6).map((t) => <li key={t.id}>{t.statement}</li>)}
                    </ul>
                  </div>
                )}
                {proj.patterns?.length > 0 && (
                  <div className="md:col-span-2">
                    <div className={h3}>패턴 ({proj.patterns.length})</div>
                    <ul className="mt-2 space-y-1 text-[13px] text-ink-2 list-disc pl-4">
                      {proj.patterns.slice(0, 6).map((p) => <li key={p.id}>{p.statement}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 최종 해석 리포트 */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={h2}>7️⃣ 최종 해석 리포트</h2>
              <button onClick={() => generateInterpretation()}
                disabled={!!busy || (!checklist.hasThemes && !checklist.hasCategories && !proj.pipelineInsight?.codebook?.length)}
                className={btnGhost} style={cardStyle}>
                <Sparkles size={13} /> {busy === "interpret" ? "생성 중…" : (interpretation ? "다시 생성" : "해석 리포트 생성")}
              </button>
              {interpretation && (
                <>
                  <button onClick={exportInterpretationPdf}
                    className={btnGhost} style={cardStyle}><FileText size={13} /> PDF로 저장</button>
                  <button onClick={exportInterpretationXlsx}
                    className={btnGhost} style={cardStyle}><Download size={13} /> 엑셀(.xlsx)</button>
                </>
              )}
            </div>
            <p className="mt-1 text-[12px] text-ink-3">
              ⑤와 동일 수준의 연구 프레임 · 규모 · 핵심 발견 · 테마/범주 · Evidence 근거 문장 · 개념·이론 · 잠정 답변 · 후속 체크리스트를 포함합니다.
              내보내기는 <b>PDF</b> 또는 <b>엑셀(.xlsx)</b>로 저장됩니다(엑셀에는 범주 빈도·상위범주·상위주제·Evidence 시트 포함).
            </p>
            {interpretation ? (
              <pre className="mt-3 whitespace-pre-wrap text-[13px] text-ink-2 leading-relaxed rounded-lg border p-3 max-h-[520px] overflow-y-auto" style={softStyle}>{interpretation}</pre>
            ) : (
              <p className="mt-2 text-[12.5px] text-ink-3">파이프라인을 실행하면 AI(또는 규칙 기반 폴백)가 해석 리포트를 생성합니다. 수동 재생성도 가능합니다.</p>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          탭 ④ AI 변환기 개별 조율
          ──────────────────────────────────────────────────────── */}
      {tab === "individual" && (
        <div className="space-y-4">
          {/* 안내 */}
          <div className={card} style={cardStyle}>
            <h2 className={h2}>🔧 개별 변환기 — 단계별로 실행·확인·수정</h2>
            <p className={`mt-2 ${body}`}>
              전체 파이프라인 대신 <b>9개 AI 변환기</b>를 순서대로 하나씩 실행합니다.
              각 단계마다 결과를 확인하고 <b>수동 편집</b>이나 <b>재실행</b>을 할 수 있어 정밀한 조율에 좋습니다.
              데이터·코드북·실행모드는 <b>파이프라인 탭</b>과 자동 공유됩니다.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11.5px]">
              <span className={chip} style={softStyle}>원자료: {proj.raw.length}자</span>
              <span className={chip} style={softStyle}>실행모드: {currentMode.label}</span>
              <span className={chip} style={softStyle}>코드북: {proj.aiCodebook?.length || 0}개</span>
              <button onClick={() => setTab("pipeline")} className="ml-auto text-[11px] text-ink-2 underline">
                → 프로젝트 정보 편집(파이프라인 탭)
              </button>
            </div>
          </div>

          {/* 9개 변환기 카드 */}
          <div className="grid md:grid-cols-2 gap-3">
            {STAGE_TRANSFORMERS.map((t, idx) => {
              const runners: Record<string, () => void> = {
                analyze: runAnalyze, cleanup: runCleanup, first_code: runFirstCode,
                recode: runRecode, categorize: runCategorize, pattern: runPattern,
                theme: runTheme, concept: runConcept, theory: runTheory,
              };
              const rule = proj.manualRules?.transformer?.[t.id] || "";
              // 각 변환기의 완료 여부
              const doneMap: Record<string, boolean> = {
                analyze: false, cleanup: checklist.hasSegments, first_code: checklist.hasCoded,
                recode: proj.refinedCodes.length > 0, categorize: checklist.hasCategories,
                pattern: proj.patterns.length > 0, theme: checklist.hasThemes,
                concept: checklist.hasConcepts, theory: checklist.hasTheory,
              };
              const done = doneMap[t.id];
              return (
                <div key={t.id} className="rounded-xl border p-3.5" style={cardStyle}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full w-6 h-6 flex items-center justify-center text-[11px] font-bold"
                      style={{ background: done ? "var(--brand-ink)" : "var(--color-background-secondary)", color: done ? "var(--on-accent)" : "var(--brand-ink)" }}>
                      {idx + 1}
                    </span>
                    <span className="text-[14.5px] font-semibold">{t.label}</span>
                    <span className="text-[11px] text-ink-3">({t.labelEn})</span>
                    {done && <CheckCircle2 size={14} className="text-emerald-600 ml-auto" />}
                  </div>
                  <div className="mt-1.5 text-[13px] text-ink-2">{t.easy}</div>
                  <div className="mt-1 text-[11.5px] text-ink-3">입력: {t.input} · 산출: {t.output}</div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <button onClick={() => runners[t.id]?.()} disabled={!!busy}
                      className={btnPrimary + " !text-[12px] !py-1"}
                      style={{ background: "var(--brand-ink)", color: "var(--on-accent)", opacity: busy ? 0.5 : 1 }}>
                      <Play size={12} /> {busy === t.id ? "실행 중…" : "실행"}
                    </button>
                    <label className={btnGhost + " !text-[11.5px] cursor-pointer"} style={cardStyle}>
                      <Upload size={11} /> 불러오기
                      <input type="file" accept=".csv,.txt,.xlsx,.xls,.pdf,.docx,.doc,.md" className="hidden"
                        onChange={async (ev) => {
                          const f = ev.target.files?.[0]; if (!f) return;
                          await importForTransformer(f, t.label);
                          ev.target.value = "";
                        }} />
                    </label>
                    <button onClick={() => {
                      try {
                        const map: Record<string, () => void> = {
                          cleanup: () => download(`raw-${proj.title || "project"}.txt`, proj.raw || "", "text/plain;charset=utf-8"),
                          first_code: () => download(`coded-${proj.title || "project"}.csv`, toCsvCoded(proj.coded), "text/csv;charset=utf-8"),
                          recode: () => download(`refined-${proj.title || "project"}.csv`, toCsvCodebook(proj.refinedCodes), "text/csv;charset=utf-8"),
                          categorize: () => download(`categories.csv`, "id,label,codes\n" + proj.categories.map((c) => `${c.id},${c.label},"${c.codes.join(" | ")}"`).join("\n"), "text/csv;charset=utf-8"),
                          pattern: () => download(`patterns.csv`, "id,statement\n" + proj.patterns.map((p) => `${p.id},"${p.statement.replace(/"/g, '""')}"`).join("\n"), "text/csv;charset=utf-8"),
                          theme: () => download(`themes.csv`, "id,sentence\n" + proj.themes.map((th) => `${th.id},"${th.sentence.replace(/"/g, '""')}"`).join("\n"), "text/csv;charset=utf-8"),
                          concept: () => download(`concepts.csv`, "id,label,definition\n" + proj.concepts.map((c) => `${c.id},"${c.label}","${c.definition.replace(/"/g, '""')}"`).join("\n"), "text/csv;charset=utf-8"),
                          theory: () => download(`theory.csv`, "id,statement\n" + proj.theory.map((th) => `${th.id},"${th.statement.replace(/"/g, '""')}"`).join("\n"), "text/csv;charset=utf-8"),
                          analyze: () => say("info", "분석 변환기는 콘솔 노트로만 결과가 표시됩니다."),
                        };
                        (map[t.id] || (() => say("warn", "내보낼 산출이 없습니다.")))();
                      } catch (err: any) {
                        say("err", `내보내기 실패: ${err?.message || err}`);
                      }
                    }} className={btnGhost + " !text-[11.5px]"} style={cardStyle}>
                      <Download size={11} /> 내보내기
                    </button>
                  </div>
                  <div className="mt-2">
                    <input type="text"
                      className="w-full rounded border px-2 py-1 text-[11.5px]" style={cardStyle}
                      placeholder="수동 변환 규칙(선택): 특정 표현 → 특정 코드"
                      value={rule}
                      onChange={(e) => setProj((p) => ({ ...p, manualRules: { ...(p.manualRules || {}), transformer: { ...((p.manualRules || {}).transformer || {}), [t.id]: e.target.value } } }))} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 수동 편집 (접기/펼치기) */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className={h2}>📝 수동 편집 · 세그먼트/코드</h2>
                <div className="text-[11.5px] text-ink-3">세그먼트 {proj.segments.length} · 코딩된 {proj.coded.length} · 코드 {proj.codebook.length}</div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setEditorOpen(!editorOpen)} className={btnGhost} style={cardStyle}>
                  {editorOpen ? "접기" : "펼치기"}
                </button>
                {editorOpen && <button onClick={addSegment} className={btnGhost} style={cardStyle}>+ 세그먼트</button>}
              </div>
            </div>
            {editorOpen && (
              proj.segments.length === 0 ? (
                <div className="mt-3 text-[13px] text-ink-2">아직 세그먼트가 없습니다. 위 <b>데이터 정리(2단계)</b>를 먼저 실행하세요.</div>
              ) : (
                <div className="mt-3 space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {proj.segments.map((s) => {
                    const cs = proj.coded.find((c) => c.id === s.id);
                    return (
                      <div key={s.id} className="rounded-lg border p-2.5" style={cardStyle}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={chip} style={softStyle}>{s.id}</span>
                          <span className={chip} style={softStyle}>{s.unit}</span>
                          <button onClick={() => delSegment(s.id)} className="text-[11px] text-red-600 ml-auto">삭제</button>
                        </div>
                        <textarea rows={2} className="mt-2 w-full rounded border px-2 py-1.5 text-[12.5px]" style={cardStyle}
                          value={s.text} onChange={(e) => updSegText(s.id, e.target.value)} />
                        <div className="mt-2">
                          <div className="text-[11px] text-ink-3 mb-1">코드</div>
                          <div className="flex flex-wrap gap-1.5">
                            {(cs?.codes || []).map((c, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <input className="rounded border px-1.5 py-0.5 text-[11.5px]" style={cardStyle}
                                  value={c.code} onChange={(e) => updCodedCode(s.id, i, e.target.value)} />
                                <button onClick={() => delCodedCode(s.id, i)} className="text-[11px] text-red-600">×</button>
                              </div>
                            ))}
                            <button onClick={() => {
                              if (!cs) {
                                setProj((p) => ({ ...p, coded: [...p.coded, { ...s, codes: [{ code: "새 코드", methodId: p.firstMethodIds[0] || "descriptive" }] }] }));
                              } else addCodedCode(s.id);
                            }} className={btnGhost + " !text-[11px] !py-0"} style={cardStyle}>+ 코드</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ═══ ⑤ AI 기반 질적연구 표준 코딩북 만들기 및 해석 ═══ */}
      {tab === "standard_codebook" && (
        <AiStandardCodebookPanel
          settings={settings}
          state={(proj.standardAiCodebook as StandardAiCodebookState) || emptyStandardAiCodebook()}
          onChange={(next) => setProj((p) => ({ ...p, standardAiCodebook: next }))}
          onNote={(kind, msg) => say(kind, msg)}
        />
      )}
    </div>
  );
}
