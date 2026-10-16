/* Methodos TS core: special functions, distributions, linear algebra, data helpers.
 * Pure TypeScript, no dependencies; runs in browser and Node. */

export type Mat = number[][];
export type Vec = number[];

// ───────────────────────── special functions ─────────────────────────
const LG = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7,
];
export function lgamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1;
  let a = LG[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LG[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** log of regularized incomplete beta via continued fraction */
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 500, EPS = 1e-16, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
/** regularized incomplete beta I_x(a,b) */
export function betainc(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbt = lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x);
  const bt = Math.exp(lbt);
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}
/** upper tail of I: 1 - I_x(a,b) computed without cancellation */
export function betaincUpper(x: number, a: number, b: number): number {
  if (x <= 0) return 1;
  if (x >= 1) return 0;
  const lbt = lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x);
  const bt = Math.exp(lbt);
  if (x < (a + 1) / (a + b + 2)) return 1 - (bt * betacf(a, b, x)) / a;
  return (bt * betacf(b, a, 1 - x)) / b;
}
/** regularized lower incomplete gamma P(a,x) */
export function gammainc(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum;
    for (let n = 0; n < 1000; n++) {
      ap += 1; del *= x / ap; sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-16) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  return 1 - gammaincUpper(a, x);
}
export function gammaincUpper(a: number, x: number): number {
  if (x <= 0) return 1;
  if (x < a + 1) return 1 - gammainc(a, x);
  const FPMIN = 1e-300;
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-16) break;
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

// erf / normal
export function erfc(x: number): number {
  // high-accuracy via incomplete gamma
  if (x === 0) return 1;
  return x > 0 ? gammaincUpper(0.5, x * x) : 1 + gammainc(0.5, x * x);
}
export function normcdf(z: number): number {
  return 0.5 * erfc(-z / Math.SQRT2);
}
export function normsf(z: number): number {
  return 0.5 * erfc(z / Math.SQRT2);
}
export function normpdf(z: number): number {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}
/** Acklam + one Halley refinement step */
export function normppf(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let x: number;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pl) {
    const q = p - 0.5, r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  for (let i = 0; i < 2; i++) {
    const e = normcdf(x) - p;
    const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
    x = x - u / (1 + (x * u) / 2);
  }
  return x;
}

