// methodos viz engine — 차트 메타·자료 유틸 (순수 TS).
// 실제 그리기는 viz-native-build + VizNativeChart (자체 SVG, Plotly 비의존).

export type ColType = "num" | "cat";
export interface Col { name: string; type: ColType }
export type Row = Record<string, any>;
export interface DataModel { columns: Col[]; rows: Row[] }
export interface Mapping { x: string; y: string; g?: string; s?: string }

export function colType(rows: Row[], c: string): ColType {
  return rows.every((r) => r[c] === "" || r[c] == null || !isNaN(parseFloat(r[c]))) ? "num" : "cat";
}
export function inferModel(cols: string[], rows: Row[]): DataModel {
  return { columns: cols.map((c) => ({ name: c, type: colType(rows, c) })), rows };
}
export const numCols = (d: DataModel) => d.columns.filter((c) => c.type === "num").map((c) => c.name);
export const catCols = (d: DataModel) => d.columns.filter((c) => c.type === "cat").map((c) => c.name);
export const col = (d: DataModel, n: string) => d.rows.map((r) => r[n]);
export const numCol = (d: DataModel, n: string) => d.rows.map((r) => parseFloat(r[n])).filter((v) => !isNaN(v));

// === 차트 카탈로그 메타 (8개 카테고리 · 44+ 유형) — 렌더는 자체 SVG ===
type ChartMeta = [string, string];
export const CHART_BUILDERS: Record<string, ChartMeta[]> = {
  "기본": [
    ["scatter", "산점도"], ["line", "선 그래프"], ["bar", "막대"], ["hbar", "가로 막대"],
    ["gbar", "묶음 막대"], ["pie", "원형"], ["donut", "도넛"], ["bubble", "버블"],
    ["area", "영역"], ["dot", "점도표"],
  ],
  "통계": [
    ["histogram", "히스토그램"], ["box", "박스 플롯"], ["violin", "바이올린"], ["hist2d", "2D 밀도"],
    ["splom", "산점 행렬"], ["ecdf", "누적분포(ECDF)"], ["errbar", "오차 막대"], ["density", "밀도(가로 바이올린)"],
  ],
  "과학": [
    ["heatmap", "히트맵"], ["corr", "상관 히트맵"], ["contour", "등고선"], ["parcoords", "평행 좌표"],
    ["parcats", "평행 범주"], ["radar", "레이더"], ["polar", "극좌표 막대"], ["log", "로그축 산점"],
  ],
  "재무·시간": [
    ["timeseries", "시계열(레인지)"], ["candle", "캔들스틱"], ["ohlc", "OHLC"], ["waterfall", "워터폴"],
    ["funnel", "깔때기"], ["gauge", "게이지"], ["kpi", "KPI 인디케이터"],
  ],
  "계층·흐름": [
    ["treemap", "트리맵"], ["sunburst", "선버스트"], ["icicle", "아이시클"], ["sankey", "생키 다이어그램"],
  ],
  "지도": [
    ["choropleth", "코로플레스(국가)"], ["geobubble", "지도 버블"],
  ],
  "3D·ML": [
    ["scatter3d", "3D 산점"], ["surface", "표면(Surface)"], ["regression", "회귀선(OLS)"],
    ["cluster", "군집 산점"], ["roc", "ROC 곡선"],
  ],
};

export const CAT_LABEL: Record<string, string> = {
  "기본": "기본 (막대·선·원)", "통계": "분포·통계", "과학": "관계·고급",
  "재무·시간": "시간·흐름", "계층·흐름": "비중·구성", "지도": "지도", "3D·ML": "3D·예측",
};

export function findChart(id: string): { cat: string; chart: string } | null {
  for (const cat of Object.keys(CHART_BUILDERS)) {
    if (CHART_BUILDERS[cat].some((c) => c[0] === id)) return { cat, chart: id };
  }
  return null;
}

// === 데모/연구 데이터 ===
export function demoData(kind: string): [string[], Row[]] {
  const cats = ["A", "B", "C", "D"]; const rows: Row[] = [];
  if (kind === "demo_scatter") { for (let i = 0; i < 120; i++) { const x = Math.random() * 10; rows.push({ x: +x.toFixed(2), y: +(x * 1.6 + (Math.random() - 0.5) * 4).toFixed(2), group: cats[i % 4], size: +(Math.random() * 20 + 5).toFixed(1) }); } return [["x", "y", "group", "size"], rows]; }
  if (kind === "demo_ts") { let v = 100; for (let i = 0; i < 60; i++) { v += (Math.random() - 0.48) * 6; const d = new Date(2024, 0, 1 + i); rows.push({ date: d.toISOString().slice(0, 10), value: +v.toFixed(2), open: +(v - 2).toFixed(2), high: +(v + 3).toFixed(2), low: +(v - 3).toFixed(2), close: +v.toFixed(2), group: cats[i % 2] }); } return [["date", "value", "open", "high", "low", "close", "group"], rows]; }
  if (kind === "demo_cat") { cats.forEach((c) => rows.push({ category: c, count: Math.round(Math.random() * 80 + 20), mean: +(Math.random() * 5 + 1).toFixed(2) })); return [["category", "count", "mean"], rows]; }
  if (kind === "demo_multi") { for (let i = 0; i < 150; i++) { rows.push({ v1: +(Math.random() * 10).toFixed(2), v2: +(Math.random() * 8 + 1).toFixed(2), v3: +(Math.random() * 5).toFixed(2), v4: +(Math.random() * 12).toFixed(2), group: cats[i % 3] }); } return [["v1", "v2", "v3", "v4", "group"], rows]; }
  return [["x", "y"], [{ x: 1, y: 2 }, { x: 2, y: 5 }, { x: 3, y: 3 }]];
}

export function researchData(research: { artifacts?: any[] } | null): [string[], Row[]] {
  if (!research || !research.artifacts || !research.artifacts.length) {
    return [["stage", "outputs", "version"], [{ stage: "(연동된 프로젝트 없음)", outputs: 0, version: 0 }]];
  }
  const rows = research.artifacts.map((a: any, i: number) => ({
    stage: (a.stageId || ("s" + i)).split(".").pop(),
    key: a.key, mode: a.mode || "-",
    version: a.version || 1,
    size: (JSON.stringify(a.value || "")).length,
  }));
  return [["stage", "key", "mode", "version", "size"], rows];
}

export function parseCSV(txt: string): [string[], Row[]] {
  const lines = (txt || "").trim().split(/\r?\n/);
  if (lines.length < 2) return [["x", "y"], [{ x: 1, y: 2 }]];
  const cols = lines[0].split(",").map((s) => s.trim());
  const rows = lines.slice(1).map((l) => { const cells = l.split(","); const o: Row = {}; cols.forEach((c, i) => o[c] = (cells[i] || "").trim()); return o; });
  return [cols, rows];
}
