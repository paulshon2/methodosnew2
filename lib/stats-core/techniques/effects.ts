/**
 * 효과크기 — "차이가 있다/없다"만으로는 결과를 보고할 수 없기 때문에 항상 함께 계산한다.
 * 해석 구간은 Cohen(1988) · Kline(2011)을 따른다.
 */
import { meanOf, sdOf } from "./assumptions";

export type EffectSize = {
  key: string;
  /** 화면에 그대로 쓰는 이름. */
  label: string;
  value: number;
  /** 작다·중간·크다 중 하나. 기준을 함께 문장으로 돌려준다. */
  reading: string;
  cutoffs: string;
};

function band(v: number, cuts: [number, number, number], words = ["매우 작다", "작다", "중간", "크다"]): string {
  const a = Math.abs(v);
  if (!Number.isFinite(a)) return "판단 불가";
  if (a < cuts[0]) return words[0];
  if (a < cuts[1]) return words[1];
  if (a < cuts[2]) return words[2];
  return words[3];
}

/** 독립표본 — 합동표준편차 기준 Cohen's d. */
export function cohensD(a: number[], b: number[]): EffectSize {
  const n1 = a.length;
  const n2 = b.length;
  const s1 = sdOf(a);
  const s2 = sdOf(b);
  const sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2));
  const d = (meanOf(a) - meanOf(b)) / sp;
  return {
    key: "d",
    label: "Cohen's d",
    value: d,
    reading: band(d, [0.2, 0.5, 0.8]),
    cutoffs: "0.20 작다 · 0.50 중간 · 0.80 크다",
  };
}

/** 대응표본 — 차이점수 기준 d_z. */
export function cohensDz(diff: number[]): EffectSize {
  const d = meanOf(diff) / sdOf(diff);
  return {
    key: "dz",
    label: "Cohen's d_z",
    value: d,
    reading: band(d, [0.2, 0.5, 0.8]),
    cutoffs: "0.20 작다 · 0.50 중간 · 0.80 크다",
  };
}

/** ANOVA — η². 표본이 작으면 과대추정되므로 ω²와 함께 본다. */
export function etaSquared(ssb: number, sst: number): EffectSize {
  const v = sst > 0 ? ssb / sst : NaN;
  return {
    key: "eta2",
    label: "η²",
    value: v,
    reading: band(v, [0.01, 0.06, 0.14]),
    cutoffs: "0.01 작다 · 0.06 중간 · 0.14 크다",
  };
}

/** ANOVA — 편향보정된 ω². */
export function omegaSquared(ssb: number, ssw: number, dfb: number, dfw: number): EffectSize {
  const msw = dfw > 0 ? ssw / dfw : NaN;
  const sst = ssb + ssw;
  const v = sst + msw > 0 ? (ssb - dfb * msw) / (sst + msw) : NaN;
  return {
    key: "omega2",
    label: "ω²",
    value: Math.max(0, v),
    reading: band(v, [0.01, 0.06, 0.14]),
    cutoffs: "0.01 작다 · 0.06 중간 · 0.14 크다",
  };
}

/** 상관 — r 자체가 효과크기이고, R²는 설명된 분산 비율이다. */
export function correlationEffect(r: number): EffectSize[] {
  return [
    {
      key: "r",
      label: "r",
      value: r,
      reading: band(r, [0.1, 0.3, 0.5]),
      cutoffs: "0.10 작다 · 0.30 중간 · 0.50 크다",
    },
    {
      key: "r2",
      label: "R² (설명된 분산)",
      value: r * r,
      reading: `${(r * r * 100).toFixed(1)}%를 설명`,
      cutoffs: "R² = r²",
    },
  ];
}

/** 카이제곱 — Cramér's V. */
export function cramersV(chi2: number, n: number, rows: number, cols: number): EffectSize {
  const k = Math.min(rows, cols) - 1;
  const v = n > 0 && k > 0 ? Math.sqrt(chi2 / (n * k)) : NaN;
  return {
    key: "v",
    label: "Cramér's V",
    value: v,
    reading: band(v, [0.1, 0.3, 0.5]),
    cutoffs: "0.10 작다 · 0.30 중간 · 0.50 크다",
  };
}
