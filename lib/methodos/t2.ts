import {
  mean, sd, variance, tp2, tppf, fsf, normppf, normcdf, normsf, ols, OLSResult, numCol, completeIdx, pick, levels, eigSym, inv, matmul,
  T, zeros, det, chi2sf, mulberry32, quantile, solve, matvec, Mat,
} from "./core";
import { Input, MResult, mk } from "./types";
import { groupSplit } from "./t1";
import { NumpyRng } from "./nprng";

/** build intercept + columns design matrix */
export function design(cols: number[][], intercept = true): number[][] {
  const n = cols[0]?.length ?? 0;
  return Array.from({ length: n }, (_, i) => (intercept ? [1, ...cols.map((c) => c[i])] : cols.map((c) => c[i])));
}
export function durbinWatson(res: number[]): number {
  let num = 0, den = 0;
  for (let i = 0; i < res.length; i++) { den += res[i] * res[i]; if (i > 0) num += (res[i] - res[i - 1]) ** 2; }
  return num / den;
}
function getNumeric(inp: Input, names: string[]) {
  const idx = completeIdx(inp.table, names);
  return names.map((n) => pick(numCol(inp.table, n), idx) as number[]);
}

// ───────── M09 단순선형회귀
export function M09(inp: Input): MResult {
  const r = mk("M09", "단순선형회귀");
  const yn = inp.slots.outcome[0], xn = inp.slots.predictor[0];
  const [y, x] = getNumeric(inp, [yn, xn]);
  const ic = inp.options.intercept !== false; const f = ols(design([x], ic), y); const n = y.length; const lab9 = ic ? ["(상수)", xn] : [xn];
  const tc = tppf(0.975, f.dfResid);
  r.tables.push({ id: "model_summary", title: "모형 요약", columns: ["R²", "수정 R²", "추정값 SE", "F", "p(F)", "더빈-왓슨"], rows: [[f.r2, f.adjR2, Math.sqrt(f.sigma2), f.fStat, f.fP, durbinWatson(f.resid)]] });
  r.tables.push({ id: "coefficients", title: "계수", columns: ["항", "B", "SE", "t", "p", "CI 하", "CI 상"], rows: lab9.map((nm, j) => [nm, f.beta[j], f.se[j], f.t[j], f.p[j], f.beta[j] - tc * f.se[j], f.beta[j] + tc * f.se[j]]) });
  r.tables.push({ id: "anova_reg", title: "분산분석", columns: ["원천", "SS"], rows: [["회귀", f.tss - f.rss], ["잔차", f.rss], ["전체", f.tss]] });
  r.effects.push({ name: "R²", value: f.r2 }, { name: "수정 R²", value: f.adjR2 });
  lab9.forEach((nm, j) => r.cis.push({ parameter: `B (${nm})`, estimate: f.beta[j], low: f.beta[j] - tc * f.se[j], high: f.beta[j] + tc * f.se[j] }));
  return r;
}

// ───────── M10 다중회귀
export function M10(inp: Input): MResult {
  const r = mk("M10", "다중회귀");
  const yn = inp.slots.outcome[0], xs = inp.slots.predictors;
  const cols = getNumeric(inp, [yn, ...xs]); const y = cols[0], X = cols.slice(1);
  const ic = inp.options.intercept !== false; const f = ols(design(X, ic), y); const o10 = ic ? 1 : 0;
  const beta = X.map((x, j) => (f.beta[j + o10] * sd(x)) / sd(y));
  r.tables.push({ id: "coefficients", title: "계수", columns: ["항", "B", "표준오차", "β", "t", "유의확률"], rows: (ic ? ["(상수)", ...xs] : xs).map((nm, j) => [nm, f.beta[j], f.se[j], ic && j === 0 ? null : beta[j - o10], f.t[j], f.p[j]]) });
  r.tables.push({ id: "model_summary", title: "모형 요약", columns: ["R²", "수정 R²", "추정값 SE", "F", "p(F)", "더빈-왓슨"], rows: [[f.r2, f.adjR2, Math.sqrt(f.sigma2), f.fStat, f.fP, durbinWatson(f.resid)]] });
  const dfm = xs.length;
  r.tables.push({ id: "anova_reg", title: "분산분석", columns: ["원천", "SS", "df", "MS"], rows: [["회귀", f.tss - f.rss, dfm, (f.tss - f.rss) / dfm], ["잔차", f.rss, f.dfResid, f.rss / f.dfResid], ["전체", f.tss, ic ? f.n - 1 : f.n, null]] });
  r.effects.push({ name: "R²", value: f.r2 }, { name: "수정 R²", value: f.adjR2 });
  xs.forEach((nm, j) => r.effects.push({ name: `표준화계수 β (${nm})`, value: beta[j] }));
  return r;
}

