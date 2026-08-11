"use client";
/** 결과·통계 태스크용 그래프 유형 (Comparison ~ Specialized) */
import { useMemo, useState } from "react";

export type ArchetypeChartId =
  | "bar"
  | "column"
  | "dot"
  | "histogram"
  | "box"
  | "violin"
  | "scatter"
  | "line"
  | "area"
  | "heatmap"
  | "radar"
  | "pareto"
  | "funnel"
  | "waterfall"
  | "qq"
  | "donut";

type ChartDef = {
  id: ArchetypeChartId;
  category: string;
  label: string;
  hint: string;
};

export const CHART_CATALOG: ChartDef[] = [
  { id: "bar", category: "Comparison(비교)", label: "Bar", hint: "집단 간 평균·비율 비교" },
  { id: "column", category: "Comparison(비교)", label: "Column", hint: "범주별 크기 비교(세로)" },
  { id: "dot", category: "Comparison(비교)", label: "Dot Plot", hint: "집단별 점+신뢰구간" },
  { id: "pareto", category: "Ranking", label: "Pareto", hint: "빈도 순위·누적비율" },
  { id: "histogram", category: "Distribution(분포)", label: "Histogram", hint: "연속변수 분포" },
  { id: "box", category: "Distribution(분포)", label: "Box Plot", hint: "중앙값·사분위·이상치" },
  { id: "violin", category: "Distribution(분포)", label: "Violin", hint: "분포 밀도+박스" },
  { id: "qq", category: "Statistical", label: "QQ Plot", hint: "정규성 점검" },
  { id: "scatter", category: "Relationship(관계)", label: "Scatter", hint: "두 변수 연관" },
  { id: "heatmap", category: "Matrix", label: "Heatmap", hint: "상관·교차표 강도" },
  { id: "line", category: "Trend(추세)", label: "Line", hint: "시간·단계별 변화" },
  { id: "area", category: "Trend(추세)", label: "Area", hint: "누적 추세" },
  { id: "radar", category: "Multivariate", label: "Radar", hint: "다요인 프로필" },
  { id: "donut", category: "Part-to-Whole(구성비)", label: "Donut", hint: "구성비(100%)" },
  { id: "funnel", category: "Specialized", label: "Funnel", hint: "단계별 탈락·전환" },
  { id: "waterfall", category: "Specialized", label: "Waterfall", hint: "증감 분해" },
];

export function chartsForTask(processKey: string, taskKind?: string): ArchetypeChartId[] {
  if (taskKind?.includes("meta")) return ["bar", "dot", "funnel", "pareto"];
  if (taskKind?.includes("inferential") || taskKind?.includes("hypothesis")) return ["bar", "dot", "column", "scatter"];
  if (taskKind?.includes("descriptive") || taskKind?.includes("assumption")) return ["histogram", "box", "qq", "bar"];
  if (taskKind?.includes("result") || processKey === "result") return ["bar", "line", "scatter", "heatmap", "dot", "box"];
  if (processKey === "stats") return ["histogram", "scatter", "qq", "heatmap", "bar"];
  if (processKey === "deliverable") return ["bar", "line", "donut", "radar", "pareto"];
  return ["bar", "line", "scatter", "histogram", "box"];
}

