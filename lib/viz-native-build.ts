/**
 * 자체 시각화 엔진 — Plotly 없이 DataModel+Mapping → 렌더 스펙.
 */
import {
  DataModel, Mapping, col, numCol, numCols, catCols,
} from "./viz-engine";

export type NativeSeries = { name: string; x: (string | number)[]; y: number[]; color?: string };
export type NativeFig = {
  kind:
    | "scatter" | "line" | "area" | "bar" | "hbar" | "gbar" | "pie" | "donut"
    | "bubble" | "dot" | "histogram" | "box" | "violin" | "ecdf" | "errbar"
    | "heatmap" | "corr" | "parcoords" | "radar" | "polar" | "sankey"
    | "treemap" | "funnel" | "waterfall" | "gauge" | "kpi" | "roc"
    | "candle" | "ohlc" | "note";
  title?: string;
  xtitle?: string;
  ytitle?: string;
  series: NativeSeries[];
  labels?: string[];
  values?: number[];
  matrix?: number[][];
  cols?: string[];
  rows?: string[];
  nodes?: string[];
  links?: { s: number; t: number; v: number }[];
  gaugeValue?: number;
  gaugeMax?: number;
  kpiValue?: number;
  kpiDelta?: number;
  note?: string;
  logY?: boolean;
  sizes?: number[];
  groups?: string[];
  ohlc?: { x: string[]; open: number[]; high: number[]; low: number[]; close: number[] };
};

const PAL = ["#534AB7", "#0F6E56", "#D85A30", "#185FA5", "#9A3412", "#7c3aed", "#0e7490", "#b45309"];

function agg(d: DataModel, by: string, val: string | null) {
  const m: Record<string, number> = {};
  d.rows.forEach((r) => {
    const k = String(r[by]);
    m[k] = (m[k] || 0) + (val ? parseFloat(r[val]) || 0 : 1);
  });
  return m;
}
function groups(d: DataModel, g: string) {
  return [...new Set(col(d, g).map(String))];
}
function corr(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? +(num / Math.sqrt(da * db)).toFixed(2) : 0;
}
function ols(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    den += (x[i] - mx) ** 2;
  }
  const b = den ? num / den : 0;
  return { a: my - b * mx, b };
}
function has(d: DataModel, cols: string[]) {
  return cols.every((c) => d.columns.some((x) => x.name === c));
}
function note(msg: string): NativeFig {
  return { kind: "note", series: [], note: msg };
}

function xyScatter(d: DataModel, m: Mapping, opts?: { logY?: boolean; withReg?: boolean; byGroup?: boolean }): NativeFig {
  const nums = numCols(d);
  let mx = m.x;
  let my = m.y;
  // 범주열이 X로 잡힌 경우 연속형 2열로 자동 보정
  if (nums.length >= 2 && (!nums.includes(mx) || !nums.includes(my) || mx === my)) {
    mx = nums[0];
    my = nums.find((n) => n !== mx) || nums[1];
  }
  const xs = numCol(d, mx);
  const ys = numCol(d, my);
  if (!xs.length || !ys.length) {
    return note(`산점도에 쓸 숫자열을 찾지 못했습니다. ①에서 키·몸무게 같은 자료를 적용하고, ②에서 가로·세로를 숫자열로 고르세요. (현재 X=${m.x}, Y=${m.y})`);
  }
  if (opts?.byGroup && m.g) {
    const gs = groups(d, m.g);
    return {
      kind: "scatter",
      xtitle: mx,
      ytitle: my,
      logY: opts.logY,
      series: gs.map((gv, i) => {
        const rows = d.rows.filter((r) => String(r[m.g!]) === gv);
        return {
          name: gv,
          x: rows.map((r) => parseFloat(r[mx])).filter((v) => !isNaN(v)),
          y: rows.map((r) => parseFloat(r[my])).filter((v) => !isNaN(v)),
          color: PAL[i % PAL.length],
        };
      }),
    };
  }
  const series: NativeSeries[] = [{ name: "점", x: xs, y: ys, color: PAL[0] }];
  if (opts?.withReg && xs.length > 1) {
    const { a, b } = ols(xs, ys);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    series.push({
      name: `y=${a.toFixed(2)}+${b.toFixed(2)}x`,
      x: [x0, x1],
      y: [a + b * x0, a + b * x1],
      color: "#C0392B",
    });
  }
  return {
    kind: "scatter",
    xtitle: mx,
    ytitle: my,
    logY: opts?.logY,
    sizes: m.s ? numCol(d, m.s) : undefined,
    series,
  };
}