// Student t
export function tcdf(t: number, df: number): number {
  const x = df / (df + t * t);
  const tail = 0.5 * betainc(x, df / 2, 0.5);
  return t > 0 ? 1 - tail : tail;
}
export function tsf(t: number, df: number): number {
  const x = df / (df + t * t);
  const tail = 0.5 * betainc(x, df / 2, 0.5);
  return t > 0 ? tail : 1 - tail;
}
/** two-sided p */
export function tp2(t: number, df: number): number {
  if (!isFinite(df)) return 2 * normsf(Math.abs(t));
  return betainc(df / (df + t * t), df / 2, 0.5);
}
function bisectMono(f: (x: number) => number, target: number, lo: number, hi: number): number {
  // f increasing; find x with f(x)=target
  for (let i = 0; i < 400; i++) {
    const mid = 0.5 * (lo + hi);
    if (f(mid) < target) lo = mid; else hi = mid;
    if (Math.abs(hi - lo) < 1e-15 * Math.max(1, Math.abs(mid))) break;
  }
  return 0.5 * (lo + hi);
}
export function tppf(p: number, df: number): number {
  if (!isFinite(df)) return normppf(p);
  if (p === 0.5) return 0;
  const sgn = p < 0.5 ? -1 : 1;
  const pp = p < 0.5 ? p : 1 - p; // upper tail prob
  // solve sf(t)=pp for t>0 (sf decreasing)
  let lo = 0, hi = 1;
  while (tsf(hi, df) > pp && hi < 1e12) hi *= 2;
  for (let i = 0; i < 300; i++) {
    const mid = 0.5 * (lo + hi);
    if (tsf(mid, df) > pp) lo = mid; else hi = mid;
    if (hi - lo < 1e-15 * Math.max(1, mid)) break;
  }
  return sgn * 0.5 * (lo + hi);
}
// F
export function fcdf(f: number, d1: number, d2: number): number {
  if (f <= 0) return 0;
  return betainc((d1 * f) / (d1 * f + d2), d1 / 2, d2 / 2);
}
export function fsf(f: number, d1: number, d2: number): number {
  if (f <= 0) return 1;
  return betaincUpper((d1 * f) / (d1 * f + d2), d1 / 2, d2 / 2);
}
export function fppf(p: number, d1: number, d2: number): number {
  let hi = 1;
  while (fcdf(hi, d1, d2) < p && hi < 1e12) hi *= 2;
  return bisectMono((x) => fcdf(x, d1, d2), p, 0, hi);
}
// chi-square
export function chi2cdf(x: number, df: number): number { return gammainc(df / 2, x / 2); }
export function chi2sf(x: number, df: number): number { return x <= 0 ? 1 : gammaincUpper(df / 2, x / 2); }
export function chi2ppf(p: number, df: number): number {
  let hi = Math.max(1, df);
  while (chi2cdf(hi, df) < p && hi < 1e12) hi *= 2;
  return bisectMono((x) => chi2cdf(x, df), p, 0, hi);
}
// beta / binomial / poisson
export function binomPmf(k: number, n: number, p: number): number {
  if (k < 0 || k > n) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
export function binomCdf(k: number, n: number, p: number): number {
  if (k < 0) return 0;
  if (k >= n) return 1;
  return betaincUpper(p, k + 1, n - k);
}
export function poisPmf(k: number, mu: number): number {
  if (k < 0) return 0;
  return Math.exp(k * Math.log(mu) - mu - lgamma(k + 1));
}

// studentized range (for Tukey) — via numerical integration (Copenhaver–Holland style, simplified Gauss–Legendre)
const GL_X16 = [0.0950125098376374, 0.2816035507792589, 0.4580167776572274, 0.6178762444026438, 0.755404408355003, 0.8656312023878318, 0.9445750230732326, 0.9894009349916499];
const GL_W16 = [0.1894506104550685, 0.1826034150449236, 0.1691565193950025, 0.1495959888165767, 0.1246289712555339, 0.0951585116824928, 0.0622535239386479, 0.0271524594117541];
function glIntegrate(f: (x: number) => number, a: number, b: number): number {
  const m = 0.5 * (a + b), h = 0.5 * (b - a);
  let s = 0;
  for (let i = 0; i < 8; i++) { s += GL_W16[i] * (f(m + h * GL_X16[i]) + f(m - h * GL_X16[i])); }
  return s * h;
}
function glComposite(f: (x: number) => number, a: number, b: number, n: number): number {
  let s = 0; const w = (b - a) / n;
  for (let i = 0; i < n; i++) s += glIntegrate(f, a + i * w, a + (i + 1) * w);
  return s;
}
/** P(range of k std normals <= w) */
function rangeNormCdf(w: number, k: number): number {
  if (w <= 0) return 0;
  const f = (z: number) => normpdf(z) * Math.pow(Math.max(0, normcdf(z) - normcdf(z - w)), k - 1);
  return Math.min(1, k * glComposite(f, -8, 8, 24));
}
/** CDF of studentized range */
export function ptukey(q: number, k: number, df: number): number {
  if (q <= 0) return 0;
  if (!isFinite(df) || df > 5000) return rangeNormCdf(q, k);
  // integrate over s ~ chi_df/sqrt(df)
  const lc = (df / 2) * Math.log(df / 2) - lgamma(df / 2) + Math.log(2) ;
  const f = (s: number) => {
    if (s <= 0) return 0;
    const lg = lc + (df - 1) * Math.log(s) - (df * s * s) / 2;
    return Math.exp(lg) * rangeNormCdf(q * s, k);
  };
  const sd = 1 / Math.sqrt(2 * df);
  const lo = Math.max(1e-8, 1 - 12 * sd), hi = 1 + 12 * sd * (df < 10 ? 3 : 1) + (df < 10 ? 1.5 : 0);
  return Math.min(1, glComposite(f, lo, hi, 30));
}
export function qtukey(p: number, k: number, df: number): number {
  let hi = 4;
  while (ptukey(hi, k, df) < p && hi < 200) hi *= 1.6;
  return bisectMono((x) => ptukey(x, k, df), p, 0, hi);
}

// ───────────────────────── descriptive helpers ─────────────────────────
export const sum = (a: Vec) => { let s = 0; for (const v of a) s += v; return s; };
export const mean = (a: Vec) => sum(a) / a.length;
export function variance(a: Vec, ddof = 1): number {
  const m = mean(a); let s = 0;
  for (const v of a) s += (v - m) * (v - m);
  return s / (a.length - ddof);
}
export const sd = (a: Vec, ddof = 1) => Math.sqrt(variance(a, ddof));
export function sorted(a: Vec): Vec { return a.slice().sort((x, y) => x - y); }
/** R type 7 quantile */
export function quantile(a: Vec, p: number, isSorted = false): number {
  const s = isSorted ? a : sorted(a);
  const h = (s.length - 1) * p;
  const lo = Math.floor(h), hi = Math.ceil(h);
  return s[lo] + (h - lo) * (s[hi] - s[lo]);
}
export const median = (a: Vec) => quantile(a, 0.5);
export function cov(a: Vec, b: Vec): number {
  const ma = mean(a), mb = mean(b); let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb);
  return s / (a.length - 1);
}
export function pearson(a: Vec, b: Vec): number {
  return cov(a, b) / (sd(a) * sd(b));
}
export function rank(a: Vec): Vec {
  const idx = a.map((v, i) => i).sort((i, j) => a[i] - a[j]);
  const r = new Array(a.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && a[idx[j + 1]] === a[idx[i]]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[idx[k]] = avg;
    i = j + 1;
  }
  return r;
}

