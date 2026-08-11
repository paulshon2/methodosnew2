"use client";

import { Lock } from "lucide-react";
import { GOALS, goalFeasible, type Dataset, type GoalId } from "@/lib/stats-goal";

/**
 * 1단계 — "무엇을 알고 싶은가".
 * 검정 이름을 여기서 말하지 않는다. 이름은 결과에서 밝힌다.
 */
export default function GoalPicker({
  ds,
  value,
  onChange,
}: {
  ds: Dataset;
  value: GoalId | null;
  onChange: (g: GoalId) => void;
}) {
  return (
    <div>
      <p className="ty-body mb-3 text-ink-2 prose-w">
        알고 싶은 것을 고르면 그에 맞는 분석이 자동으로 정해집니다. 검정 이름을 몰라도 됩니다.
        자료로는 할 수 없는 항목은 잠기고, 왜 잠겼는지 함께 알려 드립니다.
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {GOALS.map((g) => {
          const fit = goalFeasible(ds, g.id);
          const on = value === g.id;
          return (
            <button
              key={g.id}
              type="button"
              disabled={!fit.ok}
              aria-pressed={on}
              onClick={() => onChange(g.id)}
              className="rounded-2xl p-3.5 text-left disabled:cursor-not-allowed"
              style={{
                border: `1px solid ${on ? "var(--brand)" : "var(--color-border-tertiary)"}`,
                background: on ? "var(--brand-soft)" : "var(--color-background-secondary)",
                opacity: fit.ok ? 1 : 0.62,
              }}
            >
              <div className="flex items-start gap-2">
                <span className="ty-subhead min-w-0 flex-1">{g.label}</span>
                {!fit.ok && <Lock size={14} aria-hidden="true" className="mt-1 shrink-0 text-ink-3" />}
              </div>
              <p className="ty-small mt-1 text-ink-2">{g.sub}</p>
              <p className="ty-label mt-1.5 text-ink-3">{fit.ok ? g.example : fit.reason}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
