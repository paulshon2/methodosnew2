import {
  mean, sd, variance, numCol, completeIdx, pick, levels, inv, solve, logdet, cholesky, matmul, T, zeros, eye, bfgs, nelderMead, numGrad, numHess,
  chi2sf, normsf, ols, Mat, tp2, brentMin, matvec, pearson, lgamma,
} from "./core";
import { ncx2cdf } from "./core2";
import { Input, MResult, mk } from "./types";
import { design } from "./t2";
import { parseStructural } from "./util";

// ───────── fit indices (engine: compute_fit_indices)
function ncx2sf(x: number, df: number, ncp: number) { return 1 - ncx2cdf(x, df, ncp); }
function invertNcx2(chi2: number, df: number, tail: number): number {
  if (ncx2sf(chi2, df, 1e-12) >= tail) return 0;
  let lo = 0, hi = Math.max(1, chi2 + 4 * df + 10), guard = 0;
  while (ncx2sf(chi2, df, hi) < tail) { hi *= 2; if (++guard > 60) return hi; }
  for (let i = 0; i < 200; i++) { const mid = 0.5 * (lo + hi); if (ncx2sf(chi2, df, mid) < tail) lo = mid; else hi = mid; }
  return 0.5 * (lo + hi);
}
export interface Fit { chi2: number; df: number; p: number; rmsea: number; rmseaLo: number; rmseaHi: number; cfi: number; tli: number; srmr: number }
export function fitIndices(n: number, chi2: number, df: number, srmr: number, chi2Null: number | null, dfNull: number | null): Fit {
  const p = df > 0 ? chi2sf(chi2, df) : 1;
  const rmsea = df > 0 && chi2 >= 0 ? Math.sqrt(Math.max(chi2 / df - 1, 0) / n) : 0;
  let lo = 0, hi = 0;
  if (df > 0 && chi2 === chi2) { lo = Math.sqrt(invertNcx2(chi2, df, 0.05) / (df * n)); hi = Math.sqrt(invertNcx2(chi2, df, 0.95) / (df * n)); }
  let cfi = NaN, tli = NaN;
  if (chi2Null !== null && df > 0) {
    const dModel = Math.max(chi2 - df, 0), dNull = dfNull !== null ? Math.max(chi2Null - dfNull, 0) : Math.max(chi2Null - df, 0);
    cfi = dNull > 0 ? 1 - dModel / dNull : 1; cfi = Math.min(Math.max(cfi, 0), 1);
    const dfn = dfNull !== null ? dfNull : df;
    if (df > 0 && dfn > 0 && chi2Null > 0 && chi2Null / dfn !== 1) tli = (chi2Null / dfn - chi2 / df) / (chi2Null / dfn - 1);
  }
  return { chi2, df, p, rmsea, rmseaLo: lo, rmseaHi: hi, cfi, tli, srmr };
}
const covOf = (M: number[][]): Mat => { const n = M.length, p = M[0].length; const mu = Array.from({ length: p }, (_, j) => mean(M.map((r) => r[j]))); const S = zeros(p, p); for (const r of M) for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a][b] += ((r[a] - mu[a]) * (r[b] - mu[b])) / (n - 1); return S; };
const trace = (A: Mat) => A.reduce((s, r, i) => s + r[i], 0);
function lndet(A: Mat): number { return logdet(A); }

