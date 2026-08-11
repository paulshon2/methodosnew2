"use client";

import { chartTheme } from "@/lib/design-tokens";
import { fmtNum, type Scale } from "./useScales";

export const PAD = { top: 12, right: 16, bottom: 44, left: 56 };

/** 격자선과 축 텍스트. 데이터 잉크가 아니므로 절대 진하게 그리지 않는다. */
export function GridY({ y, tickVals, x0, x1, digits = 2 }: { y: Scale; tickVals: number[]; x0: number; x1: number; digits?: number }) {
  const t = chartTheme();
  return (
    <g aria-hidden="true">
      {tickVals.map((v) => (
        <g key={v}>
          <line x1={x0} x2={x1} y1={y(v)} y2={y(v)} stroke={t.grid} strokeWidth={1} />
          <text x={x0 - 8} y={y(v)} textAnchor="end" dominantBaseline="central" fill={t.ink3} fontSize={11} style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmtNum(v, digits)}
          </text>
        </g>
      ))}
    </g>
  );
}

export function AxisLabels({ x, y, xLabel, yLabel, height }: { x: number; y: number; xLabel?: string; yLabel?: string; height: number }) {
  const t = chartTheme();
  return (
    <g aria-hidden="true">
      {xLabel ? (
        <text x={x} y={y} textAnchor="middle" fill={t.ink2} fontSize={12} fontWeight={700}>
          {xLabel}
        </text>
      ) : null}
      {yLabel ? (
        <>
          <text className="axis-y-rot" transform={`translate(14 ${height / 2}) rotate(-90)`} textAnchor="middle" fill={t.ink2} fontSize={12} fontWeight={700}>
            {yLabel}
          </text>
          <text className="axis-y-flat" x={PAD.left} y={10} textAnchor="start" fill={t.ink2} fontSize={12} fontWeight={700}>
            {yLabel}
          </text>
        </>
      ) : null}
    </g>
  );
}

/** 범주 축 라벨 — 길면 기울인다. 잘라내지 않는다. */
export function CategoryAxis({ labels, band, x0, yBase }: { labels: string[]; band: number; x0: number; yBase: number }) {
  const t = chartTheme();
  const tilt = labels.some((l) => l.length > 6) || band < 54;
  return (
    <g aria-hidden="true">
      {labels.map((l, i) => {
        const cx = x0 + band * i + band / 2;
        return (
          <text
            key={l + i}
            x={cx}
            y={yBase + 16}
            textAnchor={tilt ? "end" : "middle"}
            fill={t.ink3}
            fontSize={11}
            transform={tilt ? `rotate(-32 ${cx} ${yBase + 16})` : undefined}
          >
            {l}
          </text>
        );
      })}
    </g>
  );
}
