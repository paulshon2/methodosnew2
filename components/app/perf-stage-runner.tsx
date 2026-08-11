"use client";
// TX-002·GN-029·QL-008 공용 프로젝트 페이지 — 11단계(영역) → 세부Task → 세부 분절(수행내용/산출물)
// 자동화수준 워크벤치. 근거: 각 방법의 「수행내용_산출물_자동화수준분석표.xlsx」(자동화 구분·구분근거·
// 달성 절차)와 「11개영역_전체_절차적용_재현결과.xlsx」(재현 판정 등급 배지). methodos-f18.
// 디자인 포맷은 f17 QL-008 러너를 그대로 계승(연동/불러오기 io + 모드 + 실행 + 결과 + 5종 내보내기).
import { useEffect, useMemo, useRef, useState } from "react";
import { Gloss } from "./gloss";
import CaChart from "./ca-chart";
import { useStore } from "@/store/app-store";
import {
  loadPerfRegistry, loadPerfRegistryResolved, AUTO_META, VERIFY_META,
  GT_STAGE_VIEWS,
  type PerfMethod, type GtStage, type GtTask, type GtItem, type GtEntry, type GtIOMode,
} from "@/lib/grounded-theory-spec";
import { runPerfTask, generateExamples, type GtCtx, type GtTaskResult, type ExampleItem } from "@/lib/gt-task-engine";
import { extractFile, downloadBlob } from "@/lib/ca-automation";
import { findSample, sampleToHTML, sampleToText, adaptSampleToMethodLabel, type DeliverableSample } from "@/lib/deliverable-samples";
import { loadMethodSamples, sampleFromMethodFile } from "@/lib/method-samples";
import { loadMethodOverview, type MethodOverviewBundle } from "@/lib/method-catalog";
import { MethodProcessMap } from "./method-process-map";
import QSortBoard from "./q-sort-board";
import AiCodingTool, { type AiMode } from "./ai-coding-tool";
import AiTransformPanel from "./ai-transform-panel";
import { useAnnotation } from "./annotations";
import {
  mergeTerms, termsFromText, termsFromStageGlossary, pickCoreMatching,
  preferAcademic, PARADIGM_SLOT_TERMS, CORE_METHOD_TERMS, type GlossTerm,
} from "@/lib/page-glossary";
import { CA_STAGE_VIEWS } from "@/lib/content-analysis-spec";
import { Q_STAGE_VIEWS } from "@/lib/q-methodology-spec";
import { MethodPracticeSampleAccordion } from "./practice-sample-accordion";

// 단계 전용 도구(f18): Q=범용 Q-Sort 보드(6단계), CA=AI 유목설계(6)·AI 본코딩(8),
// GT=AI 개방코딩(4)·축코딩(5)·선택코딩(6) — 사용자 첨부 q_sort_tool/ai_coding_tool의 React 전환·확장판.
const STAGE_TOOLS: Record<PerfMethod, Record<number, { title: string; kind: "qsort" | AiMode }>> = {
  q: { 6: { title: "범용 Q-Sort 보드 — 진술문 30~80개·5~15점 척도·분포 자동생성·응답자 행렬 저장", kind: "qsort" } },
  ca: {
    6: { title: "AI 유목 설계 보조 — 주제 추출·군집화(상호배타성 점검)·코드북 초안", kind: "ca-category" },
    8: { title: "AI 본코딩 — 코드북 프롬프트·1/2차 다중코더·Cohen's κ 신뢰도", kind: "ca-coding" },
  },
  gt: {
    4: { title: "AI 개방코딩 보조 — 라인바이라인 개념 명명(괄호치기)·범주 후보·속성/차원", kind: "gt-open" },
    5: { title: "AI 축코딩 보조 — 관계 추출(근거 인용 필수)·패러다임 슬롯·네트워크", kind: "gt-axial" },
    6: { title: "AI 선택코딩 보조 — 포화도 추적·핵심범주 후보·스토리라인 초안", kind: "gt-selective" },
  },
};

const IMPORT_ACCEPT = ".xlsx,.xls,.csv,.pdf,.docx,.doc,.txt,.md,.json";
const METHOD_META: Record<PerfMethod, { label: string; prefix: string; ctxKey: string; intro: string }> = {
  gt: { label: "QL-008", prefix: "gt", ctxKey: "gtctx", intro: "연구설계부터 결론까지 11개 영역·50개 세부Task·117개 수행No를 자동화 구분(수동화/반자동화/자동화)에 따라 실제로 수행합니다." },
  ca: { label: "TX-002", prefix: "cap", ctxKey: "capctx", intro: "연구설계부터 결론까지 11개 영역·36개 세부Task(수행내용+산출물)를 자동화 구분(수동화/반자동화/자동화)에 따라 실제로 수행합니다. 빈도·카이제곱·코더간 신뢰도(Kappa)는 실제로 계산됩니다." },
  q: { label: "Q 방법론", prefix: "qpf", ctxKey: "qpfctx", intro: "연구설계부터 결론까지 11개 영역·38개 세부Task를 자동화 구분(수동화/반자동화/자동화)에 따라 실제로 수행합니다. 요인분석(고유값·베리맥스·Z점수)은 실제 통계 파이프라인으로 계산됩니다." },
};
// f19: 사용자기반·규칙기반 모드 선택 UI는 삭제하고 AI기반으로 통합(내부적으로는 결정론 계산·AI초안·수동 안내가
// behavior별로 자동 판단되며, 항상 AI 우선 시도 후 키가 없으면 규칙기반으로 자연스럽게 대체된다).
const AI_BRAND = { bg: "var(--appr-qual)", soft: "var(--appr-qual-soft)" };
const IO_META: { key: GtIOMode; label: string; desc: string }[] = [
  { key: "chain", label: "이전 단계 연동", desc: "앞 단계 결과를 그대로 이어받아 처리" },
  { key: "merge", label: "새 자료 + 연동 합치기", desc: "이 단계에서 새로 불러온 자료를 앞 결과에 병합" },
  { key: "fresh", label: "새 자료만", desc: "이 단계에서 불러온 자료만 사용(연동 무시)" },
];