// ───────── M11 위계적 회귀
export function M11(inp: Input): MResult {
  const r = mk("M11", "위계적 회귀");
  const yn = inp.slots.outcome[0];
  const blocks: string[][] = inp.options.blocks ?? [inp.slots.predictors];
  const all = blocks.flat();
  const cols = getNumeric(inp, [yn, ...all]); const y = cols[0]; const byName: Record<string, number[]> = {}; all.forEach((n, i) => (byName[n] = cols[i + 1]));
  const rows: any[][] = []; let prevR2 = 0, prevK = 0; let cum: string[] = []; let lastFit: OLSResult | null = null;
  blocks.forEach((b, si) => {
    cum = cum.concat(b);
    const f = ols(design(cum.map((n) => byName[n])), y);
    const dR2 = f.r2 - prevR2, dK = cum.length - prevK;
    const dF = (dR2 / dK) / ((1 - f.r2) / f.dfResid), p = fsf(dF, dK, f.dfResid);
    rows.push([si + 1, b.join(", "), f.r2, dR2, dF, p, dR2 / (1 - f.r2)]);
    prevR2 = f.r2; prevK = cum.length; lastFit = f;
  });
  r.tables.push({ id: "hierarchical_change", title: "단계별 변화", columns: ["단계", "추가된 변수", "R²", "ΔR²", "ΔF", "p", "Cohen f²"], rows });
  const f = lastFit as unknown as OLSResult;
  const beta = all.map((n, j) => (f.beta[j + 1] * sd(byName[n])) / sd(y));
  r.tables.push({ id: "coefficients", title: "최종 계수", columns: ["항", "B", "표준오차", "β", "t", "유의확률"], rows: ["(상수)", ...all].map((nm, j) => [nm, f.beta[j], f.se[j], j === 0 ? null : beta[j - 1], f.t[j], f.p[j]]) });
  r.effects.push({ name: "최종 R²", value: f.r2 }, { name: "R² (단계별 R² 증가분)", value: rows[0][2] as number }, { name: "ΔR² (단계별 R² 증가분)", value: rows[0][3] as number }, { name: "Cohen f² (단계별 R² 증가분)", value: rows[0][6] as number });
  all.forEach((nm, j) => r.effects.push({ name: `표준화계수 β (${nm})`, value: beta[j] }));
  return r;
}

