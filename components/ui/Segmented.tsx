"use client";

import { cn } from "@/lib/cn";

/** 세그먼트 컨트롤 — 서로 배타적인 두세 개의 모드에만 쓴다. */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { id: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn("inline-flex gap-0.5 rounded-full p-0.5", className)}
      role="group"
      aria-label={label}
      style={{ background: "var(--color-background-tertiary)", border: "1px solid var(--color-border-tertiary)" }}
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.id)}
            title={o.hint}
            className="rounded-full px-3 py-1.5"
            style={{
              background: on ? "var(--color-background-primary)" : "transparent",
              color: on ? "var(--brand-ink)" : "var(--color-text-secondary)",
              fontSize: "var(--fs-label)",
              fontWeight: 700,
              minHeight: 34,
              boxShadow: on ? "var(--shadow)" : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
