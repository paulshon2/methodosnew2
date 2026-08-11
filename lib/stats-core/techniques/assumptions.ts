/**
 * 가정 점검 보조 지표 — 기존 엔진(t·ANOVA·상관·회귀)에 없던 것만 여기에 더한다.
 *
 * 여기 있는 함수는 전부 순수 함수이고, scripts/stats-assumptions-selftest.ts가
 * 해석적으로 값이 알려진 입력으로 검증한다.
 */
import { betainc, gammainc, studentTCdf } from "../special";

export type Describe = {
  n: number;
  mean: number;
  sd: number;
  se: number;
  ciLow: number;
  ciHigh: number;
  min: number;
  max: number;
  q1: number;
  median: number;
  q3: number;
  skew: number;
  kurtosis: number;
};

export function meanOf(x: number[]): number {
  return x.length ? x.reduce((s, v) => s + v, 0) / x.length : NaN;
}

/** 표본표준편차(n-1). */
export function sdOf(x: number[]): number {
  if (x.length < 2) return NaN;
  const m = meanOf(x);
  return Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - 1));
}

/** 선형보간 분위수 — 엔진의 A-03과 같은 규칙을 쓴다. */
export function quantile(sorted: number[], p: number): number {
  if (!sorted.length) return NaN;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return lo === hi ? sorted[lo] : sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
}

/** F 분포 상측 확률. F(x; d1,d2) = I_{d1x/(d1x+d2)}(d1/2, d2/2) */
export function fPValue(F: number, df1: number, df2: number): number {
  if (!Number.isFinite(F) || F <= 0 || df1 < 1 || df2 < 1) return NaN;
  const x = (df1 * F) / (df1 * F + df2);
  const p = 1 - betainc(x, df1 / 2, df2 / 2);
  return Math.min(1, Math.max(0, p));
}

/** χ² 상측 확률. */
export function chiSquarePValue(chi: number, df: number): number {
  if (!Number.isFinite(chi) || chi < 0 || df < 1) return NaN;
  return Math.min(1, Math.max(0, 1 - gammainc(df / 2, chi / 2)));
}