// ───────────────────────── linear algebra ─────────────────────────
export const zeros = (n: number, m: number): Mat => Array.from({ length: n }, () => new Array(m).fill(0));
export const eye = (n: number): Mat => { const I = zeros(n, n); for (let i = 0; i < n; i++) I[i][i] = 1; return I; };
export const T = (A: Mat): Mat => { const r = A.length, c = A[0].length; const B = zeros(c, r); for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) B[j][i] = A[i][j]; return B; };
export function matmul(A: Mat, B: Mat): Mat {
  const n = A.length, k = B.length, m = B[0].length; const C = zeros(n, m);
  for (let i = 0; i < n; i++) for (let l = 0; l < k; l++) { const a = A[i][l]; if (a === 0) continue; for (let j = 0; j < m; j++) C[i][j] += a * B[l][j]; }
  return C;
}
export function matvec(A: Mat, v: Vec): Vec { return A.map((r) => { let s = 0; for (let j = 0; j < r.length; j++) s += r[j] * v[j]; return s; }); }
/** Gauss-Jordan inverse with partial pivoting; throws if singular */
export function inv(A: Mat): Mat {
  const n = A.length; const M = A.map((r, i) => [...r, ...eye(n)[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-300) throw new Error("singular matrix");
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c];
    for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; if (f !== 0) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; }
  }
  return M.map((r) => r.slice(n));
}
export function solve(A: Mat, b: Vec): Vec {
  const n = A.length; const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-300) throw new Error("singular matrix");
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
  return x;
}
export function det(A: Mat): number {
  const n = A.length; const M = A.map((r) => r.slice()); let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (M[p][c] === 0) return 0;
    if (p !== c) { [M[c], M[p]] = [M[p], M[c]]; d = -d; }
    d *= M[c][c];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let j = c; j < n; j++) M[r][j] -= f * M[c][j]; }
  }
  return d;
}
export function logdet(A: Mat): number {
  const L = cholesky(A); let s = 0; for (let i = 0; i < L.length; i++) s += Math.log(L[i][i]); return 2 * s;
}
export function cholesky(A: Mat): Mat {
  const n = A.length; const L = zeros(n, n);
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = A[i][j]; for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    if (i === j) { if (s <= 0) throw new Error("not positive definite"); L[i][i] = Math.sqrt(s); } else L[i][j] = s / L[j][j];
  }
  return L;
}
/** symmetric eigen decomposition (Jacobi). returns values descending, vectors as columns */
export function eigSym(A: Mat): { values: Vec; vectors: Mat } {
  const n = A.length; const a = A.map((r) => r.slice()); const v = eye(n);
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
    if (off < 1e-30) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-300) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = v[k][p], vkq = v[k][q]; v[k][p] = c * vkp - s * vkq; v[k][q] = s * vkp + c * vkq; }
    }
  }
  const idx = Array.from({ length: n }, (_, i) => i).sort((i, j) => a[j][j] - a[i][i]);
  const values = idx.map((i) => a[i][i]);
  const vectors = zeros(n, n);
  idx.forEach((src, dst) => { for (let k = 0; k < n; k++) vectors[k][dst] = v[k][src]; });
  return { values, vectors };
}