// ───────── M12 조절효과
export function M12(inp: Input): MResult {
  const r = mk("M12", "조절효과와 상호작용");
  const yn = inp.slots.outcome[0], xn = inp.slots.independent[0], wn = inp.slots.moderator[0];
  const ctrl = (inp.slots.controls ?? inp.slots.predictors ?? []).filter((n) => n !== xn && n !== wn);
  const cols = getNumeric(inp, [xn, wn, yn, ...ctrl]); let [x, w, y] = cols; const C = cols.slice(3);
  const center = inp.options.center_predictors ?? true;
  const wm0 = mean(w), sw = sd(w);
  if (center) { const mx = mean(x); x = x.map((v) => v - mx); w = w.map((v) => v - wm0); }
  const ia = x.map((v, i) => v * w[i]);
  const f = ols(design([x, w, ia, ...C]), y);
  r.tables.push({ id: "coefficients", title: "계수", columns: ["항", "B", "표준오차", "β", "t", "유의확률"], rows: ["(상수)", "독립변수", "조절변수", "독립×조절", ...ctrl].map((nm, j) => [nm, f.beta[j], f.se[j], null, f.t[j], f.p[j]]) });
  const rows: any[][] = [];
  for (const [label, wv] of [["낮음(−1SD)", wm0 - sw], ["평균", wm0], ["높음(+1SD)", wm0 + sw]] as [string, number][]) {
    const wadj = center ? wv - wm0 : wv;
    const slope = f.beta[1] + f.beta[3] * wadj;
    const C = f.XtXinv; const k = f.k;
    const g = new Array(k).fill(0); g[1] = 1; g[3] = wadj;
    let q = 0; for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) q += g[a] * C[a][b] * g[b];
    const se = Math.sqrt(f.sigma2 * q), t = slope / se;
    rows.push([label, slope, se, t, tp2(t, f.dfResid)]);
  }
  r.tables.push({ id: "simple_slopes", title: "단순기울기", columns: ["조절변수 수준", "기울기", "SE", "t", "p"], rows });
  return r;
}

// ───────── M13 매개 (부트스트랩 포함)
function ab(x: number[], m: number[], y: number[]): number {
  const n = x.length; const mx = mean(x), mm = mean(m), my = mean(y);
  let sxx = 0, sxm = 0, smm = 0, sxy = 0, smy = 0;
  for (let i = 0; i < n; i++) { const a = x[i] - mx, b = m[i] - mm, c = y[i] - my; sxx += a * a; sxm += a * b; smm += b * b; sxy += a * c; smy += b * c; }
  const a = sxm / sxx; const dt = smm * sxx - sxm * sxm;
  const b = (sxx * smy - sxm * sxy) / dt;
  return a * b;
}
function pct(a: number[], p: number): number { return quantile(a, p); }
export function M13(inp: Input): MResult {
  const r = mk("M13", "매개효과와 부트스트랩 간접효과");
  const xn = inp.slots.independent[0], mn = inp.slots.mediator[0], yn = inp.slots.outcome[0];
  const [x, m, y] = getNumeric(inp, [xn, mn, yn]);
  const fa = ols(design([x]), m), fb = ols(design([m, x]), y), fc = ols(design([x]), y);
  const a = fa.beta[1], b = fb.beta[1], cp = fb.beta[2], c = fc.beta[1];
  r.tables.push({ id: "paths", title: "경로", columns: ["경로", "B", "SE", "t", "p"], rows: [
    ["a (X→M)", a, fa.se[1], fa.t[1], fa.p[1]], ["b (M→Y|X)", b, fb.se[1], fb.t[1], fb.p[1]],
    ["c' (X→Y|M)", cp, fb.se[2], fb.t[2], fb.p[2]], ["c (X→Y)", c, fc.se[1], fc.t[1], fc.p[1]]] });
  const B = Number(inp.options.bootstrap_resamples ?? 5000), rng = new NumpyRng(Number(inp.options.random_seed ?? 20260822));
  const n = x.length, est = a * b, boots: number[] = [];
  const xs = new Array(n), ms = new Array(n), ys = new Array(n);
  for (let i = 0; i < B; i++) {
    for (let j = 0; j < n; j++) { const k = rng.integer(n); xs[j] = x[k]; ms[j] = m[k]; ys[j] = y[k]; }
    const v = ab(xs, ms, ys); if (isFinite(v)) boots.push(v);
  }
  const sb = boots.slice().sort((p, q) => p - q);
  const lo = quantile(sb, 0.025, true), hi = quantile(sb, 0.975, true);
  const z0 = normppf(boots.filter((v) => v < est).length / boots.length);
  const bcl = quantile(sb, normcdf(2 * z0 + normppf(0.025)), true), bch = quantile(sb, normcdf(2 * z0 + normppf(0.975)), true);
  r.tables.push({ id: "indirect_effects", title: "효과 분해", columns: ["효과", "추정값", "백분위 CI 하한", "백분위 CI 상한", "BC CI 하한", "BC CI 상한"], rows: [["총효과 c", c, "", "", "", ""], ["직접효과 c'", cp, "", "", "", ""], ["간접효과 a×b", est, lo, hi, bcl, bch]] });
  const se = Math.sqrt(b * b * fa.se[1] ** 2 + a * a * fb.se[1] ** 2), z = est / se;
  r.tables.push({ id: "indirect_delta", title: "간접효과(델타법)", columns: ["효과", "추정값", "SE", "z", "p", "CI 하한", "CI 상한"], rows: [["간접효과 a×b", est, se, z, 2 * normsf(Math.abs(z)), est - 1.959963984540054 * se, est + 1.959963984540054 * se]] });
  r.cis.push({ parameter: "추정값 (간접효과 a×b)", estimate: est, low: lo, high: hi });
  return r;
}