// ───────── M25 CFA (ML)
export function M25(inp: Input): MResult {
  const r = mk("M25", "확인적 요인분석");
  const items = inp.slots.items; const fs: Record<string, string[]> = inp.options.factor_structure ?? { F1: items };
  const idx = completeIdx(inp.table, items); const M = idx.map((i) => items.map((it) => inp.table.cols[it][i] as number));
  const n = M.length, p = items.length, S = covOf(M); const factors = Object.keys(fs), k = factors.length;
  const belongs = items.map(() => 0); const seen = new Set<string>();
  factors.forEach((f, fi) => fs[f].forEach((it) => { const j = items.indexOf(it); if (j >= 0) { belongs[j] = fi; seen.add(it); } }));
  const anchor = new Map<number, number>(); for (let i = 0; i < p; i++) if (!anchor.has(belongs[i])) anchor.set(belongs[i], i);
  const freeLoad = Array.from({ length: p }, (_, i) => i).filter((i) => anchor.get(belongs[i]) !== i);
  const pairs: [number, number][] = []; for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) pairs.push([a, b]);
  const unpack = (x: number[]) => {
    let pos = 0; const lam = zeros(p, k); for (let i = 0; i < p; i++) lam[i][belongs[i]] = 1;
    for (const i of freeLoad) lam[i][belongs[i]] = x[pos++];
    const vf = Array.from({ length: k }, (_, j) => Math.exp(Math.min(20, Math.max(-20, x[pos + j])))); pos += k;
    const rho = pairs.map((_, m) => Math.tanh(x[pos + m])); pos += pairs.length;
    const theta = Array.from({ length: p }, (_, i) => Math.exp(Math.min(20, Math.max(-20, x[pos + i]))));
    const phi = zeros(k, k); for (let j = 0; j < k; j++) phi[j][j] = vf[j];
    pairs.forEach(([a, b], m) => { const c = rho[m] * Math.sqrt(vf[a] * vf[b]); phi[a][b] = phi[b][a] = c; });
    return { lam, phi, theta };
  };
  const sigmaOf = (x: number[]) => { const { lam, phi, theta } = unpack(x); const Sg = matmul(matmul(lam, phi), T(lam)); for (let i = 0; i < p; i++) Sg[i][i] += theta[i]; return { Sg, lam, phi, theta }; };
  const ldS = lndet(S);
  const obj = (x: number[]) => { const { Sg } = sigmaOf(x); try { const ld = lndet(Sg); const f = ld + trace(matmul(S, inv(Sg))) - ldS - p; return isFinite(f) ? n * f : 1e12; } catch { return 1e12; } };
  const dS = Array.from({ length: p }, (_, i) => S[i][i]); const dm = mean(dS);
  const x0 = [...freeLoad.map(() => 1), ...Array(k).fill(Math.log(Math.max(dm * 0.5, 1e-3))), ...pairs.map(() => 0), ...dS.map((v) => Math.log(Math.max(v * 0.5, 1e-3)))];
  // 해석적 기울기: ∂F/∂x = n·tr(A ∂Σ),  A = Σ⁻¹(Σ−S)Σ⁻¹
  const grad = (x: number[]): number[] => {
    const { Sg, lam, phi, theta } = sigmaOf(x); let Si: Mat; try { Si = inv(Sg); } catch { return x.map(() => 0); }
    const D = Sg.map((rw, i) => rw.map((v, j) => v - S[i][j])); const A = matmul(matmul(Si, D), Si); const LAL = matmul(matmul(T(lam), A), lam); const g: number[] = [];
    for (const i of freeLoad) { const f = belongs[i]; const u = lam.map((_, r2) => { let sm = 0; for (let q = 0; q < k; q++) sm += lam[r2][q] * phi[q][f]; return sm; }); let au = 0; for (let r2 = 0; r2 < p; r2++) au += A[i][r2] * u[r2]; g.push(n * 2 * au); }
    const vf = Array.from({ length: k }, (_, j) => phi[j][j]);
    for (let a = 0; a < k; a++) { let tr = 0; for (let b = 0; b < k; b++) { const d = a === b ? vf[a] : 0.5 * phi[a][b]; tr += LAL[a][b] * d + (a === b ? 0 : LAL[b][a] * d); } g.push(n * (tr)); }
    pairs.forEach(([a, b], m) => { const rho = phi[a][b] / Math.sqrt(vf[a] * vf[b]); const dphi = (1 - rho * rho) * Math.sqrt(vf[a] * vf[b]); g.push(n * 2 * LAL[a][b] * dphi); });
    for (let i = 0; i < p; i++) g.push(n * A[i][i] * theta[i]);
    return g;
  };
  let best = bfgs(obj, x0, { maxIter: 3000, gtol: 1e-9, grad });
  { const nx = bfgs(obj, best.x, { maxIter: 200, gtol: 1e-9, grad }); if (nx.fx <= best.fx) best = nx; }
  const { Sg, lam, phi, theta } = sigmaOf(best.x);
  const sdSig = Sg.map((rw, i) => Math.sqrt(Math.max(rw[i], 1e-12)));
  const loads = items.map((it, i) => { const f = belongs[i]; return { item: it, factor: factors[f], unstd: lam[i][f], std: (lam[i][f] * Math.sqrt(Math.max(phi[f][f], 0))) / sdSig[i] }; });
  const nParams = freeLoad.length + k + pairs.length + p;
  const fmin = trace(matmul(S, inv(Sg))) + lndet(Sg) - ldS - p; let chi2 = Math.max(n * fmin, 0); let df = (p * (p + 1)) / 2 - nParams; const saturated = df <= 0; if (saturated) { chi2 = 0; df = 0; }
  const dsd = S.map((rw, i) => Math.sqrt(rw[i])); let sr = 0; for (let i = 0; i < p; i++) for (let j = 0; j <= i; j++) { const d = S[i][j] / (dsd[i] * dsd[j]) - Sg[i][j] / (sdSig[i] * sdSig[j]); sr += d * d; }
  const srmr = Math.sqrt(sr / ((p * (p + 1)) / 2));
  const diagOnly = zeros(p, p); for (let i = 0; i < p; i++) diagOnly[i][i] = S[i][i];
  const fNull = trace(matmul(S, inv(diagOnly))) + lndet(diagOnly) - ldS - p;
  const fit = fitIndices(n, chi2, df, srmr, Math.max(0, n * fNull), (p * (p + 1)) / 2 - p);
  r.tables.push({ id: "cfa_loadings", title: "적재값", columns: ["문항", "요인", "비표준화", "표준화", "SE", "p"], rows: loads.map((l) => [l.item, l.factor, l.unstd, l.std, null, null]) });
  r.tables.push({ id: "cfa_fit", title: "적합도", columns: ["지표", "값"], rows: [["χ²", fit.chi2], ["df", fit.df], ["p", fit.p], ["RMSEA", fit.rmsea], ["CFI", fit.cfi], ["TLI", fit.tli], ["SRMR", fit.srmr]] });
  loads.forEach((l) => r.effects.push({ name: `표준화 적재량 (${l.item})`, value: l.std }));
  factors.forEach((f) => { const mine = loads.filter((l) => l.factor === f); const sum = mine.reduce((s, l) => s + l.std, 0); const errSum = mine.reduce((s, l) => s + theta[items.indexOf(l.item)] / Math.max(S[items.indexOf(l.item)][items.indexOf(l.item)], 1e-12), 0); const cr = (sum * sum) / (sum * sum + errSum); const ave = mean(mine.map((l) => l.std * l.std)); r.notes.push(`${f}: CR=${cr.toFixed(4)}, AVE=${ave.toFixed(4)}`); });
  return r;
}