/** 양측 t 임계값 — 이분법으로 studentTCdf를 역산한다(신뢰구간용). */
export function tCritical(df: number, conf = 0.95): number {
  if (df < 1) return NaN;
  const target = 1 - (1 - conf) / 2;
  let lo = 0;
  let hi = 200;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (studentTCdf(mid, df) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** 평균의 95% 신뢰구간까지 포함한 한 변수 요약. */
export function describeVec(raw: number[], conf = 0.95): Describe {
  const x = raw.filter((v) => Number.isFinite(v));
  const n = x.length;
  const m = meanOf(x);
  const s = sdOf(x);
  const se = n > 0 ? s / Math.sqrt(n) : NaN;
  const t = n > 1 ? tCritical(n - 1, conf) : NaN;
  const sorted = [...x].sort((a, b) => a - b);
  const { skew, kurtosis } = skewKurt(x);
  return {
    n,
    mean: m,
    sd: s,
    se,
    ciLow: m - t * se,
    ciHigh: m + t * se,
    min: sorted[0] ?? NaN,
    max: sorted[sorted.length - 1] ?? NaN,
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    skew,
    kurtosis,
  };
}

/** 편향보정 왜도 G1 · 초과첨도 G2 (Kline 기준 |G1|<2, |G2|<7과 짝을 이룬다). */
export function skewKurt(x: number[]): { skew: number; kurtosis: number } {
  const n = x.length;
  if (n < 3) return { skew: NaN, kurtosis: NaN };
  const m = meanOf(x);
  const m2 = x.reduce((s, v) => s + (v - m) ** 2, 0) / n;
  const m3 = x.reduce((s, v) => s + (v - m) ** 3, 0) / n;
  const m4 = x.reduce((s, v) => s + (v - m) ** 4, 0) / n;
  if (m2 <= 0) return { skew: 0, kurtosis: 0 };
  const g1 = m3 / m2 ** 1.5;
  const g2 = m4 / (m2 * m2) - 3;
  const G1 = (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
  const G2 = n > 3 ? ((n - 1) / ((n - 2) * (n - 3))) * ((n + 1) * g2 + 6) : g2;
  return { skew: G1, kurtosis: G2 };
}

export type NormalityResult = {
  /** 표본이 20 미만이면 검정 대신 왜도·첨도로 판단하라고 안내한다. */
  usable: boolean;
  n: number;
  skew: number;
  kurtosis: number;
  zSkew: number;
  zKurt: number;
  k2: number;
  p: number;
  /** Kline(2011) 허용 기준 통과 여부. */
  klineOk: boolean;
};

/** D'Agostino–Pearson K² 정규성 검정 (왜도 Z² + 첨도 Z², df=2). */
export function dagostinoPearson(raw: number[]): NormalityResult {
  const x = raw.filter((v) => Number.isFinite(v));
  const n = x.length;
  const { skew, kurtosis } = skewKurt(x);
  const klineOk = Math.abs(skew) < 2 && Math.abs(kurtosis) < 7;
  if (n < 20) {
    return { usable: false, n, skew, kurtosis, zSkew: NaN, zKurt: NaN, k2: NaN, p: NaN, klineOk };
  }
  const m = meanOf(x);
  const m2 = x.reduce((s, v) => s + (v - m) ** 2, 0) / n;
  const m3 = x.reduce((s, v) => s + (v - m) ** 3, 0) / n;
  const m4 = x.reduce((s, v) => s + (v - m) ** 4, 0) / n;
  const g1 = m2 > 0 ? m3 / m2 ** 1.5 : 0;
  const b2 = m2 > 0 ? m4 / (m2 * m2) : 3;

  // 왜도 Z (D'Agostino 1970)
  const Y = g1 * Math.sqrt(((n + 1) * (n + 3)) / (6 * (n - 2)));
  const beta2 = (3 * (n * n + 27 * n - 70) * (n + 1) * (n + 3)) / ((n - 2) * (n + 5) * (n + 7) * (n + 9));
  const W2 = -1 + Math.sqrt(2 * (beta2 - 1));
  const W = Math.sqrt(W2);
  const delta = 1 / Math.sqrt(Math.log(W));
  const alpha = Math.sqrt(2 / (W2 - 1));
  const u = Y / alpha;
  const zSkew = delta * Math.log(u + Math.sqrt(u * u + 1));

  // 첨도 Z (Anscombe–Glynn 1983)
  const E = (3 * (n - 1)) / (n + 1);
  const varB2 = (24 * n * (n - 2) * (n - 3)) / ((n + 1) * (n + 1) * (n + 3) * (n + 5));
  const xStd = (b2 - E) / Math.sqrt(varB2);
  const sqrtB1 =
    ((6 * (n * n - 5 * n + 2)) / ((n + 7) * (n + 9))) *
    Math.sqrt((6 * (n + 3) * (n + 5)) / (n * (n - 2) * (n - 3)));
  const A = 6 + (8 / sqrtB1) * (2 / sqrtB1 + Math.sqrt(1 + 4 / (sqrtB1 * sqrtB1)));
  const term = (1 - 2 / A) / (1 + xStd * Math.sqrt(2 / (A - 4)));
  const zKurt = (1 - 2 / (9 * A) - Math.cbrt(term)) / Math.sqrt(2 / (9 * A));

  const k2 = zSkew * zSkew + zKurt * zKurt;
  return {
    usable: Number.isFinite(k2),
    n,
    skew,
    kurtosis,
    zSkew,
    zKurt,
    k2,
    p: chiSquarePValue(k2, 2),
    klineOk,
  };
}

export type LeveneResult = { W: number; df1: number; df2: number; p: number; ok: boolean };

/** 등분산성 — Brown–Forsythe(중앙값 기준) Levene 검정. */
export function leveneBrownForsythe(groups: number[][]): LeveneResult {
  const g = groups.map((a) => a.filter((v) => Number.isFinite(v))).filter((a) => a.length >= 2);
  const k = g.length;
  const N = g.reduce((s, a) => s + a.length, 0);
  if (k < 2 || N - k < 1) return { W: NaN, df1: NaN, df2: NaN, p: NaN, ok: true };
  const z = g.map((a) => {
    const med = quantile([...a].sort((p, q) => p - q), 0.5);
    return a.map((v) => Math.abs(v - med));
  });
  const zBarI = z.map(meanOf);
  const zBar = meanOf(z.flat());
  const num = z.reduce((s, a, i) => s + a.length * (zBarI[i] - zBar) ** 2, 0) / (k - 1);
  const den = z.reduce((s, a, i) => s + a.reduce((ss, v) => ss + (v - zBarI[i]) ** 2, 0), 0) / (N - k);
  const W = den > 0 ? num / den : NaN;
  const p = fPValue(W, k - 1, N - k);
  return { W, df1: k - 1, df2: N - k, p, ok: !Number.isFinite(p) || p >= 0.05 };
}

export type WelchResult = { t: number; df: number; p: number };

/** Welch(이분산) t검정 — 등분산이 깨졌을 때 자동 전환용. */
export function welchT(a: number[], b: number[]): WelchResult {
  const n1 = a.length;
  const n2 = b.length;
  const v1 = sdOf(a) ** 2;
  const v2 = sdOf(b) ** 2;
  const t = (meanOf(a) - meanOf(b)) / Math.sqrt(v1 / n1 + v2 / n2);
  const df =
    (v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
  const p = Number.isFinite(t) && df > 0 ? 2 * (1 - studentTCdf(Math.abs(t), df)) : NaN;
  return { t, df, p };
}

/** 등분산 가정의 쌍별 t — Bonferroni 보정과 함께 쓴다. */
export function pairwiseT(
  labels: string[],
  groups: number[][],
): { a: string; b: string; t: number; df: number; p: number; pAdj: number }[] {
  const out: { a: string; b: string; t: number; df: number; p: number; pAdj: number }[] = [];
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const A = groups[i];
      const B = groups[j];
      if (A.length < 2 || B.length < 2) continue;
      const s1 = sdOf(A);
      const s2 = sdOf(B);
      const df = A.length + B.length - 2;
      const sp2 = ((A.length - 1) * s1 * s1 + (B.length - 1) * s2 * s2) / df;
      const t = (meanOf(A) - meanOf(B)) / Math.sqrt(sp2 * (1 / A.length + 1 / B.length));
      const p = Number.isFinite(t) ? 2 * (1 - studentTCdf(Math.abs(t), df)) : NaN;
      out.push({ a: labels[i], b: labels[j], t, df, p, pAdj: NaN });
    }
  }
  const m = out.length;
  return out.map((r) => ({ ...r, pAdj: Math.min(1, r.p * m) }));
}

export type CrosstabResult = {
  rowLabels: string[];
  colLabels: string[];
  observed: number[][];
  expected: number[][];
  chi2: number;
  df: number;
  p: number;
  n: number;
  /** 기대빈도 5 미만 칸 비율 — 20%를 넘으면 카이제곱을 신뢰하기 어렵다. */
  lowExpectedRatio: number;
  minExpected: number;
};

/** 교차표 · 기대빈도 — 엔진의 D-04는 χ²만 주므로 표를 여기서 만든다. */
export function crosstab(a: string[], b: string[]): CrosstabResult {
  const pairs = a.map((v, i) => [v || "(빈칸)", b[i] || "(빈칸)"]).filter((p) => p[1] !== undefined);
  const rowLabels = [...new Set(pairs.map((p) => p[0]))];
  const colLabels = [...new Set(pairs.map((p) => p[1]))];
  const observed = rowLabels.map((r) => colLabels.map((c) => pairs.filter((p) => p[0] === r && p[1] === c).length));
  const n = pairs.length;
  const rowSum = observed.map((r) => r.reduce((s, v) => s + v, 0));
  const colSum = colLabels.map((_, j) => observed.reduce((s, r) => s + r[j], 0));
  const expected = rowSum.map((rs) => colSum.map((cs) => (rs * cs) / (n || 1)));
  let chi = 0;
  let low = 0;
  let minE = Infinity;
  for (let i = 0; i < rowLabels.length; i++) {
    for (let j = 0; j < colLabels.length; j++) {
      const e = expected[i][j];
      if (e > 0) chi += (observed[i][j] - e) ** 2 / e;
      if (e < 5) low++;
      if (e < minE) minE = e;
    }
  }
  const cells = rowLabels.length * colLabels.length || 1;
  const df = (rowLabels.length - 1) * (colLabels.length - 1);
  return {
    rowLabels,
    colLabels,
    observed,
    expected,
    chi2: chi,
    df,
    p: chiSquarePValue(chi, df),
    n,
    lowExpectedRatio: low / cells,
    minExpected: Number.isFinite(minE) ? minE : NaN,
  };
}

/** Spearman 순위상관 — 정규성이 깨졌을 때 함께 보여 준다. */
export function spearman(x: number[], y: number[]): { rho: number; n: number } {
  const pairs = x.map((v, i) => [v, y[i]]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  const rank = (vals: number[]) => {
    const idx = vals.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
    const r = new Array(vals.length).fill(0);
    let i = 0;
    while (i < idx.length) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
      i = j + 1;
    }
    return r;
  };
  const rx = rank(pairs.map((p) => p[0]));
  const ry = rank(pairs.map((p) => p[1]));
  const mx = meanOf(rx);
  const my = meanOf(ry);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < rx.length; i++) {
    num += (rx[i] - mx) * (ry[i] - my);
    dx += (rx[i] - mx) ** 2;
    dy += (ry[i] - my) ** 2;
  }
  return { rho: dx > 0 && dy > 0 ? num / Math.sqrt(dx * dy) : NaN, n: rx.length };
}
