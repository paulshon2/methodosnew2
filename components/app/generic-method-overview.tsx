"use client";
import { useEffect, useState } from "react";
import type { CaStageView } from "@/lib/content-analysis-spec";
import { loadMethodOverview, type MethodOverviewBundle } from "@/lib/method-catalog";
import Figure from "./figure";
import { Gloss } from "./gloss";
import { MethodProcessMap } from "./method-process-map";

function StageCard({ s }: { s: CaStageView }) {
  const roles = Array.isArray(s.stepRole) ? s.stepRole : [];
  const table = s.table && Array.isArray(s.table.columns) && Array.isArray(s.table.rows)
    ? s.table
    : { columns: ["항목", "내용"], rows: [["단계", s.title || ""], ["불러오기", (s.inFunction || "").replace(/^넣는 것 · /, "")], ["내보내기", (s.outFunction || "").replace(/^나오는 것 · /, "")]] };
  const figure = s.figure && typeof s.figure === "object"
    ? s.figure
    : { type: "flow" as const, inputs: ["선행 자료·메모"], outputs: ["단계 산출물"], step: s.title || "단계" };
  const more = Array.isArray(s.moreExamples) ? s.moreExamples : [];
  return (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="grid place-items-center rounded-full text-white text-[13px] font-bold shrink-0" style={{ width: 28, height: 28, background: "var(--brand)" }}>{s.uiStage}</span>
        <h3 className="text-[16px] font-semibold flex-1"><Gloss text={(s.title || "").replace(/^\d+단계\s*[·\-—]?\s*/, "").trim()} /></h3>
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
      <div className="rounded-lg p-4" style={{ background: "var(--color-background-secondary)" }}>
        <div className="text-[12px] font-semibold mb-2" style={{ color: "var(--brand-ink)" }}>📋 실제 예시 (글 · 표 · 그림)</div>
        <Gloss className="text-[14px] leading-relaxed mb-3 block" text={s.exampleText || ""} />
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-3.5 items-start">
          <div>
            <table className="tbl rounded-md overflow-hidden text-[13px]" style={{ background: "var(--color-background-primary)" }}>
              <thead><tr>{table.columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
              <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((cc, j) => <td key={j}>{cc}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className="rounded-md p-2" style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)" }}>
            <Figure fig={figure} />
          </div>
        </div>
        {more.map((ex, i) => (
          <div key={i} className="mt-3.5 pt-3.5" style={{ borderTop: "0.5px dashed var(--color-border-tertiary)" }}>
            <div className="text-[11px] font-semibold mb-1">{ex.label}</div>
            <Gloss className="text-[13.5px] leading-relaxed block" text={ex.text} />
          </div>
        ))}
      </div>
      {s.beginnerTip && String(s.beginnerTip).trim() && <p className="text-[12.5px] text-ink-3 mt-2">💡 {s.beginnerTip}</p>}
    </div>
  );
}

export default function GenericMethodOverview({
  perfSlug,
  title,
  orientation,
}: {
  perfSlug: string;
  title?: string;
  /** 마케팅리서치 등: 개요·프로세스를 오리엔테이션(OT)으로 표기 */
  orientation?: boolean;
}) {
  const [bundle, setBundle] = useState<MethodOverviewBundle | null>(null);
  useEffect(() => { loadMethodOverview(perfSlug).then(setBundle); }, [perfSlug]);
  if (!bundle) return <p className="text-ink-3">개요를 불러오는 중…</p>;
  const n = (bundle.stageViews || []).length || bundle.stageCount || 6;
  const heading = orientation
    ? `${title || "연구방법"} 오리엔테이션(OT)`
    : `${title || "전체 프로세스"} — ${n}단계 한눈에 보기`;
  return (
    <div className="mt-6">
      {orientation && (
        <div className="rounded-md px-3 py-2 mb-3 text-[12px] font-semibold" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
          오리엔테이션 · 개요 / 전체 프로세스({n}단계) / {n}단계 한눈에 보기
        </div>
      )}
      <h2 className="text-[19px] font-semibold mb-1">{heading}</h2>
      {bundle.flow && (
        <p className="text-[14px] text-ink-2 mb-4">
          <Gloss text={bundle.flow} />
        </p>
      )}
      <MethodProcessMap views={bundle.stageViews || []} />
      <div className="mt-6">
        <h2 className="text-[19px] font-semibold mb-1">단계별 쉬운 설명과 예시</h2>
        <p className="text-[14px] text-ink-2 mb-4">
          각 단계의 역할·불러오기/내보내기·예시(글·표)를 미리 확인한 뒤, 프로젝트 하위 항목(Stage→Process→Task)에서 같은 이름으로 진행하세요.
        </p>
        <div className="flex flex-col gap-4">
          {(bundle.stageViews || []).map((s, i) => (
            <StageCard key={s.registryStageId || `s-${i}`} s={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