// ───────── M26 측정동일성 (다집단 CFA with means)
export interface G { lab: string; S: Mat; mean: number[]; n: number }
const SHARED: Record<string, string[]> = { "형태 동일성": [], "적재 동일성": ["loadings"], "절편 동일성": ["loadings", "intercepts"], "오차분산 동일성": ["loadings", "intercepts", "thetas"] };
export class MGModel {
  k: number; p: number; slices: Record<string, [number, number, boolean]> = {}; nFree = 0; freeKappa: boolean; rawSize = 0;
  constructor(public groups: G[], public shared: string[]) {
    this.k = groups.length; this.p = groups[0].S.length; this.freeKappa = shared.includes("intercepts");
    let pos = 0; const add = (name: string, per: number, sh: boolean) => { const size = sh ? per : per * this.k; this.slices[name] = [pos, size, sh]; pos += size; };
    add("loadings", this.p - 1, shared.includes("loadings")); add("intercepts", this.p, shared.includes("intercepts")); add("thetas", this.p, shared.includes("thetas")); add("psi", 1, false);
    if (this.freeKappa) add("kappa", 1, false);
    this.nFree = pos - (this.freeKappa ? 1 : 0); this.rawSize = pos;
  }
  get(x: number[], name: string, g: number): number[] { const [pos, size, sh] = this.slices[name]; if (sh) return x.slice(pos, pos + size); const per = size / this.k; return x.slice(pos + g * per, pos + (g + 1) * per); }
  sigmaMu(x: number[], g: number) {
    const lam = [1, ...this.get(x, "loadings", g)]; const nu = this.get(x, "intercepts", g); const theta = this.get(x, "thetas", g).map((v) => Math.exp(Math.min(20, Math.max(-20, v))));
    const psi = Math.exp(Math.min(20, Math.max(-20, this.get(x, "psi", g)[0])));
    const S = lam.map((a, i) => lam.map((b, j) => a * b * psi + (i === j ? theta[i] : 0)));
    const kappa = this.freeKappa && g > 0 ? this.get(x, "kappa", g)[0] : 0;
    return { S, mu: nu.map((v, i) => v + lam[i] * kappa) };
  }
  fit(x: number[]): number {
    let tot = 0;
    for (let g = 0; g < this.k; g++) {
      const { S, mu } = this.sigmaMu(x, g); let ld: number, Si: Mat; try { ld = lndet(S); Si = inv(S); } catch { return 1e12; }
      const d = this.groups[g].mean.map((v, i) => v - mu[i]); const Sd = matvec(Si, d);
      const f = ld + trace(matmul(this.groups[g].S, Si)) - lndet(this.groups[g].S) - this.p + d.reduce((s, v, i) => s + v * Sd[i], 0);
      if (!(f > -1e-7)) return 1e12; tot += (this.groups[g].n - 1) * f;
    }
    return tot;
  }
  start(): number[] {
    const x = new Array(this.rawSize).fill(0);
    for (const name of ["loadings", "intercepts", "thetas", "psi"]) {
      const [pos, size, sh] = this.slices[name]; const reps = sh ? 1 : this.k; const per = size / reps;
      for (let r = 0; r < reps; r++) { const g = sh ? 0 : r; let val: number[];
        if (name === "loadings") val = Array(per).fill(1); else if (name === "intercepts") val = this.groups[g].mean.slice();
        else if (name === "thetas") val = this.groups[g].S.map((rw, i) => Math.log(Math.max(rw[i] * 0.5, 1e-3)));
        else val = [Math.log(Math.max(mean(this.groups[g].S.map((rw, i) => rw[i])) * 0.5, 1e-3))];
        for (let q = 0; q < per; q++) x[pos + r * per + q] = val[q]; }
    }
    return x;
  }
  solve(prev: number | null): number {
    const x0 = this.start(); const f = (x: number[]) => this.fit(x);
    let best = bfgs(f, x0, { maxIter: 4000, gtol: 1e-7 });
    // 제약을 더한 모형은 앞 단계보다 χ² 가 작을 수 없다 — 어기면 국소해이므로 시작값을 바꿔 다시 푼다(첫 단계는 늘 한 번 더)
    if (prev === null || best.fx < prev - 1e-6) {
      const rng = ((s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; })(20260825);
      for (let t = 0; t < 2; t++) { const xs = x0.map((v) => v + (rng() - 0.5) * 0.3); const alt = bfgs(f, xs, { maxIter: 4000, gtol: 1e-7 }); if (alt.fx < best.fx) best = alt; }
    }
    return best.fx;
  }
}
export function M26(inp: Input): MResult {
  const r = mk("M26", "측정동일성 검정");
  const items = inp.slots.items, gn = inp.slots.group[0];
  const idx = completeIdx(inp.table, [...items, gn]); const G0 = pick(inp.table.cols[gn], idx) as (string | number)[];
  const order: string[] = []; G0.forEach((g) => { const s = String(g).trim(); if (!order.includes(s)) order.push(s); });
  const groups: G[] = []; for (const lab of order) { const rows = idx.filter((_, i) => String(G0[i]).trim() === lab).map((i) => items.map((it) => inp.table.cols[it][i] as number)); if (rows.length > items.length + 1) groups.push({ lab, S: covOf(rows), mean: items.map((_, j) => mean(rows.map((rw) => rw[j]))), n: rows.length }); }
  const p = items.length, k = groups.length, nTot = groups.reduce((s, g) => s + g.n, 0), moments = k * ((p * (p + 1)) / 2 + p);
  let base = 0; for (const g of groups) { const dg = zeros(p, p); for (let i = 0; i < p; i++) dg[i][i] = g.S[i][i]; base += (g.n - 1) * (lndet(dg) + trace(matmul(g.S, inv(dg))) - lndet(g.S) - p); }
  const baseDf = k * ((p * (p + 1)) / 2 + p) - k * 2 * p;
  const rows: any[][] = []; let prev: { chi2: number; df: number; cfi: number } | null = null; const deltas: any[] = [];
  for (const name of Object.keys(SHARED)) {
    const m = new MGModel(groups, SHARED[name]); const fmin = m.solve(prev ? prev.chi2 : null); const chi2 = Math.max(0, fmin), df = moments - m.nFree;
    const dModel = Math.max(chi2 - df, 0), dBase = Math.max(base - baseDf, 0); let cfi = dBase > 0 ? 1 - dModel / dBase : 1; cfi = Math.min(1, Math.max(0, cfi));
    const rmsea = df > 0 ? Math.sqrt(dModel / (df * Math.max(nTot - k, 1))) * Math.sqrt(k) : NaN; const pv = df > 0 ? chi2sf(chi2, df) : NaN;
    if (!prev) rows.push([name, chi2, df, pv, cfi, rmsea, "", "", "", ""]);
    else { const dc = chi2 - prev.chi2, dd = df - prev.df; rows.push([name, chi2, df, pv, cfi, rmsea, dc, dd, dd > 0 ? chi2sf(Math.max(dc, 0), dd) : NaN, cfi - prev.cfi]); }
    prev = { chi2, df, cfi };
  }
  r.tables.push({ id: "invariance_steps", title: "동일성 단계", columns: ["단계", "χ²", "df", "p", "CFI", "RMSEA", "Δχ²", "Δdf", "Δp", "ΔCFI"], rows });
  r.tables.push({ id: "invariance_meaning", title: "단계의 뜻", columns: ["단계", "집단끼리 같다고 묶는 것", "통과하면 할 수 있는 일"], rows: [
    ["형태 동일성", "아무것도 (구조만 같음)", "집단마다 같은 요인 구조가 성립합니다. 여기서 깨지면 아래 단계는 뜻이 없습니다."],
    ["적재 동일성", "문항 적재 λ", "집단끼리 상관·회귀계수를 견줄 수 있습니다."],
    ["절편 동일성", "적재 λ + 문항 절편 ν", "집단끼리 **평균**을 견줄 수 있습니다. 여기가 깨진 채로 평균을 비교하면 안 됩니다."],
    ["오차분산 동일성", "적재 λ + 절편 ν + 오차 Θ", "집단끼리 관측 총점을 그대로 견줄 수 있습니다. 대개 여기까지는 요구하지 않습니다."]] });
  return r;
}

