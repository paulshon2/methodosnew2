"use client";

import { chartTheme } from "@/lib/design-tokens";

export type Slice = { label: string; value: number; color?: string };

/**
 * 도넛.
 * 사람은 각도를 정확히 비교하지 못한다. 3개 이하일 때만 쓰고, 그 이상은 가로 막대를 권한다.
 * 이 컴포넌트는 그 판단을 막지 않되, 값과 비율을 항상 글자로 함께 적는다.
 */
export default function Donut({ data, size = 240, title }: { data: Slice[]; size?: number; title?: string }) {
  const t = chartTheme();
  const total = data.reduce((s, d) => s + (Number.isFinite(d.value) ? Math.max(0, d.value) : 0), 0);
  const r = size / 2 - 4;
  const inner = r * 0.58;
  let acc = -Math.PI / 2;

  const arc = (a0: number, a1: number) => {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const c = size / 2;
    const p = (rad: number, ang: number) => `${(c + rad * Math.cos(ang)).toFixed(2)} ${(c + rad * Math.sin(ang)).toFixed(2)}`;
    return `M${p(r, a0)}A${r} ${r} 0 ${large} 1 ${p(r, a1)}L${p(inner, a1)}A${inner} ${inner} 0 ${large} 0 ${p(inner, a0)}Z`;
  };

  const label = title || "도넛 그래프";

  return (
    <div className={`flex flex-wrap items-center gap-5 ${size <= 200 ? "flex-col items-stretch" : ""}`}>
      <svg width={size} height={size} role="img" aria-label={label} className="mx-auto shrink-0">
        <title>{label}</title>
        {total > 0 ? (
          data.map((d, i) => {
            const frac = Math.max(0, d.value) / total;
            const a0 = acc;
            const a1 = acc + frac * Math.PI * 2;
            acc = a1;
            return (
              <path key={d.label + i} d={arc(a0, a1)} fill={d.color || t.series[i % t.series.length]}>
                <title>{`${d.label}: ${d.value} (${(frac * 100).toFixed(1)}%)`}</title>
              </path>
            );
          })
        ) : (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.grid} strokeWidth={2} />
        )}
      </svg>
      <ul className="min-w-0 w-full flex-1" style={{ minWidth: size <= 200 ? undefined : 160 }}>
        {data.map((d, i) => (
          <li key={d.label + i} className="ty-small flex items-center gap-2 py-0.5">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: d.color || t.series[i % t.series.length] }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{d.label}</span>
            <span className="num shrink-0 text-ink-2">{d.value}</span>
            <span className="num shrink-0 text-ink-3">{total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0"}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
