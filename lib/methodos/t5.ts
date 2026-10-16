import {
  mean, sd, variance, median, quantile, numCol, completeIdx, pick, levels, inv, solve, logdet, matmul, T, zeros, eye, bfgs, nelderMead, brentMin,
  chi2sf, normsf, normppf, tppf, tp2, fsf, ols, Mat, mulberry32, randn, matvec, rank,
} from "./core";
import { Input, MResult, mk } from "./types";
import { design } from "./t2";
import { acfPacf } from "./ts_util";
import { NumpyRng } from "./nprng";

// ───────── M31 잠재프로파일 (구형·등분산 가우스 혼합, EM + 다중시작)
function logMixture(x: number[][], means: number[][], v: number, pi: number[]) {
  const n = x.length, d = x[0].length, k = pi.length; v = Math.max(v, 1e-9); let ll = 0; const resp: number[][] = [];
  const lpi = pi.map((p) => Math.log(Math.max(p, 1e-300)));
  for (let i = 0; i < n; i++) {
    const lw = new Array(k); let m = -Infinity;
    for (let j = 0; j < k; j++) { let sq = 0; for (let q = 0; q < d; q++) { const t = x[i][q] - means[j][q]; sq += t * t; } lw[j] = lpi[j] - 0.5 * d * Math.log(2 * Math.PI * v) - sq / (2 * v); if (lw[j] > m) m = lw[j]; }
    let s = 0; for (let j = 0; j < k; j++) s += Math.exp(lw[j] - m); const lse = m + Math.log(s); ll += lse;
    resp.push(lw.map((l) => Math.exp(l - lse)));
  }
  return { ll, resp };
}
function emStep(x: number[][], resp: number[][], k: number) {
  const n = x.length, d = x[0].length; const nk = new Array(k).fill(1e-12); const means = Array.from({ length: k }, () => new Array(d).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) { nk[j] += resp[i][j]; for (let q = 0; q < d; q++) means[j][q] += resp[i][j] * x[i][q]; }
  for (let j = 0; j < k; j++) for (let q = 0; q < d; q++) means[j][q] /= nk[j];
  let ssq = 0; for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) { let sq = 0; for (let q = 0; q < d; q++) { const t = x[i][q] - means[j][q]; sq += t * t; } ssq += resp[i][j] * sq; }
  return { pi: nk.map((v) => v / n), means, v: ssq / (n * d) };
}
function emGmm(x: number[][], k: number, seed: number) {
  const n = x.length, d = x[0].length;
  if (k === 1) { const mu = [Array.from({ length: d }, (_, q) => mean(x.map((r) => r[q])))]; const v = x.reduce((s, r) => s + r.reduce((a, t, q) => a + (t - mu[0][q]) ** 2, 0), 0) / (n * d); const { ll, resp } = logMixture(x, mu, v, [1]); return { ll, resp, pi: [1], means: mu, v }; }
  const rng = mulberry32(seed); const idx: number[] = []; while (idx.length < k) { const j = Math.floor(rng() * n); if (!idx.includes(j)) idx.push(j); }
  let means = idx.map((i) => x[i].map((t) => t + 1e-6 * randn(rng)));
  const gm = Array.from({ length: d }, (_, q) => mean(x.map((r) => r[q]))); let v = x.reduce((s, r) => s + r.reduce((a, t, q) => a + (t - gm[q]) ** 2, 0), 0) / (n * d) || 1;
  let pi = new Array(k).fill(1 / k); let prev = -Infinity; let resp: number[][] = [];
  for (let it = 0; it < 300; it++) {
    const e = logMixture(x, means, v, pi); resp = e.resp; const m = emStep(x, resp, k); pi = m.pi; means = m.means; v = m.v;
    if (Math.abs(e.ll - prev) < 1e-8 * Math.max(1, Math.abs(prev))) break; prev = e.ll;
  }
  const f = logMixture(x, means, v, pi); return { ll: f.ll, resp: f.resp, pi, means, v };
}
function emPolish(x: number[][], pi: number[], means: number[][], v: number) {
  const k = pi.length, d = x[0].length;
  for (let it = 0; it < 300000; it++) {
    const { resp } = logMixture(x, means, v, pi); const m = emStep(x, resp, k);
    const shift = Math.max(...m.pi.map((p, j) => Math.abs(p - pi[j])), ...m.means.flatMap((r, j) => r.map((t, q) => Math.abs(t - means[j][q]))), Math.abs(m.v - v));
    pi = m.pi; means = m.means; v = m.v;
    if (shift < 1e-13 * Math.max(1, Math.max(...means.flat().map(Math.abs)), Math.sqrt(Math.abs(v)))) break;
  }
  const f = logMixture(x, means, v, pi); return { ll: f.ll, resp: f.resp, pi, means, v };
}
export function M31(inp: Input): MResult {
  const r = mk("M31", "잠재프로파일·잠재계층분석");
  const items = inp.slots.items ?? inp.slots.outcome; const idx = completeIdx(inp.table, items); const raw = idx.map((i) => items.map((it) => Number(inp.table.cols[it][i])));
  const n = raw.length, d = items.length; const maxK = Number(inp.options.max_classes ?? 4), nStarts = Math.max(Number(inp.options.n_starts ?? 10), 10) * 3;
  const colMean = items.map((_, j) => mean(raw.map((rw) => rw[j]))); const xs = raw.map((rw) => rw.map((t, j) => t - colMean[j]));
  const sGlob = Math.sqrt(mean(items.map((_, j) => variance(xs.map((rw) => rw[j]))))) || 1; const x = xs.map((rw) => rw.map((t) => t / sGlob)); const logJac = n * d * Math.log(sGlob);
  const rows: any[][] = []; const kept: Record<number, { pi: number[]; means: number[][]; bic: number }> = {};
  for (let k = 1; k <= maxK; k++) {
    let bestLl = -Infinity, best: any = null, reps = 0;
    for (let s = 0; s < nStarts; s++) { let e; try { e = emGmm(x, k, 20260822 + 1000 * k + s); } catch { continue; } if (!isFinite(e.ll)) continue; if (Math.abs(e.ll - bestLl) < 1e-6) reps++; else if (e.ll > bestLl) { bestLl = e.ll; reps = 1; best = e; } }
    if (!best) continue; if (k > 1) best = emPolish(x, best.pi, best.means, best.v);
    const nPar = k * d + 1 + (k - 1); const ll = best.ll - logJac; const aic = -2 * ll + 2 * nPar, bic = -2 * ll + nPar * Math.log(n), abic = -2 * ll + nPar * Math.log((n + 2) / 24);
    let ent = 0; for (const rw of best.resp) for (const p of rw) ent -= p * Math.log(p + 1e-12); const entropy = k > 1 ? 1 - ent / (n * Math.log(k)) : 1;
    rows.push([k, ll, nPar, aic, bic, abic, Math.min(Math.max(entropy, 0), 1), 100 * Math.min(...best.pi), reps]);
    kept[k] = { pi: best.pi, means: best.means.map((m: number[]) => m.map((t, q) => t * sGlob + colMean[q])), bic };
  }
  r.tables.push({ id: "lpa_compare", title: "유형 수 비교", columns: ["유형 수 K", "로그우도", "모수 수", "AIC", "BIC", "aBIC", "엔트로피", "가장 작은 유형(%)", "같은 답 도달 횟수"], rows });
  const bestK = rows.reduce((a, b) => ((b[4] as number) < (a[4] as number) ? b : a))[0] as number; const kb = kept[bestK];
  r.tables.push({ id: "lpa_profile", title: `유형별 프로파일 (BIC 가 고른 ${bestK}유형)`, columns: ["유형", "비율(%)", ...items], rows: kb.means.map((m, j) => [`유형 ${j + 1}`, 100 * kb.pi[j], ...m]) });
  r.notes.push("유형 번호는 시작값에 따라 달라질 수 있습니다(같은 해라도 순서가 바뀜).");
  return r;
}

