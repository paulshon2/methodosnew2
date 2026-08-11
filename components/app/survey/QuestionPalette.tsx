"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { examplesByType } from "@/lib/survey-examples";
import { QTYPES, type QType } from "@/lib/survey-types";
import type { SurveyExample } from "@/lib/survey-examples";

/** 좌 · 문항 유형 8종 + 유형별 예제 10개(아코디언). */
export default function QuestionPalette({
  onAdd,
  onAddExample,
}: {
  onAdd: (t: QType) => void;
  onAddExample: (ex: SurveyExample) => void;
}) {
  const [open, setOpen] = useState<QType | null>("single");

  const groups = useMemo(
    () => QTYPES.map((t) => ({ meta: t, examples: examplesByType(t.id) })),
    [],
  );

  return (
    <div>
      <p className="ty-small mb-3 text-ink-2">
        유형을 누르면 빈 문항이 추가됩니다. 예제를 펼쳐 넣으면 바로 미리보기·수정할 수 있습니다.
      </p>
      <ul className="space-y-1.5">
        {groups.map(({ meta: t, examples }) => {
          const isOpen = open === t.id;
          return (
            <li key={t.id} className="rounded-xl" style={{ border: "1px solid var(--color-border-tertiary)" }}>
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => onAdd(t.id)}
                  className="min-w-0 flex-1 p-2.5 text-left"
                  title="빈 문항 추가"
                >
                  <div className="ty-label font-bold">{t.label}</div>
                  <div className="ty-label text-ink-3">{t.useWhen}</div>
                  <div className="ty-label mt-0.5 text-ink-3">{t.scale}</div>
                </button>
                <button
                  type="button"
                  className="shrink-0 px-2"
                  aria-expanded={isOpen}
                  aria-label={`${t.label} 예제 ${isOpen ? "접기" : "펼치기"}`}
                  onClick={() => setOpen(isOpen ? null : t.id)}
                  style={{ borderLeft: "1px solid var(--color-border-tertiary)" }}
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              </div>
              {isOpen ? (
                <ul className="space-y-1 border-t px-2 pb-2 pt-1.5" style={{ borderColor: "var(--color-border-tertiary)" }}>
                  {examples.map((ex) => (
                    <li key={ex.id}>
                      <button
                        type="button"
                        onClick={() => onAddExample(ex)}
                        className="flex w-full items-start gap-1.5 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--color-background-secondary)]"
                      >
                        <Plus size={12} className="mt-0.5 shrink-0 opacity-70" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="ty-label block font-semibold text-ink-1">{ex.title}</span>
                          <span className="ty-label block text-ink-3">{ex.summary}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
