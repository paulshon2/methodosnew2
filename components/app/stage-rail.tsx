"use client";

export type RailStage = {
  id: string;
  label: string;
  status: "done" | "current" | "todo" | "locked";
  reason?: string;
};

export default function StageRail({
  stages,
  onSelect,
}: {
  stages: RailStage[];
  onSelect?: (id: string) => void;
}) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label="연구 단계">
      {stages.map((s, i) => {
        const clickable = s.status !== "locked" && !!onSelect;
        const style =
          s.status === "done"
            ? { background: "var(--ok-wash)", color: "var(--ok)", borderColor: "var(--ok)" }
            : s.status === "current"
              ? { background: "var(--brand-soft)", color: "var(--brand-ink)", borderColor: "var(--brand)" }
              : s.status === "locked"
                ? { background: "var(--wash)", color: "var(--ink3)", borderColor: "var(--line)", opacity: 0.7 }
                : { background: "var(--paper)", color: "var(--ink2)", borderColor: "var(--line)" };
        return (
          <li key={s.id}>
            <button
              type="button"
              disabled={!clickable}
              title={s.reason || s.label}
              aria-current={s.status === "current" ? "step" : undefined}
              onClick={() => clickable && onSelect?.(s.id)}
              className="inline-flex items-center gap-2 rounded-[10px] px-3 py-2 border text-left"
              style={{ ...style, minHeight: 44, fontSize: "var(--fs-label)", fontWeight: 700 }}
            >
              <span
                aria-hidden="true"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border"
                style={{ borderColor: "currentColor" }}
              >
                {s.status === "done" ? "✓" : i + 1}
              </span>
              <span>{s.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
