"use client";

import { useMemo } from "react";
import { chartTheme, ON_FILL } from "@/lib/design-tokens";
import type { Approach, Method } from "@/lib/method-map-catalog";
import { linear, ticks, useMeasuredWidth } from "./useScales";

const LANES: { id: Approach; label: string }[] = [
  { id: "quant", label: "양적" },
  { id: "qual", label: "질적" },
  { id: "mixed", label: "혼합" },
];

/**
 * 계보 타임라인.
 * X축은 연도, 가로 레인 3개는 연구 접근. 베지어 곡선은 `from` 계승 관계다.
 * 노드는 키보드로 이동·선택할 수 있어야 한다 — 표가 아니라 그림이지만 조작은 표와 같아야 한다.
 */
export default function Genealogy({
  methods,
  selected,
  dimmed,
  onSelect,
  height = 380,
}: {
  methods: Method[];
  selected?: string | null;
  /** 필터에 걸리지 않은 id — 숨기지 않고 흐리게 처리한다 */
  dimmed?: Set<string>;
  onSelect: (id: string) => void;
  height?: number;
}) {
  const t = chartTheme();
  const { ref, width } = useMeasuredWidth(900);
  const padL = 56;
  const padR = 24;
  const padT = 28;
  const laneH = (height - padT - 40) / 3;

  const view = useMemo(() => {
    const x = linear([1895, 2025], [padL, Math.max(padL + 120, width - padR)]);
    const laneIndex: Record<Approach, number> = { quant: 0, qual: 1, mixed: 2 };
    // 같은 레인에서 연도가 겹치면 위아래로 흔들어 라벨이 겹치지 않게 한다
    const perLane: Record<number, Method[]> = { 0: [], 1: [], 2: [] };
    methods.forEach((m) => perLane[laneIndex[m.approach]].push(m));
    const pos: Record<string, { x: number; y: number }> = {};
    Object.entries(perLane).forEach(([li, list]) => {
      const lane = Number(li);
      list
        .slice()
        .sort((a, b) => a.year - b.year)
        .forEach((m, i) => {
          const baseY = padT + laneH * lane + laneH / 2;
          const jitter = ((i % 3) - 1) * Math.min(26, laneH / 3.4);
          pos[m.id] = { x: x(m.year), y: baseY + jitter };
        });
    });
    return { x, pos, yearTicks: ticks(1900, 2020, Math.max(3, Math.round((width - padL) / 130))) };
  }, [methods, width, laneH]);

  const isDim = (id: string) => (dimmed ? dimmed.has(id) : false);
  const laneColor = (a: Approach) => (a === "quant" ? t.quant : a === "qual" ? t.qual : t.mixed);

  return (
    <div ref={ref} className="w-full overflow-x-auto">
      <svg width={width} height={height} role="img" aria-label="연구방법 계보 타임라인" style={{ display: "block" }}>
        <title>연구방법 계보 — 가로축은 연도, 세 개의 가로 레인은 연구 접근, 곡선은 계승 관계입니다.</title>

        {LANES.map((l, i) => (
          <g key={l.id} aria-hidden="true">
            <rect x={0} y={padT + laneH * i} width={width} height={laneH - 6} fill="rgba(255,255,255,.035)" rx={8} />
            <text x={10} y={padT + laneH * i + 16} fill={laneColor(l.id)} fontSize={12} fontWeight={800}>
              {l.label}
            </text>
          </g>
        ))}

        {view.yearTicks.map((y) => (
          <g key={y} aria-hidden="true">
            <line x1={view.x(y)} x2={view.x(y)} y1={padT - 8} y2={height - 34} stroke="rgba(255,255,255,.10)" />
            <text x={view.x(y)} y={height - 18} textAnchor="middle" fill={t.ink3} fontSize={11} style={{ fontVariantNumeric: "tabular-nums" }}>
              {y}
            </text>
          </g>
        ))}

        <g aria-hidden="true">
          {methods.map((m) => {
            if (!m.from) return null;
            const a = view.pos[m.from];
            const b = view.pos[m.id];
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2;
            return (
              <path
                key={`${m.from}-${m.id}`}
                d={`M${a.x} ${a.y} C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`}
                fill="none"
                stroke="rgba(255,255,255,.16)"
                strokeWidth={1.2}
                opacity={isDim(m.id) ? 0.25 : 1}
              />
            );
          })}
        </g>

        {methods.map((m) => {
          const p = view.pos[m.id];
          if (!p) return null;
          const on = selected === m.id;
          const dim = isDim(m.id);
          return (
            <g
              key={m.id}
              tabIndex={0}
              role="button"
              aria-label={`${m.name} · ${m.year}년 · ${LANES.find((l) => l.id === m.approach)?.label}`}
              aria-pressed={on}
              onClick={() => onSelect(m.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(m.id);
                }
              }}
              style={{ cursor: "pointer", opacity: dim ? 0.28 : 1, filter: dim ? "grayscale(1)" : undefined }}
            >
              <title>{`${m.name} (${m.en}) · ${m.year}년 통용`}</title>
              <circle cx={p.x} cy={p.y} r={on ? 7 : 5} fill={laneColor(m.approach)} stroke={on ? ON_FILL : "transparent"} strokeWidth={2} />
              <text x={p.x + 10} y={p.y + 4} fill={t.ink} fontSize={11} fontWeight={on ? 800 : 400}>
                {m.name}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="ty-label mt-1 text-ink-3">
        연도는 최초 제안 시점이 아니라 그 방법이 표준으로 통용되기 시작한 시점입니다. 노드는 Tab으로 이동하고 Enter·Space로 선택합니다.
      </p>
    </div>
  );
}