// ───────── M32 다층모형 (무작위 절편, REML, Satterthwaite)
function groupSlices(g: (string | number)[]): number[][] { const m = new Map<string, number[]>(); g.forEach((v, i) => { const k = String(v); if (!m.has(k)) m.set(k, []); m.get(k)!.push(i); }); return [...m.values()]; }
function gls(theta: number, X: number[][], y: number[], sl: number[][]) {
  const p = X[0].length; const xvx = zeros(p, p), xvy = new Array(p).fill(0); let yvy = 0, ld = 0;
  for (const idx of sl) {
    const ng = idx.length, sh = theta / (1 + ng * theta); const xs = new Array(p).fill(0); let ys = 0;
    for (const i of idx) { for (let a = 0; a < p; a++) xs[a] += X[i][a]; ys += y[i]; }
    for (const i of idx) { for (let a = 0; a < p; a++) { xvy[a] += X[i][a] * y[i]; for (let b = 0; b < p; b++) xvx[a][b] += X[i][a] * X[i][b]; } yvy += y[i] * y[i]; }
    for (let a = 0; a < p; a++) { xvy[a] -= sh * xs[a] * ys; for (let b = 0; b < p; b++) xvx[a][b] -= sh * xs[a] * xs[b]; } yvy -= sh * ys * ys; ld += Math.log1p(ng * theta);
  }
  return { xvx, xvy, yvy, ld };
}
function remlObj(theta: number, X: number[][], y: number[], sl: number[][]): number {
  if (theta < 0) return Infinity; const n = X.length, p = X[0].length; const { xvx, xvy, yvy, ld } = gls(theta, X, y, sl);
  let beta: number[], ldx: number; try { beta = solve(xvx, xvy); ldx = logdet(xvx); } catch { return Infinity; }
  const rss = yvy - xvy.reduce((s, v, i) => s + v * beta[i], 0); if (rss <= 0) return Infinity; const s2 = rss / (n - p); return (n - p) * Math.log(s2) + ld + ldx;
}
export function M32(inp: Input): MResult {
  const r = mk("M32", "다층모형(위계선형모형)");
  const yn = inp.slots.outcome[0], xs = inp.slots.predictors, cn = inp.slots.cluster[0];
  const idx = completeIdx(inp.table, [yn, ...xs, cn]); const y0 = pick(numCol(inp.table, yn), idx) as number[]; const Xc = xs.map((n) => pick(numCol(inp.table, n), idx) as number[]); const grp = pick(inp.table.cols[cn], idx) as (string | number)[];
  const n = y0.length, sl = groupSlices(grp), k = sl.length;
  // ICC(1) one-way
  const gm = mean(y0); const sizes = sl.map((s) => s.length); const means = sl.map((s) => mean(s.map((i) => y0[i])));
  const ssb = sl.reduce((s, ix, g) => s + ix.length * (means[g] - gm) ** 2, 0), ssw = sl.reduce((s, ix, g) => s + ix.reduce((a, i) => a + (y0[i] - means[g]) ** 2, 0), 0);
  const msb = ssb / (k - 1), msw = ssw / (n - k), n0 = (n - sizes.reduce((s, v) => s + v * v, 0) / n) / (k - 1); const tau2o = Math.max(0, (msb - msw) / n0), s2o = msw; const icc = tau2o / (tau2o + s2o);
  const deff = 1 + (mean(sizes) - 1) * icc;
  r.tables.push({ id: "icc", title: "급내상관 (예측변수 없는 빈 모형)", columns: ["ICC", "군집 간 τ²", "군집 내 σ²", "군집 수", "설계효과", "실질 표본"], rows: [[icc, tau2o, s2o, k, deff, n / deff]] });
  // standardize
  const p = xs.length + 1; const ym = mean(y0); const sy = sd(y0) || 1; const y = y0.map((v) => (v - ym) / sy);
  const mus = Xc.map(mean), sds = Xc.map((c) => sd(c) || 1); const X = design(Xc.map((c, j) => c.map((v) => (v - mus[j]) / sds[j])));
  const back = (b: number[]) => { const o = b.slice(); for (let j = 1; j < p; j++) o[j] = b[j] / sds[j - 1]; o[0] = b[0] - b.slice(1).reduce((s, v, j) => s + (v * mus[j]) / sds[j], 0); return o; };
  const M = eye(p); for (let j = 1; j < p; j++) { M[j][j] = 1 / sds[j - 1]; M[0][j] = -mus[j - 1] / sds[j - 1]; } const backCov = (C: Mat) => matmul(matmul(M, C), T(M));
  const bm = brentMin((t) => remlObj(t, X, y, sl), 0, 1e4, 1e-10); let theta = Math.max(0, bm.x); if (remlObj(0, X, y, sl) <= remlObj(theta, X, y, sl)) theta = 0;
  const { xvx, xvy, yvy } = gls(theta, X, y, sl); const beta = solve(xvx, xvy); const rss = yvy - xvy.reduce((s, v, i) => s + v * beta[i], 0); const sigma2 = rss / (n - p), tau2 = theta * sigma2;
  const covB = inv(xvx).map((rw) => rw.map((v) => v * sigma2)); const bo = back(beta).map((v) => v * sy); bo[0] += ym; const covO = backCov(covB).map((rw) => rw.map((v) => v * sy * sy)); const se = covO.map((rw, i) => Math.sqrt(rw[i]));
  // Satterthwaite
  let nu: number[] | null = null;
  if (tau2 > 1e-12 && sigma2 > 0) {
    const dev = (t2: number, s2: number) => { const th = t2 / s2; const g = gls(th, X, y, sl); let b: number[], ldx: number; try { b = solve(g.xvx, g.xvy); ldx = logdet(g.xvx); } catch { return NaN; } const rs = g.yvy - g.xvy.reduce((s, v, i) => s + v * b[i], 0); return (n - p) * Math.log(s2) + g.ld + ldx + rs / s2; };
    const gdiag = (t2: number, s2: number) => { const g = gls(t2 / s2, X, y, sl); const C = inv(g.xvx).map((rw) => rw.map((v) => v * s2)); return backCov(C).map((rw, i) => rw[i]); };
    const x0 = [tau2, sigma2]; const h0 = [2e-3 * x0[0], 2e-3 * x0[1]];
    const d2 = (i: number, j: number, h: number[]) => { const ei = [0, 0], ej = [0, 0]; ei[i] = h[i]; ej[j] = h[j]; const f = (a: number[], b: number[], sa: number, sb: number) => dev(x0[0] + sa * a[0] + sb * b[0], x0[1] + sa * a[1] + sb * b[1]);
      if (i === j) return (f(ei, ei, 1, 0) - 2 * dev(x0[0], x0[1]) + f(ei, ei, -1, 0)) / (h[i] * h[i]); return (f(ei, ej, 1, 1) - f(ei, ej, 1, -1) - f(ei, ej, -1, 1) + f(ei, ej, -1, -1)) / (4 * h[i] * h[j]); };
    const d1 = (i: number, h: number[]) => { const e = [0, 0]; e[i] = h[i]; const a = gdiag(x0[0] + e[0], x0[1] + e[1]), b = gdiag(x0[0] - e[0], x0[1] - e[1]); return a.map((v, q) => (v - b[q]) / (2 * h[i])); };
    const H = zeros(2, 2); const h1 = h0.map((v) => v / 2);
    for (let i = 0; i < 2; i++) for (let j = i; j < 2; j++) { const v1 = d2(i, j, h0), v2 = d2(i, j, h1); H[i][j] = H[j][i] = (4 * v2 - v1) / 3; }
    try {
      const A = inv(H).map((rw) => rw.map((v) => 2 * v)); const g0 = gdiag(x0[0], x0[1]);
      const gr = [0, 1].map((i) => { const a = d1(i, h1), b = d1(i, h0); return a.map((v, q) => (4 * v - b[q]) / 3); });
      nu = g0.map((g, q) => { const gv = [gr[0][q], gr[1][q]]; const den = gv[0] * (A[0][0] * gv[0] + A[0][1] * gv[1]) + gv[1] * (A[1][0] * gv[0] + A[1][1] * gv[1]); return (2 * g * g) / den; });
      if (nu.some((v) => !isFinite(v) || v <= 0)) nu = null;
    } catch { nu = null; }
  }
  const labels = ["(상수)", ...xs]; const dfs = labels.map((_, i) => (nu ? nu[i] : Math.max(1, k - 1)));
  r.tables.push({ id: "mlm_fixed", title: "고정효과 (REML)", columns: ["항", "계수", "SE", "t", "df", "p", "95% 하한", "95% 상한"], rows: labels.map((nm, i) => { const t = bo[i] / se[i]; const tc = tppf(0.975, dfs[i]); return [nm, bo[i], se[i], t, dfs[i], tp2(t, dfs[i]), bo[i] - tc * se[i], bo[i] + tc * se[i]]; }) });
  // ML loglik for AIC/BIC and tau2=0 test
  const mlLl = (th: number) => { const g = gls(th, X, y, sl); const rs = g.yvy - g.xvy.reduce((s, v, i) => s + v * solve(g.xvx, g.xvy)[i], 0); return -0.5 * (n * Math.log((2 * Math.PI * rs) / n) + g.ld + n); };
  const bml = brentMin((t) => -mlLl(t), 0, 1e4, 1e-10); const ll = Math.max(mlLl(Math.max(0, bml.x)), mlLl(0));
  const nPar = p + 2; const llRep = ll - n * Math.log(sy); const aic = -2 * llRep + 2 * nPar, bic = -2 * llRep + nPar * Math.log(n);
  const g0 = gls(0, X, y, sl); const b0 = solve(g0.xvx, g0.xvy); const rss0 = g0.yvy - g0.xvy.reduce((s, v, i) => s + v * b0[i], 0); const ll0 = -0.5 * (n * Math.log((2 * Math.PI * (rss0 / n))) + n);
  let lrt = Math.max(0, 2 * (ll - ll0)); if (lrt < 1e-8) lrt = 0; const lrtP = lrt > 0 ? 0.5 * chi2sf(lrt, 1) : 1;
  r.tables.push({ id: "mlm_var", title: "분산성분", columns: ["항", "값"], rows: [["군집 간 절편 분산 τ²", tau2 * sy * sy], ["군집 내 잔차 분산 σ²", sigma2 * sy * sy], ["조건부 급내상관", tau2 / (tau2 + sigma2)], ["군집 수", k], ["관측 수", n], ["AIC", aic], ["BIC", bic], ["τ²=0 검정 χ²", lrt], ["τ²=0 검정 p", lrtP]] });
  r.effects.push({ name: "급내상관 ICC", value: icc });
  labels.forEach((nm, i) => { const tc = tppf(0.975, dfs[i]); r.cis.push({ parameter: `계수 (${nm})`, estimate: bo[i], low: bo[i] - tc * se[i], high: bo[i] + tc * se[i] }); });
  return r;
}

