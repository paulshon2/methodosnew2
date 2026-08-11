"use client";

import { cn } from "@/lib/cn";

export type Step = { id: string; label: string; sub?: string };

/** 단계 표시 — 활성 번호에만 브랜드 그라디언트를 쓴다. */
export default function Stepper({
  steps,
  current,
  done = [],
  onGo,
  className,
}: {
  steps: Step[];
  current: string;
  done?: string[];
  onGo?: (id: string) => void;
  className?: string;
}) {
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <ol className={cn("flex items-center gap-1 overflow-x-auto py-2", className)}>
      {steps.map((s, i) => {
        const isDone = done.includes(s.id) || i < idx;
        const isNow = s.id === current;
        return (
          <li key={s.id} className="flex items-center gap-1">
            {i > 0 && <span className="h-px w-4 shrink-0" style={{ background: "var(--color-border-tertiary)" }} aria-hidden="true" />}
            <button
              type="button"
              onClick={onGo ? () => onGo(s.id) : undefined}
              aria-current={isNow ? "step" : undefined}
              disabled={!onGo}
              className="flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2"
              style={{
                background: isNow ? "var(--brand-soft)" : "transparent",
                color: isNow ? "var(--brand-ink)" : isDone ? "var(--ok)" : "var(--color-text-tertiary)",
                fontSize: "var(--fs-small)",
                fontWeight: isNow ? 700 : 400,
                cursor: onGo ? "pointer" : "default",
              }}
              title={s.sub}
            >
              <span
                className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-extrabold", isNow && "g-fill")}
                style={{
                  background: isNow ? undefined : isDone ? "var(--ok)" : "var(--color-background-tertiary)",
                  color: isNow || isDone ? "var(--on-accent)" : "var(--color-text-secondary)",
                }}
              >
                {isDone && !isNow ? "✓" : i + 1}
              </span>
              <span>{s.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