// ───────────────────────── OLS ─────────────────────────
export interface OLSResult {
  beta: Vec; se: Vec; t: Vec; p: Vec; resid: Vec; fitted: Vec;
  n: number; k: number; dfResid: number; rss: number; tss: number; r2: number; adjR2: number;
  sigma2: number; XtXinv: Mat; fStat: number; fP: number;
}
/** OLS with intercept already in X. Weighted if w supplied. */
export function ols(X: Mat, y: Vec, w?: Vec): OLSResult {
  const n = X.length, k = X[0].length;
  const Xw = w ? X.map((r, i) => r.map((v) => v * Math.sqrt(w[i]))) : X;
  const yw = w ? y.map((v, i) => v * Math.sqrt(w[i])) : y;
  const XtX = zeros(k, k), Xty = new Array(k).fill(0);
  for (let i = 0; i < n; i++) for (let a = 0; a < k; a++) { Xty[a] += Xw[i][a] * yw[i]; for (let b = 0; b < k; b++) XtX[a][b] += Xw[i][a] * Xw[i][b]; }
  const XtXinv = inv(XtX);
  const beta = matvec(XtXinv, Xty);
  const fitted = X.map((r) => { let s = 0; for (let j = 0; j < k; j++) s += r[j] * beta[j]; return s; });
  const resid = y.map((v, i) => v - fitted[i]);
  let rss = 0; for (let i = 0; i < n; i++) rss += (w ? w[i] : 1) * resid[i] * resid[i];
  const hasInt = X.every((r) => r[0] === 1);
  const wsum = w ? sum(w) : n;
  const ybar = w ? sum(y.map((v, i) => v * w[i])) / wsum : mean(y);
  let tss = 0; for (let i = 0; i < n; i++) tss += (w ? w[i] : 1) * (y[i] - (hasInt ? ybar : 0)) ** 2;
  const dfResid = n - k;
  const sigma2 = rss / dfResid;
  const se = beta.map((_, j) => Math.sqrt(sigma2 * XtXinv[j][j]));
  const t = beta.map((b, j) => b / se[j]);
  const p = t.map((tv) => tp2(tv, dfResid));
  const r2 = 1 - rss / tss;
  const dfModel = hasInt ? k - 1 : k;
  const adjR2 = 1 - ((1 - r2) * (hasInt ? n - 1 : n)) / dfResid;
  const fStat = (tss - rss) / dfModel / sigma2;
  const fP = fsf(fStat, dfModel, dfResid);
  return { beta, se, t, p, resid, fitted, n, k, dfResid, rss, tss, r2, adjR2, sigma2, XtXinv, fStat, fP };
}