// ───────── M27 IRT — irt.ts
export { M27 } from "./irt";

// ───────── M28 경로분석
export function pathAnalysis(data: Record<string, number[]>, structural: string[]) {
  const eqs = parseStructural(structural); const n = data[Object.keys(data)[0]].length;
  const paths: { from: string; to: string; b: number; se: number; t: number; p: number; std: number }[] = []; const r2: Record<string, number> = {};
  for (const y of Object.keys(eqs)) {
    const preds = eqs[y]; const f = ols(design(preds.map((q) => data[q])), data[y]); r2[y] = f.r2; const sy = sd(data[y]);
    preds.forEach((q, i) => paths.push({ from: q, to: y, b: f.beta[i + 1], se: f.se[i + 1], t: f.t[i + 1], p: f.p[i + 1], std: sy ? (f.beta[i + 1] * sd(data[q])) / sy : f.beta[i + 1] }));
  }
  const coeff = new Map(paths.map((c) => [c.from + "\u0000" + c.to, c.b])); const effects: { from: string; to: string; direct: number; indirect: number; total: number }[] = [];
  for (const m of Object.keys(eqs)) for (const x of eqs[m]) for (const y of Object.keys(eqs)) if (eqs[y].includes(m) && y !== m) { const a_ = coeff.get(x + "\u0000" + m) ?? 0, b_ = coeff.get(m + "\u0000" + y) ?? 0, dir = coeff.get(x + "\u0000" + y) ?? 0; effects.push({ from: x, to: y, direct: dir, indirect: a_ * b_, total: dir + a_ * b_ }); }
  if (!effects.length && paths.length === 1) effects.push({ from: paths[0].from, to: paths[0].to, direct: paths[0].b, indirect: 0, total: paths[0].b });
  const vars = Object.keys(data), p = vars.length, ix = new Map(vars.map((v, i) => [v, i])); const S = covOf(Array.from({ length: n }, (_, i) => vars.map((v) => data[v][i])));
  const A = zeros(p, p); for (const c of paths) A[ix.get(c.to)!][ix.get(c.from)!] = c.b;
  const endo = vars.filter((v) => v in eqs), exo = vars.filter((v) => !(v in eqs)); const psi = zeros(p, p);
  for (const v of endo) psi[ix.get(v)!][ix.get(v)!] = variance(data[v]) * Math.max(0, 1 - (r2[v] ?? 0));
  for (const a of exo) for (const b of exo) psi[ix.get(a)!][ix.get(b)!] = S[ix.get(a)!][ix.get(b)!];
  const nParams = paths.length + endo.length + exo.length + (exo.length * (exo.length - 1)) / 2; let df = (p * (p + 1)) / 2 - nParams;
  let chi2 = 0, srmr = 0, chi2Null: number | null = null, dfNull: number | null = null;
  try {
    const IA = inv(zeros(p, p).map((rw, i) => rw.map((_, j) => (i === j ? 1 : 0) - A[i][j]))); const implied = matmul(matmul(IA, psi), T(IA));
    if (df > 0) {
      const f = lndet(implied) + trace(matmul(S, inv(implied))) - lndet(S) - p; chi2 = Math.max(0, (n - 1) * f);
      const ds = S.map((rw, i) => Math.sqrt(rw[i])), di = implied.map((rw, i) => Math.sqrt(rw[i])); let sr = 0; for (let i = 0; i < p; i++) for (let j = 0; j <= i; j++) { const d = S[i][j] / (ds[i] * ds[j]) - implied[i][j] / (di[i] * di[j]); sr += d * d; } srmr = Math.sqrt(sr / ((p * (p + 1)) / 2));
      const dg = zeros(p, p); for (let i = 0; i < p; i++) dg[i][i] = S[i][i]; const fn = lndet(dg) + trace(matmul(S, inv(dg))) - lndet(S) - p; chi2Null = Math.max(0, (n - 1) * fn); dfNull = (p * (p + 1)) / 2 - p;
    }
  } catch { chi2 = 0; df = 0; }
  const fit = fitIndices(n - 1, chi2, Math.max(df, 0), srmr, chi2Null, dfNull);
  return { paths, effects, r2, fit, df };
}
export function M28(inp: Input): MResult {
  const r = mk("M28", "경로분석");
  const vars: string[] = Array.from(new Set<string>(inp.options.variables ?? inp.slots.predictors)); const idx = completeIdx(inp.table, vars);
  const data: Record<string, number[]> = {}; vars.forEach((v) => (data[v] = pick(numCol(inp.table, v), idx) as number[]));
  const res = pathAnalysis(data, inp.options.structural);
  r.tables.push({ id: "paths", title: "경로 계수", columns: ["From", "To", "B", "SE", "p", "β"], rows: res.paths.map((c) => [c.from, c.to, c.b, c.se, c.p, c.std]) });
  r.tables.push({ id: "effects", title: "직·간접·총효과", columns: ["From", "To", "직접", "간접", "총"], rows: res.effects.map((e) => [e.from, e.to, e.direct, e.indirect, e.total]) });
  const f = res.fit, sat = f.df <= 0; const v = (x: number) => (sat && x !== x ? "" : x);
  r.tables.push({ id: "fit_indices", title: "모형 적합도", columns: ["지수", "값"], rows: [["χ²", f.chi2], ["자유도", f.df], ["p(χ²)", f.p], ["RMSEA", f.rmsea], ["RMSEA 90% 하한", f.rmseaLo], ["RMSEA 90% 상한", f.rmseaHi], ["CFI", v(f.cfi)], ["TLI", v(f.tli)], ["SRMR", f.srmr]] });
  const cmpLines: string[] = Array.isArray(inp.options.compare_structural) ? inp.options.compare_structural.filter((x: string) => String(x).trim()) : [];
  if (cmpLines.length) {
    const known = new Set(vars); const models: { id: string; eqs: string[] }[] = [{ id: "기준", eqs: inp.options.structural }];
    cmpLines.forEach((raw: string, i: number) => {
      const has = raw.includes("::"); const name = has ? raw.split("::")[0].trim() || `모형 ${i + 1}` : `모형 ${i + 1}`; const body = has ? raw.split("::").slice(1).join("::") : raw;
      const eqs = body.replace(/\r?\n/g, ";").split(";").map((e) => e.trim()).filter(Boolean);
      for (const e of eqs) { if (!e.includes("~")) throw new Error(`비교할 모형 「${name}」 의 경로식 「${e}」 에 ~ 가 없습니다.`); const [yv, xv] = [e.split("~")[0].trim(), e.split("~").slice(1).join("~")]; const used = [yv, ...xv.replace(/\+/g, " ").split(/\s+/).filter(Boolean)]; const miss = used.filter((u) => !known.has(u)); if (miss.length) throw new Error(`비교할 모형 「${name}」 에 쓴 변수 ${miss.join(", ")} 이(가) 「경로에 쓰는 변수」에 없습니다.`); }
      models.push({ id: name, eqs });
    });
    const fits = models.map((m) => ({ id: m.id, res: pathAnalysis(data, m.eqs) })); const base = fits[0].res;
    const rows = fits.map((f, i) => {
      let dc: number | "" = "", dd: number | "" = "", dp: number | "" = "";
      if (i > 0) { const [hi, lo] = f.res.fit.df > base.fit.df ? [f.res, base] : [base, f.res]; if (hi.fit.df > lo.fit.df) { const d = hi.fit.chi2 - lo.fit.chi2, ddf = hi.fit.df - lo.fit.df; dc = d; dd = ddf; dp = chi2sf(Math.max(d, 0), ddf); } }
      const nn = (v: number) => (Number.isNaN(v) ? null : v);
      return [f.id, f.res.fit.chi2, f.res.fit.df, f.res.fit.p, f.res.fit.rmsea, nn(f.res.fit.cfi), nn(f.res.fit.tli), f.res.fit.srmr, dc, dd, dp];
    });
    r.tables.push({ id: "model_compare", title: "모형 비교", columns: ["모형", "χ²", "df", "p", "RMSEA", "CFI", "TLI", "SRMR", "Δχ²(기준과)", "Δdf", "Δp"], rows });
  }
  res.paths.forEach((c) => r.effects.push({ name: `표준화계수 β (${c.from}→${c.to})`, value: c.std }));
  if (res.effects[0]) r.effects.push({ name: "직접효과", value: res.effects[0].direct }, { name: "간접효과", value: res.effects[0].indirect }, { name: "총효과", value: res.effects[0].total });
  return r;
}