// ───────── M33 생존분석
export function M33(inp: Input): MResult {
  const r = mk("M33", "생존분석");
  const tn = inp.slots.time[0], en = inp.slots.event[0], gn = inp.slots.group?.[0]; const evv = inp.options.event_value ?? 1;
  const idx = completeIdx(inp.table, gn ? [tn, en, gn] : [tn, en]); const t = pick(numCol(inp.table, tn), idx) as number[]; const eraw = pick(inp.table.cols[en], idx) as (string | number)[];
  const e = eraw.map((v) => (String(v) === String(evv) || v === 1 ? 1 : 0)); const g = gn ? (pick(inp.table.cols[gn], idx) as (string | number)[]).map((v) => String(v).trim()) : null;
  const n = t.length; const ord = t.map((_, i) => i).sort((a, b) => t[a] - t[b] || a - b); const ts = ord.map((i) => t[i]), es = ord.map((i) => e[i]);
  const z = normppf(0.975); let s = 1, gw = 0; const rows: any[][] = [[0, 1, 0, 1, 1, n, 0, 0]];
  const evT = [...new Set(ts.filter((_, i) => es[i] === 1))].sort((a, b) => a - b);
  for (const ut of evT) {
    const atRisk = ts.filter((v) => v >= ut).length; const dd = ts.filter((v, i) => v === ut && es[i] === 1).length; const cens = ts.filter((v, i) => v === ut && es[i] === 0).length; if (atRisk <= 0) continue;
    s *= 1 - dd / atRisk; gw = atRisk - dd > 0 ? gw + dd / (atRisk * (atRisk - dd)) : Infinity;
    const se = isFinite(gw) ? Math.sqrt(s * s * gw) : NaN; let lo = s, hi = s;
    if (s > 0 && s < 1 && isFinite(gw) && gw > 0) { const sl = Math.sqrt(gw) / Math.abs(Math.log(s)); const th = Math.exp(z * sl); lo = Math.pow(s, th); hi = Math.pow(s, 1 / th); }
    rows.push([ut, s, se, lo, hi, atRisk, dd, cens]);
  }
  r.tables.push({ id: "km", title: `카플란-마이어 (사건=${evv})`, columns: ["시간", "생존율", "SE(그린우드)", "95% 하한", "95% 상한", "위험집단", "사건", "중도절단"], rows });
  if (g) {
    const uniq = [...new Set(g)].sort(); const k = uniq.length;
    if (k >= 2) {
      const codes = g.map((v) => uniq.indexOf(v)); const O = new Array(k).fill(0), E = new Array(k).fill(0); const V = zeros(k, k);
      for (const ut of [...new Set(t.filter((_, i) => e[i] === 1))].sort((a, b) => a - b)) {
        const risk = t.map((v) => v >= ut); const nj = risk.filter(Boolean).length; const dj = t.filter((v, i) => v === ut && e[i] === 1).length; if (nj <= 0 || dj <= 0) continue;
        const nij = uniq.map((_, q) => t.filter((v, i) => risk[i] && codes[i] === q).length); const dij = uniq.map((_, q) => t.filter((v, i) => v === ut && e[i] === 1 && codes[i] === q).length); const sh = nij.map((v) => v / nj);
        for (let q = 0; q < k; q++) { O[q] += dij[q]; E[q] += dj * sh[q]; } if (nj > 1) { const f = (dj * (nj - dj)) / (nj - 1); for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) V[a][b] += f * ((a === b ? sh[a] : 0) - sh[a] * sh[b]); }
      }
      const diff = O.map((v, q) => v - E[q]).slice(0, k - 1); const Vs = V.slice(0, k - 1).map((rw) => rw.slice(0, k - 1)); const sol = solve(Vs, diff); const chi = diff.reduce((a, v, i) => a + v * sol[i], 0);
      r.tables.push({ id: "logrank", title: `로그순위 검정 — χ²=${chi.toFixed(4)}, df=${k - 1}, p=${chi2sf(chi, k - 1).toPrecision(4)}`, columns: ["집단", "관측 사건(O)", "기대 사건(E)", "O−E", "O/E"], rows: uniq.map((u, q) => [u, O[q], E[q], O[q] - E[q], E[q] > 0 ? O[q] / E[q] : NaN]) });
      if (k === 2) {
        const xv = codes.map((c) => c); let beta = 0, info = 0, conv = false;
        for (let it = 0; it < 50; it++) {
          let score = 0; info = 0;
          for (let i = 0; i < n; i++) { if (e[i] === 0) continue; let sw = 0, s1 = 0, s2 = 0; for (let j = 0; j < n; j++) if (t[j] >= t[i]) { const w = Math.exp(beta * xv[j]); sw += w; s1 += xv[j] * w; s2 += xv[j] * xv[j] * w; } if (sw <= 0) continue; const m1 = s1 / sw, m2 = s2 / sw; score += xv[i] - m1; info += m2 - m1 * m1; }
          if (info <= 0) break; const step = score / info; beta += step; if (Math.abs(step) < 1e-10) { conv = true; break; }
        }
        const se = 1 / Math.sqrt(info), zc = normppf(0.975); const zz = beta / se;
        r.tables.push({ id: "cox", title: `콕스 비례위험 — ${uniq[1]} 대 ${uniq[0]}`, columns: ["항", "값"], rows: [["회귀계수 β", beta], ["표준오차", se], ["위험비 HR", Math.exp(beta)], ["HR 95% 하한", Math.exp(beta - zc * se)], ["HR 95% 상한", Math.exp(beta + zc * se)], ["p", 2 * normsf(Math.abs(zz))], ["사건 수", e.reduce((a, b) => a + b, 0)]] });
        if (!conv) r.notes.push("콕스 부분우도가 완전히 수렴하지 않았습니다.");
      }
    }
  }
  return r;
}

