/**
 * 그래프 사양(VizSpec) — 어떤 그림이 가능한지, 가능하지만 나쁜지를 판정하는 순수 함수 층.
 *
 * 원칙: **그릴 수 없는 것은 비활성화하고, 그릴 수 있지만 나쁜 것은 경고한다.**
 * 전부 막으면 배울 기회가 사라지고, 전부 허용하면 왜곡이 생산된다.
 */
import { z } from "zod";
import type { Dataset, Variable } from "@/lib/stats-goal";

export type ChartId =
  | "bar"
  | "hbar"
  | "line"
  | "scatter"
  | "hist"
  | "box"
  | "donut"
  | "area"
  | "stackedbar"
  | "groupedbar"
  | "pie"
  | "lollipop"
  | "density"
  | "violin"
  | "strip"
  | "bubble"
  | "step"
  | "slope"
  | "heatmap"
  | "waterfall";

export type PaletteId = "okabe" | "blue" | "warm" | "gray";

export type VizSpec = {
  chart: ChartId;
  enc: { x?: string; y?: string; color?: string; facet?: string };
  agg: "mean" | "median" | "sum" | "count";
  format: {
    showValues: boolean;
    grid: boolean;
    zeroBaseline: boolean;
    sortByValue: boolean;
    errorBars: boolean;
    palette: PaletteId;
    yLabel?: string;
    source?: string;
  };
  title: string;
  subtitle?: string;
};

const CHART_ENUM = [
  "bar",
  "hbar",
  "line",
  "scatter",
  "hist",
  "box",
  "donut",
  "area",
  "stackedbar",
  "groupedbar",
  "pie",
  "lollipop",
  "density",
  "violin",
  "strip",
  "bubble",
  "step",
  "slope",
  "heatmap",
  "waterfall",
] as const;

export const VizSpecSchema = z.object({
  chart: z.enum(CHART_ENUM),
  enc: z.object({
    x: z.string().optional(),
    y: z.string().optional(),
    color: z.string().optional(),
    facet: z.string().optional(),
  }),
  agg: z.enum(["mean", "median", "sum", "count"]),
  format: z.object({
    showValues: z.boolean(),
    grid: z.boolean(),
    zeroBaseline: z.boolean(),
    sortByValue: z.boolean(),
    errorBars: z.boolean(),
    palette: z.enum(["okabe", "blue", "warm", "gray"]),
    yLabel: z.string().optional(),
    source: z.string().optional(),
  }),
  title: z.string(),
  subtitle: z.string().optional(),
});

export function emptySpec(): VizSpec {
  return {
    chart: "bar",
    enc: {},
    agg: "mean",
    format: {
      showValues: false,
      grid: true,
      zeroBaseline: true,
      sortByValue: false,
      errorBars: true,
      palette: "okabe",
    },
    title: "",
  };
}

export function parseSpec(raw: unknown): VizSpec | null {
  const r = VizSpecSchema.safeParse(raw);
  return r.success ? (r.data as VizSpec) : null;
}

/* ─────────────────────── 팔레트 ─────────────────────── */

