"use client";

import {
  BarChart3,
  BarChartHorizontal,
  Box as BoxIcon,
  Circle,
  CircleDashed,
  LineChart,
  ScatterChart,
  SquareStack,
  TrendingUp,
} from "lucide-react";
import { CHARTS, chartEnabled, type ChartId } from "@/lib/viz-spec";
import type { Variable } from "@/lib/stats-goal";

const ICON: Partial<Record<ChartId, typeof BarChart3>> = {
  bar: BarChart3,
  hbar: BarChartHorizontal,
  groupedbar: BarChart3,
  stackedbar: SquareStack,
  lollipop: Circle,
  waterfall: BarChart3,
  line: LineChart,
  area: LineChart,
  step: LineChart,
  slope: TrendingUp,
  scatter: ScatterChart,
  bubble: Circle,
  strip: ScatterChart,
  hist: SquareStack,
  density: SquareStack,
  box: BoxIcon,
  violin: BoxIcon,
  donut: CircleDashed,
  pie: CircleDashed,
  heatmap: SquareStack,
};

/** 그릴 수 없는 유형은 잠그고, 그릴 수 있는 유형에는 초록 점을 찍는다. */
export default function ChartTypeBar({
  value,
  x,
  y,
  recommended,
  onChange,
}: {
  value: ChartId;
  x: Variable | null;
  y: Variable | null;
  recommended: ChartId | null;
  onChange: (id: ChartId) => void;
}) {
  return (
    <div>
      <div role="radiogroup" aria-label="그래프 유형" className="viz-chart-type-bar flex flex-wrap gap-1.5">
        {CHARTS.map((c) => {
          const { ok, reason } = chartEnabled(c.id, x, y);
          const on = value === c.id;
          const Icon = ICON[c.id] || BarChart3;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-disabled={!ok}
              disabled={!ok}
              title={ok ? c.why : reason}
              onClick={() => onChange(c.id)}
              className="viz-chart-type-btn relative rounded-lg px-2.5 py-2 text-left disabled:cursor-not-allowed"
              style={{
                border: `1px solid ${on ? "var(--brand)" : "var(--color-border-secondary)"}`,
                background: on ? "var(--brand-soft)" : "var(--color-background-secondary)",
                opacity: ok ? 1 : 0.45,
                minWidth: 96,
              }}
            >
              <span className="flex items-center gap-1.5">
                <Icon size={14} aria-hidden="true" className="shrink-0" />
                <span className="viz-chart-type-btn__label font-bold">{c.label}</span>
              </span>
              {recommended === c.id && ok ? (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--ok)" }}
                />
              ) : null}
              <span className="sr-only">
                {recommended === c.id ? " (이 자료에 권하는 유형)" : ""}
                {ok ? "" : ` 사용할 수 없음: ${reason}`}
              </span>
            </button>
          );
        })}
      </div>
      <p className="ty-label mt-2 text-ink-3">유형 {CHARTS.length}종 · 자료에 맞지 않으면 잠깁니다</p>
      {recommended && recommended !== value ? (
        <p className="ty-label mt-1 text-ink-2">
          이 자료에는 <strong>{CHARTS.find((c) => c.id === recommended)?.label}</strong>가 더 나은 선택입니다 — 초록 점이
          찍힌 유형입니다.
        </p>
      ) : null}
    </div>
  );
}