// ── 내보내기 헬퍼(차트=SVG 래스터, 표/텍스트=캔버스 fillText) ──
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function tableToText(r: GtTaskResult) { let s = `■ ${r.summary}\n`; if (r.cols && r.rows) s += "\n" + r.cols.join("\t") + "\n" + r.rows.map((row) => row.join("\t")).join("\n") + "\n"; if (r.text) s += "\n" + r.text + "\n"; return s; }
function tableHTML(r: GtTaskResult) { let h = `<h2>${esc(r.summary)}</h2>`; if (r.cols && r.rows) h += `<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:12px"><thead><tr>${r.cols.map((c) => `<th style="background:#eee">${esc(String(c))}</th>`).join("")}</tr></thead><tbody>${r.rows.map((row) => `<tr>${row.map((c) => `<td>${esc(String(c))}</td>`).join("")}</tr>`).join("")}</tbody></table>`; if (r.text) h += `<pre style="white-space:pre-wrap;font-family:sans-serif;font-size:12px">${esc(r.text)}</pre>`; return h; }
function exportTXT(r: GtTaskResult, name: string) { downloadBlob(tableToText(r), name + ".txt", "text/plain;charset=utf-8"); }
function exportDOCX(r: GtTaskResult, name: string) { downloadBlob(`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body>${tableHTML(r)}</body></html>`, name + ".doc", "application/msword"); }
function exportPDF(r: GtTaskResult, name: string) { const w = window.open("", "_blank"); if (!w) return; w.document.write(`<html><head><meta charset='utf-8'><title>${esc(name)}</title></head><body onload='window.print()'>${tableHTML(r)}</body></html>`); w.document.close(); }
function saveCanvas(c: HTMLCanvasElement, type: "png" | "jpeg", name: string) { const mime = type === "png" ? "image/png" : "image/jpeg"; c.toBlob((b) => { if (b) downloadBlob(b, name + "." + type, mime); }, mime, 0.95); }
async function svgToImage(svgEl: SVGElement, type: "png" | "jpeg", name: string) {
  const r = svgEl.getBoundingClientRect(); const w = Math.max(320, Math.round(r.width || 560)), h = Math.max(120, Math.round(r.height || 320));
  const clone = svgEl.cloneNode(true) as SVGElement; clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const st = document.createElementNS("http://www.w3.org/2000/svg", "style"); st.textContent = "svg{--color-border-tertiary:#d8d8d8}"; clone.insertBefore(st, clone.firstChild);
  clone.setAttribute("width", String(w)); clone.setAttribute("height", String(h));
  const img = new Image(); await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("svg")); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone)); });
  const sc = 2; const cv = document.createElement("canvas"); cv.width = w * sc; cv.height = h * sc; const cx = cv.getContext("2d")!; cx.scale(sc, sc); cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h); saveCanvas(cv, type, name);
}
function resultToCanvas(r: GtTaskResult, type: "png" | "jpeg", name: string) {
  const sc = 2, pad = 16, fs = 13, lh = 22, gap = 16; const probe = document.createElement("canvas").getContext("2d")!; probe.font = `${fs}px sans-serif`;
  let table: string[][] | null = null, colW: number[] = [];
  if (r.cols && r.rows) { table = [r.cols.map(String), ...r.rows.map((row) => row.map(String))]; colW = r.cols.map((_, c) => Math.min(360, Math.max(...table!.map((row) => probe.measureText(row[c] || "").width)) + gap)); }
  const textLines = (r.text || "").split("\n"); const tableH = table ? Math.min(table.length, 60) * lh + 10 : 0;
  const w = Math.max(420, table ? colW.reduce((a, b) => a + b, 0) + pad * 2 : 600); const h = pad * 2 + lh + tableH + (r.text ? textLines.length * lh + 10 : 0);
  const cv = document.createElement("canvas"); cv.width = w * sc; cv.height = h * sc; const cx = cv.getContext("2d")!; cx.scale(sc, sc); cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h);
  cx.fillStyle = "#111"; cx.font = `bold ${fs + 1}px sans-serif`; let y = pad + fs; cx.fillText(r.summary.slice(0, 80), pad, y); y += lh + 4;
  if (table) { table.slice(0, 60).forEach((row, ri) => { let x = pad; cx.font = `${ri === 0 ? "bold " : ""}${fs}px sans-serif`; cx.fillStyle = ri === 0 ? "#534AB7" : "#222"; row.forEach((cell, ci) => { cx.fillText((cell || "").slice(0, 48), x, y); x += colW[ci] || 80; }); y += lh; }); y += 10; }
  if (r.text) { cx.fillStyle = "#333"; cx.font = `${fs}px sans-serif`; textLines.forEach((l) => { cx.fillText(l.slice(0, 90), pad, y); y += lh; }); }
  saveCanvas(cv, type, name);
}
async function exportImage(el: HTMLElement | null, result: GtTaskResult | null, type: "png" | "jpeg", name: string) {
  const svgEl = el?.querySelector("svg"); if (svgEl) { try { await svgToImage(svgEl as SVGElement, type, name); return; } catch {} }
  if (result) resultToCanvas(result, type, name);
}


const FALLBACK_AUTO = AUTO_META["반자동화"];
function autoMeta(auto?: string | null) {
  return (auto && AUTO_META[auto as keyof typeof AUTO_META]) || FALLBACK_AUTO;
}
function asText(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return typeof v === "string" ? v : String(v);
}
function asProc(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => asText(x)).filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split(/[\n;；]+/).map((s) => s.trim()).filter(Boolean);
  return ["이 단계의 목적·산출물을 확인한다.", "기입란에 연구 맥락을 채운다.", "AI 초안을 검토·확정한다."];
}

function VerifyBadge(_props: { verify?: string | null; long?: boolean }) {
  return null;
}