// ───────────────────────── optimization ─────────────────────────
/** Nelder–Mead minimizer */
export function nelderMead(f: (x: Vec) => number, x0: Vec, opt: { maxIter?: number; tol?: number; step?: number } = {}): { x: Vec; fx: number; iter: number } {
  const n = x0.length, maxIter = opt.maxIter ?? 2000 * n, tol = opt.tol ?? 1e-12, step = opt.step ?? 0.1;
  let sim: Vec[] = [x0.slice()];
  for (let i = 0; i < n; i++) { const x = x0.slice(); x[i] = x[i] !== 0 ? x[i] * (1 + step) : step * 0.25; sim.push(x); }
  let fs = sim.map(f);
  let iter = 0;
  for (; iter < maxIter; iter++) {
    const order = fs.map((_, i) => i).sort((a, b) => fs[a] - fs[b]);
    sim = order.map((i) => sim[i]); fs = order.map((i) => fs[i]);
    if (Math.abs(fs[n] - fs[0]) <= tol * (Math.abs(fs[0]) + 1e-12) && iter > 10) break;
    const cen = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) cen[j] += sim[i][j] / n;
    const refl = cen.map((c, j) => c + (c - sim[n][j])); const fr = f(refl);
    if (fr < fs[0]) {
      const exp = cen.map((c, j) => c + 2 * (c - sim[n][j])); const fe = f(exp);
      if (fe < fr) { sim[n] = exp; fs[n] = fe; } else { sim[n] = refl; fs[n] = fr; }
    } else if (fr < fs[n - 1]) { sim[n] = refl; fs[n] = fr; }
    else {
      const con = fr < fs[n] ? cen.map((c, j) => c + 0.5 * (refl[j] - c)) : cen.map((c, j) => c + 0.5 * (sim[n][j] - c));
      const fc = f(con);
      if (fc < Math.min(fr, fs[n])) { sim[n] = con; fs[n] = fc; }
      else { for (let i = 1; i <= n; i++) { sim[i] = sim[i].map((v, j) => sim[0][j] + 0.5 * (v - sim[0][j])); fs[i] = f(sim[i]); } }
    }
  }
  const b = fs.indexOf(Math.min(...fs));
  return { x: sim[b], fx: fs[b], iter };
}
/** numerical gradient */
export function numGrad(f: (x: Vec) => number, x: Vec, h = 1e-6): Vec {
  return x.map((_, i) => {
    const hh = h * Math.max(1, Math.abs(x[i]));
    const xp = x.slice(), xm = x.slice(); xp[i] += hh; xm[i] -= hh;
    return (f(xp) - f(xm)) / (2 * hh);
  });
}
export function numHess(f: (x: Vec) => number, x: Vec, h = 1e-4): Mat {
  const n = x.length; const H = zeros(n, n); const f0 = f(x);
  const hh = x.map((v) => h * Math.max(1, Math.abs(v)));
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {
    let v: number;
    if (i === j) { const xp = x.slice(), xm = x.slice(); xp[i] += hh[i]; xm[i] -= hh[i]; v = (f(xp) - 2 * f0 + f(xm)) / (hh[i] * hh[i]); }
    else {
      const a = x.slice(), b = x.slice(), c = x.slice(), d = x.slice();
      a[i] += hh[i]; a[j] += hh[j]; b[i] += hh[i]; b[j] -= hh[j]; c[i] -= hh[i]; c[j] += hh[j]; d[i] -= hh[i]; d[j] -= hh[j];
      v = (f(a) - f(b) - f(c) + f(d)) / (4 * hh[i] * hh[j]);
    }
    H[i][j] = H[j][i] = v;
  }
  return H;
}
/** BFGS with numeric gradient + backtracking */
export function bfgs(f: (x: Vec) => number, x0: Vec, opt: { maxIter?: number; gtol?: number; grad?: (x: Vec) => Vec } = {}): { x: Vec; fx: number; iter: number; converged: boolean } {
  const n = x0.length, maxIter = opt.maxIter ?? 500, gtol = opt.gtol ?? 1e-8;
  const g = opt.grad ?? ((x: Vec) => numGrad(f, x, 1e-6));
  let x = x0.slice(), fx = f(x), gr = g(x), H = eye(n);
  let converged = false, iter = 0;
  for (; iter < maxIter; iter++) {
    const gn = Math.sqrt(sum(gr.map((v) => v * v)));
    if (gn < gtol) { converged = true; break; }
    let dir = matvec(H, gr).map((v) => -v);
    let slope = sum(dir.map((d, i) => d * gr[i]));
    if (slope >= 0) { H = eye(n); dir = gr.map((v) => -v); slope = -gn * gn; }
    let t = 1, xn = x, fn = fx;
    for (let ls = 0; ls < 60; ls++) {
      xn = x.map((v, i) => v + t * dir[i]); fn = f(xn);
      if (isFinite(fn) && fn <= fx + 1e-4 * t * slope) break;
      t *= 0.5;
    }
    if (!isFinite(fn) || fn > fx) { if (gn < 1e-5) converged = true; break; }
    const gnew = g(xn);
    const s = xn.map((v, i) => v - x[i]), yv = gnew.map((v, i) => v - gr[i]);
    const sy = sum(s.map((v, i) => v * yv[i]));
    if (sy > 1e-12) {
      const Hy = matvec(H, yv); const yHy = sum(yv.map((v, i) => v * Hy[i]));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
        H[i][j] += ((sy + yHy) * s[i] * s[j]) / (sy * sy) - (Hy[i] * s[j] + s[i] * Hy[j]) / sy;
    }
    const df = fx - fn;
    x = xn; fx = fn; gr = gnew;
    if (df < 1e-15 * (Math.abs(fx) + 1) && Math.sqrt(sum(gr.map((v) => v * v))) < 1e-5) { converged = true; break; }
  }
  return { x, fx, iter, converged };
}
/** Brent root / scalar minimizer on interval */
export function brentMin(f: (x: number) => number, a: number, b: number, tol = 1e-10): { x: number; fx: number } {
  const g = 0.3819660112501051; let x = a + g * (b - a), w = x, v = x; let fx = f(x), fw = fx, fv = fx; let d = 0, e = 0;
  for (let it = 0; it < 200; it++) {
    const xm = 0.5 * (a + b), tol1 = tol * Math.abs(x) + 1e-12, tol2 = 2 * tol1;
    if (Math.abs(x - xm) <= tol2 - 0.5 * (b - a)) break;
    let u: number;
    if (Math.abs(e) > tol1) {
      const r = (x - w) * (fx - fv), q0 = (x - v) * (fx - fw); let p = (x - v) * q0 - (x - w) * r; let q = 2 * (q0 - r);
      if (q > 0) p = -p; q = Math.abs(q); const etemp = e; e = d;
      if (Math.abs(p) >= Math.abs(0.5 * q * etemp) || p <= q * (a - x) || p >= q * (b - x)) { e = x >= xm ? a - x : b - x; d = g * e; }
      else { d = p / q; u = x + d; if (u - a < tol2 || b - u < tol2) d = xm - x >= 0 ? tol1 : -tol1; }
    } else { e = x >= xm ? a - x : b - x; d = g * e; }
    u = Math.abs(d) >= tol1 ? x + d : x + (d >= 0 ? tol1 : -tol1);
    const fu = f(u);
    if (fu <= fx) { if (u >= x) a = x; else b = x; v = w; fv = fw; w = x; fw = fx; x = u; fx = fu; }
    else { if (u < x) a = u; else b = u; if (fu <= fw || w === x) { v = w; fv = fw; w = u; fw = fu; } else if (fu <= fv || v === x || v === w) { v = u; fv = fu; } }
  }
  return { x, fx };
}
export function bisect(f: (x: number) => number, a: number, b: number, tol = 1e-12): number {
  let fa = f(a);
  for (let i = 0; i < 300; i++) {
    const m = 0.5 * (a + b), fm = f(m);
    if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m;
    if (Math.abs(b - a) < tol) break;
  }
  return 0.5 * (a + b);
}

