"use client";

import { useMemo } from "react";
import Badge from "@/components/ui/Badge";
import { chartTheme } from "@/lib/design-tokens";
import { describeVec } from "@/lib/stats-core";
import { num, type Dataset, type Variable } from "@/lib/stats-goal";

/** 숫자 변수는 분포를, 범주 변수는 값 종류를 한 줄로 보여 준다. */
function Spark({ values }: { values: number[] }) {
  const t = chartTheme();
  const bars = useMemo(() => {
    if (values.length < 2) return [];
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const k = 16;
    const counts = new Array(k).fill(0);
    values.forEach((v) => {
      const i = hi === lo ? 0 : Math.min(k - 1, Math.floor(((v - lo) / (hi - lo)) * k));
      counts[i]++;
    });
    const max = Math.max(...counts, 1);
    return counts.map((c) => c / max);
  }, [values]);
  if (!bars.length) return null;
  return (
    <svg width="100%" height="20" viewBox="0 0 64 20" preserveAspectRatio="none" aria-hidden="true" style={{ display: "block" }}>
      {bars.map((h, i) => (
        <rect key={i} x={i * 4} y={20 - h * 18} width={3} height={Math.max(1, h * 18)} fill={t.series[0]} opacity={0.75} rx={1} />
      ))}
    </svg>
  );
}

export default function VariableList({
  ds,
  used,
  onPick,
}: {
  ds: Dataset;
  /** 지금 분석에 들어간 변수 이름 */
  used: string[];
  onPick?: (v: Variable) => void;
}) {
  if (!ds.variables.length) {
    return <p className="ty-small text-ink-3">자료를 불러오면 변수 목록이 여기 나옵니다.</p>;
  }
  return (
    <div>
      <p className="ty-small mb-3 text-ink-2">
        행 <strong className="num">{ds.n}</strong>개 · 변수 <strong className="num">{ds.variables.length}</strong>개.
        숫자인지 범주인지는 값의 90% 이상이 숫자인지로 자동 판단했습니다.
      </p>
      <ul className="space-y-2">
        {ds.variables.map((v) => {
          const on = used.includes(v.name);
          const d = v.type === "num" ? describeVec(v.numbers) : null;
          return (
            <li key={v.name}>
              <button
                type="button"
                onClick={() => onPick?.(v)}
                className="w-full rounded-xl p-2.5 text-left"
                style={{
                  border: `1px solid ${on ? "var(--brand)" : "var(--color-border-tertiary)"}`,
                  background: on ? "var(--brand-soft)" : "transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="ty-label min-w-0 flex-1 truncate font-bold">{v.name}</span>
                  <Badge tone={v.type === "num" ? "quant" : "qual"} mark={v.type === "num" ? "#" : "◇"}>
                    {v.type === "num" ? "숫자" : "범주"}
                  </Badge>
                </div>
                {d ? (
                  <>
                    <Spark values={v.numbers} />
                    <div className="ty-label num text-ink-3">
                      M {num(d.mean)} · SD {num(d.sd)} · n {d.n}
                      {v.missing > 0 ? ` · 결측 ${v.missing}` : ""}
                    </div>
                  </>
                ) : (
                  <div className="ty-label text-ink-3">
                    값 {v.levels.length}종 · {v.levels.slice(0, 3).join(", ")}
                    {v.levels.length > 3 ? " …" : ""}
                    {v.missing > 0 ? ` · 결측 ${v.missing}` : ""}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
