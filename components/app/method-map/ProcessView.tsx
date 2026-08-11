"use client";

import { Map as MapIcon } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import Note from "@/components/ui/Note";
import DataTable from "@/components/ui/DataTable";
import type { Method } from "@/lib/method-map-catalog";
import type { Section, SourceStep } from "@/lib/method-system-normalize";
import SectionTables from "./SectionTables";

/** ④ 방법별 프로세스 — 단계 카드 + 문서로 남겨야 할 항목 체크리스트. */
export default function ProcessView({
  method,
  sourceSteps,
  auxSections,
  onGoMap,
}: {
  method: Method | null;
  sourceSteps: SourceStep[];
  auxSections: Section[];
  onGoMap: () => void;
}) {
  if (!method) {
    return (
      <EmptyState
        icon={<MapIcon size={30} />}
        title="먼저 방법을 하나 고르세요"
        action={
          <button type="button" className="btn btn-primary" onClick={onGoMap}>
            지도로 이동
          </button>
        }
      >
        지도·계보 화면에서 방법 칩을 누르면 그 방법의 수행 절차가 여기에 나옵니다.
      </EmptyState>
    );
  }

  return (
    <div>
      <h3 className="ty-section mb-1">{method.name} 수행 절차</h3>
      <p className="ty-small mb-4 text-ink-2 prose-w">
        각 단계마다 <strong>문서로 남겨야 할 항목</strong>을 함께 적었습니다. 논문 방법 절은 이 기록을 옮겨 적는 일에 가깝습니다.
      </p>

      <ol className="flex flex-col gap-3">
        {method.process.map((s, i) => (
          <li key={s.title} className="card">
            <div className="flex items-start gap-3">
              <span className="g-fill grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-white">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <h4 className="ty-subhead">{s.title}</h4>
                {s.desc ? <p className="ty-small mt-1 text-ink-2 prose-w">{s.desc}</p> : null}
                {s.checks.length > 0 && (
                  <>
                    <div className="ty-label mt-2.5 uppercase text-ink-3">문서로 남겨야 할 항목</div>
                    <ul className="mt-1 flex flex-col gap-1">
                      {s.checks.map((c) => (
                        <li key={c} className="ty-small flex gap-2 text-ink-2">
                          <span aria-hidden="true" style={{ color: "var(--ok)" }}>✓</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4">
        <Note level="warn" title="이 방법에서 가장 자주 무너지는 지점" fix={`설계 단계에서 ${method.risks[0]}에 대한 대응을 먼저 문서로 정해 두세요. 자료를 모은 뒤에는 되돌릴 수 없습니다.`}>
          {method.risks.join(" · ")}
        </Note>
      </div>

      {sourceSteps.length > 0 && (
        <>
          <h4 className="ty-section mb-2 mt-6">원본 절차표</h4>
          <p className="ty-small mb-2 text-ink-2">method-system.json 의 ⑩ 방법별 프로세스 섹션에서 이 방법에 해당하는 행입니다.</p>
          <div className="card">
            <DataTable
              columns={["단계", "No.", "역할 / 작업", "설명", "근거"]}
              rows={sourceSteps.map((s) => [s.phase, s.no, s.role, s.desc, s.src])}
              numeric={[1]}
              maxHeight={360}
            />
          </div>
        </>
      )}

      <h4 className="ty-section mb-2 mt-6">보조 자료 — 자료수집·자료분석 방법</h4>
      <SectionTables sections={auxSections} />
    </div>
  );
}
