/**
 * E-06 — mediation (a·b) with percentile bootstrap CI (server-async candidate).
 */
import { type Matrix } from "../linalg/matrix";
import { olsQR } from "./ols";

export type MediationResult = {
  a: number;
  b: number;
  cPrime: number;
  c: number;
  indirect: number;
  ciLow: number;
  ciHigh: number;
  B: number;
  significant95: boolean;
};

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function resampleIdx(n: number, rand: () => number): number[] {
  const idx = Array(n);
  for (let i = 0; i < n; i++) idx[i] = Math.floor(rand() * n);
  return idx;
}

/**
 * Simple mediation: X → M → Y (and X → Y).
 * X, M, Y are column vectors as length-n arrays (or 1-col matrices via wrappers).
 */
export function mediationBootstrap(
  x: number[],
  m: number[],
  y: number[],
  B = 5000,
  seed = 42,
  onProgress?: (p: number) => void,
): MediationResult {
  const n = x.length;
  if (m.length !== n || y.length !== n) throw new Error("mediation: length mismatch");

  const X1 = x.map((v) => [v]);
  // path a: M ~ X
  const aFit = olsQR(X1, m, true);
  const a = aFit.beta[1];
  // path b,c': Y ~ X + M
  const XM: Matrix = x.map((xi, i) => [xi, m[i]]);
  const bcFit = olsQR(XM, y, true);
  const cPrime = bcFit.beta[1];
  const b = bcFit.beta[2];
  // total c: Y ~ X
  const cFit = olsQR(X1, y, true);
  const c = cFit.beta[1];
  const indirect = a * b;

  const rand = mulberry32(seed);
  const boots: number[] = [];
  const step = Math.max(1, Math.floor(B / 20));
  for (let i = 0; i < B; i++) {
    const idx = resampleIdx(n, rand);
    const xb = idx.map((j) => x[j]);
    const mb = idx.map((j) => m[j]);
    const yb = idx.map((j) => y[j]);
    try {
      const aa = olsQR(
        xb.map((v) => [v]),
        mb,
        true,
      ).beta[1];
      const bb = olsQR(
        xb.map((xi, k) => [xi, mb[k]]),
        yb,
        true,
      ).beta[2];
      boots.push(aa * bb);
    } catch {
      /* skip singular draws */
    }
    if (onProgress && i % step === 0) onProgress(i / B);
  }
  onProgress?.(1);
  boots.sort((u, v) => u - v);
  const lo = boots[Math.floor(0.025 * (boots.length - 1))] ?? NaN;
  const hi = boots[Math.floor(0.975 * (boots.length - 1))] ?? NaN;

  return {
    a,
    b,
    cPrime,
    c,
    indirect,
    ciLow: lo,
    ciHigh: hi,
    B: boots.length,
    significant95: !(lo <= 0 && hi >= 0),
  };
}
