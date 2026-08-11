"use client";

import { AlertTriangle } from "lucide-react";
import type { Issue } from "@/lib/survey-quality";
import { QTYPE_BY_ID, type Survey } from "@/lib/survey-types";

/** 좌 · 목차. 끌어서 순서를 바꾸고, 문제가 있는 문항에는 ▲를 붙인다. */
export default function QuestionOutline({
  survey,
  selected,
  issues,
  onSelect,
  onMove,
}: {
  survey: Survey;
  selected: string | null;
  issues: Issue[];
  onSelect: (id: string) => void;
  onMove: (from: number, to: number) => void;
}) {
  if (!survey.questions.length) {
    return <p className="ty-small text-ink-3">문항을 추가하면 목차가 생깁니다.</p>;
  }
  return (
    <ol className="space-y-1">
      {survey.questions.map((q, i) => {
        const mine = issues.filter((x) => x.q === q.id);
        const risky = mine.some((x) => x.level === "risk");
        return (
          <li
            key={q.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const from = Number(e.dataTransfer.getData("text/plain"));
              if (Number.isInteger(from)) onMove(from, i);
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(q.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left"
              style={{
                background: selected === q.id ? "var(--brand-soft)" : "transparent",
                border: `1px solid ${selected === q.id ? "var(--brand)" : "transparent"}`,
                cursor: "grab",
              }}
            >
              <span className="ty-label num shrink-0 text-ink-3">{i + 1}</span>
              <span className="ty-label min-w-0 flex-1 truncate">
                {q.text || <span className="text-ink-3">(빈 문항)</span>}
              </span>
              {mine.length > 0 && (
                <AlertTriangle
                  size={13}
                  aria-hidden="true"
                  style={{ color: risky ? "var(--danger)" : "var(--warn)" }}
                />
              )}
              <span className="sr-only">
                {QTYPE_BY_ID[q.type].label}
                {mine.length ? ` · 점검 ${mine.length}건` : ""}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