export function buildNativeFig(chartId: string, d: DataModel, m: Mapping): NativeFig {
  const id = chartId;
  const nums = numCols(d);
  const cats = catCols(d);

  try {
    if (id === "scatter") return xyScatter(d, m);
    if (id === "log") return xyScatter(d, m, { logY: true });
    if (id === "regression") return xyScatter(d, m, { withReg: true });
    if (id === "cluster") return xyScatter(d, m, { byGroup: true });
    if (id === "bubble") {
      const fig = xyScatter(d, m);
      fig.kind = "bubble";
      fig.sizes = m.s ? numCol(d, m.s) : xsFill(numCol(d, m.x).length, 12);
      return fig;
    }
    if (id === "line" || id === "timeseries") {
      return {
        kind: "line",
        xtitle: m.x,
        ytitle: m.y,
        series: [{ name: m.y, x: col(d, m.x).map(String), y: alignedY(d, m.x, m.y), color: PAL[0] }],
      };
    }
    if (id === "area") {
      return {
        kind: "area",
        xtitle: m.x,
        ytitle: m.y,
        series: [{ name: m.y, x: col(d, m.x).map(String), y: alignedY(d, m.x, m.y), color: PAL[0] }],
      };
    }
    if (id === "bar" || id === "waterfall") {
      const a = agg(d, m.x, nums.includes(m.y) ? m.y : null);
      return {
        kind: id === "waterfall" ? "waterfall" : "bar",
        xtitle: m.x,
        ytitle: m.y,
        labels: Object.keys(a),
        values: Object.values(a),
        series: [],
      };
    }
    if (id === "hbar" || id === "funnel" || id === "dot") {
      const a = agg(d, m.x, nums.includes(m.y) ? m.y : null);
      return {
        kind: id === "funnel" ? "funnel" : id === "dot" ? "dot" : "hbar",
        xtitle: m.y,
        ytitle: m.x,
        labels: Object.keys(a),
        values: Object.values(a),
        series: [],
      };
    }
    if (id === "gbar") {
      const gkey = m.g || m.x;
      const gs = groups(d, gkey);
      return {
        kind: "gbar",
        xtitle: gkey,
        ytitle: m.y,
        labels: gs,
        values: gs.map((gv) =>
          d.rows.filter((r) => String(r[gkey]) === gv).reduce((s, r) => s + (parseFloat(r[m.y]) || 0), 0)
        ),
        series: [],
      };
    }
    if (id === "pie" || id === "donut" || id === "treemap" || id === "sunburst" || id === "icicle") {
      const a = agg(d, m.x, nums.includes(m.y) ? m.y : null);
      return {
        kind: id === "donut" ? "donut" : id === "pie" ? "pie" : "treemap",
        labels: Object.keys(a),
        values: Object.values(a),
        series: [],
        title: id === "sunburst" || id === "icicle" ? `${id} (비중)` : undefined,
      };
    }
    if (id === "histogram" || id === "density") {
      const vals = numCol(d, m.y).length ? numCol(d, m.y) : numCol(d, m.x);
      return { kind: "histogram", ytitle: "빈도", series: [{ name: "값", x: vals, y: vals, color: PAL[0] }] };
    }
    if (id === "box" || id === "violin") {
      const gkey = m.g || m.x;
      const gs = groups(d, gkey);
      return {
        kind: id === "violin" ? "violin" : "box",
        xtitle: gkey,
        ytitle: m.y,
        series: gs.map((gv, i) => ({
          name: gv,
          x: [gv],
          y: d.rows.filter((r) => String(r[gkey]) === gv).map((r) => parseFloat(r[m.y])).filter((v) => !isNaN(v)),
          color: PAL[i % PAL.length],
        })),
      };
    }
    if (id === "ecdf") {
      const xs = numCol(d, m.y).length ? numCol(d, m.y) : numCol(d, m.x);
      const s = [...xs].sort((a, b) => a - b);
      const y = s.map((_, i) => (i + 1) / s.length);
      return { kind: "ecdf", xtitle: m.y || m.x, ytitle: "누적비율", series: [{ name: "ECDF", x: s, y, color: PAL[0] }] };
    }
    if (id === "errbar") {
      const gkey = m.g || m.x;
      const gs = groups(d, gkey);
      const means = gs.map((gv) => {
        const a = d.rows.filter((r) => String(r[gkey]) === gv).map((r) => parseFloat(r[m.y])).filter((v) => !isNaN(v));
        return a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
      });
      const sds = gs.map((gv, i) => {
        const a = d.rows.filter((r) => String(r[gkey]) === gv).map((r) => parseFloat(r[m.y])).filter((v) => !isNaN(v));
        if (!a.length) return 0;
        return Math.sqrt(a.reduce((s, v) => s + (v - means[i]) ** 2, 0) / a.length);
      });
      return {
        kind: "errbar",
        xtitle: gkey,
        ytitle: m.y,
        labels: gs,
        values: means,
        series: [{ name: "sd", x: gs, y: sds, color: PAL[1] }],
      };
    }
    if (id === "heatmap" || id === "hist2d" || id === "contour" || id === "surface") {
      if (nums.length >= 2 && (id === "heatmap" || id === "surface")) {
        return {
          kind: "heatmap",
          rows: d.rows.slice(0, 12).map((_, i) => `r${i + 1}`),
          cols: nums.slice(0, 6),
          matrix: d.rows.slice(0, 12).map((r) => nums.slice(0, 6).map((n) => parseFloat(r[n]) || 0)),
          series: [],
        };
      }
      // 2D density approx as binned heatmap
      const xs = numCol(d, m.x), ys = numCol(d, m.y);
      const bins = 6;
      const matrix = Array.from({ length: bins }, () => Array(bins).fill(0));
      if (xs.length) {
        const xmin = Math.min(...xs), xmax = Math.max(...xs) || 1;
        const ymin = Math.min(...ys), ymax = Math.max(...ys) || 1;
        for (let i = 0; i < xs.length; i++) {
          const xi = Math.min(bins - 1, Math.floor(((xs[i] - xmin) / (xmax - xmin || 1)) * bins));
          const yi = Math.min(bins - 1, Math.floor(((ys[i] - ymin) / (ymax - ymin || 1)) * bins));
          matrix[bins - 1 - yi][xi]++;
        }
      }
      return {
        kind: "heatmap",
        rows: Array.from({ length: bins }, (_, i) => `y${bins - i}`),
        cols: Array.from({ length: bins }, (_, i) => `x${i + 1}`),
        matrix,
        series: [],
        title: id === "contour" ? "등고(밀도)" : "2D 밀도",
      };
    }
    if (id === "corr") {
      const ns = nums.slice(0, 6);
      const matrix = ns.map((a) => ns.map((b) => corr(numCol(d, a), numCol(d, b))));
      return { kind: "corr", rows: ns, cols: ns, matrix, series: [] };
    }
    if (id === "splom" || id === "parcoords") {
      const ns = nums.slice(0, 5);
      return {
        kind: "parcoords",
        cols: ns,
        rows: d.rows.slice(0, 40).map((_, i) => `r${i + 1}`),
        matrix: d.rows.slice(0, 40).map((r) => ns.map((n) => parseFloat(r[n]) || 0)),
        series: [],
      };
    }
    if (id === "parcats") {
      const cs = cats.slice(0, 3);
      if (cs.length < 2) return note("범주형 열 2개 이상이 필요합니다.");
      const sk = buildLinks(d, cs[0], cs[1]);
      return { kind: "sankey", nodes: sk.nodes, links: sk.links, series: [] };
    }
    if (id === "radar") {
      const gkey = m.g || cats[0] || m.x;
      const gs = groups(d, gkey).slice(0, 4);
      const ns = nums.slice(0, 6);
      if (!ns.length) return note("숫자 열이 필요합니다.");
      return {
        kind: "radar",
        labels: ns,
        series: gs.map((gv, i) => {
          const rws = d.rows.filter((r) => String(r[gkey]) === gv);
          return {
            name: gv,
            x: ns,
            y: ns.map((n) => rws.reduce((s, r) => s + (parseFloat(r[n]) || 0), 0) / Math.max(1, rws.length)),
            color: PAL[i % PAL.length],
          };
        }),
      };
    }
    if (id === "polar") {
      const a = agg(d, m.x, nums.includes(m.y) ? m.y : null);
      return { kind: "polar", labels: Object.keys(a), values: Object.values(a), series: [] };
    }
    if (id === "sankey") {
      const cs = cats;
      if (cs.length >= 2) {
        const sk = buildLinks(d, cs[0], cs[1]);
        return { kind: "sankey", nodes: sk.nodes, links: sk.links, series: [] };
      }
      // 출처,목적,건수 형식
      if (has(d, ["출처", "목적"]) || has(d, ["출처", "목적", "건수"])) {
        const sk = buildLinks(d, "출처", "목적", has(d, ["건수"]) ? "건수" : null);
        return { kind: "sankey", nodes: sk.nodes, links: sk.links, series: [] };
      }
      return note("생키는 범주형 2열(또는 출처·목적)이 필요합니다.");
    }
    if (id === "gauge") {
      const v = numCol(d, m.y);
      const val = v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
      return { kind: "gauge", gaugeValue: +val.toFixed(2), gaugeMax: Math.max(...v, 100), series: [] };
    }
    if (id === "kpi") {
      const v = numCol(d, m.y);
      return {
        kind: "kpi",
        kpiValue: v[v.length - 1] || 0,
        kpiDelta: (v[v.length - 1] || 0) - (v[0] || 0),
        series: [],
        title: m.y,
      };
    }
    if (id === "candle" || id === "ohlc") {
      if (!has(d, ["open", "high", "low", "close"])) return note("open / high / low / close 열이 필요합니다.");
      return {
        kind: id === "candle" ? "candle" : "ohlc",
        ohlc: {
          x: col(d, m.x).map(String),
          open: numCol(d, "open"),
          high: numCol(d, "high"),
          low: numCol(d, "low"),
          close: numCol(d, "close"),
        },
        series: [],
        xtitle: m.x,
      };
    }
    if (id === "choropleth" || id === "geobubble") {
      const a = agg(d, m.x, nums.includes(m.y) ? m.y : null);
      return {
        kind: "hbar",
        title: id === "choropleth" ? "지역 값 (막대 대체)" : "지도 버블 (가로막대 대체)",
        labels: Object.keys(a),
        values: Object.values(a),
        series: [],
        note: "지도 타일은 자체 SVG에서 가로 막대로 표현합니다.",
      };
    }
    if (id === "scatter3d") {
      const fig = xyScatter(d, { x: nums[0] || m.x, y: nums[1] || m.y, g: m.g, s: nums[2] });
      fig.title = "3D 산점 (2축 투영)";
      fig.note = `Z축 후보: ${nums[2] || "—"}`;
      return fig;
    }
    if (id === "roc") {
      if (has(d, ["FPR", "TPR"])) {
        return {
          kind: "roc",
          series: [
            { name: "ROC", x: numCol(d, "FPR"), y: numCol(d, "TPR"), color: PAL[0] },
            { name: "random", x: [0, 1], y: [0, 1], color: "#999" },
          ],
          xtitle: "FPR",
          ytitle: "TPR",
        };
      }
      return {
        kind: "roc",
        series: [
          { name: "ROC", x: [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.7, 1], y: [0, 0.4, 0.6, 0.75, 0.85, 0.92, 0.97, 1], color: PAL[0] },
          { name: "random", x: [0, 1], y: [0, 1], color: "#999" },
        ],
        xtitle: "FPR",
        ytitle: "TPR",
      };
    }
    // fallback
    return xyScatter(d, m);
  } catch {
    return note("이 그래프는 지금 자료와 잘 안 맞아요. 자료/축을 바꿔보세요.");
  }
}

function xsFill(n: number, v: number) {
  return Array.from({ length: n }, () => v);
}
function alignedY(d: DataModel, xName: string, yName: string) {
  return d.rows.map((r) => parseFloat(r[yName])).map((v) => (isNaN(v) ? 0 : v));
}
function buildLinks(d: DataModel, aCol: string, bCol: string, vCol: string | null = null) {
  const A = [...new Set(col(d, aCol).map(String))];
  const B = [...new Set(col(d, bCol).map(String))];
  const links: { s: number; t: number; v: number }[] = [];
  A.forEach((a, i) => {
    B.forEach((b, j) => {
      const rows = d.rows.filter((r) => String(r[aCol]) === a && String(r[bCol]) === b);
      const v = vCol
        ? rows.reduce((s, r) => s + (parseFloat(r[vCol]) || 0), 0)
        : rows.length;
      if (v) links.push({ s: i, t: A.length + j, v });
    });
  });
  return { nodes: [...A, ...B], links };
}

export { PAL as NATIVE_PALETTE };
