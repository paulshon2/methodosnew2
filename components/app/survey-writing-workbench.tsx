"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useStore } from "@/store/app-store";
import {
  CONTENT_TYPE_LABEL,
  DEFAULT_AI_FORM,
  SCALE_LABEL,
  SURVEY_WRITING_METHOD_ID,
  SS_STATS_LINK_METHOD_ID,
  loadSurveyProtocol,
  type AiSurveyForm,
  type ContentTypeId,
  type SurveyItem,
  type SurveyProtocol,
} from "@/lib/survey-writing-spec";
import { generateSurveyItemsAi, itemsToCodingTable, itemsToCsv } from "@/lib/survey-writing-generate";
import {
  analyzeSurveyRows,
  convertItemsToScaleCoding,
  rowsFromMatrix,
  type ExcelAnalysisResult,
} from "@/lib/survey-writing-analyze";
import { useAnnotation } from "./annotations";
import { mergeTerms, preferAcademic, CORE_METHOD_TERMS } from "@/lib/page-glossary";

type TabId = "overview" | "types" | "protocol" | "ai" | "excel" | "scale" | "steps";

const SURVEY_GLOSS = [
  { term: "설문문항", def: "설문문항 — 응답자에게 묻는 한 줄의질문. 예: ‘수업 만족도는?’" },
  { term: "척도", def: "척도 — 답을 숫자로 바꾸는 눈금. 예: 1~5점 평정척도(등간형)" },
  { term: "평정척도(등간형)", def: "평정척도(등간형) — ‘전혀 아니다~매우 그렇다’처럼 정도를 고르는 척도" },
  { term: "코딩표", def: "코딩표 — 응답을 분석용 숫자·코드로 옮기는 표" },
  { term: "프로토콜", def: "프로토콜 — 설문 작성·검수 규칙을 정한 절차서(출처 표준 프로토콜)" },
  { term: "인구통계", def: "인구통계 — 나이·성별 등 응답자 기본 특성 문항" },
  { term: "태도문항", def: "태도문항 — 선호·의견의 방향을 묻는 문항" },
  { term: "조사방식(Mode)", def: "조사방식 — 설문을 전달·회수하는 경로(웹·우편·전화·대면)" },
  { term: "유니모드", def: "유니모드 — 혼합모드에서도 문항 어간·범주를 같게 맞추는 설계" },
  { term: "쇼카드", def: "쇼카드 — 대면면접에서 응답 범주를 보여주는 카드" },
  { term: "IVR", def: "IVR — 자동응답전화로 문항을 듣고 버튼으로 답하는 조사" },
  { term: "면접원 개입도", def: "면접원 개입도 — 면접원이 문항을 읽고 답을 받는 정도" },
  { term: "자기기입식", def: "자기기입식 — 응답자가 스스로 읽고 답하는 방식(웹·우편)" },
  { term: "출처 표준 프로토콜", def: "출처 표준 프로토콜 — 유형별 문항 작성·검수 표준 절차" },
];

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "개요" },
  { id: "types", label: "유형별 예시" },
  { id: "protocol", label: "프로토콜·기준" },
  { id: "ai", label: "AI 설문문항 작성" },
  { id: "excel", label: "엑셀 검수" },
  { id: "scale", label: "척도변환·통계연동" },
  { id: "steps", label: "절차 11단계" },
];

const TYPE_ORDER: ContentTypeId[] = [
  "attitude", "knowledge", "performance", "psychographic", "demographic", "self_administered",
];