// ───────── M14 이원 분산분석 (제III유형)
export function effectCodes(g: (string | number)[], lv: (string | number)[]): number[][] {
  const k = lv.length;
  return lv.slice(0, k - 1).map((l, j) => g.map((v) => (v === lv[k - 1] ? -1 : v === l ? 1 : 0)));
}
export function M14(inp: Input): MResult {
  const r = mk("M14", "이원(요인) 분산분석");
  const yn = inp.slots.outcome[0], an = inp.slots.factor_a[0], bn = inp.slots.factor_b[0];
  const idx = completeIdx(inp.table, [yn, an, bn]);
  const y = pick(numCol(inp.table, yn), idx) as number[], A = pick(inp.table.cols[an], idx) as (string | number)[], B = pick(inp.table.cols[bn], idx) as (string | number)[];
  const la = levels(A), lb = levels(B);
  const ca = effectCodes(A, la), cb = effectCodes(B, lb);
  const cab: number[][] = []; for (const u of ca) for (const v of cb) cab.push(u.map((a, i) => a * v[i]));
  const full = ols(design([...ca, ...cb, ...cab]), y);
  const rss = (cols: number[][]) => ols(design(cols), y).rss;
  const sA = rss([...cb, ...cab]) - full.rss, sB = rss([...ca, ...cab]) - full.rss, sAB = rss([...ca, ...cb]) - full.rss;
  const dA = la.length - 1, dB = lb.length - 1, dAB = dA * dB, dE = full.dfResid, mse = full.rss / dE;
  const row = (nm: string, ss: number, df: number) => [nm, ss, df, ss / df, ss / df / mse, fsf(ss / df / mse, df, dE)];
  r.tables.push({ id: "factorial", title: "이원 분산분석", columns: ["원천", "SS", "df", "MS", "F", "p"], rows: [row("요인 A", sA, dA), row("요인 B", sB, dB), row("A×B", sAB, dAB), ["오차", full.rss, dE, mse, "", ""]] });
  const cells: any[][] = la.map((a) => { const out: any[] = [String(a)]; lb.forEach((b) => { const v = y.filter((_, i) => A[i] === a && B[i] === b); out.push(v.length ? mean(v) : null, v.length); }); return out; });
  r.tables.push({ id: "factorial_cells", title: "셀 평균", columns: [`${an} \\ ${bn}`, ...lb.flatMap((b) => [`${b} 평균`, `${b} N`])], rows: cells });
  r.effects.push({ name: "부분 η²(요인 A)", value: sA / (sA + full.rss) }, { name: "부분 η²(요인 B)", value: sB / (sB + full.rss) }, { name: "부분 η²(A×B)", value: sAB / (sAB + full.rss) });
  return r;
}