// ───────── M34 시계열 (ARIMA 정확 가우스 우도)
const ADF_T = [25, 50, 100, 250, 500, 1e5]; const ADF_P = [0.01, 0.025, 0.05, 0.1, 0.9, 0.95, 0.975, 0.99];
const ADF_TAB = [[4.38, 3.95, 3.6, 3.24, 1.14, 0.8, 0.5, 0.15], [4.15, 3.8, 3.5, 3.18, 1.19, 0.87, 0.58, 0.24], [4.04, 3.73, 3.45, 3.15, 1.22, 0.9, 0.62, 0.28], [3.99, 3.69, 3.43, 3.13, 1.23, 0.92, 0.64, 0.31], [3.98, 3.68, 3.42, 3.13, 1.24, 0.93, 0.65, 0.32], [3.96, 3.66, 3.41, 3.12, 1.25, 0.94, 0.66, 0.33]].map((r) => r.map((v) => -v));
function interp(x: number, xp: number[], fp: number[]): number { if (x <= xp[0]) return fp[0]; if (x >= xp[xp.length - 1]) return fp[fp.length - 1]; let i = 0; while (xp[i + 1] < x) i++; return fp[i] + ((x - xp[i]) / (xp[i + 1] - xp[i])) * (fp[i + 1] - fp[i]); }
function adfStat(x: number[]): number {
  const k = Math.floor(Math.pow(x.length - 1, 1 / 3)); const k1 = k + 1; const y = x.slice(1).map((v, i) => v - x[i]); const n = y.length; if (n - k1 < 5 + k1) return NaN;
  const rows: number[] = []; for (let i = k1 - 1; i < n; i++) rows.push(i);
  const yt = rows.map((i) => y[i]); const cols: number[][] = [rows.map((i) => x[i]), rows.map(() => 1), rows.map((i) => i + 1)]; for (let q = 1; q < k1; q++) cols.push(rows.map((i) => y[i - q]));
  const X = rows.map((_, i) => cols.map((c) => c[i])); const f = ols(X, yt); if (f.dfResid <= 0) return NaN; return f.beta[0] / f.se[0];
}
export function adfP(x: number[]): number { if (x.length < 10) return 1; const st = adfStat(x); if (!(st === st)) return 1; const n = x.length - 1; const col = ADF_P.map((_, i) => interp(n, ADF_T, ADF_TAB.map((r) => r[i]))); return interp(st, col, ADF_P); }
function arAcf(phi: number[], theta: number[], n: number, h: number): number[] {
  const p = phi.length, q = theta.length; const psi = [1]; const L = Math.max(2000, n + h) + 2;
  for (let j = 1; j < L; j++) { let v = j <= q ? theta[j - 1] : 0; for (let i = 1; i <= Math.min(j, p); i++) v += phi[i - 1] * psi[j - i]; psi.push(v); }
  const K = n + h + 1; const gam = new Array(K).fill(0); for (let k = 0; k < K; k++) { let s = 0; for (let j = 0; j + k < psi.length; j++) s += psi[j] * psi[j + k]; gam[k] = s; } return gam;
}
function armaKalman(y: number[], phi: number[], theta: number[]) {
  const p = phi.length, q = theta.length, r = Math.max(p, q + 1); const Tm = zeros(r, r); for (let i = 0; i < p; i++) Tm[i][0] = phi[i]; for (let i = 0; i < r - 1; i++) Tm[i][i + 1] += 1;
  const R = new Array(r).fill(0); R[0] = 1; for (let i = 0; i < q; i++) R[i + 1] = theta[i]; const RR = R.map((a) => R.map((b) => a * b));
  // solve P = T P T' + RR'  via vec
  const r2 = r * r; const A = zeros(r2, r2), b = new Array(r2).fill(0);
  for (let i = 0; i < r; i++) for (let j = 0; j < r; j++) { const row = i * r + j; A[row][row] += 1; b[row] = RR[i][j]; for (let a = 0; a < r; a++) for (let c = 0; c < r; c++) A[row][a * r + c] -= Tm[i][a] * Tm[j][c]; }
  let P0: Mat; try { const v = solve(A, b); P0 = Array.from({ length: r }, (_, i) => v.slice(i * r, (i + 1) * r)); } catch { return { slf: Infinity, sv2f: Infinity, std: [] as number[], raw: [] as number[] }; }
  if (P0.some((rw) => rw.some((v) => !isFinite(v)))) return { slf: Infinity, sv2f: Infinity, std: [], raw: [] };
  let a = new Array(r).fill(0); let pm = P0; let slf = 0, sv2f = 0; const std: number[] = [], raw: number[] = []; let steady = false; let kg: number[] = [], f = 0;
  for (const yt of y) {
    if (!steady) { f = pm[0][0]; if (f <= 1e-12) return { slf: Infinity, sv2f: Infinity, std, raw }; kg = pm.map((rw) => rw[0] / f); }
    const v = yt - a[0]; slf += Math.log(f); sv2f += (v * v) / f; std.push(v / Math.sqrt(f)); raw.push(v);
    const at = a.map((ai, i) => ai + kg[i] * v); a = Tm.map((rw) => rw.reduce((s, tv, j) => s + tv * at[j], 0));
    if (!steady) { const inner = pm.map((rw, i) => rw.map((pv, j) => pv - kg[i] * pm[0][j])); const pn = matmul(matmul(Tm, inner), T(Tm)).map((rw, i) => rw.map((vv, j) => vv + RR[i][j])); let md = 0; for (let i = 0; i < r; i++) for (let j = 0; j < r; j++) md = Math.max(md, Math.abs(pn[i][j] - pm[i][j])); steady = md < 1e-15; pm = pn; }
  }
  return { slf, sv2f, std, raw };
}
function pacfToAr(z: number[]): number[] { const p = z.length; if (!p) return []; const phi = z.map(Math.tanh); const work = phi.slice(); for (let j = 1; j < p; j++) { const a = phi[j]; for (let k = 0; k < j; k++) work[k] -= a * phi[j - k - 1]; for (let k = 0; k < j; k++) phi[k] = work[k]; } return phi; }
function polyRoots(c: number[]): { re: number; im: number }[] { // c: highest-degree first; Durand–Kerner
  const n = c.length - 1; const a = c.map((v) => v / c[0]); let z = Array.from({ length: n }, (_, i) => ({ re: Math.cos((2 * Math.PI * i) / n + 0.4) * 0.9, im: Math.sin((2 * Math.PI * i) / n + 0.4) * 0.9 }));
  const cm = (x: any, y: any) => ({ re: x.re * y.re - x.im * y.im, im: x.re * y.im + x.im * y.re }); const cd = (x: any, y: any) => { const d = y.re * y.re + y.im * y.im; return { re: (x.re * y.re + x.im * y.im) / d, im: (x.im * y.re - x.re * y.im) / d }; };
  for (let it = 0; it < 500; it++) { let md = 0; z = z.map((zi, i) => { let pv = { re: 1, im: 0 }; for (let k = 1; k <= n; k++) { pv = cm(pv, zi); pv = { re: pv.re + a[k], im: pv.im }; } let den = { re: 1, im: 0 }; for (let j = 0; j < n; j++) if (j !== i) den = cm(den, { re: zi.re - z[j].re, im: zi.im - z[j].im }); const dlt = cd(pv, den); md = Math.max(md, Math.hypot(dlt.re, dlt.im)); return { re: zi.re - dlt.re, im: zi.im - dlt.im }; }); if (md < 1e-14) break; }
  return z;
}
function invertibleMa(theta: number[]): number[] {
  let k = theta.length; while (k > 0 && theta[k - 1] === 0) k--; if (k === 0) return theta;
  const roots = polyRoots([...theta.slice(0, k).reverse(), 1]); if (roots.every((z) => Math.hypot(z.re, z.im) > 1 + 1e-9)) return theta;
  const nr = roots.map((z) => { const m = Math.hypot(z.re, z.im); return m > 1 ? z : { re: z.re / (m * m), im: -z.im / (m * m) }; });
  // poly Π(1 - z/r): coefficients ascending
  let poly: { re: number; im: number }[] = [{ re: 1, im: 0 }]; for (const rt of nr) { const inv_ = { re: rt.re / (rt.re ** 2 + rt.im ** 2), im: -rt.im / (rt.re ** 2 + rt.im ** 2) }; const np: any[] = new Array(poly.length + 1).fill(0).map(() => ({ re: 0, im: 0 })); poly.forEach((c, i) => { np[i].re += c.re; np[i].im += c.im; np[i + 1].re -= c.re * inv_.re - c.im * inv_.im; np[i + 1].im -= c.re * inv_.im + c.im * inv_.re; }); poly = np; }
  const out = theta.slice().fill(0); for (let i = 0; i < k; i++) out[i] = poly[i + 1].re; return out;
}
function ljungBox(res: number[], lag: number, fitdf: number): number { if (res.length < 4) return 1; lag = Math.min(lag, res.length - 2); const ac = acfPacf(res, lag).acf; const n = res.length; let q = 0; for (let k = 1; k <= lag; k++) q += ac[k] ** 2 / (n - k); q *= n * (n + 2); return chi2sf(q, Math.max(1, lag - fitdf)); }
const diffN = (x: number[], d: number) => { let y = x.slice(); for (let i = 0; i < d; i++) y = y.slice(1).map((v, j) => v - y[j]); return y; };
export function fitArima(x: number[], order: [number, number, number], fast = false) {
  const [p, d, q] = order; const y = d ? diffN(x, d) : x.slice(); const n = y.length;
  if ((p === 0 && q === 0 && d > 0) || n <= Math.max(p, q, 1) + 2) return { coefs: [] as number[], sigma2: variance(y, 0), aic: Infinity, lb: 1 };
  const useMean = d === 0; const mean0 = useMean ? mean(y) : 0; const off = useMean ? 1 : 0;
  const unpack = (par: number[]) => ({ mu: useMean ? par[0] : 0, phi: pacfToAr(par.slice(off, off + p)), theta: par.slice(off + p, off + p + q) });
  const neg2ll = (par: number[]) => { const { mu, phi, theta } = unpack(par); const k = armaKalman(y.map((v) => v - mu), phi, theta); if (!isFinite(k.slf) || k.sv2f <= 0) return 1e12; const s2 = k.sv2f / n; return n * Math.log(2 * Math.PI * s2) + k.slf + n; };
  const start = new Array(off + p + q).fill(0); if (useMean) start[0] = mean0;
  if (p) { const pac = acfPacf(y, p).pacf.slice(1, p + 1); for (let i = 0; i < p; i++) start[off + i] = Math.atanh(Math.min(0.95, Math.max(-0.95, pac[i]))); }
  const s1 = start.map((v, i) => 0.5 * v + 0.5 * (useMean && i === 0 ? mean0 : 0)); let best: { x: number[]; fx: number } | null = null;
  for (const s0 of [start, s1]) {
    if (fast) { const r1 = bfgs(neg2ll, s0, { maxIter: 300, gtol: 1e-6 }); best = !best || r1.fx < best.fx ? r1 : best; break; }
    let r1 = bfgs(neg2ll, s0, { maxIter: 2000, gtol: 1e-10 }); const nm = nelderMead(neg2ll, r1.x, { tol: 1e-12, maxIter: 400 * s0.length }); if (nm.fx <= r1.fx) r1 = { ...r1, x: nm.x, fx: nm.fx }; const r2 = bfgs(neg2ll, r1.x, { maxIter: 2000, gtol: 1e-11 }); if (r2.fx <= r1.fx) r1 = r2;
    if (!best || r1.fx < best.fx) best = r1; if (best && p + q > 1) break;
  }
  const u = unpack(best!.x); const theta = invertibleMa(u.theta); const k = armaKalman(y.map((v) => v - u.mu), u.phi, theta); const s2 = k.sv2f / n; const nPar = best!.x.length + 1; const aic = best!.fx + 2 * nPar;
  const lb = ljungBox(k.std, 10, p + q); const cst = useMean ? u.mu * (1 - u.phi.reduce((a, b) => a + b, 0)) : 0;
  return { coefs: [cst, ...u.phi, ...theta], sigma2: s2, aic, lb };
}
export function forecastArima(x: number[], order: [number, number, number], horizon: number) {
  const [p, d, q] = order; const res = fitArima(x, order); const z = d ? diffN(x, d) : x.slice(); const phi = res.coefs.slice(1, 1 + p), theta = res.coefs.slice(1 + p, 1 + p + q); const cst = res.coefs[0] ?? 0;
  const denom = 1 - phi.reduce((a, b) => a + b, 0); const mu = d === 0 && denom !== 0 ? cst / denom : 0; const kr = armaKalman(z.map((v) => v - mu), phi, theta);
  const hist = z.map((v) => v - mu), err = kr.raw.slice(); const steps: number[] = [];
  for (let h = 0; h < horizon; h++) { let val = 0; for (let i = 0; i < p; i++) val += phi[i] * hist[hist.length - 1 - i]; for (let j = 0; j < q; j++) val += theta[j] * err[err.length - 1 - j]; hist.push(val); err.push(0); steps.push(val + mu); }
  let preds = steps.slice(); for (let kk = d; kk > 0; kk--) { const last = kk - 1 ? diffN(x, kk - 1)[diffN(x, kk - 1).length - 1] : x[x.length - 1]; let c = last; preds = preds.map((v) => (c += v)); }
  let ar = [1, ...phi.map((v) => -v)]; for (let i = 0; i < d; i++) { const nx = new Array(ar.length + 1).fill(0); ar.forEach((v, j) => { nx[j] += v; nx[j + 1] -= v; }); ar = nx; }
  const psi = [1]; for (let j = 1; j < horizon; j++) { let s_ = j <= q ? theta[j - 1] : 0; for (let i = 1; i <= Math.min(j, ar.length - 1); i++) s_ -= ar[i] * psi[j - i]; psi.push(s_); }
  const nz = z.length, kPar = p + q + (d === 0 ? 1 : 0), dfRes = nz - kPar; const s2df = dfRes > 0 ? (res.sigma2 * nz) / dfRes : res.sigma2;
  let extra = new Array(horizon).fill(0);
  if (d === 0) { const gam = arAcf(phi, theta, nz, horizon); const Gm = Array.from({ length: nz }, (_, i) => Array.from({ length: nz }, (_, j) => gam[Math.abs(i - j)])); const ri1 = solve(Gm, new Array(nz).fill(1)); const vmu = s2df / ri1.reduce((a, b) => a + b, 0);
    extra = Array.from({ length: horizon }, (_, h0) => { const h = h0 + 1; const rh = Array.from({ length: nz }, (_, i) => gam[Math.abs(h + nz - (i + 1))]); const w = solve(Gm, rh); return vmu * (1 - w.reduce((a, b) => a + b, 0)) ** 2; }); }
  const se = psi.map((_, h) => Math.sqrt(s2df * psi.slice(0, h + 1).reduce((s, v) => s + v * v, 0) + extra[h])); const zc = dfRes > 0 ? tppf(0.975, dfRes) : normppf(0.975);
  return { point: preds, low: preds.map((v, i) => v - zc * se[i]), high: preds.map((v, i) => v + zc * se[i]) };
}
export function selectArima(x: number[], d: number): [number, number, number] {
  const m = mean(x), s = sd(x, 0) || 1; const xs = x.map((v) => (v - m) / s); const screened: { aic: number; k: number; p: number; q: number }[] = [];
  for (let p = 0; p <= 2; p++) for (let q = 0; q <= 2; q++) { if (d > 0 && p === 0 && q === 0) continue; try { const r = fitArima(xs, [p, d, q], true); if (isFinite(r.aic)) screened.push({ aic: r.aic, k: p + q, p, q }); } catch { /* skip */ } }
  screened.sort((a, b) => a.aic - b.aic || a.k - b.k); let best: { key: [number, number]; ord: [number, number, number] } | null = null;
  for (const c of screened.slice(0, 3)) { try { const r = fitArima(xs, [c.p, d, c.q]); if (!isFinite(r.aic)) continue; const key: [number, number] = [Math.round(r.aic * 1e9) / 1e9, c.p + c.q]; if (!best || key[0] < best.key[0] || (key[0] === best.key[0] && key[1] < best.key[1])) best = { key, ord: [c.p, d, c.q] }; } catch { /* skip */ } }
  return best ? best.ord : [1, d, 0];
}
export function M34(inp: Input): MResult {
  const r = mk("M34", "시계열·개입시계열 분석");
  const vn = inp.options.value_var ?? inp.slots.outcome[0]; const tn = inp.slots.time?.[0];
  let y: number[]; if (tn) { const idx = completeIdx(inp.table, [tn, vn]); const tm = pick(numCol(inp.table, tn), idx) as number[]; const yy = pick(numCol(inp.table, vn), idx) as number[]; const o = tm.map((_, i) => i).sort((a, b) => tm[a] - tm[b] || a - b); y = o.map((i) => yy[i]); } else y = (numCol(inp.table, vn).filter((v) => v !== null)) as number[];
  const pAdf = adfP(y); const dOpt = inp.options.diff_order ?? "auto"; const d = /^-?\d+$/.test(String(dOpt)) ? Number(dOpt) : pAdf === pAdf && pAdf >= 0.05 ? 1 : 0;
  const mode = String(inp.options.order_mode ?? "ar1"); let p_ = 1, q_ = 0;
  if (mode === "manual") { p_ = Number(inp.options.ar_order ?? 1); q_ = Number(inp.options.ma_order ?? 0); } else if (mode === "aic") { const o = selectArima(y, d); p_ = o[0]; q_ = o[2]; }
  const horizon = Number(inp.options.horizon ?? 5); const ar = fitArima(y, [p_, d, q_]); const fc = forecastArima(y, [p_, d, q_], horizon);
  r.tables.push({ id: "ts_diag", title: "시계열 진단", columns: ["항", "값"], rows: [["ADF p", pAdf], ["AIC", ar.aic], ["Ljung-Box p", ar.lb], ["ARIMA 차분 d", d], ["AR 차수 p", p_], ["MA 차수 q", q_]] });
  r.tables.push({ id: "ts_forecast", title: "예측값", columns: ["예측 시점", "예측", "95% 하한", "95% 상한"], rows: fc.point.map((v, i) => [`+${i + 1}`, v, fc.low[i], fc.high[i]]) });
  fc.point.forEach((v, i) => r.cis.push({ parameter: `예측 (+${i + 1})`, estimate: v, low: fc.low[i], high: fc.high[i] }));
  return r;
}