const taskLabel = (t: GtTask) => t.nameKo || t.name || "세부 작업";
const itemLabel = (i: GtItem, t: GtTask) => i.label || taskLabel(t);
/** Prefer bilingual 한글 (English) titles; fall back to stageLabel. */
const hasLatinParen = (t: string) => /\([\s\S]*[A-Za-z][\s\S]*\)|（[\s\S]*[A-Za-z][\s\S]*）/.test(t);
const stageHeading = (s: GtStage) => {
  const clean = (t: string) =>
    t
      .replace(/^\d+\s*단계\s*[·\-—:]?\s*/g, "")
      .replace(/chapter\s*\d+|ch\.?\s*\d+/gi, "")
      .replace(/\s*Creswell\s*연구설계\s*6e/gi, "")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  const title = clean(s.title || "");
  const label = clean(s.stageLabel || "");
  const full = clean((s as GtStage & { fullName?: string }).fullName || "");
  const pick = [title, label, full].find((t) => t && hasLatinParen(t)) || title || label || full;
  return pick || s.title || "";
};

export default function PerfStageRunner({
  pid, method, perfSlug, label, intro,
}: {
  pid: string;
  method?: PerfMethod | null;
  perfSlug?: string | null;
  label?: string;
  intro?: string;
}) {
  const mm = method ? METHOD_META[method] : {
    label: label || "연구방법",
    prefix: "m11",
    ctxKey: "m11ctx",
    intro: intro || "11개 영역·세부 작업을 **수동/반자동/자동** 구분에 따라 진행합니다. 각 항목마다 **쉬운 한글 설명·예시·산출물 샘플**이 붙어 있습니다.",
  };
  const legacyMethod = method || null;
  const deliverableMethod: PerfMethod = legacyMethod || "ca";
  const settings = useStore((s) => s.settings);
  const getCa = useStore((s) => s.getCa);
  const setCa = useStore((s) => s.setCa);
  const { replace } = useAnnotation();

  const [stages, setStages] = useState<GtStage[] | null>(null);
  const [methodSamples, setMethodSamples] = useState<Awaited<ReturnType<typeof loadMethodSamples>>>(null);
  const [overview, setOverview] = useState<MethodOverviewBundle | null>(null);
  useEffect(() => {
    loadPerfRegistryResolved(legacyMethod, perfSlug || null).then(setStages);
    if (perfSlug && !legacyMethod) {
      loadMethodSamples(perfSlug).then(setMethodSamples);
      loadMethodOverview(perfSlug).then(setOverview);
    } else {
      setMethodSamples(null);
      setOverview(null);
    }
  }, [legacyMethod, perfSlug]);

  const [stageNo, setStageNo] = useState<number | null>(null);
  const [taskNo, setTaskNo] = useState<string | null>(null);
  const [perfNo, setPerfNo] = useState<string | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);

  // 왼쪽 용어 주석: 목록 → 단계 → Task → 세부항목마다 그 페이지 학술용어로 교체
  useEffect(() => {
    if (!stages?.length) return;
    type SX = GtStage & { beginnerPage?: string; stageGlossary?: { term: string; easy: string }[] };
    const legacyViews =
      legacyMethod === "gt" ? GT_STAGE_VIEWS
        : legacyMethod === "ca" ? CA_STAGE_VIEWS
          : legacyMethod === "q" ? Q_STAGE_VIEWS
            : null;

    const stageTerms = (s: GtStage): GlossTerm[] => {
      const ext = s as SX;
      const blob = [
        stageHeading(s), s.easyIntro || "", s.whyStage || "", ext.beginnerPage || "",
        ...s.tasks.flatMap((t) => [
          taskLabel(t), t.whyTask || "", t.example || "",
          ...t.items.flatMap((i) => [
            itemLabel(i, t),
            ...i.entries.flatMap((e) => [e.easyTitle || "", e.easyContent || "", e.easyWhyNeed || "", e.content || "", e.seg || ""]),
          ]),
        ]),
      ].join(" ");
      return mergeTerms(
        termsFromStageGlossary(ext.stageGlossary),
        pickCoreMatching(blob),
        termsFromText(blob),
      );
    };

    let terms: GlossTerm[] = [];
    const cur = stageNo != null ? stages.find((s) => s.stageNo === stageNo) || null : null;
    const curTask = cur && taskNo ? cur.tasks.find((t) => t.taskNo === taskNo) || null : null;
    const curItem = curTask && perfNo ? curTask.items.find((i) => i.perfNo === perfNo) || null : null;
    const curEntry = curItem && entryId ? curItem.entries.find((e) => e.id === entryId) || null : null;

    const methodGloss = termsFromStageGlossary(
      (overview?.glossary || []).map((g) => ({ term: g.termKo || g.term, easy: g.def })),
    );

    if (!cur) {
      // 11단계 목록
      const allBlob = stages.map((s) => stageHeading(s) + " " + (s.easyIntro || "")).join(" ");
      terms = mergeTerms(
        ...(stages.map((s) => stageTerms(s))),
        methodGloss,
        pickCoreMatching(allBlob + " " + (legacyViews || []).map((v) => v.title).join(" ")),
        termsFromText(allBlob),
        (legacyMethod === "gt" || legacyMethod === "ca" || legacyMethod === "q") ? CORE_METHOD_TERMS : [],
      );
    } else if (!curTask) {
      // 단계(세부Task 목록) — 축코딩이면 패러다임 슬롯 포함
      const head = stageHeading(cur);
      terms = mergeTerms(
        methodGloss,
        stageTerms(cur),
        /축코딩|패러다임|axial/i.test(head) ? PARADIGM_SLOT_TERMS : [],
        pickCoreMatching(head + " " + (cur.easyIntro || "") + " " + (cur.whyStage || "")),
        /연구설계|방법론|통합|해석|시사점/.test(head) ? pickCoreMatching(head + " 연구설계 방법론 연구질문 결과 통합 시사점") : [],
      );
    } else {
      // Task / 세부항목 / 수행내용
      const blob = [
        stageHeading(cur),
        taskLabel(curTask),
        curItem ? itemLabel(curItem, curTask) : "",
        curEntry ? [curEntry.easyTitle, curEntry.easyContent, curEntry.easyWhyNeed, curEntry.content, curEntry.seg, ...asProc(curEntry.procedureEasy || curEntry.procedure)].join(" ") : "",
        curTask.whyTask || "",
        curTask.example || "",
      ].join(" ");
      terms = mergeTerms(
        methodGloss,
        termsFromStageGlossary((cur as SX).stageGlossary),
        /축코딩|패러다임|인과적|중심현상|중재적|맥락적|속성/i.test(blob) ? PARADIGM_SLOT_TERMS : [],
        pickCoreMatching(blob),
        termsFromText(blob),
      );
    }

    replace(preferAcademic(terms));
  }, [stages, overview, stageNo, taskNo, perfNo, entryId, legacyMethod, replace]);

  const [ioMode, setIoMode] = useState<GtIOMode>("chain");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState<"" | "run" | "load" | "ex">("");
  const [result, setResult] = useState<GtTaskResult | null>(null);
  const [examples, setExamples] = useState<ExampleItem[] | null>(null);
  const [exNote, setExNote] = useState<string | null>(null);
  const [sample, setSample] = useState<DeliverableSample | null>(null);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [toolOpen, setToolOpen] = useState(true);
  const resultRef = useRef<HTMLDivElement>(null);

  const key = (id: string) => `${mm.prefix}:${id}`;
  const ctx = (): GtCtx => getCa(pid)[mm.ctxKey] || {};
  const doneOf = (id: string) => !!getCa(pid)[key(id)];

  const allEntries = (s: GtStage) => (s.tasks || []).flatMap((t) => (t.items || []).flatMap((i) => i.entries || []));
  const stageDone = (s: GtStage) => allEntries(s).filter((e) => doneOf(e.id)).length;
  const stageTotal = (s: GtStage) => allEntries(s).length;
  const taskDone = (t: GtTask) => (t.items || []).flatMap((i) => i.entries || []).filter((e) => doneOf(e.id)).length;
  const taskTotal = (t: GtTask) => (t.items || []).flatMap((i) => i.entries || []).length;
  const totalDone = useMemo(() => (stages || []).reduce((a, s) => a + stageDone(s), 0), [getCa, pid, stages, result]);
  const totalAll = useMemo(() => (stages || []).reduce((a, s) => a + stageTotal(s), 0), [stages]);

  type StageExt = GtStage & { pillarShort?: string; pillarLabel?: string; beginnerPage?: string; stageGlossary?: { term: string; easy: string }[] };
  const pillarGroups = useMemo(() => {
    if (!stages?.length) return null;
    const ext = stages[0] as StageExt;
    if (!ext.pillarShort && stages.length <= 12) return null;
    const order = ["기초통계", "가정검토", "추론통계"];
    const map = new Map<string, GtStage[]>();
    for (const s of stages) {
      const p = (s as StageExt).pillarShort || "기타";
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(s);
    }
    return order.filter((o) => map.has(o)).map((o) => ({ key: o, stages: map.get(o)! }));
  }, [stages]);

  const isSocial33 = !!pillarGroups && stages && stages.length >= 30;

  if (!stages || !Array.isArray(stages) || stages.length === 0) {
    return (
      <div className="text-[13px] text-ink-3">
        {stages === null
          ? `${mm.label} 자동화수준 분석표를 불러오는 중…`
          : `${mm.label} 단계 데이터를 불러오지 못했습니다. 방법 목록으로 돌아가 다시 열어 주세요.`}
      </div>
    );
  }

  const stage = stageNo != null ? stages.find((s) => s.stageNo === stageNo) || null : null;
  const task: GtTask | null = stage && taskNo ? stage.tasks.find((t) => t.taskNo === taskNo) || null : null;
  const item: GtItem | null = task && perfNo ? task.items.find((i) => i.perfNo === perfNo) || null : null;
  const entry: GtEntry | null = item && entryId ? item.entries.find((e) => e.id === entryId) || null : null;

  const openStage = (s: GtStage) => { setStageNo(s.stageNo); setTaskNo(null); setPerfNo(null); setEntryId(null); setResult(null); };
  const openTask = (t: GtTask) => { const items = Array.isArray(t.items) ? t.items : []; setTaskNo(t.taskNo); setPerfNo(items.length === 1 ? items[0].perfNo : null); setEntryId(null); setResult(null); };
  const openItem = (i: GtItem) => { setPerfNo(i.perfNo); setEntryId(null); setResult(null); };
  const backFromItem = () => { if (task && (task.items?.length === 1)) { setTaskNo(null); setPerfNo(null); } else setPerfNo(null); setEntryId(null); setResult(null); };
  const openEntry = (e: GtEntry) => {
    setEntryId(e.id); setText((e as { aiInputHint?: string }).aiInputHint || ""); setFileName(""); setIoMode((e.io === "chain" || e.io === "merge" || e.io === "fresh") ? e.io : "fresh");
    setResult(getCa(pid)[key(e.id)] || null);
    setExamples(e.prebuiltExamples?.length ? e.prebuiltExamples.map((x, i) => ({ label: x.label || `예시 ${i + 1}`, text: x.text, table: x.table })) : null);
    setExNote(e.prebuiltExamples?.length ? "미리 준비한 연습 예시입니다. 주제에 맞게 바꾸려면 ‘AI 예시 생성’을 누르세요." : null);
    setSample(null); setSampleOpen(false);
  };

  const onFile = async (f: File | undefined) => { if (!f) return; setBusy("load"); try { const d = await extractFile(f); setText((t) => (t ? t + "\n\n" : "") + d.text); setFileName(`${f.name} (${d.chars.toLocaleString()}자)`); } finally { setBusy(""); } };

  // f19: 모드 선택 삭제 — 항상 'ai'로 실행(behavior가 결정론 계산/AI초안/수동안내를 내부에서 자동 처리)
  const run = async () => {
    if (!entry) return; setBusy("run");
    try {
      const res = await runPerfTask({ behavior: entry.behavior, mode: "ai", text, settings, ctx: ctx(), io: { mode: ioMode }, content: entry.content, reason: entry.reason, procedure: entry.procedure, outputName: `${entry.kind} · ${asText(entry.content).slice(0, 40)}` });
      setResult(res);
      const patch: any = { [key(entry.id)]: res }; if (res.ctxPatch) patch[mm.ctxKey] = { ...ctx(), ...res.ctxPatch };
      setCa(pid, patch);
    } catch (e: any) { setResult({ summary: "오류", text: String(e?.message || e) }); } finally { setBusy(""); }
  };

  const genEx = async () => {
    if (!entry) return; setBusy("ex");
    try {
      const r = await generateExamples({
        content: entry.easyContent || entry.content,
        kind: entry.kind,
        auto: entry.auto,
        reason: entry.easyReason || entry.reason,
        procedure: entry.procedureEasy || entry.procedure,
      }, settings);
      setExamples(r.items); setExNote(r.note || null);
    } finally { setBusy(""); }
  };

  // ── 레벨1: 11단계(영역) 목록 ──
  if (!stage) {
    const ov = overview as (MethodOverviewBundle & { beginnerIntro?: string; pillarGuide?: { id: string; title: string; desc: string }[] }) | null;
    return (
      <div className="text-[14px] leading-relaxed">
        <div className="rounded-md p-3 mb-4 text-[13px]" style={{ background: "var(--brand-soft)" }}>
          <b style={{ color: "var(--brand-ink)" }}>{mm.label} {isSocial33 ? "33단계(3×11)" : "11단계"} 자동화 워크벤치</b> — {mm.intro} · 전체 진행 {totalDone}/{totalAll}
        </div>
        {ov?.beginnerIntro && (
          <div className="card mb-4 text-[13px] leading-relaxed" style={{ borderLeft: "4px solid var(--brand)" }}>
            <div className="font-semibold mb-1">🌱 처음이신가요? (쉬운 안내)</div>
            <Gloss text={ov.beginnerIntro} />
          </div>
        )}
        {pillarGroups ? (
          pillarGroups.map((pg) => (
            <div key={pg.key} className="mb-6">
              <h3 className="text-[15px] font-semibold mb-2" style={{ color: "var(--brand-ink)" }}>📂 {pg.key} ({pg.stages.length}단계)</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pg.stages.map((s) => {
                  const d = stageDone(s), all = stageTotal(s);
                  const lab = (s as StageExt).pillarLabel;
                  return (
                    <button key={s.stageNo} onClick={() => openStage(s)} className="card text-left hover:-translate-y-0.5 transition-transform" style={{ borderLeft: "3px solid var(--color-border-tertiary)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="grid place-items-center rounded-full text-[11px] font-semibold" style={{ width: 22, height: 22, background: d === all && all > 0 ? "var(--ok)" : "var(--brand-soft)", color: d === all && all > 0 ? "var(--on-accent)" : "var(--brand-ink)" }}>{d === all && all > 0 ? "✓" : s.stageNo}</span>
                        {lab && <span className="text-[10px] text-ink-3">{lab}</span>}
                        <span className="ml-auto text-[11px] text-ink-3">{d}/{all}</span>
                      </div>
                      <div className="font-semibold text-[14px]">{s.title}</div>
                      <div className="text-[11px] text-ink-3 mt-1 line-clamp-2">{s.easyIntro || `세부 작업 ${s.tasks.length}개`}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stages.map((s) => {
            const d = stageDone(s), all = stageTotal(s);
            return (
              <button key={s.stageNo} onClick={() => openStage(s)} className="card text-left hover:-translate-y-0.5 transition-transform" style={{ borderLeft: "3px solid var(--color-border-tertiary)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="grid place-items-center rounded-full text-[11px] font-semibold" style={{ width: 22, height: 22, background: d === all && all > 0 ? "var(--ok)" : "var(--brand-soft)", color: d === all && all > 0 ? "var(--on-accent)" : "var(--brand-ink)" }}>{d === all && all > 0 ? "✓" : s.stageNo}</span>
                  <span className="ml-auto text-[11px] text-ink-3">{d}/{all}</span>
                </div>
                <div className="font-semibold text-[14px]"><Gloss text={stageHeading(s)} /></div>
                <div className="text-[11px] text-ink-3 mt-1 line-clamp-2"><Gloss text={s.easyIntro || `세부 작업 ${s.tasks.length}개`} /></div>
              </button>
            );
          })}
        </div>
        )}
        {overview?.stageViews?.length ? (
          <details className="mt-4 card text-[13px]">
            <summary className="cursor-pointer font-semibold">📋 전체 {isSocial33 ? "33" : "11"}단계 표로 보기</summary>
            <div className="mt-3"><MethodProcessMap views={overview.stageViews} /></div>
          </details>
        ) : null}
      </div>
    );
  }

  // ── 레벨2: 세부Task 목록 ──
  if (!task) {
    const sIdx = stages.findIndex((s) => s.stageNo === stage.stageNo);
    const tool = legacyMethod ? STAGE_TOOLS[legacyMethod]?.[stage.stageNo] : undefined;
    return (
      <div className="text-[14px] leading-relaxed">
        <button className="btn btn-sm mb-2" onClick={() => { setStageNo(null); }}>← 11단계 목록으로</button>
        <div className="card mb-3" style={{ borderTop: "3px solid var(--brand)" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="grid place-items-center rounded-full text-white text-[12px] font-bold" style={{ width: 24, height: 24, background: "var(--brand)" }}>{stage.stageNo}</span>
            <h2 className="text-[18px] font-semibold"><Gloss text={stageHeading(stage)} /></h2>
            <span className="ml-auto text-[12px] text-ink-3">단계 {sIdx + 1}/{stages.length}</span>
          </div>
          {stage.easyIntro && <p className="text-[13px] mt-2 text-ink-2"><Gloss text={stage.easyIntro} /></p>}
          {(stage as StageExt).beginnerPage && (
            <div className="rounded-md p-2.5 mt-2 text-[12.5px] leading-relaxed border" style={{ borderColor: "var(--color-border-tertiary)" }}>
              <b>쉬운 설명 · 왜·어디에 쓰나요</b>
              <div className="mt-1"><Gloss text={(stage as StageExt).beginnerPage!} /></div>
            </div>
          )}
          {stage.whyStage && (
            <div className="rounded-md p-2.5 mt-2 text-[12.5px] leading-relaxed" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
              <b>왜 이 단계가 필요한가요?</b> <Gloss text={stage.whyStage} />
            </div>
          )}
        </div>
        {tool && (
          <div className="card mb-3" style={{ borderLeft: "3px solid var(--brand)" }}>
            <button className="w-full text-left" onClick={() => setToolOpen(!toolOpen)}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] px-1.5 py-0.5 rounded text-white" style={{ background: "var(--brand)" }}>🧰 단계 전용 도구</span>
                <span className="text-[13.5px] font-semibold">{tool.title}</span>
                <span className="ml-auto text-[12px]" style={{ color: "var(--brand-ink)" }}>{toolOpen ? "접기 ▲" : "펼치기 ▼"}</span>
              </div>
            </button>
            {toolOpen && (
              <div className="mt-3 pt-3" style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                {tool.kind === "qsort" ? <QSortBoard pid={pid} /> : <AiCodingTool pid={pid} mode={tool.kind} />}
              </div>
            )}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          {(stage.tasks || []).map((t) => {
            const d = taskDone(t), all = taskTotal(t);
            return (
              <button key={t.taskNo} onClick={() => openTask(t)} className="card text-left hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <VerifyBadge verify={t.verify} />
                  <span className="ml-auto text-[11px] text-ink-3">{d}/{all}</span>
                </div>
                <div className="font-semibold text-[14px]"><Gloss text={taskLabel(t)} /></div>
                <div className="text-[11px] mt-1" style={{ color: "var(--ok)" }}>세부 항목 {all}개</div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-4">
          {sIdx > 0 && <button className="btn btn-sm" onClick={() => openStage(stages[sIdx - 1])}>← {stages[sIdx - 1].title}</button>}
          {sIdx + 1 < stages.length && <button className="btn btn-sm btn-primary" onClick={() => openStage(stages[sIdx + 1])}>{stages[sIdx + 1].title} →</button>}
        </div>
      </div>
    );
  }

  // ── 레벨3: 수행No(세부 항목) 목록 — 항목이 여러 개인 방법(QL-008)만 표시 ──
  if (!item) {
    const tIdx = stage.tasks.findIndex((t) => t.taskNo === task.taskNo);
    return (
      <div className="text-[14px] leading-relaxed">
        <button className="btn btn-sm mb-2" onClick={() => { setTaskNo(null); setPerfNo(null); }}>← {stage.title} · 세부 작업 목록</button>
        <div className="card mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <VerifyBadge verify={task.verify} />
          </div>
          <h2 className="text-[17px] font-semibold"><Gloss text={taskLabel(task)} /></h2>
          {task.whyTask && <div className="rounded-md p-2.5 mt-2 text-[12.5px]" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}><b>이 작업을 하는 이유 · </b><Gloss text={task.whyTask} /></div>}
          {task.example && <div className="rounded-md p-2.5 mt-2 text-[12.5px]" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}><Gloss text={task.example} /></div>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(task.items || []).map((i) => {
            const doneN = i.entries.filter((e) => doneOf(e.id)).length;
            return (
              <button key={i.perfNo} onClick={() => openItem(i)} className="card text-left hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold" style={{ color: "var(--brand-ink)" }}><Gloss text={itemLabel(i, task)} /></span>
                  <span className="ml-auto text-[11px] text-ink-3">{doneN}/{i.entries.length}</span>
                </div>
                <div className="text-[13px] leading-snug"><Gloss text={(i.entries[0]?.easyContent || i.entries[0]?.content || "").slice(0, 90)} /></div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {i.entries.map((e) => (
                    <span key={e.id} className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: autoMeta(e.auto).color }}>{e.kind}·{e.auto}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-4">
          {tIdx > 0 && <button className="btn btn-sm" onClick={() => openTask(stage.tasks[tIdx - 1])}>← {taskLabel(stage.tasks[tIdx - 1])}</button>}
          {tIdx + 1 < stage.tasks.length && <button className="btn btn-sm btn-primary" onClick={() => openTask(stage.tasks[tIdx + 1])}>{taskLabel(stage.tasks[tIdx + 1])} →</button>}
        </div>
      </div>
    );
  }

  // ── 레벨4: 세부 분절(수행내용/산출물) 카드 + 실행 ──
  const tIdx = stage.tasks.findIndex((t) => t.taskNo === task.taskNo);
  return (
    <div className="text-[14px] leading-relaxed">
      <button className="btn btn-sm mb-2" onClick={backFromItem}>← {task.items.length === 1 ? `${stage.title} · 세부 작업 목록` : `${taskLabel(task)} · 하위 항목 목록`}</button>
      <div className="card mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <VerifyBadge verify={task.verify} long />
        </div>
        <h2 className="text-[16px] font-semibold mt-0.5"><Gloss text={taskLabel(task)} /></h2>
        {task.items.length > 1 && item && <p className="text-[13px] text-ink-2 mt-1"><Gloss text={itemLabel(item, task)} /></p>}
        {task.example && <div className="rounded-md p-2.5 mt-2 text-[12.5px]" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}><Gloss text={task.example} /></div>}
      </div>

      {(item?.entries || []).map((e) => {
        const open = entry?.id === e.id;
        const am = autoMeta(e.auto);
        const displayTitle = e.easyTitle || `${e.kind === "산출물" ? "산출물" : "수행"} · ${taskLabel(task)}`;
        const displayBody = asText(e.easyContent || e.content);
        const displayReason = asText(e.easyReason || e.reason, "이 분절을 연구 절차에 맞게 수행·기록하기 위한 단계입니다.");
        const displayProc = asProc(e.procedureEasy?.length ? e.procedureEasy : e.procedure);
        const expertRaw = e.contentRaw;
        return (
          <div key={e.id} className="card mb-3" style={{ borderLeft: `3px solid ${am.color}` }}>
            <button className="w-full text-left" onClick={() => (open ? setEntryId(null) : openEntry(e))}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: am.color }}>{e.auto}</span>
                <span className="text-[11px] text-ink-3">{e.kind === "산출물" ? "📄 산출물" : "✋ 수행내용"}{e.segLabel ? ` · ${e.segLabel}` : ""}</span>
                {doneOf(e.id) && <span className="text-[11px]" style={{ color: "var(--ok)" }}>✓ 완료</span>}
                <span className="ml-auto text-[12px]" style={{ color: "var(--brand-ink)" }}>{open ? "접기 ▲" : "펼치기 ▼"}</span>
              </div>
              <div className="text-[14px] font-semibold mt-1"><Gloss text={displayTitle} /></div>
              <div className="text-[13px] text-ink-2 mt-1 leading-relaxed"><Gloss text={displayBody.slice(0, 160) + (displayBody.length > 160 ? "…" : "")} /></div>
              <div className="text-[12px] text-ink-3 mt-1">{am.tag}</div>
            </button>

            {open && (
              <div className="mt-3 pt-3" style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                {e.easyWhyNeed && (
                  <div className="rounded-md p-2.5 mb-3 text-[12.5px]" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
                    <b>왜 이 과정이 필요한가요?</b> — <Gloss text={e.easyWhyNeed} />
                  </div>
                )}
                <div className="rounded-md p-2.5 mb-3 text-[12.5px]" style={{ background: am.soft }}>
                  <b style={{ color: am.color }}>구분 근거 (쉬운 말)</b> — <Gloss text={displayReason} />
                </div>
                <div className="rounded-md p-2.5 mb-3 text-[12.5px]" style={{ background: "var(--color-background-secondary)" }}>
                  <b>따라 할 단계 (한글)</b>
                  <ol className="list-decimal pl-5 mt-1 space-y-0.5">{displayProc.map((p, i) => <li key={i}><Gloss text={p} /></li>)}</ol>
                </div>
                {expertRaw && expertRaw !== displayBody && (
                  <details className="mb-3 text-[12px] text-ink-3">
                    <summary className="cursor-pointer font-semibold">전문가용 원문(분석표·영문 약어)</summary>
                    <Gloss className="block mt-1 leading-relaxed" text={expertRaw} />
                  </details>
                )}

                {/* 산출물 서식 샘플(구체적 예시가 채워진 실물 서식) — 산출물 항목에만 노출 */}
                {e.kind === "산출물" && (
                  <div className="rounded-md p-2.5 mb-3" style={{ background: "var(--ok-wash)", borderLeft: "3px solid var(--ok)" }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <b style={{ color: "var(--ok)" }}>📄 산출물 서식 샘플 — 연습용으로 채워진 예시</b>
                      <div className="flex gap-1.5 flex-wrap">
                        <button className="btn btn-sm" style={{ background: "var(--ok)", borderColor: "var(--ok)", color: "var(--on-accent)" }}
                          onClick={() => {
                            const ms = sampleFromMethodFile(methodSamples, e.id);
                            const raw = ms || findSample(e.easyContent || e.content, deliverableMethod);
                            const s = adaptSampleToMethodLabel(raw, mm.label);
                            setSample(s); setSampleOpen(true);
                          }}>
                          {sample && sampleOpen && entryId === e.id ? "서식 새로 불러오기" : "서식 샘플 보기"}
                        </button>
                        {sample && sampleOpen && entryId === e.id && <button className="btn btn-sm" onClick={() => setSampleOpen(false)}>접기</button>}
                      </div>
                    </div>
                    {sample && sampleOpen && entryId === e.id && (
                      <div className="mt-2.5">
                        <div className="flex gap-1.5 flex-wrap mb-2">
                          <button className="btn btn-sm" onClick={() => downloadBlob(sampleToText(sample), (sample.title || "산출물서식") + ".txt", "text/plain;charset=utf-8")}>TXT 저장</button>
                          <button className="btn btn-sm" onClick={() => downloadBlob(`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body>${sampleToHTML(sample)}</body></html>`, (sample.title || "산출물서식") + ".doc", "application/msword")}>DOCX 저장</button>
                          <button className="btn btn-sm" onClick={() => { const w = window.open("", "_blank"); if (!w) return; w.document.write(`<html><head><meta charset='utf-8'><title>${sample.title || "서식 샘플"}</title></head><body onload='window.print()'>${sampleToHTML(sample)}</body></html>`); w.document.close(); }}>PDF 인쇄</button>
                        </div>
                        <div className="rounded-md p-3 overflow-x-auto" style={{ background: "var(--doc-bg)", color: "var(--doc-ink)", border: "0.5px solid var(--color-border-tertiary)", maxHeight: 640, overflowY: "auto" }} dangerouslySetInnerHTML={{ __html: sampleToHTML(sample) }} />
                      </div>
                    )}
                  </div>
                )}

                {/* 실제 예시 생성(AI 기반) */}
                <div className="rounded-md p-2.5 mb-3" style={{ background: AI_BRAND.soft, borderLeft: `3px solid ${AI_BRAND.bg}` }}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <b style={{ color: AI_BRAND.bg }}>🤖 더 구체적인 예시 만들기 (선택 · AI)</b>
                    <button className="btn btn-sm" disabled={busy === "ex"} onClick={genEx} style={{ background: AI_BRAND.bg, borderColor: AI_BRAND.bg, color: "var(--on-accent)" }}>{busy === "ex" ? "생성 중…" : "AI로 예시 다듬기"}</button>
                  </div>
                  {!examples?.length && entryId === e.id && (
                    <p className="text-[11.5px] mt-2 text-ink-3">위에 연습용 예시가 있으면 표시됩니다. AI 키가 있으면 주제에 맞게 더 구체화할 수 있습니다.</p>
                  )}
                  {examples && examples.length > 0 && entryId === e.id && (
                    <div className="mt-2.5 space-y-2.5">
                      {exNote && <div className="text-[11.5px]" style={{ color: AI_BRAND.bg }}>ℹ {exNote}</div>}
                      <div className="rounded-md border p-2 text-[12px] leading-relaxed" style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
                        <b>자료수집 단계 · 표본수 안내</b>
                        <p className="mt-1 text-ink-2">
                          위 미니 표(3–6행)는 서식·절차 익힘용입니다. 실전 양적 조사는 보통 <b>100명 이상</b>(집단비교·상관은 200–400, 회귀·세그먼트는 400–1,000+)을 목표로 합니다.
                          질적 면담은 포화 기준 <b>15–40명</b>이 흔합니다. 방법별 상세 표준과 <b>100행+ 연습 데이터</b>는 아래 아코디언을 펼치세요.
                        </p>
                      </div>
                      {examples.map((ex, i) => (
                        <div key={i} className="rounded-md p-2.5" style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)" }}>
                          <div className="text-[11.5px] font-semibold mb-1" style={{ color: AI_BRAND.bg }}>{ex.label}</div>
                          <Gloss className="text-[13px] leading-relaxed block" text={ex.text} />
                          {ex.table && (
                            <>
                              <p className="text-[11px] text-ink-3 mt-2 mb-1">서식 익힘용 미니 표(원본)</p>
                              <table className="w-full text-[12px] mt-1" style={{ borderCollapse: "collapse" }}>
                                <thead><tr>{ex.table.columns.map((c, j) => <th key={j} className="text-left p-1" style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>{c}</th>)}</tr></thead>
                                <tbody>{ex.table.rows.slice(0, 8).map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k} className="p-1 align-top" style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{String(c)}</td>)}</tr>)}</tbody>
                              </table>
                              <MethodPracticeSampleAccordion
                                methodId={perfSlug || mm.prefix || method || "method"}
                                methodLabel={mm.label}
                                exampleLabel={ex.label}
                                exampleText={ex.text}
                                seedTable={{ columns: ex.table.columns, rows: ex.table.rows.map((r) => r.map(String)) }}
                              />
                            </>
                          )}
                          {!ex.table && (
                            <MethodPracticeSampleAccordion
                              methodId={perfSlug || mm.prefix || method || "method"}
                              methodLabel={mm.label}
                              exampleLabel={ex.label}
                              exampleText={ex.text}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI 변환기 (수집·코딩·분석·해석 등) */}
                <AiTransformPanel
                  kind={(e as { aiTransformType?: string }).aiTransformType || "focus"}
                  title={(e as { aiTransformLabel?: string }).aiTransformLabel || "AI 변환기"}
                  initialText={text}
                />

                {/* 연동/불러오기(io) */}
                <div className="mb-3">
                  <div className="text-[12.5px] font-semibold mb-1.5">🔗 자료 연동 방식</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {IO_META.map((io) => {
                      const on = io.key === ioMode;
                      return <button key={io.key} onClick={() => setIoMode(io.key)} className="rounded px-3 py-1.5 text-[12px]" title={io.desc} style={on ? { background: "var(--brand)", color: "var(--on-accent)", fontWeight: 600 } : { background: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{io.label}</button>;
                    })}
                  </div>
                  <p className="text-[11px] text-ink-3 mt-1.5">{IO_META.find((i) => i.key === ioMode)?.desc}</p>
                </div>

                {/* 불러오기 + 입력 */}
                <div className="rounded-md p-3 mb-3" style={{ background: "var(--color-background-secondary)" }}>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <h4 className="text-[13.5px] font-semibold">📥 불러오기 · 입력</h4>
                    <label className="btn btn-sm btn-primary cursor-pointer">파일 불러오기
                      <input type="file" accept={IMPORT_ACCEPT} className="hidden" onChange={(ev) => onFile(ev.target.files?.[0])} /></label>
                  </div>
                  {fileName && <div className="text-[12px] mb-2" style={{ color: "var(--ok)" }}>✓ {fileName}</div>}
                  {busy === "load" && <div className="text-[12px] text-ink-3 mb-2">파일에서 텍스트 추출 중…</div>}
                  <textarea className="inp text-[13px] min-h-[100px] w-full" placeholder="자료를 입력하거나 파일을 불러오세요." value={text} onChange={(ev) => setText(ev.target.value)} />
                  <div className="mt-2.5">
                    <button className="btn btn-primary text-[13.5px]" disabled={!!busy} onClick={run} style={{ background: AI_BRAND.bg, borderColor: AI_BRAND.bg }}>
                      {busy === "run" ? "처리 중…" : "🤖 AI 기반으로 실행 ▶"}</button>
                  </div>
                </div>

                {/* 결과 + 내보내기 */}
                {result && entryId === e.id && (
                  <div className="rounded-md p-3" style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)" }}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <h4 className="text-[13.5px] font-semibold">📤 결과 · 내보내기</h4>
                      <div className="flex gap-1.5 flex-wrap">
                        <button className="btn btn-sm" onClick={() => exportTXT(result, asText(e.content).slice(0, 30))}>TXT</button>
                        <button className="btn btn-sm" onClick={() => exportPDF(result, asText(e.content).slice(0, 30))}>PDF</button>
                        <button className="btn btn-sm" onClick={() => exportDOCX(result, asText(e.content).slice(0, 30))}>DOCX</button>
                        <button className="btn btn-sm" onClick={() => exportImage(resultRef.current, result, "png", asText(e.content).slice(0, 30))}>PNG</button>
                        <button className="btn btn-sm" onClick={() => exportImage(resultRef.current, result, "jpeg", asText(e.content).slice(0, 30))}>JPEG</button>
                      </div>
                    </div>
                    {result.note && <div className="rounded-md p-2 mb-2 text-[12px]" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>ℹ {result.note}</div>}
                    <div ref={resultRef}>
                      <div className="rounded-md p-2.5 mb-2 text-[13.5px] font-semibold" style={{ background: "var(--color-background-secondary)" }}>{result.summary}</div>
                      {result.chart && <div className="mb-3"><CaChart spec={result.chart} /></div>}
                      {result.cols && result.rows && (
                        <div className="overflow-x-auto mb-2" style={{ maxHeight: 400, overflowY: "auto" }}><table className="w-full text-[12px] border-collapse">
                          <thead><tr>{result.cols.map((c, i) => <th key={i} className="text-left p-2 text-white sticky top-0" style={{ background: AI_BRAND.bg }}>{c}</th>)}</tr></thead>
                          <tbody>{result.rows.map((row, ri) => <tr key={ri} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{row.map((c, ci) => <td key={ci} className="p-2 align-top">{String(c)}</td>)}</tr>)}</tbody>
                        </table></div>
                      )}
                      {result.text && <pre className="text-[12px] whitespace-pre-wrap rounded-md p-2.5" style={{ background: "var(--color-background-secondary)" }}>{result.text}</pre>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex gap-2 mt-4">
        {tIdx > 0 && <button className="btn btn-sm" onClick={() => openTask(stage.tasks[tIdx - 1])}>← 이전 세부Task</button>}
        {tIdx + 1 < stage.tasks.length && <button className="btn btn-sm btn-primary" onClick={() => openTask(stage.tasks[tIdx + 1])}>다음 세부Task →</button>}
      </div>
    </div>
  );
}