// ───────────────────────── data ─────────────────────────
export interface Table { headers: string[]; cols: Record<string, (number | string | null)[]>; n: number }
export function parseCSV(text: string): Table {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = []; let cur: string[] = []; let f = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { cur.push(f); f = ""; }
    else if (c === "\n") { cur.push(f.replace(/\r$/, "")); rows.push(cur); cur = []; f = ""; }
    else f += c;
  }
  if (f.length || cur.length) { cur.push(f.replace(/\r$/, "")); rows.push(cur); }
  const headers = rows[0].map((h) => h.trim());
  const body = rows.slice(1).filter((r) => r.some((x) => x.trim() !== ""));
  const cols: Table["cols"] = {};
  headers.forEach((h, j) => {
    const raw = body.map((r) => (r[j] ?? "").trim());
    const numeric = raw.every((s) => s === "" || s.toLowerCase() === "na" || (s !== "" && !isNaN(Number(s))));
    cols[h] = raw.map((s) => (s === "" || s.toLowerCase() === "na" ? null : numeric ? Number(s) : s));
  });
  return { headers, cols, n: body.length };
}
export function numCol(t: Table, name: string): (number | null)[] {
  const c = t.cols[name]; if (!c) throw new Error(`variable not found: ${name}`);
  return c.map((v) => (typeof v === "number" ? v : v === null ? null : Number(v)));
}
/** listwise complete rows over given columns */
export function completeIdx(t: Table, names: string[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < t.n; i++) if (names.every((nm) => t.cols[nm][i] !== null && t.cols[nm][i] !== undefined)) out.push(i);
  return out;
}
export function pick<T>(a: T[], idx: number[]): T[] { return idx.map((i) => a[i]); }
/** unique levels, in order of first appearance (numeric levels sorted) */
export function levels(a: (number | string | null)[]): (number | string)[] {
  const s: (number | string)[] = [];
  for (const v of a) if (v !== null && !s.includes(v)) s.push(v);
  if (s.every((v) => typeof v === "number")) (s as number[]).sort((x, y) => x - y);
  else (s as string[]).sort((x, y) => (String(x) < String(y) ? -1 : String(x) > String(y) ? 1 : 0));
  return s;
}
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function randn(rng: () => number): number {
  let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ───────────────────────── noncentral t (AS 243) ─────────────────────────
export function nctcdf(t: number, df: number, delta: number): number {
  if (df <= 0) return NaN;
  if (delta === 0) return tcdf(t, df);
  let negdel = false, tt = t, del = delta;
  if (t < 0) { negdel = true; tt = -t; del = -delta; }
  const x = (tt * tt) / (tt * tt + df);
  let tnc: number;
  if (x > 0) {
    const lambda = del * del;
    let p = 0.5 * Math.exp(-0.5 * lambda);
    if (p === 0) return delta > 0 ? 0 : 1;
    let q = Math.sqrt(2 / Math.PI) * p * del;
    let s = 0.5 - p;
    let a = 0.5; const b = 0.5 * df;
    const rxb = Math.pow(1 - x, b);
    const albeta = 0.5 * Math.log(Math.PI) + lgamma(b) - lgamma(0.5 + b);
    let xodd = betainc(x, a, b);
    let godd = 2 * rxb * Math.exp(a * Math.log(x) - albeta);
    let xeven = 1 - rxb;
    let geven = b * x * rxb;
    tnc = p * xodd + q * xeven;
    for (let it = 1; it < 2000; it++) {
      a += 1; xodd -= godd; xeven -= geven;
      godd *= (x * (a + b - 1)) / a;
      geven *= (x * (a + b - 0.5)) / (a + 0.5);
      p *= lambda / (2 * it); q *= lambda / (2 * it + 1);
      tnc += p * xodd + q * xeven;
      s -= p;
      if (s < -1e-12) break;
      const errbd = 2 * s * (xodd - godd);
      if (Math.abs(errbd) < 1e-13) break;
    }
  } else tnc = 0;
  tnc += normcdf(-del);
  const out = negdel ? 1 - tnc : tnc;
  return Math.min(1, Math.max(0, out));
}