// ───────── M35 GAM (P-스플라인, REML)
function bsplineBasis(x: number[], knots: number[], deg: number): number[][] {
  const nb = knots.length - deg - 1;
  const N = (i: number, k: number, v: number): number => { if (k === 0) return v >= knots[i] && v < knots[i + 1] ? 1 : 0; let a = 0, b = 0; const d1 = knots[i + k] - knots[i], d2 = knots[i + k + 1] - knots[i + 1]; if (d1 > 0) a = ((v - knots[i]) / d1) * N(i, k - 1, v); if (d2 > 0) b = ((knots[i + k + 1] - v) / d2) * N(i + 1, k - 1, v); return a + b; };
  return x.map((v) => Array.from({ length: nb }, (_, i) => N(i, deg, v)));
}
export function M35(inp: Input): MResult {
  const r = mk("M35", "일반화가법모형");
  const yn = inp.slots.outcome[0], xn = inp.slots.predictors[0]; const idx = completeIdx(inp.table, [yn, xn]); const x = pick(numCol(inp.table, xn), idx) as number[], y0 = pick(numCol(inp.table, yn), idx) as number[];
  const n = y0.length; const lin = ols(design([x]), y0); const ybar = mean(y0); const y = y0.map((v) => v - ybar);
  const kb = Number(inp.options.n_knots ?? 5) + 4; const m = 2; const nk = kb - m; let xl = Math.min(...x), xu = Math.max(...x); const xr = xu - xl; xl -= xr * 0.001; xu += xr * 0.001; const dx = (xu - xl) / (nk - 1);
  const knots = Array.from({ length: nk + 2 * m + 2 }, (_, i) => xl - dx * (m + 1) + (i * (xu + dx * (m + 1) - (xl - dx * (m + 1)))) / (nk + 2 * m + 1)); const X = bsplineBasis(x, knots, m + 1);
  const D: Mat = Array.from({ length: kb - 2 }, (_, i) => Array.from({ length: kb }, (_, j) => (j === i ? 1 : j === i + 1 ? -2 : j === i + 2 ? 1 : 0))); const S = matmul(T(D), D);
  const xtx = matmul(T(X), X), xty = matvec(T(X), y); const rankS = kb - 2, mp = 2;
  const solveL = (ll: number) => { const lam = Math.exp(ll); const A = xtx.map((rw, i) => rw.map((v, j) => v + lam * S[i][j])); const beta = solve(A, xty); const res = y.map((v, i) => v - X[i].reduce((s, t, j) => s + t * beta[j], 0)); const db = matvec(D, beta); const pen = res.reduce((s, v) => s + v * v, 0) + lam * db.reduce((s, v) => s + v * v, 0); return { lam, A, beta, res, pen }; };
  const reml = (ll: number) => { const s_ = solveL(ll); return (n - mp) * Math.log(s_.pen) + logdet(s_.A) - rankS * ll; };
  const grid = Array.from({ length: 75 }, (_, i) => -12 + (37 * i) / 74); const gv = grid.map(reml); const best = grid[gv.indexOf(Math.min(...gv))]; const step = grid[1] - grid[0];
  const bm = brentMin(reml, Math.max(grid[0], best - step), Math.min(grid[grid.length - 1], best + step), 1e-12); const ll = reml(bm.x) <= reml(best) ? bm.x : best;
  const fit = solveL(ll); const edf = (() => { const Ai = inv(fit.A); let tr = 0; for (let i = 0; i < kb; i++) for (let j = 0; j < kb; j++) tr += Ai[i][j] * xtx[j][i]; return tr; })();
  const rss = fit.res.reduce((s, v) => s + v * v, 0); const ym = mean(y); const tss = y.reduce((s, v) => s + (v - ym) ** 2, 0); const r2 = 1 - rss / tss; const dfRes = n - edf; const adj = 1 - (rss / tss) * ((n - 1) / dfRes);
  r.tables.push({ id: "gam_vs_linear", title: "직선 대비", columns: ["모형", "R²", "adj R²"], rows: [["직선", lin.r2, lin.adjR2], ["GAM", r2, adj]] });
  r.effects.push({ name: "R² (직선)", value: lin.r2 }, { name: "R² (GAM)", value: r2 });
  return r;
}

