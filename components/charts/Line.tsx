"use client";

import { useMemo } from "react";
import { chartTheme } from "@/lib/design-tokens";
import { AxisLabels, GridY, PAD } from "./Axes";
import { fmtNum, linear, niceDomain, ticks, useMeasuredWidth } from "./useScales";

export type Series = { name: string; points: { x: number; y: number; label?: string }[]; color?: string };

/** 꺾은선 — 점 사이를 잇는 선은 '사이 값이 있다'는 뜻이다. 순서·시간 축에만 쓴다. */
export default function Line({
  series,
  height = 300,
  xTickLabels,
  xLabel,
  yLabel,
  zeroBaseline = false,
  grid = true,
  title,
}: {
  series: Series[];
  height?: number;
  /** x가 범주 인덱스일 때 축에 찍을 이름 */
  xTickLabels?: string[];
  xLabel?: string;
  yLabel?: string;
  zeroBaseline?: boolean;
  grid?: boolean;
  title?: string;
}) {
  const t = chartTheme();
  const { ref, width } = useMeasuredWidth();

  const view = useMemo(() => {
    const xs = series.flatMap((s) => s.points.map((p) => p.x));
    const ys = series.flatMap((s) => s.points.map((p) => p.y));
    const innerW = Math.max(60, width - PAD.left - PAD.right);
    const innerH = Math.max(60, height - PAD.top - PAD.bottom);
    const xd = niceDomain(xs, false, 0.02);
    const yd = niceDomain(ys, zeroBaseline);
    return {
      x: linear(xd, [PAD.left, PAD.left + innerW]),
      y: linear(yd, [PAD.top + innerH, PAD.top]),
      innerW,
      innerH,
      xd,
      tickVals: ticks(yd[0], yd[1], 5),
      xTicks: ticks(xd[0], xd[1], Math.min(8, Math.max(2, Math.round(innerW / 90)))),
    };
  }, [series, width, height, zeroBaseline]);

  const label = title || "꺾은선 그래프";

  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={height} role="img" aria-label={label} style={{ display: "block" }}>
        <title>{label}</title>
        {grid && <GridY y={view.y} tickVals={view.tickVals} x0={PAD.left} x1={PAD.left + view.innerW} />}
        {view.xTicks.map((tv) => (
          <text key={tv} x={view.x(tv)} y={PAD.top + view.innerH + 18} textAnchor="middle" fill={t.ink3} fontSize={11} aria-hidden="true">
            {xTickLabels ? xTickLabels[Math.round(tv)] ?? "" : fmtNum(tv)}
          </text>
        ))}
        <line x1={PAD.left} x2={PAD.left + view.innerW} y1={PAD.top + view.innerH} y2={PAD.top + view.innerH} stroke={t.axis} />

        {series.map((s, si) => {
          const color = s.color || t.series[si % t.series.length];
          const d = s.points
            .slice()
            .sort((a, b) => a.x - b.x)
            .map((p, i) => `${i === 0 ? "M" : "L"}${view.x(p.x).toFixed(1)} ${view.y(p.y).toFixed(1)}`)
            .join(" ");
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {s.points.map((p, i) => (
                <circle key={i} cx={view.x(p.x)} cy={view.y(p.y)} r={3} fill={color}>
                  <title>{`${s.name} · ${p.label ?? fmtNum(p.x)}: ${fmtNum(p.y)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
        <AxisLabels x={PAD.left + view.innerW / 2} y={height - 6} xLabel={xLabel} yLabel={yLabel} height={height} />
      </svg>
    </div>
  );
}
