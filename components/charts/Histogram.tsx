"use client";

import { useMemo } from "react";
import { chartTheme } from "@/lib/design-tokens";
import { AxisLabels, GridY, PAD } from "./Axes";
import { fmtNum, linear, ticks, useMeasuredWidth } from "./useScales";

/** Freedman–Diaconis 규칙. 표본이 작으면 Sturges로 물러난다. */
export function binCount(values: number[]): number {
  const v = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  const n = v.length;
  if (n < 4) return Math.max(1, n);
  const q = (p: number) => v[Math.min(n - 1, Math.max(0, Math.floor(p * (n - 1))))];
  const iqr = q(0.75) - q(0.25);
  if (iqr <= 0) return Math.ceil(Math.log2(n) + 1);
  const w = (2 * iqr) / Math.cbrt(n);
  const k = Math.ceil((v[n - 1] - v[0]) / (w || 1));
  return Math.min(40, Math.max(5, k));
}

export function histogram(values: number[], bins?: number) {
  const v = values.filter(Number.isFinite);
  if (v.length === 0) return { bins: [] as { lo: number; hi: number; n: number }[], lo: 0, hi: 1 };
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const k = bins || binCount(v);
  const w = (hi - lo) / k || 1;
  const out = Array.from({ length: k }, (_, i) => ({ lo: lo + w * i, hi: lo + w * (i + 1), n: 0 }));
  v.forEach((x) => {
    const i = Math.min(k - 1, Math.max(0, Math.floor((x - lo) / w)));
    out[i].n += 1;
  });
  return { bins: out, lo, hi };
}

export default function Histogram({
  values,
  bins,
  height = 280,
  xLabel,
  yLabel = "빈도",
  title,
}: {
  values: number[];
  bins?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  title?: string;
}) {
  const t = chartTheme();
  const { ref, width } = useMeasuredWidth();

  const view = useMemo(() => {
    const hs = histogram(values, bins);
    const innerW = Math.max(60, width - PAD.left - PAD.right);
    const innerH = Math.max(60, height - PAD.top - PAD.bottom);
    const maxN = Math.max(1, ...hs.bins.map((b) => b.n));
    return {
      hs,
      innerW,
      innerH,
      x: linear([hs.lo, hs.hi], [PAD.left, PAD.left + innerW]),
      y: linear([0, maxN], [PAD.top + innerH, PAD.top]),
      yTicks: ticks(0, maxN, 4),
      xTicks: ticks(hs.lo, hs.hi, Math.min(7, Math.max(2, Math.round(innerW / 100)))),
    };
  }, [values, bins, width, height]);

  const label = title || "히스토그램";

  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={height} role="img" aria-label={label} style={{ display: "block" }}>
        <title>{label}</title>
        <GridY y={view.y} tickVals={view.yTicks} x0={PAD.left} x1={PAD.left + view.innerW} digits={0} />
        {view.hs.bins.map((b, i) => {
          const x0 = view.x(b.lo);
          const w = Math.max(1, view.x(b.hi) - x0 - 1);
          const y0 = view.y(b.n);
          return (
            <rect key={i} x={x0} y={y0} width={w} height={Math.max(0, view.y(0) - y0)} fill={t.series[0]}>
              <title>{`${fmtNum(b.lo)} ~ ${fmtNum(b.hi)}: ${b.n}개`}</title>
            </rect>
          );
        })}
        {view.xTicks.map((tv) => (
          <text key={tv} x={view.x(tv)} y={PAD.top + view.innerH + 18} textAnchor="middle" fill={t.ink3} fontSize={11} aria-hidden="true">
            {fmtNum(tv)}
          </text>
        ))}
        <line x1={PAD.left} x2={PAD.left + view.innerW} y1={PAD.top + view.innerH} y2={PAD.top + view.innerH} stroke={t.axis} />
        <AxisLabels x={PAD.left + view.innerW / 2} y={height - 6} xLabel={xLabel} yLabel={yLabel} height={height} />
      </svg>
    </div>
  );
}