function downloadText(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\uFEFF" + text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function SurveyWritingWorkbench({
  pid, title, nav,
}: {
  pid: string;
  title: string;
  nav: (r: string) => void;
}) {
  const settings = useStore((s) => s.settings);
  const getCa = useStore((s) => s.getCa);
  const setCa = useStore((s) => s.setCa);
  const createProject = useStore((s) => s.createProject);
  const { replace } = useAnnotation();

  useEffect(() => {
    replace(preferAcademic(mergeTerms(SURVEY_GLOSS, CORE_METHOD_TERMS.filter((t) => ["연구설계", "연구질문", "타당성", "신뢰도"].includes(t.term)))));
  }, [replace]);

  const saved = getCa(pid)["survey-writing"] as {
    form?: AiSurveyForm;
    items?: SurveyItem[];
    tab?: TabId;
  } | undefined;

  const [protocol, setProtocol] = useState<SurveyProtocol | null>(null);
  const [tab, setTab] = useState<TabId>(saved?.tab || "overview");
  const [form, setForm] = useState<AiSurveyForm>(saved?.form || { ...DEFAULT_AI_FORM, topic: "공공 디지털 서비스", researchQuestion: "디지털 서비스 이용은 만족도와 관련이 있는가?", population: "국내 성인 이용자" });
  const [items, setItems] = useState<SurveyItem[]>(saved?.items || []);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");
  const [analysis, setAnalysis] = useState<ExcelAnalysisResult | null>(null);
  const [typeFocus, setTypeFocus] = useState<ContentTypeId>("attitude");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSurveyProtocol().then(setProtocol).catch((e) => setLog(String(e)));
  }, []);

  useEffect(() => {
    setCa(pid, { "survey-writing": { form, items, tab } });
  }, [form, items, tab, pid, setCa]);

  const coded = useMemo(
    () => (protocol && items.length ? convertItemsToScaleCoding(items, protocol) : []),
    [protocol, items],
  );

  const runAi = async () => {
    if (!protocol) return;
    if (!form.topic.trim()) { setLog("설문 주제를 입력하세요."); return; }
    setBusy(true);
    setLog("생성 중…");
    const r = await generateSurveyItemsAi(form, protocol, settings);
    setItems(r.items);
    setLog(`${r.log} (source=${r.source})`);
    setBusy(false);
    setTab("scale");
  };

  const onExcel = async (file: File) => {
    if (!protocol) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" }) as string[][];
    const rows = rowsFromMatrix(matrix);
    const result = analyzeSurveyRows(rows, protocol);
    setAnalysis(result);
    if (result.inferredItems.length) setItems(result.inferredItems);
    setLog(`엑셀 분석: ${result.total}문항 · 오류 ${result.summary.error} · 경고 ${result.summary.warn}`);
    setTab("excel");
  };

  const openSsStats = () => {
    const p = createProject(SS_STATS_LINK_METHOD_ID, "사회과학 통계분석", `${title} → 통계분석`);
    nav("project/" + p.id);
  };

  if (!protocol) {
    return <p className="text-ink-3 p-4">설문조사 문항 표준프로토콜을 불러오는 중… {log}</p>;
  }

  return (
    <div className="text-[14px] leading-relaxed">
      <button type="button" className="btn btn-sm mb-2.5" onClick={() => nav("methods")}>← 방법</button>
      <h1 className="text-[22px] font-semibold">{title}</h1>
      <p className="text-[13px] text-ink-2 mb-3">
        설문조사 작성(Survey Question Writing) · 표준프로토콜 기반 문항 설계·AI 생성·엑셀 검수·척도 코딩 ·{" "}
        <button type="button" className="underline text-[13px]" onClick={openSsStats}>사회과학 통계분석 연동 →</button>
      </p>

      <div className="flex flex-wrap gap-1 mb-4">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`btn btn-sm ${tab === t.id ? "btn-primary" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="text-base font-semibold mb-2">개요</h2>
            <p className="text-[13px] text-ink-2 mb-3">{protocol.purpose}</p>
            <table className="tbl text-[12px]">
              <tbody>
                
                <tr><th>절차</th><td>{protocol.stages.length}단계</td></tr>
                <tr><th>내용 유형</th><td>{protocol.contentTypes.map((c) => c.ko).join(" · ")}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="card">
            <h2 className="text-base font-semibold mb-2">전체 프로세스</h2>
            <ol className="list-decimal pl-5 text-[13px] space-y-1">
              {protocol.stages.map((s) => (
                <li key={s.id}><strong>{s.name}</strong> — {s.goal}</li>
              ))}
            </ol>
            <button type="button" className="btn btn-primary mt-3" onClick={() => setTab("ai")}>AI 문항 생성으로 시작 →</button>
          </div>
        </div>
      )}

      {tab === "types" && (
        <div>
          <div className="flex flex-wrap gap-1 mb-3">
            {TYPE_ORDER.map((id) => (
              <button key={id} type="button" className={`btn btn-sm ${typeFocus === id ? "btn-primary" : ""}`} onClick={() => setTypeFocus(id)}>
                {CONTENT_TYPE_LABEL[id]}
              </button>
            ))}
          </div>
          {(() => {
            const ex = protocol.examples[typeFocus];
            if (!ex) return <p>예시 없음</p>;
            return (
              <div className="card">
                <h2 className="text-base font-semibold mb-2">{ex.title}</h2>
                <div className="mb-2">
                  <div className="text-[11px] font-semibold text-ink-3">작성 지침</div>
                  <ul className="list-disc pl-5 text-[13px]">{ex.guidelines.map((g) => <li key={g}>{g}</li>)}</ul>
                </div>
                <div className="grid md:grid-cols-2 gap-2 mb-3 text-[12.5px]">
                  <div className="rounded p-2 bg-red-50 text-red-900"><strong>오류 패턴</strong><br />{ex.bad}</div>
                  <div className="rounded p-2 bg-emerald-50 text-emerald-900"><strong>표준 패턴</strong><br />{ex.good}</div>
                </div>
                <table className="tbl text-[12px] w-full">
                  <thead><tr><th>코드</th><th>완성 문항</th><th>응답척도</th><th>척도유형</th><th>비고</th></tr></thead>
                  <tbody>
                    {ex.items.map((it) => (
                      <tr key={it.code}>
                        <td>{it.code}</td><td>{it.stem}</td><td>{it.scale}</td>
                        <td>{SCALE_LABEL[it.scaleType as keyof typeof SCALE_LABEL]?.ko || it.scaleType}</td>
                        <td>{it.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
          <div className="card mt-4">
            <h2 className="text-base font-semibold mb-2">전체 문항 예시 ({protocol.fullQuestionnaireExample.count}문항) — {protocol.fullQuestionnaireExample.topic}</h2>
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="tbl text-[11.5px] w-full min-w-[720px]">
                <thead><tr><th>No</th><th>유형</th><th>문항</th><th>척도</th><th>척도유형</th></tr></thead>
                <tbody>
                  {protocol.fullQuestionnaireExample.items.map((it) => (
                    <tr key={it.code}>
                      <td>{it.no}</td>
                      <td className="whitespace-nowrap">{CONTENT_TYPE_LABEL[it.type] || it.type}</td>
                      <td>{it.stem}</td>
                      <td>{it.responseScale}</td>
                      <td>{SCALE_LABEL[it.scaleType as keyof typeof SCALE_LABEL]?.ko || it.scaleType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn btn-sm mt-2"
              onClick={() => {
                setItems(protocol.fullQuestionnaireExample.items);
                setLog("전체 문항 예시를 작업 세트로 불러왔습니다.");
                setTab("scale");
              }}
            >
              이 예시 세트를 작업 문항으로 불러오기
            </button>
          </div>
        </div>
      )}

      {tab === "protocol" && (
        <div className="space-y-4">
          {[
            ["modeDimensions", "조사방식 핵심 차원 (출처 표준 프로토콜)"],
            ["modeAbbreviations", "조사방식 약어 (CAPI·ACASI·CATI·IVR 등)"],
            ["surveyTypeCatalog", "설문유형 총목록"],
            ["typeWriteProtocols", "유형별 문항작성 프로토콜"],
            ["unimodePrinciples", "혼합모드 유니모드 설계"],
            ["webEmailIvrPrinciples", "웹·이메일·IVR 세부 원칙"],
            ["contentProtocols", "내용 유형별 작성 프로토콜"],
            ["errorPatterns", "표준·오류 패턴 (Before→After)"],
            ["responseScaleCriteria", "응답 척도 설계 기준"],
            ["evaluationMethods", "문항 평가(사전검증) 방법"],
            ["cognitiveModel", "인지응답과정 모델·오류 유형"],
            ["structureTypes", "문항 구조 유형"],
            ["sensitiveTechniques", "민감질문 기법"],
            ["selfAdminPrinciples", "자기기입식 설계 원칙"],
          ].map(([key, title]) => {
            const sheet = protocol.sheets[key];
            if (!sheet) return null;
            return (
              <div key={key} className="card">
                <h2 className="text-base font-semibold mb-2">{title}</h2>
                <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                  <table className="tbl text-[11px] w-full min-w-[640px]">
                    <thead>
                      <tr>{sheet.headers.map((h) => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {sheet.rows.map((r, i) => (
                        <tr key={i}>{sheet.headers.map((h) => <td key={h}>{r[h]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "ai" && (
        <div className="card">
          <h2 className="text-base font-semibold mb-2">AI 설문문항 작성 — 다음1·다음2 적용</h2>
          <div className="rounded-md p-3 mb-3 text-[12.5px] leading-relaxed" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
            <strong>다음1</strong> 11단계 절차(개념정의→유형분류→구조→초안→척도→오류점검→민감/자기기입→사전검증→AI/엑셀→코딩→통계연동)과
            <strong> 다음2</strong> 표준 프로토콜(조사방식 4차원·유형 총목록·유형별 작성·유니모드 6.x·웹/이메일/IVR 11.x·오류패턴)을 AI 생성 프롬프트에 반영합니다.
            조사방식(Mode)을 정확히 고르면 해당 프로토콜 시사점이 문항 문장에 반영됩니다.
          </div>
          {protocol?.stages?.length ? (
            <details className="mb-3 rounded-md border p-2.5 text-[12px]" style={{ borderColor: "var(--color-border-tertiary)" }}>
              <summary className="cursor-pointer font-medium">다음1 · 11단계 한눈에 보기</summary>
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-ink-2">
                {protocol.stages.map((s) => (
                  <li key={s.id || s.order}><strong>{s.name}</strong> — {s.goal}</li>
                ))}
              </ol>
            </details>
          ) : null}
          <p className="text-[12.5px] text-ink-2 mb-3">
            표준프로토콜 기준으로 유형별 문항을 생성합니다. 최소 <strong>30문항 이상</strong>. AI 키가 없으면 규칙 기반 생성으로 폴백합니다.
          </p>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            {([
              ["topic", "설문 주제 *", "예: 원격근무 만족도"],
              ["researchQuestion", "연구질문 *", "예: 이용은 만족도와 관련이 있는가?"],
              ["population", "대상 모집단 *", "예: 국내 성인 이용자"],
              ["mode", "조사 방식", "자기기입식 웹 / 면접원 / 혼합"],
              ["language", "문항 언어 수준", "일반 성인 / 청소년 / 전문가"],
              ["notes", "추가 제약·필수 측정개념", "반드시 포함할 개념 등"],
            ] as const).map(([id, label, ph]) => (
              <label key={id} className="block text-[12px]">
                <span className="font-medium">{label}</span>
                <input
                  className="inp w-full mt-0.5"
                  placeholder={ph}
                  value={form[id]}
                  onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                />
              </label>
            ))}
            <label className="block text-[12px]">
              <span className="font-medium">최소 문항 수 *</span>
              <input className="inp w-full mt-0.5" type="number" min={30} value={form.minItems}
                onChange={(e) => setForm({ ...form, minItems: Math.max(30, Number(e.target.value) || 30) })} />
            </label>
            <label className="block text-[12px]">
              <span className="font-medium">Likert 점수 수</span>
              <select className="inp w-full mt-0.5" value={form.likertPoints}
                onChange={(e) => setForm({ ...form, likertPoints: Number(e.target.value) })}>
                <option value={5}>5점</option>
                <option value={7}>7점</option>
              </select>
            </label>
          </div>
          <div className="mb-3">
            <div className="text-[12px] font-medium mb-1">포함할 내용 유형 (유형별 생성) *</div>
            <div className="flex flex-wrap gap-2">
              {TYPE_ORDER.concat(["nonsensitive_behavior", "sensitive_behavior"] as ContentTypeId[]).map((id) => {
                const on = form.types.includes(id);
                return (
                  <label key={id} className={`btn btn-sm cursor-pointer ${on ? "btn-primary" : ""}`}>
                    <input
                      type="checkbox"
                      className="mr-1"
                      checked={on}
                      onChange={() => {
                        setForm({
                          ...form,
                          types: on ? form.types.filter((t) => t !== id) : [...form.types, id],
                        });
                      }}
                    />
                    {CONTENT_TYPE_LABEL[id]}
                  </label>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-[12px] mb-3">
            <input type="checkbox" checked={form.includeSensitive}
              onChange={(e) => setForm({ ...form, includeSensitive: e.target.checked })} />
            민감 행동질문 포함 (로딩·장문화 등 기법 적용)
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={runAi}>
              {busy ? "생성 중…" : "프로토콜 기준 AI 문항 생성 (30+)"}
            </button>
            <button type="button" className="btn btn-sm" onClick={() => downloadText("survey-items.csv", itemsToCsv(items))} disabled={!items.length}>
              문항 CSV 다운로드
            </button>
          </div>
          {log && <p className="text-[12px] mt-2 text-ink-3">{log}</p>}
          {items.length > 0 && (
            <div className="mt-4 overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="tbl text-[11.5px] w-full min-w-[700px]">
                <thead><tr><th>코드</th><th>유형</th><th>문항</th><th>응답척도</th><th>척도</th></tr></thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.code + it.no}>
                      <td>{it.code}</td>
                      <td>{CONTENT_TYPE_LABEL[it.type] || it.type}</td>
                      <td>{it.stem}</td>
                      <td>{it.responseScale}</td>
                      <td>{SCALE_LABEL[it.scaleType as keyof typeof SCALE_LABEL]?.ko || it.scaleType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "excel" && (
        <div className="card">
          <h2 className="text-base font-semibold mb-2">기존 설문문항 엑셀 불러오기 · 수정 분석</h2>
          <p className="text-[12.5px] text-ink-2 mb-3">
            열 예: 코드/문항/응답척도/유형. 표준·오류 패턴, 척도 기준, 인지과정 오류를 복합 점검합니다.
          </p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void onExcel(f); e.target.value = ""; }} />
          <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()}>엑셀 파일 불러오기</button>
          {analysis && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-3 text-[13px] mb-3">
                <span>문항 {analysis.total}</span>
                <span className="text-red-700">오류 {analysis.summary.error}</span>
                <span className="text-amber-700">경고 {analysis.summary.warn}</span>
                <span className="text-ink-3">안내 {analysis.summary.info}</span>
              </div>
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="tbl text-[11.5px] w-full min-w-[760px]">
                  <thead><tr><th>행</th><th>심각도</th><th>규칙</th><th>문항</th><th>문제</th><th>수정 제안</th><th>인지단계</th></tr></thead>
                  <tbody>
                    {analysis.issues.map((iss, i) => (
                      <tr key={i} className={iss.severity === "error" ? "bg-red-50" : iss.severity === "warn" ? "bg-amber-50" : ""}>
                        <td>{iss.row || "-"}</td>
                        <td>{iss.severity}</td>
                        <td>{iss.rule}</td>
                        <td className="max-w-[220px]">{iss.stem}</td>
                        <td>{iss.problem}</td>
                        <td>{iss.suggestion}</td>
                        <td>{iss.cognitiveStage || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "scale" && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-semibold mb-2">척도 유형 → 코딩 변환</h2>
            <div className="overflow-x-auto mb-3">
              <table className="tbl text-[12px] w-full">
                <thead><tr><th>척도 유형</th><th>영어</th><th>특징</th><th>가능한 통계</th></tr></thead>
                <tbody>
                  {protocol.measurementScales.map((s) => (
                    <tr key={s.id}>
                      <td>{s.ko}</td><td>{s.en}</td><td>{s.features}</td><td>{s.stats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!coded.length ? (
              <p className="text-ink-3 text-[13px]">먼저 AI 생성 또는 엑셀/예시로 문항을 불러오세요.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button type="button" className="btn btn-sm" onClick={() => downloadText("survey-coding.csv", itemsToCodingTable(items))}>
                    코딩표 CSV 다운로드
                  </button>
                  <button type="button" className="btn btn-sm btn-primary" onClick={openSsStats}>
                    사회과학 통계분석 프로젝트로 연동
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="tbl text-[11px] w-full min-w-[800px]">
                    <thead>
                      <tr>
                        <th>변수</th><th>문항</th><th>척도(한/영)</th><th>코딩</th><th>가능통계</th>
                        <th>기초통계</th><th>가정검토</th><th>추론통계</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coded.map((it) => {
                        const desc = it.ssLinks.filter((l) => l.phase === "descriptive").map((l) => l.name).join(", ") || "-";
                        const diag = it.ssLinks.filter((l) => l.phase === "diagnostic").map((l) => l.name).join(", ") || "-";
                        const inf = it.ssLinks.filter((l) => l.phase === "inferential").map((l) => l.name).join(", ") || "-";
                        return (
                          <tr key={it.code + it.no}>
                            <td>{it.code}</td>
                            <td className="max-w-[240px]">{it.stem}</td>
                            <td>{it.scaleKo}<br /><span className="text-ink-3">{it.scaleEn}</span></td>
                            <td>{it.codingMap}</td>
                            <td>{it.stats}</td>
                            <td>{desc}</td>
                            <td>{diag}</td>
                            <td>{inf}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
          <div className="card">
            <h2 className="text-base font-semibold mb-2">사회과학 통계분석 하위 연동 맵</h2>
            <div className="grid md:grid-cols-3 gap-3 text-[12.5px]">
              {[
                { id: "descriptive", title: "기초통계 (Descriptive)" },
                { id: "diagnostic", title: "가정검토 (Diagnostic)" },
                { id: "inferential", title: "추론통계 (Inferential)" },
              ].map((ph) => (
                <div key={ph.id} className="rounded border p-2.5" style={{ borderColor: "var(--color-border-tertiary)" }}>
                  <div className="font-semibold mb-1">{ph.title}</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {protocol.measurementScales.flatMap((s) =>
                      s.ssLinks.filter((l) => l.phase === ph.id).map((l) => (
                        <li key={s.id + l.techId}>{s.ko} → {l.name}</li>
                      )),
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "steps" && (
        <div className="space-y-3">
          {protocol.stages.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-center gap-2 mb-1">
                <span className="grid place-items-center rounded-full text-white text-[12px] font-bold" style={{ width: 26, height: 26, background: "var(--brand)" }}>{s.order}</span>
                <h3 className="font-semibold">{s.name}</h3>
              </div>
              <p className="text-[13px] text-ink-2 mb-2">{s.goal}</p>
              <div className="text-[12px] grid sm:grid-cols-2 gap-2">
                <div><span className="text-ink-3">입력 · </span>{s.inputs.join(", ")}</div>
                <div><span className="text-ink-3">출력 · </span>{s.outputs.join(", ")}</div>
              </div>
              {s.order === 9 && (
                <div className="mt-2 flex gap-2">
                  <button type="button" className="btn btn-sm" onClick={() => setTab("ai")}>AI 생성</button>
                  <button type="button" className="btn btn-sm" onClick={() => setTab("excel")}>엑셀 검수</button>
                </div>
              )}
              {s.order === 10 && <button type="button" className="btn btn-sm mt-2" onClick={() => setTab("scale")}>척도 변환</button>}
              {s.order === 11 && <button type="button" className="btn btn-sm btn-primary mt-2" onClick={openSsStats}>통계분석 열기</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { SURVEY_WRITING_METHOD_ID };
