"use client";
// TX-002 개요/전체 프로세스 — 엔진을 언급하지 않는 초보자용 단계 설명(11단계, methodos-f18).
// 역할→단계, 입력/출력→기능, 글·표·그림 예시(자체 제작: 반려동물 신문기사 TX-002 — 원전 예시 미사용).
import { CA_STAGE_VIEWS, CaStageView } from "@/lib/content-analysis-spec";
import Figure from "./figure";
import { Gloss } from "./gloss";

function StageCard({ s }: { s: CaStageView }) {
  const roles = Array.isArray(s.stepRole) ? s.stepRole : [];
  const more = Array.isArray(s.moreExamples) ? s.moreExamples : [];
  const table = s.table && Array.isArray(s.table.columns) && Array.isArray(s.table.rows)
    ? s.table
    : { title: "단계 요약", columns: ["항목", "내용"], rows: [["단계", s.title || ""], ["불러오기", (s.inFunction || "").replace(/^넣는 것 · /, "")], ["내보내기", (s.outFunction || "").replace(/^나오는 것 · /, "")]] };
  const figure = s.figure && typeof s.figure === "object" ? s.figure : { type: "flow" as const, inputs: ["선행 자료"], outputs: ["단계 산출물"], step: s.title || "단계" };
  return (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="grid place-items-center rounded-full text-white text-[13px] font-bold shrink-0" style={{ width: 28, height: 28, background: "var(--brand)" }}>{s.uiStage}</span>
        <h3 className="text-[16px] font-semibold flex-1"><Gloss text={(s.title || "").replace(/^\d+단계\s*[·\-—]?\s*/, "")} /></h3>
      </div>
      <div className="rounded-md p-3 mb-3 text-[14px] leading-relaxed" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
        <strong>한 줄로 · </strong><Gloss text={s.oneLine || ""} />
        <div className="mt-1 text-[13px]">왜 필요한가요? <Gloss text={s.why || ""} /></div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div className="rounded-md p-3 text-[13px]" style={{ background: "var(--color-background-secondary)" }}>
          <div className="font-semibold mb-1">이 단계가 해주는 일</div>
          <ul className="list-disc pl-5 leading-relaxed">{roles.map((r, i) => <li key={i}><Gloss text={r} /></li>)}</ul>
        </div>
        <div className="rounded-md p-3 text-[13px]" style={{ background: "var(--color-background-secondary)" }}>
          <div className="font-semibold mb-1">어떤 데이터를 불러오기하고, 어떤데이터를 내보내기하나요</div>
          <div className="mb-1.5"><span className="px-1.5 py-0.5 rounded text-[11px] mr-1" style={{ background: "var(--color-background-primary)" }}>불러오기</span><Gloss text={(s.inFunction || "").replace(/^넣는 것 · /, "")} /></div>
          <div><span className="px-1.5 py-0.5 rounded text-[11px] mr-1" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>내보내기</span><Gloss text={(s.outFunction || "").replace(/^나오는 것 · /, "")} /></div>
        </div>
      </div>

      {/* 실제 예시: 글·표·그림 (2~3개 이상) */}
      <div className="rounded-lg p-4" style={{ background: "var(--color-background-secondary)" }}>
        <div className="text-[12px] font-semibold mb-2" style={{ color: "var(--brand-ink)" }}>📋 실제 예시 (글 · 표 · 그림) — 예시 1~{1 + more.length}</div>
        <div className="text-[11px] font-semibold mb-1" style={{ color: "var(--brand-ink)" }}>예시 1</div>
        <Gloss className="text-[14px] leading-relaxed mb-3 block" text={s.exampleText || ""} />
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-3.5 items-start">
          <div>
            <div className="text-[12px] font-semibold mb-1.5" style={{ color: "var(--brand-ink)" }}>표 — {table.title || "요약"}</div>
            <table className="tbl rounded-md overflow-hidden text-[13px]" style={{ background: "var(--color-background-primary)" }}>
              <thead><tr>{table.columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
              <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((cc, j) => <td key={j}>{cc}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div>
            <div className="text-[12px] font-semibold mb-1.5" style={{ color: "var(--brand-ink)" }}>그림 — 단계 흐름/결과 도식</div>
            <div className="rounded-md p-2" style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)" }}>
              <Figure fig={figure} />
            </div>
          </div>
        </div>
        {more.map((ex, i) => (
          <div key={i} className="mt-3.5 pt-3.5" style={{ borderTop: "0.5px dashed var(--color-border-tertiary)" }}>
            <div className="text-[11px] font-semibold mb-1" style={{ color: "var(--brand-ink)" }}>{ex.label}</div>
            <Gloss className="text-[13.5px] leading-relaxed mb-2 block" text={ex.text} />
            {ex.table && Array.isArray(ex.table.columns) && Array.isArray(ex.table.rows) && (
              <table className="tbl rounded-md overflow-hidden text-[12.5px]" style={{ background: "var(--color-background-primary)" }}>
                <thead><tr>{ex.table.columns.map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
                <tbody>{ex.table.rows.map((r, j) => <tr key={j}>{r.map((cc, k) => <td key={k}>{cc}</td>)}</tr>)}</tbody>
              </table>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 text-[12.5px] text-ink-3">💡 <Gloss text={s.beginnerTip || ""} /></div>
    </div>
  );
}

// 전체 프로세스 한눈에 보기(엔진 없이 단계·기능만)
export function CaProcessMap() {
  return (
    <div className="card mt-4">
      <h3 className="text-[16px] font-semibold mb-2">전체 {CA_STAGE_VIEWS.length}단계 한눈에 보기</h3>
      <p className="text-[13px] text-ink-2 mb-3">아래 {CA_STAGE_VIEWS.length}단계가 차례로 이어집니다. 각 단계는 ‘무엇을 넣으면 → 무엇이 나오는지’가 분명합니다.</p>
      <table className="tbl text-[13px]">
        <thead><tr><th style={{ width: 32 }}>#</th><th>단계</th><th>불러오기(데이터)</th><th>내보내기(데이터)</th></tr></thead>
        <tbody>
          {CA_STAGE_VIEWS.map((s) => (
            <tr key={s.registryStageId}>
              <td>{s.uiStage}</td>
              <td><strong><Gloss text={s.title.replace(/^\d+단계\s*[·\-—]?\s*/, "")} /></strong></td>
              <td><Gloss text={s.inFunction.replace(/^넣는 것 · /, "")} /></td>
              <td><Gloss text={s.outFunction.replace(/^나오는 것 · /, "")} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 개요 + 전체 프로세스(단계별 카드) — method-detail의 TX-002 전용 본문
export default function CaOverview() {
  return (
    <div>
      <CaProcessMap />
      <div className="mt-6">
        <h2 className="text-[19px] font-semibold mb-1">시작하기 전에 — {CA_STAGE_VIEWS.length}단계를 예시로 미리 보기</h2>
        <p className="text-[14px] text-ink-2 mb-4">처음 1단계부터 마지막 {CA_STAGE_VIEWS.length}단계까지, 각 단계가 무엇이고 실제로 어떤 결과(표·그림·글)가 나오는지 쉬운 예시(반려동물 신문기사 TX-002)로 봅니다. 어려운 전문 도구 이름 없이, 하는 일과 결과만 쉽게 설명합니다.</p>
        <div className="flex flex-col gap-4">
          {CA_STAGE_VIEWS.map((s) => <StageCard key={s.registryStageId} s={s} />)}
        </div>
      </div>
    </div>
  );
}
