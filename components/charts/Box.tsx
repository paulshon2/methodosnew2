"use client";

import { useMemo } from "react";
import { chartTheme } from "@/lib/design-tokens";
import { AxisLabels, CategoryAxis, GridY, PAD } from "./Axes";
import { linear, niceDomain, ticks, useMeasuredWidth } from "./useScales";

export type BoxGroup = { label: string; values: number[]; color?: string };
export type BoxStat = { label: string; q1: number; med: number; q3: number; lo: number; hi: number; out: number[]; n: number };

export function boxStats(g: BoxGroup): BoxStat {
  const v = g.values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  const n = v.length;
  if (n === 0) return { label: g.label, q1: 0, med: 0, q3: 0, lo: 0, hi: 0, out: [], n: 0 };
  const q = (p: number) => {
    const i = p * (n - 1);
    const f = Math.floor(i);
    return v[f] + (v[Math.min(n - 1, f + 1)] - v[f]) * (i - f);
  };
  const q1 = q(0.25), med = q(0.5), q3 = q(0.75);
  const iqr = q3 - q1;
  const fenceLo = q1 - 1.5 * iqr;
  const fenceHi = q3 + 1.5 * iqr;
  const inner = v.filter((x) => x >= fenceLo && x <= fenceHi);
  return {
    label: g.label,
    q1,
    med,
    q3,
    lo: inner.length ? inner[0] : v[0],
    hi: inner.length ? inner[inner.length - 1] : v[n - 1],
    out: v.filter((x) => x < fenceLo || x > fenceHi),
    n,
  };
}

/** 상자그림 — 분포와 이상치를 함께 보여준다. 개별 점은 지터로 겹침을 푼다. */
export default function Box({
  groups,
  height = 320,
  showPoints = true,
  xLabel,
  yLabel,
  title,
}: {
  groups: BoxGroup[];
  height?: number;
  showPoints?: boolean;
  xLabel?: string;
  yLabel?: string;
  title?: string;
}) {
  const t = chartTheme();
  const { ref, width } = useMeasuredWidth();

  const view = useMemo(() => {
    const stats = groups.map(boxStats);
    const all = groups.flatMap((g) => g.values);
    const dom = niceDomain(all, false);
    const innerW = Math.max(60, width - PAD.left - PAD.right);
    const innerH = Math.max(60, height - PAD.top - PAD.bottom);
    return {
      stats,
      innerW,
      innerH,
      y: linear(dom, [PAD.top + innerH, PAD.top]),
      band: innerW / Math.max(1, groups.length),
      yTicks: ticks(dom[0], dom[1], 5),
    };
  }, [groups, width, height]);

  const label = title || "상자그림";

  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={height} role="img" aria-label={label} style={{ display: "block" }}>
        <title>{label}</title>
        <GridY y={view.y} tickVals={view.yTicks} x0={PAD.left} x1={PAD.left + view.innerW} />
        {view.stats.map((s, i) => {
          const cx = PAD.left + view.band * i + view.band / 2;
          const bw = Math.min(72, view.band * 0.46);
          const color = groups[i].color || t.series[i % t.series.length];
          return (
            <g key={s.label + i}>
              <line x1={cx} x2={cx} y1={view.y(s.hi)} y2={view.y(s.lo)} stroke={t.ink2} strokeWidth={1.2} />
              <line x1={cx - bw / 3} x2={cx + bw / 3} y1={view.y(s.hi)} y2={view.y(s.hi)} stroke={t.ink2} strokeWidth={1.2} />
              <line x1={cx - bw / 3} x2={cx + bw / 3} y1={view.y(s.lo)} y2={view.y(s.lo)} stroke={t.ink2} strokeWidth={1.2} />
              <rect x={cx - bw / 2} y={view.y(s.q3)} width={bw} height={Math.max(1, view.y(s.q1) - view.y(s.q3))} fill={color} fillOpacity={1} rx={2}>
                <title>{`${s.label} · n=${s.n} · Q1=${s.q1.toFixed(2)} 중앙값=${s.med.toFixed(2)} Q3=${s.q3.toFixed(2)}`}</title>
              </rect>
              <line x1={cx - bw / 2} x2={cx + bw / 2} y1={view.y(s.med)} y2={view.y(s.med)} stroke={t.surface} strokeWidth={2.5} />
              {showPoints &&
                groups[i].values
                  .filter((v) => Number.isFinite(v) && !s.out.includes(v))
                  .map((v, k) => (
                    <circle key={k} cx={cx + ((k * 37) % 17) - 8} cy={view.y(v)} r={1.8} fill={t.ink3} />
                  ))}
              {s.out.map((v, k) => (
                <circle key={"o" + k} cx={cx} cy={view.y(v)} r={4} fill="none" stroke={t.danger} strokeWidth={1.5}>
                  <title>{`이상치 ${v.toFixed(2)} — 1.5×IQR 밖`}</title>
                </circle>
              ))}
            </g>
          );
        })}
        <line x1={PAD.left} x2={PAD.left + view.innerW} y1={PAD.top + view.innerH} y2={PAD.top + view.innerH} stroke={t.axis} />
        <CategoryAxis labels={view.stats.map((s) => s.label)} band={view.band} x0={PAD.left} yBase={PAD.top + view.innerH} />
        <AxisLabels x={PAD.left + view.innerW / 2} y={height - 6} xLabel={xLabel} yLabel={yLabel} height={height} />
      </svg>
    </div>
  );
}
