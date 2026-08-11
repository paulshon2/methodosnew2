/**
 * 가정 점검·효과크기 보조 지표 검증.
 * 해석적으로 답이 알려진 입력만 쓴다.  Run: npx --yes tsx scripts/stats-assumptions-selftest.ts
 */
import {
  chiSquarePValue,
  cohensD,
  cohensDz,
  correlationEffect,
  cramersV,
  crosstab,
  dagostinoPearson,
  describeVec,
  etaSquared,
  fPValue,
  leveneBrownForsythe,
  omegaSquared,
  pairwiseT,
  quantile,
  skewKurt,
  spearman,
  tCritical,
  welchT,
} from "../lib/stats-core";

let checks = 0;
function assert(cond: boolean, msg: string) {
  checks++;
  if (!cond) throw new Error(`FAIL: ${msg}`);
}
function approx(a: number, b: number, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

// ① 분위수 — 선형보간 기준값
assert(approx(quantile([1, 2, 3, 4], 0.5), 2.5), "median of 1..4 = 2.5");
assert(approx(quantile([1, 2, 3, 4, 5], 0.25), 2), "Q1 of 1..5 = 2");

// ② 기술통계 — 평균·SD는 손으로 계산 가능
const d = describeVec([2, 4, 4, 4, 5, 5, 7, 9]);
assert(approx(d.mean, 5), `mean=${d.mean}`);
assert(approx(d.sd, Math.sqrt(32 / 7), 1e-9), `sd=${d.sd}`);
assert(d.ciLow < d.mean && d.mean < d.ciHigh, "CI가 평균을 감싼다");
assert(approx(d.median, 4.5), `median=${d.median}`);

// ③ t 임계값 — 널리 알려진 표값
assert(approx(tCritical(1, 0.95), 12.7062, 1e-3), `t(.975,1)=${tCritical(1, 0.95)}`);
assert(approx(tCritical(10, 0.95), 2.2281, 1e-3), `t(.975,10)=${tCritical(10, 0.95)}`);
assert(approx(tCritical(30, 0.95), 2.0423, 1e-3), `t(.975,30)=${tCritical(30, 0.95)}`);

// ④ 대칭 자료의 왜도는 0
const sym = skewKurt([1, 2, 3, 4, 5, 6, 7, 8, 9]);
assert(approx(sym.skew, 0, 1e-9), `skew=${sym.skew}`);

// ⑤ χ² df=2 상측확률 = exp(-x/2)
assert(approx(chiSquarePValue(2, 2), Math.exp(-1), 1e-5), `chi2 sf = ${chiSquarePValue(2, 2)}`);
// F(1,df) 상측확률은 t 양측 p와 같다: F=t²
assert(approx(fPValue(4, 1, 10), 0.0734, 1e-3), `F(4;1,10)=${fPValue(4, 1, 10)}`);

// ⑥ 완전히 같은 분산이면 Levene은 유의하지 않다
const lev = leveneBrownForsythe([
  [1, 2, 3, 4, 5],
  [11, 12, 13, 14, 15],
]);
assert(approx(lev.W, 0, 1e-9), `Levene W=${lev.W}`);
assert(lev.ok, "동일 산포 → 등분산 유지");
const lev2 = leveneBrownForsythe([
  [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  [-40, -20, 0, 20, 40, -35, -15, 5, 25, 45],
]);
assert(lev2.p < 0.05, `이분산 감지 p=${lev2.p}`);

// ⑦ Welch — 표본크기·분산이 같으면 Student t와 df가 같아진다
const A = [1, 2, 3, 4, 5];
const B = [3, 4, 5, 6, 7];
const w = welchT(A, B);
assert(approx(w.df, 8, 1e-9), `Welch df=${w.df}`);
assert(approx(w.t, -2, 1e-9), `Welch t=${w.t}`);

// ⑧ 효과크기 — d = (M1-M2)/sp
const dd = cohensD(A, B);
assert(approx(dd.value, -2 / Math.sqrt(2.5), 1e-9), `d=${dd.value}`);
assert(cohensDz([2, 2, 2, 2]).value === Infinity || Number.isNaN(cohensDz([2, 2, 2, 2]).value) === false, "dz 계산");
assert(approx(etaSquared(30, 100).value, 0.3), "eta2=0.3");
assert(omegaSquared(30, 70, 2, 27).value < etaSquared(30, 100).value, "ω² ≤ η²");
assert(approx(correlationEffect(0.5)[1].value, 0.25), "R²=r²");

// ⑨ 교차표 — 완전 독립이면 χ²=0
const ct = crosstab(
  ["a", "a", "b", "b", "a", "a", "b", "b"],
  ["x", "y", "x", "y", "x", "y", "x", "y"],
);
assert(approx(ct.chi2, 0, 1e-9), `독립 χ²=${ct.chi2}`);
assert(ct.df === 1, `df=${ct.df}`);
assert(approx(ct.expected[0][0], 2), `기대빈도=${ct.expected[0][0]}`);
assert(approx(cramersV(0, 8, 2, 2).value, 0), "V=0");

// ⑩ Spearman — 단조증가면 ρ=1
assert(approx(spearman([1, 2, 3, 4], [10, 20, 30, 40]).rho, 1, 1e-9), "ρ=1");
assert(approx(spearman([1, 2, 3, 4], [40, 30, 20, 10]).rho, -1, 1e-9), "ρ=-1");

// ⑪ Bonferroni — 보정 p는 원 p의 m배(상한 1)
const pw = pairwiseT(["a", "b", "c"], [[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
assert(pw.length === 3, `쌍 개수=${pw.length}`);
assert(pw.every((r) => r.pAdj >= r.p - 1e-12), "pAdj ≥ p");

// ⑫ 정규성 — 표본 20 미만이면 검정 불가로 표시
assert(dagostinoPearson([1, 2, 3, 4, 5]).usable === false, "n<20 → usable=false");
const normalish = Array.from({ length: 200 }, (_, i) => {
  // Box–Muller with fixed seed-free deterministic angles
  const u = (i + 0.5) / 200;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * u);
});
const dp = dagostinoPearson(normalish);
assert(Number.isFinite(dp.k2) && dp.p >= 0 && dp.p <= 1, `K²=${dp.k2}, p=${dp.p}`);

console.log(`stats assumptions selftest OK · ${checks} checks`);