// ───────── M29 구조방정식 (엔진 정의: 측정모형이 있으면 요인점수=문항 평균, 없으면 경로분석)
export function M29(inp: Input): MResult {
  const r = mk("M29", "구조방정식모형");
  const items = inp.slots.items; const idx = completeIdx(inp.table, items); const data: Record<string, number[]> = {};
  items.forEach((v) => (data[v] = pick(numCol(inp.table, v), idx) as number[]));
  const meas: Record<string, string[]> | undefined = inp.options.measurement;
  let cols = data;
  if (meas && Object.keys(meas).length) { cols = {}; for (const [f, its] of Object.entries(meas)) cols[f] = data[its[0]].map((_, i) => mean(its.map((it) => data[it][i]))); for (const line of inp.options.structural) { const y = line.split("~")[0].trim(); if (!(y in cols) && y in data) cols[y] = data[y]; } }
  const res = pathAnalysis(cols, inp.options.structural);
  r.tables.push({ id: "sem_structural", title: "구조 경로", columns: ["From", "To", "B", "SE", "p", "표준화"], rows: res.paths.map((c) => [c.from, c.to, c.b, c.se, c.p, c.std]) });
  res.paths.forEach((c) => r.effects.push({ name: `표준화 경로계수 (${c.from}→${c.to})`, value: c.std }));
  r.notes.push("측정모형이 있으면 요인점수(문항 평균)를 거쳐 구조 경로를 추정하는 근사 방식입니다(엔진과 같은 정의).");
  return r;
}