export const PALETTES: Record<PaletteId, { label: string; colors: string[]; safe: boolean; note: string }> = {
  okabe: {
    label: "색각 안전 (Okabe–Ito)",
    colors: ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#56B4E9", "#D55E00", "#F0E442", "#000000"],
    safe: true,
    note: "적록 색각 이상에서도 구분됩니다.",
  },
  blue: {
    label: "파랑 계열",
    colors: ["#1e3a8a", "#2563eb", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"],
    safe: true,
    note: "같은 색상의 명도 차이만 쓰므로 순서가 있는 값에 어울립니다.",
  },
  warm: {
    label: "따뜻한 대비",
    colors: ["#b91c1c", "#ea580c", "#d97706", "#65a30d", "#0891b2", "#7c3aed"],
    safe: false,
    note: "빨강과 초록을 함께 쓰기 때문에 색각 이상에서 구분이 어렵습니다.",
  },
  gray: {
    label: "무채색 (인쇄용)",
    colors: ["#111827", "#374151", "#6b7280", "#9ca3af", "#d1d5db"],
    safe: true,
    note: "흑백 인쇄에서도 그대로 읽힙니다. 계열이 5개를 넘으면 구분이 어렵습니다.",
  },
};

/* ─────────────────────── 유형 판정 ─────────────────────── */

export type ChartMeta = {
  id: ChartId;
  label: string;
  why: string;
  howToRead: string;
  /** 실제 렌더러에 위임할 기본형 */
  renderAs: "bar" | "hbar" | "line" | "scatter" | "hist" | "box" | "donut";
};

export const CHARTS: ChartMeta[] = [
  { id: "bar", label: "세로 막대", why: "범주별 크기를 비교할 때 사람이 가장 정확하게 읽는 그림입니다.", howToRead: "막대 길이가 곧 값입니다. 세로축이 0에서 시작하는지 확인하세요.", renderAs: "bar" },
  { id: "hbar", label: "가로 막대", why: "범주 이름이 길거나 항목이 많을 때 이름이 겹치지 않습니다.", howToRead: "막대 길이가 곧 값입니다. 값 순으로 정렬하면 순위를 읽기 쉽습니다.", renderAs: "hbar" },
  { id: "groupedbar", label: "묶은 막대", why: "같은 범주 안에서 계열을 나란히 비교할 때 씁니다.", howToRead: "인접 막대는 같은 범주의 다른 계열입니다. 색 범례를 함께 보세요.", renderAs: "bar" },
  { id: "stackedbar", label: "누적 막대", why: "전체가 어떻게 구성되는지와 부분의 비중을 함께 볼 때 씁니다.", howToRead: "전체 높이는 합, 구간은 구성입니다. 부분 비교에는 묶은 막대가 더 정확합니다.", renderAs: "bar" },
  { id: "lollipop", label: "롤리팝", why: "막대보다 잉크를 덜 쓰면서 순위·크기를 보여 줍니다.", howToRead: "점의 위치가 값이고, 줄은 0에서 점까지입니다.", renderAs: "hbar" },
  { id: "waterfall", label: "폭포", why: "증가·감소가 누적되어 최종값에 이르는 과정을 보여 줍니다.", howToRead: "각 막대는 변화분, 마지막은 합계로 읽습니다.", renderAs: "bar" },
  { id: "line", label: "꺾은선", why: "시간처럼 순서가 있는 값의 변화를 보여 줍니다.", howToRead: "점 사이의 선은 '그 사이에도 값이 이어진다'는 뜻입니다.", renderAs: "line" },
  { id: "area", label: "영역", why: "꺾은선에 면적을 채워 규모감을 강조할 때 씁니다.", howToRead: "면적은 누적·규모 인상을 줍니다. 여러 계열이면 가릴 수 있습니다.", renderAs: "line" },
  { id: "step", label: "계단선", why: "값이 구간마다 갑자기 바뀌는 시계열에 적합합니다.", howToRead: "수평 구간은 유지, 수직은 변화 시점입니다.", renderAs: "line" },
  { id: "slope", label: "기울기(전후)", why: "두 시점의 변화를 집단별로 비교할 때 씁니다.", howToRead: "선의 기울기가 변화 방향·크기입니다.", renderAs: "line" },
  { id: "scatter", label: "산점도", why: "두 연속 변수의 관계를 왜곡 없이 보여 주는 그림입니다.", howToRead: "점 하나가 사례 하나입니다. 점선은 회귀선입니다.", renderAs: "scatter" },
  { id: "bubble", label: "버블", why: "산점도에 세 번째 크기 차원을 더할 때 씁니다(색·분할로 대체 가능).", howToRead: "위치는 X·Y, 색은 집단입니다. 크기 인코딩은 과장되기 쉽습니다.", renderAs: "scatter" },
  { id: "strip", label: "스트립", why: "개별 값을 그대로 펼쳐 분포·겹침을 봅니다.", howToRead: "점 하나가 사례입니다. 겹치면 밀도가 높다는 뜻입니다.", renderAs: "scatter" },
  { id: "hist", label: "히스토그램", why: "한 변수의 분포 모양·치우침·이상치를 봅니다.", howToRead: "막대 하나가 한 구간의 사례 수입니다.", renderAs: "hist" },
  { id: "density", label: "밀도", why: "히스토그램을 부드럽게 본 분포 형태입니다.", howToRead: "곡선 높이는 상대 밀도입니다. 사례가 적으면 형태가 불안정합니다.", renderAs: "hist" },
  { id: "box", label: "상자그림", why: "집단별 분포와 이상치를 함께 보여 줍니다.", howToRead: "상자는 IQR, 굵은 선은 중앙값, 원은 이상치입니다.", renderAs: "box" },
  { id: "violin", label: "바이올린", why: "상자그림에 밀도 형태를 더한 분포 비교입니다.", howToRead: "폭이 넓은 곳은 사례가 많은 구간입니다(여기선 상자로 근사).", renderAs: "box" },
  { id: "donut", label: "도넛", why: "전체 대비 비중을 한눈에 보여 주지만 각도 비교는 부정확합니다.", howToRead: "조각 각도로 크기를 비교하기 어렵습니다. 3개 이하일 때만.", renderAs: "donut" },
  { id: "pie", label: "원형(파이)", why: "구성비 제시용. 정확한 비교에는 막대가 낫습니다.", howToRead: "각도와 넓이로 읽습니다. 조각이 많으면 읽기 어렵습니다.", renderAs: "donut" },
  { id: "heatmap", label: "히트맵", why: "두 범주의 교차 강도(집계값)를 색으로 봅니다.", howToRead: "색이 진할수록 값이 큽니다. 범례 범위를 확인하세요(막대로 근사).", renderAs: "bar" },
];

export const CHART_BY_ID: Record<ChartId, ChartMeta> = Object.fromEntries(CHARTS.map((c) => [c.id, c])) as Record<
  ChartId,
  ChartMeta
>;

/** 물리적으로 그릴 수 없으면 false — 이유까지 함께 돌려준다. */
export function chartEnabled(id: ChartId, x: Variable | null, y: Variable | null): { ok: boolean; reason: string } {
  if (!x) return { ok: false, reason: "가로축(X)에 변수를 놓아야 합니다." };
  const render = CHART_BY_ID[id]?.renderAs ?? id;
  switch (render) {
    case "scatter":
      if (x.type !== "num" && id !== "strip") {
        // strip은 범주×숫자도 허용하되 렌더는 scatter 근사
      }
      if (id === "strip") {
        if (!y || y.type !== "num") return { ok: false, reason: "스트립의 세로축은 숫자 변수여야 합니다." };
        return { ok: true, reason: "" };
      }
      if (x.type !== "num") return { ok: false, reason: "산점도·버블의 가로축은 숫자 변수여야 합니다." };
      if (!y || y.type !== "num") return { ok: false, reason: "산점도·버블의 세로축은 숫자 변수여야 합니다." };
      return { ok: true, reason: "" };
    case "hist":
      if (x.type !== "num") return { ok: false, reason: "히스토그램·밀도는 숫자 변수의 분포를 그립니다." };
      return { ok: true, reason: "" };
    case "box":
      if (!y || y.type !== "num") return { ok: false, reason: "상자·바이올린의 세로축은 숫자 변수여야 합니다." };
      return { ok: true, reason: "" };
    case "line":
      if (!y || y.type !== "num") return { ok: false, reason: "꺾은선·영역·계단·기울기의 세로축은 숫자 변수여야 합니다." };
      return { ok: true, reason: "" };
    case "donut":
      if (x.type !== "cat") return { ok: false, reason: "도넛·파이는 범주별 비중을 그립니다. 가로축에 범주 변수를 놓으세요." };
      return { ok: true, reason: "" };
    default:
      return { ok: true, reason: "" };
  }
}

export function recommend(x?: Variable | null, y?: Variable | null): ChartId | null {
  if (!x) return null;
  if (!y) return x.type === "num" ? "hist" : "bar";
  if (x.type === "num" && y.type === "num") return "scatter";
  if (x.type === "cat" && y.type === "num") return "box";
  return "bar";
}

/* ─────────────────────── 경고 규칙 ─────────────────────── */

export type Advice = { id: string; level: "ok" | "warn" | "risk"; title: string; message: string; fix?: string };

export function advise(spec: VizSpec, ds: Dataset): Advice[] {
  const out: Advice[] = [];
  const v = (n?: string) => ds.variables.find((x) => x.name === n) ?? null;
  const x = v(spec.enc.x);
  const y = v(spec.enc.y);
  const color = v(spec.enc.color);
  const render = CHART_BY_ID[spec.chart]?.renderAs;

  if ((render === "bar" || render === "hbar") && !spec.format.zeroBaseline) {
    out.push({
      id: "zero",
      level: "risk",
      title: "축을 자른 막대는 차이를 과장합니다",
      message: "막대는 길이가 곧 값이기 때문에, 축을 0이 아닌 곳에서 시작하면 실제보다 큰 차이로 보입니다.",
      fix: "서식에서 '0에서 시작'을 다시 켜거나, 축을 잘라야 한다면 꺾은선·점 그래프로 바꾸세요.",
    });
  }
  if (render === "line" && x && x.type === "cat" && spec.chart !== "slope") {
    out.push({
      id: "line-cat",
      level: "risk",
      title: "순서가 없는 범주를 선으로 이었습니다",
      message: "점 사이를 잇는 선은 '사이 값이 존재한다'는 뜻입니다. 범주 사이에는 그런 값이 없습니다.",
      fix: "막대 그래프로 바꾸세요. 시간처럼 순서가 있는 축일 때만 꺾은선을 쓰세요.",
    });
  }
  if (render === "donut") {
    const k = x ? x.levels.length : 0;
    out.push({
      id: "donut",
      level: "risk",
      title: "원형·도넛은 정확한 비교에 불리합니다",
      message: `사람은 각도와 넓이를 정확히 비교하지 못합니다. 지금 조각은 ${k}개입니다.`,
      fix: k > 3 ? "조각이 4개 이상입니다. 가로 막대로 바꾸면 순위와 크기를 정확히 읽을 수 있습니다." : "비중을 강조해야 하는 자리가 아니라면 막대가 더 정확합니다.",
    });
  }
  if ((render === "bar" || render === "hbar") && spec.agg === "mean" && y) {
    out.push({
      id: "mean-bar",
      level: "warn",
      title: "평균 막대는 흩어짐을 숨깁니다",
      message: "평균이 같아도 분포는 전혀 다를 수 있습니다. 오차막대는 그 일부만 보여 줍니다.",
      fix: "분포까지 보여야 한다면 상자그림으로 바꾸거나, 오차막대를 켜 두세요.",
    });
  }
  if (color && color.levels.length > 6) {
    out.push({
      id: "color-many",
      level: "warn",
      title: `색으로 ${color.levels.length}개를 구분하려 합니다`,
      message: "색이 예닐곱 개를 넘으면 범례를 오가며 읽어야 하고, 인접한 색은 구분되지 않습니다.",
      fix: "색상 대신 '분할'을 쓰면 같은 축으로 나란히 비교할 수 있습니다.",
    });
  }
  if (color && !PALETTES[spec.format.palette].safe) {
    out.push({
      id: "palette",
      level: "warn",
      title: "색각 안전하지 않은 팔레트입니다",
      message: "남성의 약 8%가 적록 색각 이상입니다. 지금 팔레트는 빨강과 초록을 함께 씁니다.",
      fix: "'색각 안전 (Okabe–Ito)' 팔레트로 바꾸거나, 색 외에 모양·이름도 함께 쓰세요.",
    });
  }
  if (render === "box" || render === "scatter") {
    out.push({
      id: "good",
      level: "ok",
      title: "좋은 선택입니다",
      message:
        render === "box"
          ? "상자·바이올린은 요약값과 흩어짐, 이상치를 한 그림에서 보여 줍니다."
          : "산점도·버블·스트립은 두 변수의 관계를 요약하지 않고 보여 줍니다.",
    });
  }
  if (render === "hist" && x && x.numbers.length < 20) {
    out.push({
      id: "hist-n",
      level: "warn",
      title: "사례가 적어 분포 모양을 믿기 어렵습니다",
      message: `유효 사례가 ${x.numbers.length}개입니다. 구간을 어떻게 나누느냐에 따라 모양이 크게 달라집니다.`,
      fix: "점 그래프(산점도)나 상자그림으로 개별 값을 그대로 보여 주는 편이 정직합니다.",
    });
  }
  return out;
}

/* ─────────────────────── 집계 ─────────────────────── */

export type Agg = VizSpec["agg"];

function aggregate(values: number[], agg: Agg): number {
  if (!values.length) return 0;
  if (agg === "count") return values.length;
  if (agg === "sum") return values.reduce((s, v) => s + v, 0);
  if (agg === "median") {
    const s = [...values].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export const AGG_LABEL: Record<Agg, string> = {
  mean: "평균",
  median: "중위수",
  sum: "합계",
  count: "사례 수",
};

export type VizData = {
  categories: { label: string; value: number; ci?: number; n: number; color?: string }[];
  points: { x: number; y: number; group?: string }[];
  values: number[];
  groups: { label: string; values: number[] }[];
  series: { name: string; points: { x: number; y: number; label?: string }[] }[];
  xTickLabels: string[];
};

/** 렌더 기본형으로 정규화한 뒤 데이터를 만든다. */
export function effectiveChart(spec: VizSpec): ChartId {
  return CHART_BY_ID[spec.chart]?.renderAs ?? spec.chart;
}

export function buildData(ds: Dataset, spec: VizSpec, facetValue?: string): VizData {
  const chart = effectiveChart(spec);
  const varOf = (n?: string) => ds.variables.find((v) => v.name === n) ?? null;
  const x = varOf(spec.enc.x);
  const y = varOf(spec.enc.y);
  const color = varOf(spec.enc.color);
  const facet = varOf(spec.enc.facet);
  const palette = PALETTES[spec.format.palette].colors;

  const rows = ds.rows.filter((r) => (facet && facetValue !== undefined ? (r[facet.index] ?? "").trim() === facetValue : true));
  const cell = (r: string[], v: Variable | null) => (v ? (r[v.index] ?? "").trim() : "");
  const numCell = (r: string[], v: Variable | null) => (v ? Number((r[v.index] ?? "").trim()) : NaN);

  const empty: VizData = { categories: [], points: [], values: [], groups: [], series: [], xTickLabels: [] };
  if (!x) return empty;

  if (chart === "hist") {
    return { ...empty, values: rows.map((r) => numCell(r, x)).filter(Number.isFinite) };
  }

  if (chart === "scatter") {
    if (spec.chart === "strip" && x.type === "cat" && y) {
      const labels = [...new Set(rows.map((r) => cell(r, x)).filter(Boolean))];
      return {
        ...empty,
        points: rows
          .map((r) => {
            const lab = cell(r, x);
            const xi = labels.indexOf(lab);
            return { x: xi + 1, y: numCell(r, y), group: color ? cell(r, color) : lab };
          })
          .filter((p) => Number.isFinite(p.y)),
      };
    }
    return {
      ...empty,
      points: rows
        .map((r) => ({ x: numCell(r, x), y: numCell(r, y), group: color ? cell(r, color) : undefined }))
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    };
  }

  if (chart === "box") {
    const labels = x.type === "cat" ? [...new Set(rows.map((r) => cell(r, x)).filter(Boolean))] : ["전체"];
    return {
      ...empty,
      groups: labels.map((l) => ({
        label: l,
        values: rows
          .filter((r) => (x.type === "cat" ? cell(r, x) === l : true))
          .map((r) => numCell(r, y))
          .filter(Number.isFinite),
      })),
    };
  }

  if (chart === "line") {
    const seriesNames = color ? [...new Set(rows.map((r) => cell(r, color)).filter(Boolean))] : ["전체"];
    const xLabels = [...new Set(rows.map((r) => cell(r, x)).filter(Boolean))];
    if (x.type === "num") xLabels.sort((a, b) => Number(a) - Number(b));
    return {
      ...empty,
      xTickLabels: x.type === "num" ? [] : xLabels,
      series: seriesNames.map((name) => ({
        name,
        points: xLabels.map((xl, i) => {
          const vals = rows
            .filter((r) => cell(r, x) === xl && (!color || cell(r, color) === name))
            .map((r) => (y ? numCell(r, y) : 1))
            .filter(Number.isFinite);
          return { x: x.type === "num" ? Number(xl) : i, y: aggregate(vals, spec.agg), label: xl };
        }),
      })),
    };
  }

  const labels = [...new Set(rows.map((r) => cell(r, x)).filter(Boolean))];
  const cats = labels.map((l, i) => {
    const vals = rows
      .filter((r) => cell(r, x) === l)
      .map((r) => (y ? numCell(r, y) : 1))
      .filter(Number.isFinite);
    const value = aggregate(vals, spec.agg);
    const n = vals.length;
    let ci: number | undefined;
    if (spec.format.errorBars && spec.agg === "mean" && n > 1) {
      const m = value;
      const sd = Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / (n - 1));
      ci = 1.96 * (sd / Math.sqrt(n));
    }
    return { label: l, value, ci, n, color: palette[i % palette.length] };
  });
  if (spec.format.sortByValue || spec.chart === "lollipop" || spec.chart === "waterfall") cats.sort((a, b) => b.value - a.value);
  return { ...empty, categories: cats };
}

export function facetLevels(ds: Dataset, spec: VizSpec, max = 6): string[] {
  const f = ds.variables.find((v) => v.name === spec.enc.facet);
  if (!f) return [];
  return f.levels.slice(0, max);
}