// ───────── M15 공분산분석
export function M15(inp: Input): MResult {
  const r = mk("M15", "공분산분석");
  const yn = inp.slots.outcome[0], gn = inp.slots.group[0], cn = inp.slots.covariate[0];
  const idx = completeIdx(inp.table, [yn, gn, cn]);
  const y = pick(numCol(inp.table, yn), idx) as number[], G = pick(inp.table.cols[gn], idx) as (string | number)[], cv = pick(numCol(inp.table, cn), idx) as number[];
  const lv = levels(G); const k = lv.length;
  const dums = lv.slice(1).map((l) => G.map((v) => (v === l ? 1 : 0)));
  const both = ols(design([cv, ...dums]), y), fcov = ols(design([cv]), y), fgrp = ols(design(dums), y);
  const dE = both.dfResid, mse = both.rss / dE;
  const ssCov = fgrp.rss - both.rss, ssGrp = fcov.rss - both.rss;
  r.tables.push({ id: "ancova_anova", title: "공분산분석", columns: ["원천", "SS", "df", "MS", "F", "p"], rows: [
    ["공변량", ssCov, 1, ssCov, ssCov / mse, fsf(ssCov / mse, 1, dE)],
    ["집단(공변량 조정)", ssGrp, k - 1, ssGrp / (k - 1), ssGrp / (k - 1) / mse, fsf(ssGrp / (k - 1) / mse, k - 1, dE)],
    ["오차", both.rss, dE, mse, "", ""]] });
  const gm = mean(cv), tc = tppf(0.975, dE); const rows: any[][] = [];
  lv.forEach((l, i) => {
    const xv = [1, gm, ...lv.slice(1).map((_, j) => (j === i - 1 ? 1 : 0))];
    const est = xv.reduce((s, v, j) => s + v * both.beta[j], 0);
    let q = 0; for (let a = 0; a < xv.length; a++) for (let b = 0; b < xv.length; b++) q += xv[a] * both.XtXinv[a][b] * xv[b];
    const se = Math.sqrt(mse * q);
    const raw = mean(y.filter((_, j) => G[j] === l));
    rows.push([String(l), raw, est, se, est - tc * se, est + tc * se]);
    r.cis.push({ parameter: `추정 주변평균 (${l})`, estimate: est, low: est - tc * se, high: est + tc * se });
  });
  r.tables.push({ id: "ancova_means", title: "조정 전·후 평균", columns: ["집단", "조정 전", "추정 주변평균", "SE", "95% 하한", "95% 상한"], rows });
  r.effects.push({ name: "부분 η²(집단)", value: ssGrp / (ssGrp + both.rss) });
  return r;
}

