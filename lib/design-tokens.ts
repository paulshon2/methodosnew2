/**
 * SVG 렌더용 색 상수.
 *
 * SVG 속성(fill/stroke)에 CSS 변수를 직접 넣으면 PNG·SVG 내보내기 때 색이 사라진다.
 * 직렬화 시점에 변수를 해석해 줄 주체가 없기 때문이다.
 * 그래서 차트 계층은 이 파일의 리터럴을 쓰고, 테마 전환은 `chartTheme()`가 담당한다.
 */

export type ThemeName = "glass" | "light" | "midnight" | "charcoal" | "black";

/** 차트 계열색 — Okabe–Ito 팔레트의 다크 보정판 */
export const CHART_DARK = ["#4d9dff", "#ffb020", "#2dd4a0", "#f472b6", "#7dd3fc", "#fb923c", "#fde047", "#94a3b8"] as const;
/** 차트 계열색 — 라이트 배경용 원본 Okabe–Ito */
export const CHART_LIGHT = ["#0072b2", "#e69f00", "#009e73", "#cc79a7", "#56b4e9", "#d55e00", "#9a8300", "#525252"] as const;

/**
 * 색으로 칠한 도형 위에 얹는 글자.
 * DOM에서는 `var(--on-accent)`를 쓰고, SVG·캔버스처럼 직렬화되는 곳에서만 이 리터럴을 쓴다.
 */
export const ON_FILL = "#ffffff";

/** 증감 표시 — 오르면 초록, 내리면 주황. 화살표와 부호를 함께 쓰므로 색만으로 말하지 않는다. */
export const TREND_UP = "#0F6E56";
export const TREND_DOWN = "#D85A30";

/** 색각 안전 여부 — Okabe–Ito 계열만 안전으로 본다 */
export const SAFE_PALETTES = ["okabe", "gray"] as const;

export type ChartTheme = {
  ink: string;
  ink2: string;
  ink3: string;
  grid: string;
  axis: string;
  surface: string;
  brand: string;
  ok: string;
  warn: string;
  danger: string;
  series: readonly string[];
  quant: string;
  qual: string;
  mixed: string;
};

const DARK: ChartTheme = {
  ink: "#eef2ff",
  ink2: "rgba(226,233,255,.70)",
  ink3: "rgba(226,233,255,.60)",
  grid: "rgba(255,255,255,.12)",
  axis: "rgba(255,255,255,.28)",
  surface: "#0a0f1d",
  brand: "#4d7cff",
  ok: "#3ddc97",
  warn: "#ffb84d",
  danger: "#ff8585",
  series: CHART_DARK,
  quant: "#5b9bff",
  qual: "#c084fc",
  mixed: "#2dd4bf",
};

const LIGHT: ChartTheme = {
  ink: "#15171f",
  ink2: "#4c5261",
  ink3: "#6c7385",
  grid: "rgba(21,23,31,.12)",
  axis: "rgba(21,23,31,.32)",
  surface: "#ffffff",
  brand: "#534ab7",
  ok: "#0f7a5a",
  warn: "#8a6100",
  danger: "#b3261e",
  series: CHART_LIGHT,
  quant: "#2f6fd8",
  qual: "#7a3fb0",
  mixed: "#0d7d70",
};

const CHARCOAL: ChartTheme = { ...DARK, brand: "#b9a06a", surface: "#232323", ok: "#6ecf8e", warn: "#e0b84a", danger: "#e88a7a" };

/** 현재 `:root` 클래스에서 테마 이름을 읽는다. 서버에서는 glass로 본다. */
export function currentTheme(): ThemeName {
  if (typeof document === "undefined") return "glass";
  const c = document.documentElement.classList;
  if (c.contains("theme-midnight")) return "midnight";
  if (c.contains("theme-charcoal")) return "charcoal";
  if (c.contains("theme-black")) return "black";
  if (c.contains("theme-glass")) return "glass";
  return "light";
}

export function chartTheme(name: ThemeName = currentTheme()): ChartTheme {
  if (name === "light") return LIGHT;
  if (name === "charcoal") return CHARCOAL;
  if (name === "midnight") return { ...DARK, brand: "#6c63ff", surface: "#141a2e" };
  if (name === "black") return { ...DARK, brand: "#7b74ff", surface: "#0c0c0e" };
  return DARK;
}

/** 9개 방법 계열색 — 배지·칩에서 쓴다 */
export const FAMILY_COLOR_VARS: Record<string, string> = {
  survey: "var(--fam-survey)",
  qual: "var(--fam-qual)",
  causal: "var(--fam-causal)",
  lit: "var(--fam-lit)",
  stats: "var(--fam-stats)",
  hist: "var(--fam-hist)",
  eval: "var(--fam-eval)",
  mixed: "var(--fam-mixed)",
  text: "var(--fam-text)",
};

/** 연구 접근 3종 */
export const APPROACH_COLOR: Record<"quant" | "qual" | "mixed", string> = {
  quant: "var(--appr-quant)",
  qual: "var(--appr-qual)",
  mixed: "var(--appr-mixed)",
};

/**
 * 내보내기 직전에 CSS 변수를 실제 색상값으로 치환한다.
 * `var(--x)` 형태의 fill/stroke/color/stop-color 속성을 계산값으로 바꾼다.
 */
export function inlineCssVars(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const src = Array.from(svg.querySelectorAll<SVGElement>("*"));
  const dst = Array.from(clone.querySelectorAll<SVGElement>("*"));
  const props = ["fill", "stroke", "color", "stop-color"] as const;
  const resolve = (from: Element, to: Element) => {
    const cs = getComputedStyle(from);
    props.forEach((p) => {
      const attr = to.getAttribute(p);
      if (attr && attr.includes("var(")) {
        const v = cs.getPropertyValue(p);
        if (v) to.setAttribute(p, v.trim());
      }
    });
  };
  resolve(svg, clone);
  src.forEach((el, i) => { if (dst[i]) resolve(el, dst[i]); });
  return clone;
}
