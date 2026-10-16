/* additional numerical routines: SVD, noncentral F / chi2, signed-rank distribution */
import { Mat, Vec, eye, betainc, gammainc, lgamma } from "./core";

export function svd(A: Mat): { U: Mat; s: Vec; V: Mat } {
  const m = A.length, n = A[0].length;
  const U = A.map((r) => r.slice()); const V = eye(n);
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      let a = 0, b = 0, c = 0;
      for (let i = 0; i < m; i++) { a += U[i][p] * U[i][p]; b += U[i][q] * U[i][q]; c += U[i][p] * U[i][q]; }
      if (Math.abs(c) < 1e-300 || Math.abs(c) <= 1e-15 * Math.sqrt(a * b)) continue;
      off = Math.max(off, Math.abs(c) / Math.sqrt(a * b));
      const zeta = (b - a) / (2 * c); const t = Math.sign(zeta || 1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
      const cs = 1 / Math.sqrt(1 + t * t), sn = cs * t;
      for (let i = 0; i < m; i++) { const up = U[i][p], uq = U[i][q]; U[i][p] = cs * up - sn * uq; U[i][q] = sn * up + cs * uq; }
      for (let i = 0; i < n; i++) { const vp = V[i][p], vq = V[i][q]; V[i][p] = cs * vp - sn * vq; V[i][q] = sn * vp + cs * vq; }
    }
    if (off < 1e-15) break;
  }
  const s = new Array(n).fill(0);
  for (let j = 0; j < n; j++) { let nr = 0; for (let i = 0; i < m; i++) nr += U[i][j] * U[i][j]; s[j] = Math.sqrt(nr); if (s[j] > 0) for (let i = 0; i < m; i++) U[i][j] /= s[j]; }
  return { U, s, V };
}

function poissonMix(term: (j: number) => number, half: number): number {
  const kmax = Math.floor(half); let sum = 0;
  for (let j = kmax; j < kmax + 4000; j++) { const t = term(j); sum += t; if (t < 1e-17 * Math.max(sum, 1e-300) && j > kmax + 5) break; }
  for (let j = kmax - 1; j >= 0; j--) { const t = term(j); sum += t; if (t < 1e-17 * Math.max(sum, 1e-300)) break; }
  return Math.min(1, sum);
}
/** noncentral chi-square CDF */
export function ncx2cdf(x: number, df: number, ncp: number): number {
  if (x <= 0) return 0;
  if (ncp === 0) return gammainc(df / 2, x / 2);
  const half = ncp / 2;
  return poissonMix((j) => Math.exp(-half + j * Math.log(half) - lgamma(j + 1)) * gammainc(df / 2 + j, x / 2), half);
}
/** noncentral F CDF */
export function ncfcdf(x: number, d1: number, d2: number, ncp: number): number {
  if (x <= 0) return 0;
  const z = (d1 * x) / (d1 * x + d2);
  if (ncp === 0) return betainc(z, d1 / 2, d2 / 2);
  const half = ncp / 2;
  return poissonMix((j) => Math.exp(-half + j * Math.log(half) - lgamma(j + 1)) * betainc(z, d1 / 2 + j, d2 / 2), half);
}
/** exact CDF of Wilcoxon signed-rank W+ for n untied observations */
export function signrankCdf(n: number): (w: number) => number {
  const maxw = (n * (n + 1)) / 2; const cnt = new Array(maxw + 1).fill(0); cnt[0] = 1;
  for (let k = 1; k <= n; k++) for (let w = maxw; w >= k; w--) cnt[w] += cnt[w - k];
  const total = Math.pow(2, n); const cum: number[] = []; let s = 0;
  for (let w = 0; w <= maxw; w++) { s += cnt[w]; cum.push(s / total); }
  return (w: number) => (w < 0 ? 0 : w >= maxw ? 1 : cum[Math.floor(w)]);
}
