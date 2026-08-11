/**
 * Smoke tests for stats-core (browser/Node shared).
 * Run: npx --yes tsx scripts/stats-core-selftest.ts
 */
import {
  betainc,
  erf,
  gammainc,
  lgamma,
  normalCdf,
  olsQR,
  runStatsTechnique,
} from "../lib/stats-core";
import { chooseStatsExecMode } from "../lib/stats-runtime";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function approx(a: number, b: number, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

// ① Analytic anchors
assert(approx(normalCdf(0), 0.5), "Φ(0)=0.5");
assert(approx(erf(0), 0), "erf(0)=0");
assert(approx(betainc(0.37, 1, 1), 0.37), "betainc(x;1,1)=x");
assert(approx(lgamma(5), Math.log(24), 1e-8), "lgamma(5)=ln(24)");
// χ² df=2 CDF at x=2: 1-e^{-1}
const chi2 = 1 - Math.exp(-1);
assert(approx(gammainc(1, 1), 1 - Math.exp(-1), 1e-5) || approx(gammainc(1, 1), chi2, 1e-3), "gammainc smoke");

// ② OLS Xᵀe ≈ 0
const X = [
  [1],
  [2],
  [3],
  [4],
  [5],
];
const y = [2.1, 3.9, 6.2, 7.8, 10.1];
const fit = olsQR(X, y, true);
assert(fit.xtxeNorm < 1e-8, `Xᵀe norm ${fit.xtxeNorm}`);
assert(Math.abs(fit.residualSum) < 1e-8, `Σe ${fit.residualSum}`);
assert(approx(fit.sse + (fit.r2 * fit.sst), fit.sst, 1e-6) || approx(fit.sse / fit.sst + fit.r2, 1, 1e-6), "SST≈SSR+SSE");

// Runtime gate
assert(chooseStatsExecMode({ techniqueCode: "A-01", n: 100, p: 2 }) === "browser", "small→browser");
assert(
  chooseStatsExecMode({ techniqueCode: "E-06", n: 200, p: 3, bootstrapB: 5000 }) === "server-async",
  "E-06→async",
);
assert(
  chooseStatsExecMode({ techniqueCode: "E-02", n: 5000, p: 50 }) === "server-sync",
  "large cells→sync",
);

const self = runStatsTechnique("special.selftest", {});
assert(self.ok, "special.selftest");

console.log("stats-core selftest OK");
console.log({
  r2: fit.r2,
  beta: fit.beta,
  xtxeNorm: fit.xtxeNorm,
  gate: {
    small: chooseStatsExecMode({ techniqueCode: "A-01", n: 10, p: 1 }),
    e06: chooseStatsExecMode({ techniqueCode: "E-06", n: 50, p: 3, bootstrapB: 5000 }),
  },
});
