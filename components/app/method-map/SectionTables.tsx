"use client";

import DataTable from "@/components/ui/DataTable";
import type { Section } from "@/lib/method-system-normalize";

/**
 * method-system.json 의 원본 표를 그대로 낸다.
 * 큐레이션 화면이 답을 요약해 준다면, 이 표는 근거를 그대로 보여 준다.
 * 두 개를 함께 두는 이유는 연구자가 요약을 검증할 수 있어야 하기 때문이다.
 */
export default function SectionTables({ sections, defaultOpen = false }: { sections: Section[]; defaultOpen?: boolean }) {
  if (sections.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {sections.map((s) => (
        <details key={s.id} className="card" open={defaultOpen}>
          <summary className="ty-subhead cursor-pointer">
            {s.title} <span className="ty-label num text-ink-3">{s.rows.length}행</span>
          </summary>
          {s.subtitle ? <p className="ty-small mt-1 text-ink-2">{s.subtitle}</p> : null}
          <div className="mt-3">
            <DataTable columns={s.columns} rows={s.rows} maxHeight={420} />
          </div>
        </details>
      ))}
    </div>
  );
}
