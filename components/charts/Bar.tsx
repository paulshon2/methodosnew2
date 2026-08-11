"use client";

import { useMemo } from "react";
import { chartTheme } from "@/lib/design-tokens";
import { AxisLabels, CategoryAxis, GridY, PAD } from "./Axes";
import { fmtNum, linear, niceDomain, ticks, useMeasuredWidth } from "./useScales";

export type BarDatum = { label: string; value: number; ci?: number; color?: string };

/**
 * 막대 그래프 — 세로/가로.
 * 막대 길이가 곧 값이므로 `zeroBaseline`을 끄면 차이가 과장된다. 기본은 켬.
 */
export default function Bar({
  data,
  height = 300,
  horizontal = false,
  zeroBaseline = true,
  showValues = false,
  grid = true,
  errorBars = false,
  xLabel,
  yLabel,
  title,
}: {
  data: BarDatum[];
  height?: number;
  horizontal?: boolean;
  zeroBaseline?: boolean;
  showValues?: boolean;
  grid?: boolean;
  errorBars?: boolean;
  xLabel?: string;
  yLabel?: string;
  title?: string;
}) {
  const t = chartTheme();
  const { ref, width } = useMeasuredWidth();
  const h = horizontal ? Math.max(height, data.length * 30 + 60) : height;
  const pad = horizontal ? { ...PAD, left: 120, bottom: 40 } : PAD;

  const view = useMemo(() => {
    const vals = data.flatMap((d) => [d.value, errorBars && d.ci ? d.value + d.ci : d.value, errorBars && d.ci ? d.value - d.ci : d.value]);
    const dom = niceDomain(vals, zeroBaseline);
    const innerW = Math.max(60, width - pad.left - pad.right);
    const innerH = Math.max(60, h - pad.top - pad.bottom);
    const v = horizontal ? linear(dom, [pad.left, pad.left + innerW]) : linear(dom, [pad.top + innerH, pad.top]);
    const band = (horizontal ? innerH : innerW) / Math.max(1, data.length);
    return { dom, innerW, innerH, v, band, tickVals: ticks(dom[0], dom[1], 5) };
  }, [data, width, h, horizontal, zeroBaseline, errorBars, pad.left, pad.right, pad.top, pad.bottom]);

  const zero = view.v(Math.max(view.dom[0], Math.min(0, view.dom[1])));
  const label = title || "막대 그래프";

  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={h} role="img" aria-label={label} style={{ display: "block" }}>
        <title>{label}</title>
        {!horizontal && grid && <GridY y={view.v} tickVals={view.tickVals} x0={pad.left} x1={pad.left + view.innerW} />}
        {horizontal &&
          grid &&
          view.tickVals.map((tv) => (
            <g key={tv} aria-hidden="true">
              <line x1={view.v(tv)} x2={view.v(tv)} y1={pad.top} y2={pad.top + view.innerH} stroke={t.grid} />
              <text x={view.v(tv)} y={pad.top + view.innerH + 16} textAnchor="middle" fill={t.ink3} fontSize={11}>
                {fmtNum(tv)}
              </text>
            </g>
          ))}

        {data.map((d, i) => {
          const color = d.color || t.series[i % t.series.length];
          if (horizontal) {
            const y0 = pad.top + view.band * i + 5;
            const bh = Math.max(4, view.band - 10);
            const x0 = Math.min(zero, view.v(d.value));
            const bw = Math.abs(view.v(d.value) - zero);
            return (
              <g key={d.label + i}>
                <rect x={x0} y={y0} width={bw} height={bh} fill={color} rx={2}>
                  <title>{`${d.label}: ${fmtNum(d.value)}`}</title>
                </rect>
                <text x={pad.left - 8} y={y0 + bh / 2} textAnchor="end" dominantBaseline="central" fill={t.ink2} fontSize={11}>
                  {d.label}
                </text>
                {showValues && (
                  <text x={x0 + bw + 6} y={y0 + bh / 2} dominantBaseline="central" fill={t.ink2} fontSize={11} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {fmtNum(d.value)}
                  </text>
                )}
              </g>
            );
          }
          const x0 = pad.left + view.band * i + view.band * 0.18;
          const bw = view.band * 0.64;
          const yTop = Math.min(zero, view.v(d.value));
          const bh = Math.abs(view.v(d.value) - zero);
          return (
            <g key={d.label + i}>
              <rect x={x0} y={yTop} width={bw} height={Math.max(1, bh)} fill={color} rx={2}>
                <title>{`${d.label}: ${fmtNum(d.value)}${errorBars && d.ci ? ` (95% CI ±${fmtNum(d.ci)})` : ""}`}</title>
              </rect>
              {errorBars && d.ci ? (
                <g stroke={t.ink2} strokeWidth={1.5} aria-hidden="true">
                  <line x1={x0 + bw / 2} x2={x0 + bw / 2} y1={view.v(d.value - d.ci)} y2={view.v(d.value + d.ci)} />
                  <line x1={x0 + bw / 2 - 6} x2={x0 + bw / 2 + 6} y1={view.v(d.value + d.ci)} y2={view.v(d.value + d.ci)} />
                  <line x1={x0 + bw / 2 - 6} x2={x0 + bw / 2 + 6} y1={view.v(d.value - d.ci)} y2={view.v(d.value - d.ci)} />
                </g>
              ) : null}
              {showValues && (
                <text x={x0 + bw / 2} y={yTop - 5} textAnchor="middle" fill={t.ink2} fontSize={11} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmtNum(d.value)}
                </text>
              )}
            </g>
          );
        })}

        <line
          x1={horizontal ? zero : pad.left}
          x2={horizontal ? zero : pad.left + view.innerW}
          y1={horizontal ? pad.top : zero}
          y2={horizontal ? pad.top + view.innerH : zero}
          stroke={t.axis}
        />
        {!horizontal && <CategoryAxis labels={data.map((d) => d.label)} band={view.band} x0={pad.left} yBase={pad.top + view.innerH} />}
        <AxisLabels x={pad.left + view.innerW / 2} y={h - 6} xLabel={xLabel} yLabel={yLabel} height={h} />
      </svg>
    </div>
  );
}