// ───────── M36 분위회귀 (정확한 LP 해 + 부트스트랩 SE)
function qrCheck(x: number[], y: number[], tau: number, b1: number): { loss: number; b0: number } {
  const res = y.map((v, i) => v - b1 * x[i]); const s = res.slice().sort((a, b) => a - b); const n = s.length; const k = Math.max(0, Math.ceil(n * tau) - 1); const b0 = s[Math.min(k, n - 1)];
  let loss = 0; for (const v of res) { const r_ = v - b0; loss += r_ >= 0 ? tau * r_ : (tau - 1) * r_; } return { loss, b0 };
}
export function qreg(x: number[], y: number[], tau: number): { b0: number; b1: number } {
  const o = ols(design([x]), y); const sc = (sd(y) || 1) / (sd(x) || 1); let lo = o.beta[1] - 50 * sc, hi = o.beta[1] + 50 * sc; const g = 0.3819660112501051;
  let a = lo + g * (hi - lo), b = hi - g * (hi - lo); let fa = qrCheck(x, y, tau, a).loss, fb = qrCheck(x, y, tau, b).loss;
  for (let it = 0; it < 300 && hi - lo > 1e-13 * Math.max(1, Math.abs(a)); it++) { if (fa < fb) { hi = b; b = a; fb = fa; a = lo + g * (hi - lo); fa = qrCheck(x, y, tau, a).loss; } else { lo = a; a = b; fa = fb; b = hi - g * (hi - lo); fb = qrCheck(x, y, tau, b).loss; } }
  // snap to the nearest breakpoint of the piecewise-linear profile: candidate slopes (y_i-y_j)/(x_i-x_j) within tolerance
  const b1 = 0.5 * (lo + hi); const n = x.length; let bestB = b1, bestL = qrCheck(x, y, tau, b1).loss;
  const tol = 1e-6 * Math.max(1, Math.abs(b1));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (x[i] === x[j]) continue; const c = (y[i] - y[j]) / (x[i] - x[j]); if (Math.abs(c - b1) <= tol) { const l = qrCheck(x, y, tau, c).loss; if (l < bestL - 1e-12) { bestL = l; bestB = c; } } }
  return { b0: qrCheck(x, y, tau, bestB).b0, b1: bestB };
}
export function M36(inp: Input): MResult {
  const r = mk("M36", "분위회귀");
  const yn = inp.slots.outcome[0], xn = inp.slots.predictors[0]; const idx = completeIdx(inp.table, [yn, xn]); const x = pick(numCol(inp.table, xn), idx) as number[], y = pick(numCol(inp.table, yn), idx) as number[];
  const taus: number[] = inp.options.quantiles ?? [0.25, 0.5, 0.75]; const nBoot = Number(inp.options.bootstrap_resamples ?? 200); const seed36 = Number(inp.options.random_seed ?? 20260822); const n = x.length; const rows: any[][] = [];
  for (const tau of taus) {
    const f = qreg(x, y, tau); const boots: number[] = []; const rng = new NumpyRng(seed36);
    for (let b = 0; b < nBoot; b++) { const xs = new Array(n), ys = new Array(n); for (let i = 0; i < n; i++) { const k = rng.integer(n); xs[i] = x[k]; ys[i] = y[k]; } boots.push(qreg(xs, ys, tau).b1); }
    const se = sd(boots); const sb = boots.slice().sort((a, b) => a - b); const lo = quantile(sb, 0.025, true), hi = quantile(sb, 0.975, true); const z = se ? f.b1 / se : 0;
    rows.push([tau, f.b1, se, 2 * normsf(Math.abs(z)), lo, hi]);
  }
  r.tables.push({ id: "quantile_coef", title: "분위회귀", columns: ["τ", "기울기", "SE", "p", "CI 하", "CI 상"], rows });
  r.cis.push({ parameter: "기울기 (분위회귀)", estimate: rows[0][1] as number, low: rows[0][4] as number, high: rows[0][5] as number });
  return r;
}
