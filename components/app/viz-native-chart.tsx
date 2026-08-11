"use client";
/** 자체 SVG 차트 렌더러 — Plotly/Chart.js 비의존 */
import { useEffect, useMemo, useRef } from "react";
import type { DataModel, Mapping } from "@/lib/viz-engine";
import { buildNativeFig, NATIVE_PALETTE, type NativeFig } from "@/lib/viz-native-build";
import { ON_FILL, TREND_DOWN, TREND_UP, chartTheme } from "@/lib/design-tokens";

const W = 900;
const H = 520;
const PL = 56, PR = 24, PT = 28, PB = 56;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * p;
}
const fmt = (n: number) => (Math.abs(n) >= 100 ? n.toFixed(0) : Number.isInteger(n) ? String(n) : n.toFixed(1));

function asNums(arr: (string | number)[]) {
  return arr.map((v) => (typeof v === "number" ? v : parseFloat(String(v)))).filter((v) => !isNaN(v));
}

export default function VizNativeChart({
  chartId,
  data,
  mapping,
  height = 540,
  onSnapshot,
}: {
  chartId: string;
  data: DataModel;
  mapping: Mapping;
  height?: number;
  onSnapshot?: (dataUrl: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fig = useMemo(() => buildNativeFig(chartId, data, mapping), [chartId, data, mapping]);

  useEffect(() => {
    if (!onSnapshot || !wrapRef.current) return;
    const svg = wrapRef.current.querySelector("svg");
    if (!svg) return;
    const t = setTimeout(() => {
      try {
        const xml = new XMLSerializer().serializeToString(svg);
        const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
        onSnapshot(url);
      } catch { /* ignore */ }
    }, 120);
    return () => clearTimeout(t);
  }, [fig, onSnapshot]);

  return (
    <div ref={wrapRef} className="w-full overflow-hidden rounded-md" style={{ background: "var(--color-background-primary)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ height, display: "block" }} role="img" aria-label={fig.title || chartId}>
        <rect width={W} height={H} fill="transparent" />
        {fig.title && <text x={W / 2} y={18} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--brand-ink)">{fig.title}</text>}
        <FigBody fig={fig} />
        {fig.note && <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-text-tertiary)">{fig.note}</text>}
      </svg>
    </div>
  );
}

function FigBody({ fig }: { fig: NativeFig }) {
  const k = fig.kind;
  if (k === "note") {
    return <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="14" fill="var(--color-text-secondary)">{fig.note}</text>;
  }
  if (k === "scatter" || k === "bubble" || k === "roc" || k === "ecdf" || k === "line" || k === "area") {
    return <XYPlot fig={fig} />;
  }
  if (k === "bar" || k === "waterfall" || k === "gbar" || k === "errbar") return <BarPlot fig={fig} />;
  if (k === "hbar" || k === "funnel" || k === "dot") return <HBarPlot fig={fig} />;
  if (k === "pie" || k === "donut") return <PiePlot fig={fig} donut={k === "donut"} />;
  if (k === "treemap") return <TreemapPlot fig={fig} />;
  if (k === "histogram") return <HistPlot fig={fig} />;
  if (k === "box" || k === "violin") return <BoxPlot fig={fig} />;
  if (k === "heatmap" || k === "corr") return <HeatPlot fig={fig} />;
  if (k === "parcoords") return <ParallelPlot fig={fig} />;
  if (k === "radar") return <RadarPlot fig={fig} />;
  if (k === "polar") return <PolarPlot fig={fig} />;
  if (k === "sankey") return <SankeyPlot fig={fig} />;
  if (k === "gauge") return <GaugePlot fig={fig} />;
  if (k === "kpi") return <KpiPlot fig={fig} />;
  if (k === "candle" || k === "ohlc") return <CandlePlot fig={fig} />;
  return <XYPlot fig={fig} />;
}

function AxisFrame({
  xMin, xMax, yMin, yMax, xtitle, ytitle, logY, catX,
}: {
  xMin: number; xMax: number; yMin: number; yMax: number;
  xtitle?: string; ytitle?: string; logY?: boolean; catX?: string[];
}) {
  const yw = H - PT - PB;
  const xw = W - PL - PR;
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <g>
      {yTicks.map((f, i) => {
        const yy = PT + yw * (1 - f);
        const val = yMin + (yMax - yMin) * f;
        return (
          <g key={i}>
            <line x1={PL} y1={yy} x2={W - PR} y2={yy} stroke="var(--color-border-tertiary)" strokeDasharray="2 3" />
            <text x={PL - 8} y={yy + 3} fontSize="10" textAnchor="end" fill="var(--color-text-tertiary)">
              {logY && val > 0 ? val.toExponential(0) : fmt(val)}
            </text>
          </g>
        );
      })}
      <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="var(--color-border-secondary)" />
      <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="var(--color-border-secondary)" />
      {xtitle && <text x={(PL + W - PR) / 2} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--color-text-secondary)">{xtitle}</text>}
      {ytitle && (
        <text x={14} y={(PT + H - PB) / 2} textAnchor="middle" fontSize="11" fill="var(--color-text-secondary)"
          transform={`rotate(-90 14 ${(PT + H - PB) / 2})`}>{ytitle}</text>
      )}
      {catX && catX.map((lab, i) => {
        const xx = PL + (catX.length <= 1 ? xw / 2 : (i / (catX.length - 1)) * xw);
        return (
          <text key={i} x={xx} y={H - PB + 14} fontSize="9" textAnchor="middle" fill="var(--color-text-tertiary)"
            transform={catX.length > 8 ? `rotate(28 ${xx} ${H - PB + 14})` : undefined}>
            {String(lab).slice(0, 8)}
          </text>
        );
      })}
      {/* silence unused */}
      <title>{`${xMin}-${xMax}`}</title>
    </g>
  );
}

function XYPlot({ fig }: { fig: NativeFig }) {
  const allXnum: number[] = [];
  const allY: number[] = [];
  let catMode = false;
  const catLabels: string[] = [];

  fig.series.forEach((s) => {
    const xn = asNums(s.x);
    if (xn.length === s.x.length) allXnum.push(...xn);
    else {
      catMode = true;
      s.x.forEach((v) => { if (!catLabels.includes(String(v))) catLabels.push(String(v)); });
    }
    allY.push(...s.y);
  });

  let xMin = allXnum.length ? Math.min(...allXnum) : 0;
  let xMax = allXnum.length ? Math.max(...allXnum) : 1;
  if (xMin === xMax) { xMin -= 1; xMax += 1; }
  let yMin = allY.length ? Math.min(0, ...allY) : 0;
  let yMax = allY.length ? niceMax(Math.max(...allY, 1)) : 1;
  if (fig.kind === "ecdf" || fig.kind === "roc") { yMin = 0; yMax = 1; }
  if (fig.logY) { yMin = Math.max(0.01, Math.min(...allY.filter((v) => v > 0), 0.01)); yMax = Math.max(...allY, 1); }

  const xw = W - PL - PR, yw = H - PT - PB;
  const xOf = (v: string | number, i: number, s: typeof fig.series[0]) => {
    if (catMode) {
      const idx = catLabels.indexOf(String(v));
      return PL + (catLabels.length <= 1 ? xw / 2 : (Math.max(0, idx) / Math.max(1, catLabels.length - 1)) * xw);
    }
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return PL + ((n - xMin) / (xMax - xMin || 1)) * xw;
  };
  const yOf = (v: number) => {
    if (fig.logY) {
      const ly = Math.log10(Math.max(v, yMin));
      const l0 = Math.log10(yMin), l1 = Math.log10(yMax);
      return PT + yw * (1 - (ly - l0) / (l1 - l0 || 1));
    }
    return PT + yw * (1 - (v - yMin) / (yMax - yMin || 1));
  };

  const sizeMax = fig.sizes?.length ? Math.max(...fig.sizes, 1) : 1;
  const isLine = fig.kind === "line" || fig.kind === "area" || fig.kind === "ecdf" || fig.kind === "roc"
    || (fig.series.some((s) => s.name.startsWith("y=")));

  return (
    <g>
      <AxisFrame xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} xtitle={fig.xtitle} ytitle={fig.ytitle} logY={fig.logY} catX={catMode ? catLabels : undefined} />
      {fig.series.map((s, si) => {
        const color = s.color || NATIVE_PALETTE[si % NATIVE_PALETTE.length];
        const pts = s.x.map((xv, i) => `${xOf(xv, i, s)},${yOf(s.y[i] ?? 0)}`).join(" ");
        const lineLike = isLine && (s.name.startsWith("y=") || fig.kind !== "scatter" && fig.kind !== "bubble");
        return (
          <g key={si}>
            {fig.kind === "area" && si === 0 && (
              <polygon
                points={`${PL},${H - PB} ${s.x.map((xv, i) => `${xOf(xv, i, s)},${yOf(s.y[i] ?? 0)}`).join(" ")} ${PL + xw},${H - PB}`}
                fill={color} opacity="0.25"
              />
            )}
            {lineLike && <polyline points={pts} fill="none" stroke={color} strokeWidth={s.name === "random" ? 1.5 : 2.4} strokeDasharray={s.name === "random" ? "5 4" : undefined} />}
            {(fig.kind === "scatter" || fig.kind === "bubble" || (!lineLike && fig.kind !== "area")) &&
              s.x.map((xv, i) => {
                const r = fig.kind === "bubble" && fig.sizes
                  ? 4 + Math.sqrt((fig.sizes[i] || 1) / sizeMax) * 18
                  : 5;
                return <circle key={i} cx={xOf(xv, i, s)} cy={yOf(s.y[i] ?? 0)} r={r} fill={color} opacity="0.75" />;
              })}
            {lineLike && fig.kind !== "area" && s.name.startsWith("y=") && (
              <text x={W - PR - 4} y={PT + 14 + si * 14} fontSize="10" textAnchor="end" fill={color}>{s.name}</text>
            )}
          </g>
        );
      })}
      {fig.series.length > 1 && fig.series[0].name !== "점" && (
        <g>
          {fig.series.slice(0, 6).map((s, i) => (
            <g key={i} transform={`translate(${PL + i * 110}, ${PT - 10})`}>
              <rect width="10" height="10" rx="2" fill={s.color || NATIVE_PALETTE[i]} />
              <text x="14" y="9" fontSize="10" fill="var(--color-text-tertiary)">{s.name.slice(0, 10)}</text>
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

function BarPlot({ fig }: { fig: NativeFig }) {
  const labels = fig.labels || [];
  const values = fig.values || [];
  const err = fig.series[0]?.y || [];
  const max = niceMax(Math.max(1, ...values.map((v, i) => Math.abs(v) + (err[i] || 0))));
  const xw = W - PL - PR, yw = H - PT - PB;
  const cw = xw / Math.max(1, labels.length);
  const bw = Math.min(cw * 0.62, 48);
  const y0 = PT + yw;
  const yOf = (v: number) => PT + yw * (1 - v / max);
  let acc = 0;
  return (
    <g>
      <AxisFrame xMin={0} xMax={1} yMin={0} yMax={max} xtitle={fig.xtitle} ytitle={fig.ytitle} catX={labels} />
      {values.map((v, i) => {
        const cx = PL + cw * i + cw / 2;
        if (fig.kind === "waterfall") {
          const y1 = yOf(acc + v), y2 = yOf(acc);
          const top = Math.min(y1, y2), h = Math.abs(y2 - y1);
          acc += v;
          return (
            <g key={i}>
              <rect x={cx - bw / 2} y={top} width={bw} height={Math.max(1, h)} rx="3" fill={v >= 0 ? NATIVE_PALETTE[0] : NATIVE_PALETTE[2]} />
              <text x={cx} y={top - 4} fontSize="9" textAnchor="middle" fill="var(--color-text-primary)">{fmt(v)}</text>
            </g>
          );
        }
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={yOf(v)} width={bw} height={Math.max(1, y0 - yOf(v))} rx="3" fill={NATIVE_PALETTE[i % NATIVE_PALETTE.length]} />
            {err[i] != null && (
              <line x1={cx} y1={yOf(v - err[i])} x2={cx} y2={yOf(v + err[i])} stroke={chartTheme().ink} strokeWidth="1.5" />
            )}
            <text x={cx} y={yOf(v) - 5} fontSize="9" textAnchor="middle" fill="var(--color-text-primary)">{fmt(v)}</text>
          </g>
        );
      })}
    </g>
  );
}

function HBarPlot({ fig }: { fig: NativeFig }) {
  const labels = fig.labels || [];
  const values = [...(fig.values || [])];
  if (fig.kind === "funnel") {
    // already value order
  }
  const max = niceMax(Math.max(1, ...values));
  const ch = (H - PT - PB) / Math.max(1, labels.length);
  const bh = Math.min(ch * 0.62, 28);
  const xOf = (v: number) => PL + (v / max) * (W - PL - PR);
  return (
    <g>
      {values.map((v, i) => {
        const cy = PT + ch * i + ch / 2;
        const w = fig.kind === "funnel" ? (W - PL - PR) * (0.35 + 0.65 * (v / max)) : xOf(v) - PL;
        const x0 = fig.kind === "funnel" ? PL + ((W - PL - PR) - w) / 2 : PL;
        return (
          <g key={i}>
            {fig.kind === "dot" ? (
              <>
                <line x1={PL} y1={cy} x2={xOf(v)} y2={cy} stroke={NATIVE_PALETTE[i % 8]} strokeWidth="2" />
                <circle cx={xOf(v)} cy={cy} r="6" fill={NATIVE_PALETTE[i % 8]} />
              </>
            ) : (
              <rect x={x0} y={cy - bh / 2} width={Math.max(1, w)} height={bh} rx="3" fill={NATIVE_PALETTE[i % 8]} />
            )}
            <text x={PL - 6} y={cy + 3} fontSize="10" textAnchor="end" fill="var(--color-text-primary)">{labels[i]?.slice(0, 12)}</text>
            <text x={x0 + (fig.kind === "dot" ? xOf(v) - PL : w) + 6} y={cy + 3} fontSize="9" fill="var(--color-text-tertiary)">{fmt(v)}</text>
          </g>
        );
      })}
      <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="var(--color-border-secondary)" />
      {fig.title && <text x={W / 2} y={16} textAnchor="middle" fontSize="12" fill="var(--brand-ink)">{fig.title}</text>}
    </g>
  );
}

function PiePlot({ fig, donut }: { fig: NativeFig; donut?: boolean }) {
  const labels = fig.labels || [];
  const values = fig.values || [];
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const cx = W / 2 - 60, cy = H / 2, R = 140, r = donut ? 70 : 0;
  let ang = -Math.PI / 2;
  const slices = values.map((v, i) => {
    const a0 = ang;
    const a1 = ang + (v / total) * Math.PI * 2;
    ang = a1;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const xi0 = cx + r * Math.cos(a1), yi0 = cy + r * Math.sin(a1);
    const xi1 = cx + r * Math.cos(a0), yi1 = cy + r * Math.sin(a0);
    const d = donut
      ? `M${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} L${xi0},${yi0} A${r},${r} 0 ${large} 0 ${xi1},${yi1} Z`
      : `M${cx},${cy} L${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} Z`;
    return { d, color: NATIVE_PALETTE[i % 8], label: labels[i], pct: ((v / total) * 100).toFixed(0) };
  });
  return (
    <g>
      {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} opacity="0.9" />)}
      {donut && <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fontWeight="600" fill="var(--brand-ink)">{fmt(total)}</text>}
      {slices.map((s, i) => (
        <g key={`l${i}`} transform={`translate(${W - 200}, ${60 + i * 22})`}>
          <rect width="12" height="12" rx="2" fill={s.color} />
          <text x="18" y="11" fontSize="12" fill="var(--color-text-primary)">{s.label?.slice(0, 14)} {s.pct}%</text>
        </g>
      ))}
    </g>
  );
}

function TreemapPlot({ fig }: { fig: NativeFig }) {
  const labels = fig.labels || [];
  const values = fig.values || [];
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let x = PL, y = PT;
  const maxW = W - PL - PR, maxH = H - PT - PB;
  const items = labels.map((l, i) => ({ l, v: values[i], w: (values[i] / total) * maxW }));
  return (
    <g>
      {items.map((it, i) => {
        const ww = Math.max(40, it.w);
        if (x + ww > PL + maxW) { x = PL; y += maxH / 2; }
        const node = (
          <g key={i}>
            <rect x={x} y={y} width={ww - 3} height={maxH / 2 - 6} rx="4" fill={NATIVE_PALETTE[i % 8]} opacity="0.85" />
            <text x={x + 8} y={y + 22} fontSize="12" fill={ON_FILL}>{it.l.slice(0, 10)}</text>
            <text x={x + 8} y={y + 40} fontSize="11" fill={ON_FILL}>{fmt(it.v)}</text>
          </g>
        );
        x += ww;
        return node;
      })}
    </g>
  );
}

function HistPlot({ fig }: { fig: NativeFig }) {
  const vals = (fig.series[0]?.y || []).filter((v) => !isNaN(v));
  if (!vals.length) return <text x={W / 2} y={H / 2} textAnchor="middle" fill="var(--color-text-tertiary)">데이터 없음</text>;
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const bins = Math.min(10, Math.max(4, Math.ceil(Math.sqrt(vals.length))));
  const bw = (mx - mn) / bins || 1;
  const counts = new Array(bins).fill(0);
  vals.forEach((v) => {
    let b = Math.floor((v - mn) / bw);
    if (b >= bins) b = bins - 1;
    if (b < 0) b = 0;
    counts[b]++;
  });
  return (
    <BarPlot fig={{ kind: "bar", labels: counts.map((_, i) => fmt(mn + bw * i)), values: counts, series: [], xtitle: fig.xtitle, ytitle: "빈도" }} />
  );
}

function BoxPlot({ fig }: { fig: NativeFig }) {
  const q = (arr: number[], p: number) => {
    const a = [...arr].sort((x, y) => x - y);
    if (!a.length) return 0;
    const idx = (a.length - 1) * p;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    return a[lo] + ((a[hi] ?? a[lo]) - a[lo]) * (idx - lo);
  };
  const all = fig.series.flatMap((s) => s.y);
  const max = niceMax(Math.max(1, ...all));
  const min = Math.min(0, ...all);
  const xw = W - PL - PR, yw = H - PT - PB;
  const gw = xw / Math.max(1, fig.series.length);
  const yOf = (v: number) => PT + yw * (1 - (v - min) / (max - min || 1));
  return (
    <g>
      <AxisFrame xMin={0} xMax={1} yMin={min} yMax={max} xtitle={fig.xtitle} ytitle={fig.ytitle} catX={fig.series.map((s) => s.name)} />
      {fig.series.map((s, i) => {
        if (!s.y.length) return null;
        const cx = PL + gw * i + gw / 2;
        const bw = Math.min(gw * 0.45, 40);
        const q1 = q(s.y, 0.25), q2 = q(s.y, 0.5), q3 = q(s.y, 0.75);
        const lo = Math.min(...s.y), hi = Math.max(...s.y);
        const color = s.color || NATIVE_PALETTE[i % 8];
        return (
          <g key={i}>
            <line x1={cx} y1={yOf(lo)} x2={cx} y2={yOf(hi)} stroke={color} />
            <rect x={cx - bw / 2} y={yOf(q3)} width={bw} height={Math.max(2, yOf(q1) - yOf(q3))} fill={color} opacity="0.35" stroke={color} />
            <line x1={cx - bw / 2} y1={yOf(q2)} x2={cx + bw / 2} y2={yOf(q2)} stroke={color} strokeWidth="2.5" />
            {fig.kind === "violin" && s.y.map((v, j) => (
              <circle key={j} cx={cx + ((j % 5) - 2) * 3} cy={yOf(v)} r="2" fill={color} opacity="0.35" />
            ))}
          </g>
        );
      })}
    </g>
  );
}

function HeatPlot({ fig }: { fig: NativeFig }) {
  const rows = fig.rows || [];
  const cols = fig.cols || [];
  const matrix = fig.matrix || [];
  const flat = matrix.flat();
  const max = Math.max(1, ...flat.map(Math.abs));
  const cellW = (W - 120 - PR) / Math.max(1, cols.length);
  const cellH = Math.min(36, (H - 80) / Math.max(1, rows.length));
  return (
    <g>
      {cols.map((c, j) => (
        <text key={j} x={110 + cellW * j + cellW / 2} y={40} fontSize="10" textAnchor="middle" fill="var(--color-text-tertiary)">{c.slice(0, 8)}</text>
      ))}
      {rows.map((r, i) => (
        <g key={i}>
          <text x={100} y={55 + cellH * i + cellH / 2} fontSize="10" textAnchor="end" fill="var(--color-text-primary)">{r.slice(0, 10)}</text>
          {(matrix[i] || []).map((v, j) => {
            const t = Math.abs(v) / max;
            return (
              <g key={j}>
                <rect x={110 + cellW * j} y={48 + cellH * i} width={cellW - 2} height={cellH - 2} rx="2"
                  fill={v < 0 ? NATIVE_PALETTE[2] : NATIVE_PALETTE[0]} opacity={0.15 + t * 0.8} />
                <text x={110 + cellW * j + cellW / 2} y={48 + cellH * i + cellH / 2 + 3} fontSize="9" textAnchor="middle"
                  fill={t > 0.55 ? ON_FILL : "var(--color-text-primary)"}>{fmt(v)}</text>
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}

function ParallelPlot({ fig }: { fig: NativeFig }) {
  const axes = fig.cols || [];
  const rows = fig.rows || [];
  const matrix = fig.matrix || [];
  if (axes.length < 2) return <text x={W / 2} y={H / 2} textAnchor="middle" fill="var(--color-text-tertiary)">축 2개 이상 필요</text>;
  const xOf = (j: number) => PL + (j / (axes.length - 1)) * (W - PL - PR);
  const colMax = axes.map((_, j) => Math.max(1, ...matrix.map((r) => r[j] || 0)));
  const colMin = axes.map((_, j) => Math.min(0, ...matrix.map((r) => r[j] || 0)));
  const yOf = (j: number, v: number) => PT + (H - PT - PB) * (1 - (v - colMin[j]) / (colMax[j] - colMin[j] || 1));
  return (
    <g>
      {axes.map((a, j) => (
        <g key={j}>
          <line x1={xOf(j)} y1={PT} x2={xOf(j)} y2={H - PB} stroke="var(--color-border-tertiary)" />
          <text x={xOf(j)} y={H - PB + 14} fontSize="10" textAnchor="middle" fill="var(--color-text-tertiary)">{a.slice(0, 8)}</text>
        </g>
      ))}
      {rows.slice(0, 50).map((_, i) => (
        <polyline key={i}
          points={axes.map((_, j) => `${xOf(j)},${yOf(j, matrix[i]?.[j] || 0)}`).join(" ")}
          fill="none" stroke={NATIVE_PALETTE[i % 8]} strokeWidth="1.4" opacity="0.7" />
      ))}
    </g>
  );
}

function RadarPlot({ fig }: { fig: NativeFig }) {
  const axes = fig.labels || [];
  const cx = W / 2, cy = H / 2 + 10, R = Math.min(W, H) / 2 - 70;
  const max = Math.max(1, ...fig.series.flatMap((s) => s.y));
  const pt = (i: number, v: number) => {
    const a = (i / axes.length) * Math.PI * 2 - Math.PI / 2;
    const rr = (v / max) * R;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)] as const;
  };
  return (
    <g>
      {[0.25, 0.5, 0.75, 1].map((f, k) => (
        <polygon key={k}
          points={axes.map((_, i) => { const a = (i / axes.length) * Math.PI * 2 - Math.PI / 2; return `${cx + R * f * Math.cos(a)},${cy + R * f * Math.sin(a)}`; }).join(" ")}
          fill="none" stroke="var(--color-border-tertiary)" />
      ))}
      {axes.map((ax, i) => {
        const a = (i / axes.length) * Math.PI * 2 - Math.PI / 2;
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} stroke="var(--color-border-tertiary)" />
            <text x={cx + (R + 16) * Math.cos(a)} y={cy + (R + 16) * Math.sin(a) + 3} fontSize="10" textAnchor="middle" fill="var(--color-text-tertiary)">{ax.slice(0, 8)}</text>
          </g>
        );
      })}
      {fig.series.map((s, si) => (
        <polygon key={si}
          points={s.y.map((v, i) => pt(i, v).join(",")).join(" ")}
          fill={s.color || NATIVE_PALETTE[si]} fillOpacity="0.2" stroke={s.color || NATIVE_PALETTE[si]} strokeWidth="2" />
      ))}
    </g>
  );
}

function PolarPlot({ fig }: { fig: NativeFig }) {
  const labels = fig.labels || [];
  const values = fig.values || [];
  const max = niceMax(Math.max(1, ...values));
  const cx = W / 2, cy = H / 2, R = 150;
  const step = (Math.PI * 2) / Math.max(1, labels.length);
  return (
    <g>
      {[0.33, 0.66, 1].map((f, i) => <circle key={i} cx={cx} cy={cy} r={R * f} fill="none" stroke="var(--color-border-tertiary)" />)}
      {values.map((v, i) => {
        const a0 = -Math.PI / 2 + step * i;
        const a1 = a0 + step * 0.85;
        const rr = (v / max) * R;
        const x0 = cx + rr * Math.cos(a0), y0 = cy + rr * Math.sin(a0);
        const x1 = cx + rr * Math.cos(a1), y1 = cy + rr * Math.sin(a1);
        return (
          <g key={i}>
            <path d={`M${cx},${cy} L${x0},${y0} A${rr},${rr} 0 0 1 ${x1},${y1} Z`} fill={NATIVE_PALETTE[i % 8]} opacity="0.8" />
            <text x={cx + (R + 18) * Math.cos(a0 + step / 2)} y={cy + (R + 18) * Math.sin(a0 + step / 2)} fontSize="10" textAnchor="middle" fill="var(--color-text-tertiary)">{labels[i]?.slice(0, 6)}</text>
          </g>
        );
      })}
    </g>
  );
}

function SankeyPlot({ fig }: { fig: NativeFig }) {
  const nodes = fig.nodes || [];
  const links = fig.links || [];
  if (!nodes.length || !links.length) {
    return <text x={W / 2} y={H / 2} textAnchor="middle" fill="var(--color-text-tertiary)">관계 데이터 없음</text>;
  }
  const leftIdx = new Set(links.map((l) => l.s));
  const lefts = nodes.map((n, i) => ({ n, i })).filter((o) => leftIdx.has(o.i));
  const rights = nodes.map((n, i) => ({ n, i })).filter((o) => !leftIdx.has(o.i));
  const ly: Record<number, number> = {};
  const ry: Record<number, number> = {};
  lefts.forEach((o, i) => { ly[o.i] = 40 + (i / Math.max(1, lefts.length)) * (H - 80); });
  rights.forEach((o, i) => { ry[o.i] = 40 + (i / Math.max(1, rights.length)) * (H - 80); });
  const x0 = 140, x1 = W - 140;
  const maxW = Math.max(1, ...links.map((l) => l.v));
  return (
    <g>
      {links.map((l, i) => {
        const y0 = ly[l.s] ?? 100, y1 = ry[l.t] ?? 100;
        const w = 1 + (l.v / maxW) * 16;
        return <path key={i} d={`M${x0},${y0} C${(x0 + x1) / 2},${y0} ${(x0 + x1) / 2},${y1} ${x1},${y1}`} fill="none" stroke={NATIVE_PALETTE[l.s % 8]} strokeOpacity="0.45" strokeWidth={w} />;
      })}
      {lefts.map((o, i) => (
        <g key={`l${i}`}>
          <rect x={x0 - 6} y={(ly[o.i] || 0) - 8} width="6" height="16" fill={NATIVE_PALETTE[i % 8]} />
          <text x={x0 - 12} y={(ly[o.i] || 0) + 4} fontSize="11" textAnchor="end" fill="var(--color-text-primary)">{o.n.slice(0, 12)}</text>
        </g>
      ))}
      {rights.map((o, i) => (
        <g key={`r${i}`}>
          <rect x={x1} y={(ry[o.i] || 0) - 8} width="6" height="16" fill={NATIVE_PALETTE[i % 8]} opacity="0.7" />
          <text x={x1 + 12} y={(ry[o.i] || 0) + 4} fontSize="11" fill="var(--color-text-primary)">{o.n.slice(0, 12)}</text>
        </g>
      ))}
    </g>
  );
}

function GaugePlot({ fig }: { fig: NativeFig }) {
  const val = fig.gaugeValue || 0;
  const max = fig.gaugeMax || 100;
  const t = Math.min(1, Math.max(0, val / max));
  const cx = W / 2, cy = H / 2 + 40, R = 160;
  const a0 = Math.PI, a1 = Math.PI + Math.PI * t;
  const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
  const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
  return (
    <g>
      <path d={`M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy}`} fill="none" stroke="var(--color-border-tertiary)" strokeWidth="22" strokeLinecap="round" />
      <path d={`M${x0},${y0} A${R},${R} 0 ${t > 0.5 ? 1 : 0} 1 ${x1},${y1}`} fill="none" stroke={NATIVE_PALETTE[0]} strokeWidth="22" strokeLinecap="round" />
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize="36" fontWeight="700" fill="var(--brand-ink)">{fmt(val)}</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="13" fill="var(--color-text-tertiary)">/ {fmt(max)}</text>
    </g>
  );
}

function KpiPlot({ fig }: { fig: NativeFig }) {
  const v = fig.kpiValue || 0;
  const d = fig.kpiDelta || 0;
  return (
    <g>
      <text x={W / 2} y={H / 2 - 30} textAnchor="middle" fontSize="18" fill="var(--color-text-tertiary)">{fig.title || "KPI"}</text>
      <text x={W / 2} y={H / 2 + 30} textAnchor="middle" fontSize="64" fontWeight="700" fill="var(--brand-ink)">{fmt(v)}</text>
      <text x={W / 2} y={H / 2 + 70} textAnchor="middle" fontSize="18" fill={d >= 0 ? TREND_UP : TREND_DOWN}>
        {d >= 0 ? "▲" : "▼"} {fmt(Math.abs(d))}
      </text>
    </g>
  );
}

function CandlePlot({ fig }: { fig: NativeFig }) {
  const o = fig.ohlc;
  if (!o) return null;
  const n = Math.min(o.x.length, o.open.length, 40);
  const highs = o.high.slice(0, n), lows = o.low.slice(0, n);
  const max = niceMax(Math.max(...highs, 1));
  const min = Math.min(...lows, 0);
  const xw = W - PL - PR, yw = H - PT - PB;
  const cw = xw / n;
  const yOf = (v: number) => PT + yw * (1 - (v - min) / (max - min || 1));
  return (
    <g>
      <AxisFrame xMin={0} xMax={1} yMin={min} yMax={max} xtitle={fig.xtitle} catX={o.x.slice(0, n)} />
      {Array.from({ length: n }).map((_, i) => {
        const cx = PL + cw * i + cw / 2;
        const up = o.close[i] >= o.open[i];
        const color = up ? TREND_UP : TREND_DOWN;
        return (
          <g key={i}>
            <line x1={cx} y1={yOf(o.high[i])} x2={cx} y2={yOf(o.low[i])} stroke={color} />
            <rect x={cx - Math.min(cw * 0.3, 8)} y={Math.min(yOf(o.open[i]), yOf(o.close[i]))}
              width={Math.min(cw * 0.6, 16)} height={Math.max(2, Math.abs(yOf(o.open[i]) - yOf(o.close[i])))}
              fill={color} />
          </g>
        );
      })}
    </g>
  );
}