// ───────── 구형성·반복측정
export function orthoContrasts(p: number): number[][] {
  // Helmert orthonormal rows
  const C: number[][] = [];
  for (let i = 1; i < p; i++) {
    const row = new Array(p).fill(0);
    for (let j = 0; j < i; j++) row[j] = 1;
    row[i] = -i;
    const nrm = Math.sqrt(i + i * i);
    C.push(row.map((v) => v / nrm));
  }
  return C;
}
export function covMat(M: number[][]): number[][] {
  const n = M.length, p = M[0].length; const mu = new Array(p).fill(0);
  for (const r of M) for (let j = 0; j < p; j++) mu[j] += r[j] / n;
  const S = zeros(p, p);
  for (const r of M) for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a][b] += ((r[a] - mu[a]) * (r[b] - mu[b])) / (n - 1);
  return S;
}
export function sphericity(M: number[][]) {
  const n = M.length, p = M[0].length;
  const S = covMat(M); const C = orthoContrasts(p); const A = matmul(matmul(C, S), T(C));
  const tr = A.reduce((s, r, i) => s + r[i], 0); const tr2 = matmul(A, A).reduce((s, r, i) => s + r[i], 0);
  const ggRaw = tr * tr / ((p - 1) * tr2); const gg = Math.min(1, Math.max(1 / (p - 1), ggRaw));
  const dn = (p - 1) * (n - 1 - (p - 1) * gg);
  let hf = dn !== 0 ? Math.min(1, (n * (p - 1) * gg - 2) / dn) : 1; hf = Math.max(gg, hf);
  const k = p - 1; let W = 1, pm = 1;
  const dA = det(A);
  if (k >= 2 && tr > 0 && dA > 0) {
    W = dA / Math.pow(tr / k, k);
    const dfm = (k * (k + 1)) / 2 - 1, d = 1 - (2 * k * k + k + 2) / (6 * k * (n - 1));
    const chi = -(n - 1) * d * Math.log(Math.max(W, 1e-300));
    pm = dfm > 0 ? chi2sf(chi, dfm) : 1;
  }
  return { W, pm, gg, hf };
}
export function M16(inp: Input): MResult {
  const r = mk("M16", "반복측정 분산분석");
  const rep = inp.slots.repeated;
  const idx = completeIdx(inp.table, rep);
  const M = idx.map((i) => rep.map((v) => inp.table.cols[v][i] as number));
  const n = M.length, k = rep.length;
  const grand = mean(M.flat()); const sm = M.map((row) => mean(row)); const cm = rep.map((_, j) => mean(M.map((row) => row[j])));
  const ssT = n * cm.reduce((s, c) => s + (c - grand) ** 2, 0);
  let ssE = 0; for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) ssE += (M[i][j] - sm[i] - cm[j] + grand) ** 2;
  const dfT = k - 1, dfE = (n - 1) * (k - 1), F = ssT / dfT / (ssE / dfE);
  const sph = sphericity(M);
  const rows: any[][] = [["시점", "보정 전", F, dfT, fsf(F, dfT, dfE), "", ""]];
  if (sph.pm < 0.05) rows.push(["시점", "Greenhouse-Geisser", F, dfT * sph.gg, fsf(F, dfT * sph.gg, dfE * sph.gg), sph.gg, "구형성 위반 시 보정 행을 우선 읽으세요."]);
  r.tables.push({ id: "rm_anova", title: "반복측정 분산분석", columns: ["원천", "행", "F", "df", "p", "ε", "비고"], rows });
  r.notes.push(`Mauchly W=${sph.W.toFixed(3)}, p=${sph.pm.toFixed(4)}`);
  return r;
}