function SvgChart({ type, topic }: { type: ArchetypeChartId; topic: string }) {
  const W = 520;
  const H = 260;
  const pad = 36;
  const labels = ["대조", "실험", "혼합", "기타"];
  const vals = [2.9, 3.4, 3.1, 2.7];
  const max = Math.max(...vals) * 1.2;

  const title = (
    <text x={pad} y={22} fontSize="13" fontWeight="600" fill="#111">
      {topic.slice(0, 42)}
    </text>
  );

  if (type === "scatter") {
    const pts = [
      [0.2, 0.7], [0.35, 0.55], [0.5, 0.48], [0.62, 0.42], [0.78, 0.35], [0.88, 0.28],
      [0.25, 0.62], [0.45, 0.52], [0.7, 0.38],
    ];
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#ccc" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#ccc" />
        {pts.map(([rx, ry], i) => (
          <circle
            key={i}
            cx={pad + rx * (W - pad * 2)}
            cy={H - pad - ry * (H - pad * 2)}
            r="5"
            fill="#8b5cf6"
            opacity={0.85}
          />
        ))}
        <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#555">
          예측변수 X
        </text>
      </svg>
    );
  }

  if (type === "line" || type === "area") {
    const series = [2.1, 2.4, 2.9, 3.2, 3.5, 3.4];
    const pts = series.map((v, i) => {
      const x = pad + (i / (series.length - 1)) * (W - pad * 2);
      const y = H - pad - (v / 4) * (H - pad * 2);
      return `${x},${y}`;
    });
    const areaPts = `${pad},${H - pad} ${pts.join(" ")} ${W - pad},${H - pad}`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        {type === "area" && <polygon points={areaPts} fill="#0ea5e933" />}
        <polyline fill="none" stroke="#0ea5e9" strokeWidth="2.5" points={pts.join(" ")} />
      </svg>
    );
  }

  if (type === "histogram") {
    const bins = [3, 8, 14, 22, 18, 11, 6];
    const bw = (W - pad * 2) / bins.length - 4;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        {bins.map((b, i) => {
          const h = (b / 24) * (H - pad * 2);
          const x = pad + i * (bw + 4);
          return <rect key={i} x={x} y={H - pad - h} width={bw} height={h} fill="#06b6d4" rx="1" />;
        })}
      </svg>
    );
  }

  if (type === "box") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        {[0, 1, 2, 3].map((i) => {
          const cx = pad + 60 + i * 100;
          const q1 = H - pad - 60;
          const med = H - pad - 90;
          const q3 = H - pad - 120;
          return (
            <g key={i}>
              <line x1={cx} y1={H - pad - 30} x2={cx} y2={H - pad - 140} stroke="#64748b" />
              <rect x={cx - 22} y={q3} width={44} height={q1 - q3} fill="#e0f2fe" stroke="#0284c7" />
              <line x1={cx - 22} y1={med} x2={cx + 22} y2={med} stroke="#0284c7" strokeWidth="2" />
            </g>
          );
        })}
      </svg>
    );
  }

  if (type === "heatmap") {
    const grid = [
      [0.2, 0.6, 0.9, 0.4],
      [0.5, 1, 0.7, 0.3],
      [0.8, 0.65, 0.55, 0.2],
    ];
    const cw = 48;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        {grid.map((row, ri) =>
          row.map((v, ci) => (
            <rect
              key={`${ri}-${ci}`}
              x={pad + ci * cw}
              y={40 + ri * cw}
              width={cw - 4}
              height={cw - 4}
              fill={`rgba(14,165,233,${0.15 + v * 0.85})`}
            />
          ))
        )}
      </svg>
    );
  }

  if (type === "donut") {
    const r = 70;
    const cx = W / 2;
    const cy = H / 2 + 10;
    const segs = [0.35, 0.28, 0.22, 0.15];
    let acc = 0;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        {segs.map((s, i) => {
          const a0 = acc * Math.PI * 2 - Math.PI / 2;
          acc += s;
          const a1 = acc * Math.PI * 2 - Math.PI / 2;
          const x0 = cx + r * Math.cos(a0);
          const y0 = cy + r * Math.sin(a0);
          const x1 = cx + r * Math.cos(a1);
          const y1 = cy + r * Math.sin(a1);
          const large = s > 0.5 ? 1 : 0;
          const d = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
          const colors = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981"];
          return <path key={i} d={d} fill={colors[i % colors.length]} opacity={0.9} />;
        })}
        <circle cx={cx} cy={cy} r={38} fill="var(--color-background-secondary, #fff)" />
      </svg>
    );
  }

  if (type === "funnel") {
    const steps = [100, 72, 51, 38, 29];
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        {steps.map((w, i) => {
          const width = (w / 100) * (W - pad * 2);
          const x = (W - width) / 2;
          const y = 40 + i * 42;
          return <rect key={i} x={x} y={y} width={width} height={32} fill="#6366f1" opacity={0.75 - i * 0.1} rx="3" />;
        })}
      </svg>
    );
  }

  if (type === "waterfall") {
    const blocks = [10, 4, -2, 3, -1, 5];
    let x = pad;
    let y = H - pad;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        {blocks.map((b, i) => {
          const h = Math.abs(b) * 12;
          const up = b >= 0;
          const rectY = up ? y - h : y;
          const el = (
            <rect key={i} x={x} y={rectY} width={36} height={h} fill={up ? "#10b981" : "#ef4444"} rx="2" />
          );
          y = up ? y - h : y + h;
          x += 44;
          return el;
        })}
      </svg>
    );
  }

  if (type === "radar") {
    const n = 5;
    const cx = W / 2;
    const cy = H / 2 + 8;
    const R = 85;
    const vals = [0.7, 0.85, 0.55, 0.9, 0.65];
    const pts = vals.map((v, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return `${cx + R * v * Math.cos(a)},${cy + R * v * Math.sin(a)}`;
    });
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        <polygon points={pts.join(" ")} fill="#0ea5e944" stroke="#0ea5e9" strokeWidth="2" />
      </svg>
    );
  }

  if (type === "qq") {
    const pts = Array.from({ length: 18 }, (_, i) => {
      const t = (i + 0.5) / 18;
      return [t, t + (Math.sin(i) * 0.04)];
    });
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={pad} stroke="#94a3b8" strokeDasharray="4" />
        {pts.map(([rx, ry], i) => (
          <circle key={i} cx={pad + rx * (W - pad * 2)} cy={H - pad - ry * (H - pad * 2)} r="4" fill="#f97316" />
        ))}
      </svg>
    );
  }

  if (type === "violin") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        {[0, 1, 2].map((i) => {
          const cx = pad + 80 + i * 120;
          return (
            <ellipse key={i} cx={cx} cy={H / 2} rx={28} ry={70} fill="#a855f766" stroke="#7c3aed" />
          );
        })}
      </svg>
    );
  }

  if (type === "dot") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        {vals.map((v, i) => {
          const cx = pad + 50 + i * 100;
          const cy = H - pad - (v / max) * (H - pad * 2);
          return (
            <g key={i}>
              <line x1={cx} y1={cy - 12} x2={cx} y2={cy + 12} stroke="#0369a1" strokeWidth="2" />
              <circle cx={cx} cy={cy} r="6" fill="#0ea5e9" />
            </g>
          );
        })}
      </svg>
    );
  }

  if (type === "pareto") {
    const freqs = [42, 28, 18, 12, 8];
    let cum = 0;
    const total = freqs.reduce((a, b) => a + b, 0);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
        {title}
        {freqs.map((f, i) => {
          const h = (f / 45) * (H - pad * 2);
          const x = pad + i * 70;
          cum += f;
          const cy = H - pad - (cum / total) * (H - pad * 2);
          return (
            <g key={i}>
              <rect x={x} y={H - pad - h} width={48} height={h} fill="#0891b2" />
              <circle cx={x + 24} cy={cy} r="3" fill="#dc2626" />
            </g>
          );
        })}
      </svg>
    );
  }

  // bar / column default
  const vertical = type === "column";
  const barW = (W - pad * 2) / labels.length - 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl">
      {title}
      {labels.map((lab, i) => {
        const v = vals[i];
        const h = (v / max) * (H - pad * 2);
        if (vertical) {
          const x = pad + i * (barW + 10);
          return (
            <g key={i}>
              <rect x={x} y={H - pad - h} width={barW} height={h} fill="#0ea5e9" rx="2" />
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize="10" fill="#444">
                {lab}
              </text>
            </g>
          );
        }
        const y = pad + i * (barW + 10);
        return (
          <g key={i}>
            <rect x={pad + 60} y={y} width={h * 1.4} height={barW} fill="#0ea5e9" rx="2" />
            <text x={pad + 4} y={y + barW / 2 + 4} fontSize="10" fill="#444">
              {lab}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ArchetypeResultCharts({
  processKey,
  taskKind,
  topic,
  chartRef,
}: {
  processKey: string;
  taskKind?: string;
  topic: string;
  chartRef: React.RefObject<HTMLDivElement | null>;
}) {
  const allowed = useMemo(() => chartsForTask(processKey, taskKind), [processKey, taskKind]);
  const [chartId, setChartId] = useState<ArchetypeChartId>(allowed[0] || "bar");

  const byCat = useMemo(() => {
    const m = new Map<string, ChartDef[]>();
    for (const c of CHART_CATALOG) {
      if (!allowed.includes(c.id)) continue;
      if (!m.has(c.category)) m.set(c.category, []);
      m.get(c.category)!.push(c);
    }
    return m;
  }, [allowed]);

  return (
    <div className="mt-4 mb-4">
      <h3 className="text-[14px] font-semibold mb-2">결과 그래프(Result Charts)</h3>
      <p className="text-[12px] text-ink-3 mb-2">
        분석 목적에 맞는 유형을 고르세요. 막대·분포·관계·추세·구성비 등 {allowed.length}종을 이 태스크에 연결했습니다.
      </p>
      {Array.from(byCat.entries()).map(([cat, defs]) => (
        <div key={cat} className="mb-2">
          <div className="text-[11px] text-ink-3 mb-1">{cat}</div>
          <div className="flex flex-wrap gap-1.5">
            {defs.map((d) => (
              <button
                key={d.id}
                type="button"
                className="btn btn-sm"
                title={d.hint}
                style={chartId === d.id ? { background: "var(--brand-soft)", borderColor: "var(--brand)" } : undefined}
                onClick={() => setChartId(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div ref={chartRef} className="rounded-md p-2 mt-2" style={{ background: "var(--color-background-secondary)" }}>
        <SvgChart type={chartId} topic={topic} />
      </div>
    </div>
  );
}
