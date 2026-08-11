"use client";

import Badge from "@/components/ui/Badge";
import type { Dataset } from "@/lib/stats-goal";

/** 좌 · 변수 목록. 끌어다 놓거나 눌러서 가로축에 바로 넣을 수 있다. */
export default function VariableRail({
  ds,
  used,
  onQuickAssign,
}: {
  ds: Dataset;
  used: string[];
  onQuickAssign: (name: string) => void;
}) {
  return (
    <div>
      <p className="ty-small mb-3 text-ink-2">
        변수를 오른쪽 자리로 끌어다 놓거나, 눌러서 비어 있는 축에 넣으세요.
      </p>
      <ul className="space-y-1.5">
        {ds.variables.map((v) => {
          const on = used.includes(v.name);
          return (
            <li key={v.name}>
              <button
                type="button"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", v.name)}
                onClick={() => onQuickAssign(v.name)}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left"
                style={{
                  border: `1px solid ${on ? "var(--brand)" : "var(--color-border-tertiary)"}`,
                  background: on ? "var(--brand-soft)" : "transparent",
                  cursor: "grab",
                }}
              >
                <span className="ty-label min-w-0 flex-1 truncate font-bold">{v.name}</span>
                <Badge tone={v.type === "num" ? "quant" : "qual"} mark={v.type === "num" ? "#" : "◇"}>
                  {v.type === "num" ? "숫자" : `범주 ${v.levels.length}`}
                </Badge>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