// ───────── M17 혼합설계
export function M17(inp: Input): MResult {
  const r = mk("M17", "혼합설계 분산분석");
  const rep = inp.slots.repeated, gn = inp.slots.group[0];
  const idx = completeIdx(inp.table, [...rep, gn]);
  const G = pick(inp.table.cols[gn], idx) as (string | number)[]; const lv = levels(G); const k = lv.length, p = rep.length;
  const mats = lv.map((l) => idx.filter((_, i) => G[i] === l).map((i) => rep.map((v) => inp.table.cols[v][i] as number)));
  const nBy = mats.map((m) => m.length), N = nBy.reduce((a, b) => a + b, 0), dfBE = N - k;
  const subj = mats.map((m) => m.map((row) => mean(row))); const smean = subj.map((s) => mean(s));
  const grand = nBy.reduce((s, n, g) => s + n * smean[g], 0) / N;
  const ssA = p * nBy.reduce((s, n, g) => s + n * (smean[g] - grand) ** 2, 0);
  const ssSE = p * subj.reduce((s, sv, g) => s + sv.reduce((a, v) => a + (v - smean[g]) ** 2, 0), 0);
  const fA = ssA / (k - 1) / (ssSE / dfBE);
  const C = orthoContrasts(p); let ssB = 0, ssAB = 0, ssWE = 0;
  for (const row of C) {
    const sc = mats.map((m) => m.map((r) => r.reduce((s, v, j) => s + v * row[j], 0)));
    const sg = sc.map((s) => mean(s)); const overall = nBy.reduce((s, n, g) => s + n * sg[g], 0) / N; const overallU = mean(sg);
    ssB += overallU ** 2 / (nBy.reduce((s, n) => s + 1 / n, 0) / (k * k));
    ssAB += nBy.reduce((s, n, g) => s + n * (sg[g] - overall) ** 2, 0);
    ssWE += sc.reduce((s, v, g) => s + v.reduce((a, x) => a + (x - sg[g]) ** 2, 0), 0);
  }
  const dfB = p - 1, dfAB = (k - 1) * (p - 1), dfWE = dfBE * (p - 1);
  const fB = ssB / dfB / (ssWE / dfWE), fAB = ssAB / dfAB / (ssWE / dfWE);
  const centered = mats.flatMap((m) => { const mu = m[0].map((_, j) => mean(m.map((r) => r[j]))); return m.map((r) => r.map((v, j) => v - mu[j])); });
  const sph = sphericity(centered);
  const pe = (ss: number, e: number) => ss / (ss + e);
  r.tables.push({ id: "mixed_anova", title: "혼합설계 분산분석", columns: ["원천", "SS", "df", "MS", "F", "p", "p(GG 보정)", "부분 η²"], rows: [
    ["집단 간 — 집단", ssA, k - 1, ssA / (k - 1), fA, fsf(fA, k - 1, dfBE), "", pe(ssA, ssSE)],
    ["집단 간 — 오차(집단 안의 사람)", ssSE, dfBE, ssSE / dfBE, "", "", "", ""],
    ["집단 내 — 시점", ssB, dfB, ssB / dfB, fB, fsf(fB, dfB, dfWE), fsf(fB, dfB * sph.gg, dfWE * sph.gg), pe(ssB, ssWE)],
    ["집단 내 — 집단×시점", ssAB, dfAB, ssAB / dfAB, fAB, fsf(fAB, dfAB, dfWE), fsf(fAB, dfAB * sph.gg, dfWE * sph.gg), pe(ssAB, ssWE)],
    ["집단 내 — 오차(시점×사람)", ssWE, dfWE, ssWE / dfWE, "", "", "", ""]] });
  const seen17: (string | number)[] = []; for (const gv of G) if (!seen17.includes(gv)) seen17.push(gv);
  const r4 = (v: number) => Math.round(v * 1e4) / 1e4;
  r.tables.push({ id: "mixed_cells", title: "셀 평균", columns: ["집단", "N", ...rep], rows: seen17.map((l) => { const g = lv.indexOf(l); return [String(l), nBy[g], ...rep.map((_, j) => r4(mean(mats[g].map((row) => row[j]))))]; }) });
  r.effects.push({ name: "부분 η²(집단)", value: pe(ssA, ssSE) }, { name: "부분 η²(시점)", value: pe(ssB, ssWE) }, { name: "부분 η²(집단×시점)", value: pe(ssAB, ssWE) },
    { name: "부분 η² (집단 간 — 집단)", value: pe(ssA, ssSE) }, { name: "부분 η² (집단 내 — 시점)", value: pe(ssB, ssWE) }, { name: "부분 η² (집단 내 — 집단×시점)", value: pe(ssAB, ssWE) });
  return r;
}

