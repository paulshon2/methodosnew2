"use client";

import { useMemo } from "react";
import { chartTheme } from "@/lib/design-tokens";
import { AxisLabels, GridY, PAD } from "./Axes";
import { fmtNum, linear, niceDomain, ticks, useMeasuredWidth } from "./useScales";

export type Point = { x: number; y: number; label?: string; group?: string };

/** 최소제곱 회귀선. 상관은 인과가 아니므로 캡션에서 단정하지 않는다. */
export function fitLine(pts: Point[]): { a: number; b: number; r: number } | null {
  const p = pts.filter((q) => Number.isFinite(q.x) && Number.isFinite(q.y));
  const n = p.length;
  if (n < 3) return null;
  const mx = p.reduce((s, q) => s + q.x, 0) / n;
  const my = p.reduce((s, q) => s + q.y, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  p.forEach((q) => {
    sxy += (q.x - mx) * (q.y - my);
    sxx += (q.x - mx) ** 2;
    syy += (q.y - my) ** 2;
  });
  if (sxx === 0 || syy === 0) return null;
  const b = sxy / sxx;
  return { a: my - b * mx, b, r: sxy / Math.sqrt(sxx * syy) };
}

export default function Scatter({
  points,
  height = 320,
  xLabel,
  yLabel,
  regression = true,
  groupColors,
  title,
}: {
  points: Point[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
  regression?: boolean;
  groupColors?: Record<string, string>;
  title?: string;
}) {
  const t = chartTheme();
  const { ref, width } = useMeasuredWidth();

  const view = useMemo(() => {
    const innerW = Math.max(60, width - PAD.left - PAD.right);
    const innerH = Math.max(60, height - PAD.top - PAD.bottom);
    const xd = niceDomain(points.map((p) => p.x), false);
    const yd = niceDomain(points.map((p) => p.y), false);
    return {
      x: linear(xd, [PAD.left, PAD.left + innerW]),
      y: linear(yd, [PAD.top + innerH, PAD.top]),
      innerW,
      innerH,
      xd,
      yTicks: ticks(yd[0], yd[1], 5),
      xTicks: ticks(xd[0], xd[1], Math.min(7, Math.max(2, Math.round(innerW / 100)))),
      fit: regression ? fitLine(points) : null,
    };
  }, [points, width, height, regression]);

  const label = title || "산점도";

  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={height} role="img" aria-label={label} style={{ display: "block" }}>
        <title>{label}</title>
        <GridY y={view.y} tickVals={view.yTicks} x0={PAD.left} x1={PAD.left + view.innerW} />
        {view.xTicks.map((tv) => (
          <text key={tv} x={view.x(tv)} y={PAD.top + view.innerH + 18} textAnchor="middle" fill={t.ink3} fontSize={11} aria-hidden="true">
            {fmtNum(tv)}
          </text>
        ))}
        <line x1={PAD.left} x2={PAD.left + view.innerW} y1={PAD.top + view.innerH} y2={PAD.top + view.innerH} stroke={t.axis} />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={view.x(p.x)}
            cy={view.y(p.y)}
            r={3.5}
            fill={(p.group && groupColors?.[p.group]) || t.series[0]}
            fillOpacity={1}
          >
            <title>{`${p.label ? p.label + " · " : ""}(${fmtNum(p.x)}, ${fmtNum(p.y)})`}</title>
          </circle>
        ))}

        {view.fit && (
          <line
            x1={view.x(view.xd[0])}
            y1={view.y(view.fit.a + view.fit.b * view.xd[0])}
            x2={view.x(view.xd[1])}
            y2={view.y(view.fit.a + view.fit.b * view.xd[1])}
            stroke={t.ink2}
            strokeWidth={1.5}
            strokeDasharray="5 4"
          >
            <title>{`회귀선 · r = ${view.fit.r.toFixed(3)}`}</title>
          </line>
        )}
        <AxisLabels x={PAD.left + view.innerW / 2} y={height - 6} xLabel={xLabel} yLabel={yLabel} height={height} />
      </svg>
    </div>
  );
}