// ───────── M30 잠재성장모형 (ML)
export function M30(inp: Input): MResult {
  const r = mk("M30", "잠재성장모형");
  const tv = inp.options.time_variables ?? inp.slots.outcome; const idx = completeIdx(inp.table, tv); const raw = idx.map((i) => tv.map((v) => Number(inp.table.cols[v][i])));
  const t = tv.length; const times: number[] = inp.options.time_points && inp.options.time_points.length === t ? inp.options.time_points : tv.map((_, i) => i);
  const flat = raw.flat(); const gMean = mean(flat); const gSd = sd(flat) || 1; const y = raw.map((rw) => rw.map((v) => (v - gMean) / gSd)); const n = y.length;
  const lam = times.map((tm) => [1, tm]); const ybar = Array.from({ length: t }, (_, j) => mean(y.map((rw) => rw[j])));
  const S = zeros(t, t); for (const rw of y) for (let a = 0; a < t; a++) for (let b = 0; b < t; b++) S[a][b] += ((rw[a] - ybar[a]) * (rw[b] - ybar[b])) / n;
  const ldS = lndet(S);
  const unpack = (th: number[]) => { const alpha = [th[0], th[1]]; const l11 = Math.exp(th[2]), l21 = th[3], l22 = Math.exp(th[4]); const psi = [[l11 * l11, l11 * l21], [l11 * l21, l21 * l21 + l22 * l22]]; const theta = Array.from({ length: t }, (_, i) => Math.exp(th[5 + i])); return { alpha, psi, theta }; };
  const fml = (th: number[]) => { const { alpha, psi, theta } = unpack(th); const Sg = matmul(matmul(lam, psi), T(lam)); for (let i = 0; i < t; i++) Sg[i][i] += theta[i]; let ld: number, Si: Mat; try { ld = lndet(Sg); Si = inv(Sg); } catch { return 1e10; } const d = ybar.map((v, i) => v - (lam[i][0] * alpha[0] + lam[i][1] * alpha[1])); const Sd = matvec(Si, d); return ld + trace(matmul(S, Si)) - ldS - t + d.reduce((s, v, i) => s + v * Sd[i], 0); };
  // start: individual OLS
  const coefs = y.map((rw) => { const X = lam; const Xt = T(X); const b = solve(matmul(Xt, X), matvec(Xt, rw)); return b; }); const c0 = mean(coefs.map((c) => c[0])), c1 = mean(coefs.map((c) => c[1]));
  const cv = covOf(coefs); const resid = y.flatMap((rw, i) => rw.map((v, j) => v - ybar[j])); const v0 = Math.max(variance(resid), 1e-3);
  const th0 = [c0, c1, 0.5 * Math.log(Math.max(cv[0][0], 1e-3)), cv[0][1] / Math.sqrt(Math.max(cv[0][0], 1e-3)), 0.5 * Math.log(Math.max(cv[1][1], 1e-3)), ...Array(t).fill(Math.log(v0))];
  let best = bfgs(fml, th0, { maxIter: 5000, gtol: 1e-10 });
  for (let rep = 0; rep < 2; rep++) { const b2 = bfgs(fml, best.x, { maxIter: 500, gtol: 1e-10 }); if (b2.fx < best.fx - 1e-13) best = b2; else break; }
  { const nm = nelderMead(fml, best.x, { tol: 1e-13, maxIter: 3000 }); if (nm.fx < best.fx - 1e-12) { const b2 = bfgs(fml, nm.x, { maxIter: 500, gtol: 1e-10 }); best = b2.fx <= nm.fx ? b2 : { ...best, x: nm.x, fx: nm.fx }; } }
  const { alpha, psi } = unpack(best.x);
  const a0 = alpha[0] * gSd + gMean, a1 = alpha[1] * gSd;
  const rr = psi[0][0] > 0 && psi[1][1] > 0 ? psi[0][1] / Math.sqrt(psi[0][0] * psi[1][1]) : NaN;
  r.tables.push({ id: "lgm_means", title: "잠재성장 모수", columns: ["모수", "평균", "분산"], rows: [["초기값", a0, psi[0][0] * gSd * gSd], ["변화율", a1, psi[1][1] * gSd * gSd], ["초기값–변화율 r", rr, ""]] });
  if (psi[1][1] < 1e-3 * psi[0][0]) r.notes.push("기울기 분산이 0 에 가깝습니다(경계 해). 이 웹판은 제약 경계 해를 따로 풀지 않습니다.");
  return r;
}