// ───────── M18 MANOVA
export function M18(inp: Input): MResult {
  const r = mk("M18", "다변량분산분석");
  const outs = inp.slots.outcomes, gn = inp.slots.group[0];
  const idx = completeIdx(inp.table, [...outs, gn]);
  const G = pick(inp.table.cols[gn], idx) as (string | number)[]; const lv = levels(G); const k = lv.length, p = outs.length;
  const Y = idx.map((i) => outs.map((v) => inp.table.cols[v][i] as number)); const n = Y.length;
  const grand = outs.map((_, j) => mean(Y.map((r) => r[j])));
  const Sw = zeros(p, p), Sb = zeros(p, p);
  for (const l of lv) {
    const ys = Y.filter((_, i) => G[i] === l); const ng = ys.length; const mu = outs.map((_, j) => mean(ys.map((r) => r[j])));
    for (const y of ys) for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) Sw[a][b] += (y[a] - mu[a]) * (y[b] - mu[b]);
    for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) Sb[a][b] += ng * (mu[a] - grand[a]) * (mu[b] - grand[b]);
  }
  // eigenvalues of Sw^-1 Sb via symmetric form: L^-1 Sb L^-T
  const M = matmul(inv(Sw), Sb);
  // eigenvalues of non-symmetric M: use symmetric transform with Cholesky of Sw
  const L = (await_chol(Sw)); const Li = inv(L);
  const Ssym = matmul(matmul(Li, Sb), T(Li));
  const ev = eigSym(Ssym).values.map((v) => Math.max(0, v));
  const v = n - k, q = k - 1, s = Math.min(p, q); const lam = ev.slice(0, s);
  const wilks = lam.reduce((a, l) => a * (1 / (1 + l)), 1), pillai = lam.reduce((a, l) => a + l / (1 + l), 0), hot = lam.reduce((a, l) => a + l, 0), roy = lam[0];
  const rows: any[][] = [];
  const tRao = p * q <= 2 ? 1 : Math.sqrt(((p * q) ** 2 - 4) / (p * p + q * q - 5));
  const df1w = p * q, df2w = tRao * (v - (p - q + 1) / 2) - (p * q - 2) / 2; const root = Math.pow(wilks, 1 / tRao);
  const fw = ((1 - root) / root) * (df2w / df1w);
  rows.push(["윌크스 람다", wilks, fw, df1w, df2w, fsf(fw, df1w, df2w), 1 - root]);
  const mp = (Math.abs(p - q) - 1) / 2, np = (v - p - 1) / 2;
  const df1p = s * (2 * mp + s + 1), df2p = s * (2 * np + s + 1), fp = ((2 * np + s + 1) / (2 * mp + s + 1)) * (pillai / (s - pillai));
  rows.push(["필라이 대각합", pillai, fp, df1p, df2p, fsf(fp, df1p, df2p), pillai / s]);
  const df2h = 2 * (s * np + 1), fh = (df2h / (s * s * (2 * mp + s + 1))) * hot;
  rows.push(["호텔링–롤리 대각합", hot, fh, df1p, df2h, fsf(fh, df1p, df2h), hot / (hot + s)]);
  const r1 = Math.max(p, q), r2 = v - Math.max(p, q) + q, fr = (roy * r2) / r1;
  rows.push(["로이 최대근", roy, fr, r1, r2, fsf(fr, r1, r2), roy / (1 + roy)]);
  r.tables.push({ id: "manova", title: "다변량 검정", columns: ["검정", "통계량", "F", "df1", "df2", "p", "부분 η²"], rows });
  const uni = outs.map((nm, j) => {
    const y = Y.map((r) => r[j]); const gm = mean(y);
    const ssb = lv.reduce<number>((s, l) => { const ys = y.filter((_, i) => G[i] === l); return s + ys.length * (mean(ys) - gm) ** 2; }, 0);
    const ssw = lv.reduce<number>((s, l) => { const ys = y.filter((_, i) => G[i] === l); const m = mean(ys); return s + ys.reduce((a, b) => a + (b - m) ** 2, 0); }, 0);
    const F = ssb / (k - 1) / (ssw / (n - k));
    return [nm, ssb, k - 1, F, fsf(F, k - 1, n - k)];
  });
  r.tables.push({ id: "manova_univariate", title: "변수별 분산분석", columns: ["결과변수", "SS", "df", "F", "p"], rows: uni });
  for (const row of rows) r.effects.push({ name: `부분 η² (${row[0]})`, value: row[6] as number });
  return r;
}
import { cholesky } from "./core";
function await_chol(S: Mat): Mat { return cholesky(S); }
