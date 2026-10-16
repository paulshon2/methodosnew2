import {
  mean, sd, variance, median, tppf, chi2sf, chi2ppf, normppf, normsf, normcdf, numCol, completeIdx, pick, levels, eigSym, matmul, T, zeros, eye,
  inv, solve, lgamma, brentMin, rank, pearson, fppf, nctcdf, Mat, mulberry32, randn, matvec,
} from "./core";
import { svd, ncfcdf, ncx2cdf, signrankCdf } from "./core2";
import { Input, MResult, mk } from "./types";
import { design } from "./t2";
import { multinomial, ordinal } from "./t7";

function getNumeric(inp: Input, names: string[]) { const idx = completeIdx(inp.table, names); return names.map((n) => pick(numCol(inp.table, n), idx) as number[]); }

// ───────── M19 로지스틱 (이항)
export function logisticFit(X: number[][], y: number[]) {
  const n = X.length, k = X[0].length; let beta = new Array(k).fill(0);
  let ll0 = -Infinity, cov: Mat = eye(k);
  for (let it = 0; it < 100; it++) {
    const eta = X.map((r) => r.reduce((s, v, j) => s + v * beta[j], 0)); const p = eta.map((e) => 1 / (1 + Math.exp(-e)));
    const g = new Array(k).fill(0); const H = zeros(k, k);
    for (let i = 0; i < n; i++) { const w = Math.max(p[i] * (1 - p[i]), 1e-12); for (let a = 0; a < k; a++) { g[a] += X[i][a] * (y[i] - p[i]); for (let b = 0; b < k; b++) H[a][b] += w * X[i][a] * X[i][b]; } }
    cov = inv(H); const step = matvec(cov, g); beta = beta.map((b, j) => b + step[j]);
    const ll = y.reduce((s, yy, i) => { const e = X[i].reduce((a, v, j) => a + v * beta[j], 0); return s + yy * e - Math.log(1 + Math.exp(e)); }, 0);
    if (Math.abs(ll - ll0) < 1e-12 && Math.max(...step.map(Math.abs)) < 1e-9) { ll0 = ll; break; } ll0 = ll;
  }
  return { beta, cov, se: beta.map((_, j) => Math.sqrt(cov[j][j])), ll: ll0 };
}
export function M19(inp: Input): MResult {
  const r = mk("M19", "이항·다항·순서형 로지스틱 회귀");
  const yn = inp.slots.outcome[0], xs = inp.slots.predictors;
  const idx = completeIdx(inp.table, [yn, ...xs]);
  const raw = pick(inp.table.cols[yn], idx) as (string | number)[];
  const labels = raw.map((v) => (typeof v === "number" ? String(v) : String(v).trim()));
  const uniq = [...new Set(labels)].sort();
  const evRaw = inp.options.event_value; const hasEvent = evRaw !== undefined && evRaw !== null && evRaw !== "";
  let kind = String(inp.options.model_family ?? "auto").toLowerCase();
  if (["", "auto", "자동"].includes(kind)) kind = uniq.length <= 2 || hasEvent ? "binary" : "multinomial";
  const Xc = xs.map((n) => pick(numCol(inp.table, n), idx) as number[]);
  if (kind === "binary") {
    const ev = hasEvent ? String(evRaw) : uniq[1];
    if (!hasEvent && uniq.length !== 2) throw new Error(`'${yn}' 에 값이 ${uniq.length}종 있습니다. 이항으로 보려면 「사건으로 볼 값」을 정하거나, 다항·순서형을 고르세요.`);
    const y = labels.map((v) => (v === ev ? 1 : 0));
    const f = logisticFit(design(Xc), y); const zc = normppf(0.975);
    const rows = ["(상수)", ...xs].map((nm, j) => { const z = f.beta[j] / f.se[j]; return [nm, f.beta[j], f.se[j], z, 2 * normsf(Math.abs(z)), Math.exp(f.beta[j]), Math.exp(f.beta[j] - zc * f.se[j]), Math.exp(f.beta[j] + zc * f.se[j])]; });
    r.tables.push({ id: "logistic", title: `이항 로지스틱 회귀 — 사건=${ev}`, columns: ["항", "B", "SE", "z", "p", "OR", "OR 95% 하한", "OR 95% 상한"], rows });
    xs.forEach((nm, j) => r.effects.push({ name: `승산비 (${nm})`, value: Math.exp(f.beta[j + 1]) }));
    return r;
  }
  const order: string[] | undefined = Array.isArray(inp.options.category_order) ? inp.options.category_order.map((v: any) => String(v).trim()) : undefined;
  const res = kind === "ordinal" ? ordinal(Xc, labels, xs, order) : multinomial(Xc, labels, xs, inp.options.reference_category ? String(inp.options.reference_category) : undefined);
  const title = kind === "ordinal" ? "순서형 로지스틱 회귀 (누적 로짓 · 비례오즈)" : `다항 로지스틱 회귀 (기준 범주 = ${res.reference})`;
  r.tables.push({ id: "logistic_poly", title, columns: ["결과 범주", "항", "B", "SE", "z", "p", "OR", "OR 95% 하한", "OR 95% 상한"], rows: res.coefs.map((c) => [c.outcome || "—", c.name, c.b, c.se, c.z, c.p, c.or, c.orLo, c.orHi]) });
  if (res.thresholds.length) r.tables.push({ id: "ordinal_thresholds", title: "문턱 (범주를 가르는 자리)", columns: ["경계", "추정", "SE"], rows: res.thresholds.map((t) => [t[0], t[1], t[2]]) });
  r.tables.push({ id: "logistic_fit", title: "모형 적합", columns: ["항", "값"], rows: [["로그우도", res.ll], ["영모형 로그우도", res.ll0], ["우도비 χ²", res.lr], ["자유도", res.lrDf], ["p", res.lrP], ["맥패든 R²", res.mcfadden], ["나겔커크 R²", res.nagelkerke], ["AIC", res.aic], ["BIC", res.bic], ["분류 정확도", res.acc], ["사례 수", res.n]] });
  const seen = new Set<string>(); for (const c of res.coefs) { const key = c.outcome || "—"; if (!seen.has(key)) { seen.add(key); r.effects.push({ name: `승산비 (${key})`, value: c.or }); } }
  r.notes.push(...res.notes);
  return r;
}

// ───────── M20 포아송·음이항
function irls(X: number[][], y: number[], alpha: number) {
  const n = X.length, k = X[0].length; const ybar = mean(y);
  let mu = y.map((v) => Math.max(v, 0.1) * 0.5 + ybar * 0.5); let eta = mu.map(Math.log); let beta = new Array(k).fill(0); let cov: Mat = eye(k);
  for (let it = 0; it < 100; it++) {
    const w = mu.map((m) => m / (1 + alpha * m)); const z = eta.map((e, i) => e + (y[i] - mu[i]) / Math.max(mu[i], 1e-12));
    const A = zeros(k, k), b = new Array(k).fill(0);
    for (let i = 0; i < n; i++) for (let a = 0; a < k; a++) { b[a] += X[i][a] * w[i] * z[i]; for (let c = 0; c < k; c++) A[a][c] += X[i][a] * w[i] * X[i][c]; }
    const nb = solve(A, b); const step = Math.max(...nb.map((v, j) => Math.abs(v - beta[j]))); beta = nb;
    eta = X.map((r) => Math.min(30, Math.max(-30, r.reduce((s, v, j) => s + v * beta[j], 0)))); mu = eta.map(Math.exp);
    if (step < 1e-12) break;
  }
  const w = mu.map((m) => m / (1 + alpha * m)); const A = zeros(k, k);
  for (let i = 0; i < n; i++) for (let a = 0; a < k; a++) for (let c = 0; c < k; c++) A[a][c] += X[i][a] * w[i] * X[i][c];
  cov = inv(A); return { beta, mu, cov };
}
function cLoglik(y: number[], mu: number[], alpha: number): number {
  if (alpha <= 0) return y.reduce((s, v, i) => s + v * Math.log(Math.max(mu[i], 1e-300)) - mu[i] - lgamma(v + 1), 0);
  const r = 1 / alpha;
  return y.reduce((s, v, i) => { const am = alpha * mu[i]; return s + lgamma(v + r) - lgamma(r) - lgamma(v + 1) + v * Math.log(Math.max(am, 1e-300)) - (v + r) * Math.log1p(am); }, 0);
}
function cDeviance(y: number[], mu: number[], alpha: number): number {
  if (alpha <= 0) return 2 * y.reduce((s, v, i) => s + (v > 0 ? v * Math.log(v / mu[i]) : 0) - (v - mu[i]), 0);
  const r = 1 / alpha; return 2 * y.reduce((s, v, i) => s + (v > 0 ? v * Math.log(v / mu[i]) : 0) - (v + r) * Math.log((v + r) / (mu[i] + r)), 0);
}
export function M20(inp: Input): MResult {
  const r = mk("M20", "포아송·음이항 회귀");
  const yn = inp.slots.outcome[0], xs = inp.slots.predictors;
  const idx = completeIdx(inp.table, [yn, ...xs]); const y = pick(numCol(inp.table, yn), idx) as number[]; const Xc = xs.map((n) => pick(numCol(inp.table, n), idx) as number[]);
  const mus = Xc.map(mean), sds = Xc.map((c) => sd(c) || 1); const Xs = design(Xc.map((c, j) => c.map((v) => (v - mus[j]) / sds[j])));
  const n = y.length, k = xs.length + 1;
  const back = (b: number[], C: Mat) => {
    const M = eye(k); for (let j = 1; j < k; j++) { M[j][j] = 1 / sds[j - 1]; M[0][j] = -mus[j - 1] / sds[j - 1]; }
    return { bo: matvec(M, b), Co: matmul(matmul(M, C), T(M)) };
  };
  const fam = String(inp.options.family ?? "poisson").toLowerCase();
  const wantNB = ["negative_binomial", "nb", "negbin", "음이항"].includes(fam);
  const P = irls(Xs, y, 0), llP = cLoglik(y, P.mu, 0);
  const lo = Math.log(1e-6);
  const nll = (la: number) => { const a = Math.exp(la); const m = irls(Xs, y, a); return -cLoglik(y, m.mu, a); };
  const bm = brentMin(nll, lo, Math.log(50), 1e-12);
  const xopt = nll(lo) <= bm.fx + 1e-9 * Math.max(1, Math.abs(bm.fx)) ? lo : bm.x; const alpha = Math.exp(xopt);
  const NB = irls(Xs, y, alpha), llNB = cLoglik(y, NB.mu, alpha);
  const fit = wantNB ? NB : P;
  const { bo, Co } = back(fit.beta, fit.cov); const zc = normppf(0.975);
  r.tables.push({ id: "count_coef", title: "계수", columns: ["항", "B (log)", "SE", "z", "p", "IRR", "IRR 95% 하한", "IRR 95% 상한"], rows: ["(상수)", ...xs].map((nm, j) => { const se = Math.sqrt(Co[j][j]); const z = bo[j] / se; return [nm, bo[j], se, z, 2 * normsf(Math.abs(z)), Math.exp(bo[j]), Math.exp(bo[j] - zc * se), Math.exp(bo[j] + zc * se)]; }) });
  const row = (nm: string, m: { mu: number[] }, a: number, ll: number) => {
    const dev = cDeviance(y, m.mu, a); const varf = m.mu.map((u) => (a > 0 ? u + a * u * u : u)); const pear = y.reduce((s, v, i) => s + (v - m.mu[i]) ** 2 / Math.max(varf[i], 1e-12), 0);
    const npar = k + (a > 0 ? 1 : 0); return [nm, ll, dev, n - k, pear / (n - k), -2 * ll + 2 * npar, -2 * ll + npar * Math.log(n), a];
  };
  r.tables.push({ id: "model_compare", title: "모형 비교", columns: ["모형", "로그우도", "이탈도", "자유도", "흩어짐", "AIC", "BIC", "NB α"], rows: [row("포아송", P, 0, llP), row("음이항(NB2)", NB, alpha, llNB)] });
  xs.forEach((nm, j) => r.effects.push({ name: `발생률비 IRR (${nm})`, value: Math.exp(bo[j + 1]) }));
  return r;
}

// ───────── M21 신뢰도
export function corrMat(M: number[][]): Mat { const p = M[0].length; const cols = Array.from({ length: p }, (_, j) => M.map((r) => r[j])); return cols.map((a) => cols.map((b) => pearson(a, b))); }
export function paf(R: Mat, k: number) {
  const p = R.length; const Rinv = inv(R);
  let h2 = Rinv.map((r, i) => Math.min(0.999, Math.max(0.001, 1 - 1 / r[i])));
  let L: Mat = zeros(p, k);
  for (let it = 0; it < 20000; it++) {
    const A = R.map((r) => r.slice()); for (let i = 0; i < p; i++) A[i][i] = h2[i];
    const e = eigSym(A); L = zeros(p, k);
    for (let j = 0; j < k; j++) { const lam = Math.max(e.values[j], 0); for (let i = 0; i < p; i++) L[i][j] = e.vectors[i][j] * Math.sqrt(lam); }
    const nh = L.map((row) => Math.min(0.999, Math.max(0.001, row.reduce((s, v) => s + v * v, 0))));
    const d = Math.max(...nh.map((v, i) => Math.abs(v - h2[i]))); h2 = nh; if (d < 1e-13) break;
  }
  return { L, h2 };
}
export function M21(inp: Input): MResult {
  const r = mk("M21", "신뢰도 분석");
  const items = inp.slots.items; const cols = getNumeric(inp, items); const n = cols[0].length, k = items.length;
  const M = Array.from({ length: n }, (_, i) => cols.map((c) => c[i]));
  const alphaOf = (m: number[][]) => { const kk = m[0].length; const iv = m[0].map((_, j) => variance(m.map((r) => r[j]))); const tv = variance(m.map((r) => r.reduce((a, b) => a + b, 0))); return (kk / (kk - 1)) * (1 - iv.reduce((a, b) => a + b, 0) / tv); };
  const alpha = alphaOf(M); const iv = cols.map((c) => variance(c)); const tv = variance(M.map((r) => r.reduce((a, b) => a + b, 0)));
  const df1 = n - 1, df2 = (n - 1) * (k - 1); const fLo = fppf(0.975, df1, df2), fHi = fppf(0.025, df1, df2);
  const ci = [1 - (1 - alpha) * fLo, 1 - (1 - alpha) * fHi];
  const R = corrMat(M); const { L } = paf(R, 1); let lam = L.map((row, i) => row[0] * Math.sqrt(iv[i])); if (lam.reduce((a, b) => a + b, 0) < 0) lam = lam.map((v) => -v);
  const theta = iv.map((v, i) => Math.max(v - lam[i] ** 2, 1e-12)); const s = lam.reduce((a, b) => a + b, 0); const omega = (s * s) / (s * s + theta.reduce((a, b) => a + b, 0));
  const Ri = inv(R); const smc = Ri.map((row, i) => 1 - 1 / row[i]); const err = iv.map((v, i) => v * (1 - smc[i])); const l6 = 1 - err.reduce((a, b) => a + b, 0) / tv;
  let off = 0, cnt = 0; for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) if (i !== j) { off += R[i][j]; cnt++; }
  r.tables.push({ id: "alpha", title: "신뢰도", columns: ["지표", "값", "95% 하한", "95% 상한"], rows: [["크론바흐 α", alpha, ci[0], ci[1]], ["맥도널드 ω", omega, "", ""], ["구트만 λ6", l6, "", ""], ["문항 사이 평균 상관", off / cnt, "", ""]] });
  const total = M.map((rw) => rw.reduce((a, b) => a + b, 0));
  const rows = items.map((nm, j) => {
    const rest = total.map((t, i) => t - M[i][j]); const sub = M.map((rw) => rw.filter((_, c) => c !== j));
    return [nm, mean(cols[j]), sd(cols[j]), pearson(cols[j], rest), sub[0].length >= 2 ? alphaOf(sub) : NaN];
  });
  r.tables.push({ id: "reliability_items", title: "문항 분석", columns: ["문항", "평균", "SD", "수정된 문항-전체 상관", "제거 시 α"], rows });
  rows.forEach((rw) => r.effects.push({ name: `문항 제거 시 α (${rw[0]})`, value: rw[4] as number }));
  r.cis.push({ parameter: "값 (크론바흐 α)", estimate: alpha, low: ci[0], high: ci[1] });
  return r;
}

// ───────── M22 탐색적 요인분석
export function varimax(Lm: Mat, gamma = 1): Mat {
  const p = Lm.length, k = Lm[0].length; if (k < 2) return Lm.map((r) => r.slice());
  const sc = Lm.map((r) => { const s = Math.sqrt(r.reduce((a, v) => a + v * v, 0)); return s > 0 ? s : 1; });
  const x = Lm.map((r, i) => r.map((v) => v / sc[i])); let rot = eye(k); let d = 0;
  for (let it = 0; it < 20000; it++) {
    const lam = matmul(x, rot); const ltl = matmul(T(lam), lam);
    const inner = lam.map((row) => row.map((v, j) => v ** 3 - (gamma / p) * v * ltl[j][j]));
    const B = matmul(T(x), inner); const { U, s, V } = svd(B); const rn = matmul(U, T(V));
    const step = Math.max(...rn.flatMap((row, i) => row.map((v, j) => Math.abs(v - rot[i][j])))); rot = rn;
    const dOld = d; d = s.reduce((a, b) => a + b, 0); if (dOld !== 0 && d <= dOld * (1 + 1e-14) && step < 1e-13) break;
  }
  return matmul(x, rot).map((row, i) => row.map((v) => v * sc[i]));
}
export function promax(Lm: Mat, power = 4): { pattern: Mat; phi: Mat } {
  const lam = varimax(Lm); const k = lam[0].length; if (k < 2) return { pattern: lam, phi: eye(Math.max(k, 1)) };
  const target = lam.map((row) => row.map((v) => v * Math.abs(v) ** (power - 1)));
  const LtL = matmul(T(lam), lam); const U = matmul(inv(LtL), matmul(T(lam), target));
  const UtUi = inv(matmul(T(U), U)); const dgl = UtUi.map((r, i) => Math.sqrt(r[i]));
  const U2 = U.map((row) => row.map((v, j) => v * dgl[j])); const pattern = matmul(lam, U2);
  let phi = inv(matmul(T(U2), U2)); const dd = phi.map((r, i) => Math.sqrt(r[i])); phi = phi.map((row, i) => row.map((v, j) => v / (dd[i] * dd[j])));
  return { pattern, phi };
}
export function kmo(R: Mat) {
  const Ri = inv(R); const d = Ri.map((r, i) => Math.sqrt(r[i])); const P = Ri.map((row, i) => row.map((v, j) => (i === j ? 0 : -v / (d[i] * d[j]))));
  const Rz = R.map((row, i) => row.map((v, j) => (i === j ? 0 : v)));
  let sr = 0, sp = 0; Rz.forEach((row, i) => row.forEach((v, j) => { sr += v * v; sp += P[i][j] ** 2; }));
  const per = Rz.map((row, i) => { const a = row.reduce((s, v) => s + v * v, 0), b = P[i].reduce((s, v) => s + v * v, 0); return a / (a + b); });
  return { overall: sr / (sr + sp), per };
}
export function M22(inp: Input): MResult {
  const r = mk("M22", "탐색적 요인분석");
  const items = inp.slots.items; const cols = getNumeric(inp, items); const n = cols[0].length, p = items.length;
  const M = Array.from({ length: n }, (_, i) => cols.map((c) => c[i])); const R = corrMat(M);
  const eig = eigSym(R).values; const kaiser = eig.filter((v) => v > 1).length; const tot = eig.reduce((a, b) => a + b, 0);
  let cum = 0, k80 = 1; for (let i = 0; i < p; i++) { cum += eig[i] / tot; if (cum >= 0.8 - 1e-12) { k80 = i + 1; break; } }
  let kScree = 1, minDrop = Infinity; for (let i = 0; i < p - 1; i++) { const dr = eig[i + 1] - eig[i]; if (dr < minDrop) { minDrop = dr; kScree = i + 1; } }
  const rng = mulberry32(42); const mr = new Array(p).fill(0);
  for (let b = 0; b < 100; b++) { const Z = Array.from({ length: n }, () => Array.from({ length: p }, () => randn(rng))); const ev = eigSym(corrMat(Z)).values; ev.forEach((v, i) => (mr[i] += v / 100)); }
  const kPA = eig.filter((v, i) => v > mr[i]).length;
  const cumAt = eig.slice(0, k80).reduce((a, b) => a + b, 0) / tot;
  r.tables.push({ id: "factor_count", title: "요인 수 결정", columns: ["방법", "제안 요인 수", "설명"], rows: [
    ["고유값>1 (Kaiser)", Math.max(kaiser, 1), `고유값: ${eig.slice(0, 5).map((v) => v.toFixed(2)).join(", ")}`],
    ["스크리 (최대 하강)", Math.max(kScree, 1), "고유값 곡선의 급격한 꺾임"],
    ["누적 80% 분산", Math.max(k80, 1), `${(100 * cumAt).toFixed(1)}%`],
    ["평행분석 (100회)", Math.max(kPA, 1), "무작위 데이터 고유값 평균보다 큰 개수"]] });
  const kf = Math.max(1, Math.min(inp.options.n_factors ? Number(inp.options.n_factors) : kPA || 2, p - 1));
  const rot = String(inp.options.rotation ?? "varimax").toLowerCase();
  const { L: raw, h2 } = paf(R, kf); let L: Mat = raw, phi: Mat | null = null;
  if (kf >= 2 && ["promax", "프로멕스", "oblique", "사교"].includes(rot)) { const pr = promax(raw); L = pr.pattern; phi = pr.phi; }
  else if (kf >= 2 && !["none", "없음", "무회전"].includes(rot)) L = varimax(raw);
  L = L.map((row) => row.slice());
  for (let j = 0; j < kf; j++) if (L.reduce((s, row) => s + row[j], 0) < 0) { for (const row of L) row[j] *= -1; if (phi) { phi[j] = phi[j].map((v) => -v); for (const rw of phi) rw[j] = -rw[j]; } }
  if (phi) for (let i = 0; i < kf; i++) phi[i][i] = 1;
  let ss = Array.from({ length: kf }, (_, j) => L.reduce((s, row) => s + row[j] ** 2, 0));
  const order = ss.map((_, i) => i).sort((a, b) => ss[b] - ss[a]); L = L.map((row) => order.map((o) => row[o])); ss = order.map((o) => ss[o]); if (phi) { const ph0: Mat = phi; phi = order.map((a) => order.map((b) => ph0[a][b])); }
  const comm = phi ? h2 : L.map((row) => row.reduce((s, v) => s + v * v, 0)); const km = kmo(R);
  r.tables.push({ id: "efa_eigen", title: "고유값", columns: ["성분", "고유값"], rows: eig.slice(0, Math.min(8, eig.length)).map((v, i) => [i + 1, v]) });
  r.tables.push({ id: "efa_loadings", title: "적재", columns: ["문항", ...Array.from({ length: kf }, (_, j) => `요인 ${j + 1}`), "공통성", "고유분산", "KMO"], rows: items.map((nm, i) => [nm, ...L[i], comm[i], 1 - comm[i], km.per[i]]) });
  let c = 0; r.tables.push({ id: "efa_variance", title: "설명분산", columns: ["요인", "적재 제곱합", "설명분산(%)", "누적(%)"], rows: ss.map((s, j) => { c += (100 * s) / p; return [`요인 ${j + 1}`, s, (100 * s) / p, c]; }) });
  if (phi) r.tables.push({ id: "efa_factor_corr", title: "요인 간 상관", columns: ["요인", ...Array.from({ length: kf }, (_, j) => `요인 ${j + 1}`)], rows: phi.map((row, i) => [`요인 ${i + 1}`, ...row]) });
  r.notes.push(`KMO = ${km.overall.toFixed(4)}`);
  return r;
}

// ───────── M23 비모수
export function mannWhitney(a: number[], b: number[]) {
  const n1 = a.length, n2 = b.length, all = a.concat(b), rk = rank(all);
  const r1 = rk.slice(0, n1).reduce((x, y) => x + y, 0); const u1 = r1 - (n1 * (n1 + 1)) / 2;
  const N = n1 + n2; const cnt = new Map<number, number>(); all.forEach((v) => cnt.set(v, (cnt.get(v) ?? 0) + 1));
  let tie = 0; cnt.forEach((t) => (tie += t ** 3 - t));
  const mu = (n1 * n2) / 2; const sg = Math.sqrt(((n1 * n2) / 12) * (N + 1 - tie / (N * (N - 1))));
  const z = (u1 - mu) / sg; return { u1, n1, n2, p: 2 * normsf(Math.abs(z)) };
}
export function wilcoxonSigned(diff: number[]) {
  const nz = diff.filter((d) => d !== 0); const n = nz.length; if (!n) return { stat: NaN, p: NaN, n: 0 };
  const rk = rank(nz.map(Math.abs)); const wp = rk.reduce((s, r, i) => s + (nz[i] > 0 ? r : 0), 0), wm = rk.reduce((s, r, i) => s + (nz[i] < 0 ? r : 0), 0);
  const stat = Math.min(wp, wm); const hasTies = new Set(nz.map(Math.abs)).size !== n; const hasZero = diff.length !== n;
  let p: number;
  if (n <= 50 && !hasTies && !hasZero) { p = Math.min(1, 2 * signrankCdf(n)(stat)); }
  else {
    const mu = (n * (n + 1)) / 4; const cnt = new Map<number, number>(); nz.forEach((d) => cnt.set(Math.abs(d), (cnt.get(Math.abs(d)) ?? 0) + 1)); let tc = 0; cnt.forEach((t) => (tc += t ** 3 - t));
    const sg = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24 - tc / 48); p = 2 * normsf(Math.abs((stat - mu) / sg));
  }
  return { stat, p, n };
}
export function kruskal(groups: number[][]) {
  const all = groups.flat(); const N = all.length; const rk = rank(all); let pos = 0; let h = 0;
  for (const g of groups) { const rs = rk.slice(pos, pos + g.length).reduce((a, b) => a + b, 0); h += (rs * rs) / g.length; pos += g.length; }
  h = (12 / (N * (N + 1))) * h - 3 * (N + 1); const cnt = new Map<number, number>(); all.forEach((v) => cnt.set(v, (cnt.get(v) ?? 0) + 1)); let tc = 0; cnt.forEach((t) => (tc += t ** 3 - t));
  h /= 1 - tc / (N ** 3 - N); return { h, p: chi2sf(h, groups.length - 1), rk };
}
export function M23(inp: Input): MResult {
  const r = mk("M23", "비모수 검정");
  const cols = inp.slots.outcomes ?? inp.slots.outcome; const gn = inp.slots.group?.[0]; const chosen = String(inp.options.design ?? "auto").toLowerCase();
  let groups: { lab: string; v: number[] }[] = [];
  if (gn) { const idx = completeIdx(inp.table, [cols[0], gn]); const y = pick(numCol(inp.table, cols[0]), idx) as number[]; const g = pick(inp.table.cols[gn], idx) as (string | number)[]; groups = levels(g).map((l) => ({ lab: String(l), v: y.filter((_, i) => g[i] === l) })).filter((x) => x.v.length); }
  let design = chosen;
  if (["", "auto", "자동"].includes(chosen)) design = gn && groups.length >= 3 ? "independent_k" : gn && groups.length === 2 ? "independent_two" : cols.length >= 3 ? "repeated_k" : cols.length === 2 ? "paired_two" : "one_sample";
  const names: Record<string, string> = { one_sample: "윌콕슨 부호순위", independent_two: "맨-휘트니 U", paired_two: "윌콕슨 부호순위", independent_k: "크러스컬-월리스", repeated_k: "프리드먼" };
  const dnames: Record<string, string> = { one_sample: "일표본", independent_two: "독립 2집단", paired_two: "대응 2측정", independent_k: "독립 3집단 이상", repeated_k: "반복 3측정 이상" };
  r.tables.push({ id: "np_design", title: "고른 검정", columns: ["설계", "검정"], rows: [[dnames[design], names[design]]] });
  const rankRows = (gs: { lab: string; v: number[] }[]) => { const all = gs.flatMap((g) => g.v); const rk = rank(all); let pos = 0; return gs.map((g) => { const m = mean(rk.slice(pos, pos + g.v.length)); pos += g.v.length; return [g.lab, g.v.length, median(g.v), m]; }); };
  if (design === "independent_two") {
    const a = groups[0].v, b = groups[1].v; const mw = mannWhitney(a, b);
    r.tables.push({ id: "np_two", title: "맨-휘트니 U (독립 2집단)", columns: ["집단", "N", "중앙값", "평균순위"], rows: rankRows(groups.slice(0, 2)) });
    r.tables.push({ id: "np_two_test", title: "검정", columns: ["U", "p"], rows: [[Math.min(mw.u1, a.length * b.length - mw.u1), mw.p]] });
    r.effects.push({ name: "순위양분상관 r", value: (2 * mw.u1) / (a.length * b.length) - 1 });
  } else if (design === "independent_k") {
    const kw = kruskal(groups.map((g) => g.v)); const N = groups.reduce((s, g) => s + g.v.length, 0); const k = groups.length;
    r.tables.push({ id: "np_k", title: "집단별 순위", columns: ["집단", "N", "중앙값", "평균순위"], rows: rankRows(groups) });
    r.tables.push({ id: "np_k_test", title: "크러스컬-월리스", columns: ["H", "df", "p"], rows: [[kw.h, k - 1, kw.p]] });
    const all = groups.flatMap((g) => g.v); const rk = rank(all); let pos = 0; const mr = groups.map((g) => { const m = mean(rk.slice(pos, pos + g.v.length)); pos += g.v.length; return m; });
    const cnt = new Map<number, number>(); all.forEach((v) => cnt.set(v, (cnt.get(v) ?? 0) + 1)); let tc = 0; cnt.forEach((t) => (tc += t ** 3 - t));
    const dr: any[][] = []; const m = (k * (k - 1)) / 2;
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { const se = Math.sqrt(((N * (N + 1)) / 12 - tc / (12 * (N - 1))) * (1 / groups[i].v.length + 1 / groups[j].v.length)); const z = (mr[i] - mr[j]) / se; const pr = 2 * normsf(Math.abs(z)); dr.push([groups[i].lab, groups[j].lab, z, pr, Math.min(1, pr * m)]); }
    r.tables.push({ id: "np_dunn", title: "던 사후검정(본페로니)", columns: ["집단 A", "집단 B", "z", "p", "p(보정)"], rows: dr });
    r.effects.push({ name: "엡실론제곱 ε²", value: (kw.h - k + 1) / (N - k) });
  } else if (design === "paired_two") {
    const [a, b] = getNumeric(inp, [cols[0], cols[1]]); const w = wilcoxonSigned(b.map((v, i) => v - a[i]));
    r.tables.push({ id: "np_paired", title: "윌콕슨 부호순위 (대응 2측정)", columns: ["측정", "중앙값"], rows: [[cols[0], median(a)], [cols[1], median(b)]] });
    r.tables.push({ id: "np_paired_test", title: "검정", columns: ["W", "p", "N(0 제외)"], rows: [[w.stat, w.p, w.n]] });
    r.effects.push({ name: "순위양분상관 r", value: 1 - (2 * w.stat) / ((w.n * (w.n + 1)) / 2) });
  } else if (design === "one_sample") {
    const mu0 = Number(inp.options.mu0 ?? 0); const [y] = getNumeric(inp, [cols[0]]); const w = wilcoxonSigned(y.map((v) => v - mu0));
    r.tables.push({ id: "np_one", title: "윌콕슨 부호순위 (일표본)", columns: ["기준값", "중앙값", "W", "p", "N(0 제외)"], rows: [[mu0, median(y), w.stat, w.p, w.n]] });
    r.effects.push({ name: "순위양분상관 r", value: 1 - (2 * w.stat) / ((w.n * (w.n + 1)) / 2) });
  } else if (design === "repeated_k") {
    const cs = getNumeric(inp, cols); const n = cs[0].length, k = cs.length; const rks = Array.from({ length: n }, (_, i) => rank(cs.map((c) => c[i])));
    const rs = cs.map((_, j) => rks.reduce((s, row) => s + row[j], 0));
    let tie = 0; for (const row of rks) { const cnt = new Map<number, number>(); row.forEach((v) => cnt.set(v, (cnt.get(v) ?? 0) + 1)); cnt.forEach((t) => (tie += t ** 3 - t)); }
    const chi = ((12 / (n * k * (k + 1))) * rs.reduce((s, v) => s + v * v, 0) - 3 * n * (k + 1)) / (1 - tie / (n * k * (k * k - 1)));
    r.tables.push({ id: "np_rep", title: "측정별 순위", columns: ["측정", "중앙값", "평균순위"], rows: cols.map((c, j) => [c, median(cs[j]), rs[j] / n]) });
    r.tables.push({ id: "np_rep_test", title: "프리드먼", columns: ["카이제곱", "df", "p", "N(완전한 줄)"], rows: [[chi, k - 1, chi2sf(chi, k - 1), n]] });
    const m = (k * (k - 1)) / 2; const post: any[][] = [];
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { const diff = cs[j].map((v, q) => v - cs[i][q]); const w = wilcoxonSigned(diff); post.push([cols[i], cols[j], w.stat, w.p, Math.min(1, w.p * m)]); }
    r.tables.push({ id: "np_rep_post", title: "사후검정 (쌍별 윌콕슨 · 본페로니 보정)", columns: ["측정 A", "측정 B", "W", "p", "p(보정)"], rows: post });
    r.effects.push({ name: "켄달 일치도 W", value: chi / (n * (k - 1)) });
  }
  return r;
}

// ───────── M24 검정력
const tcrit = (a: number, df: number) => tppf(1 - a, df);
function powerT(d: number, n: number, alpha: number, paired: boolean, tails: number): number {
  const df = paired ? n - 1 : 2 * n - 2; const ncp = Math.abs(d) * Math.sqrt(paired ? n : n / 2); if (df <= 0) return 0;
  if (tails === 1) return 1 - nctcdf(tcrit(alpha, df), df, ncp);
  const c = tcrit(alpha / 2, df); return 1 - nctcdf(c, df, ncp) + nctcdf(-c, df, ncp);
}
export function powerOf(test: string, effect: number, n: number, alpha: number, o: any): number {
  if (test === "t_two_independent") return powerT(effect, n, alpha, false, o.tails ?? 2);
  if (test === "t_one_sample") return powerT(effect, n, alpha, true, o.tails ?? 2);
  if (test === "anova_one_way") { const g = o.groups ?? 3; const d1 = g - 1, d2 = g * n - g; if (d1 <= 0 || d2 <= 0) return 0; return 1 - ncfcdf(fppf(1 - alpha, d1, d2), d1, d2, effect ** 2 * g * n); }
  if (test === "correlation") { if (n <= 3 || Math.abs(effect) >= 1) return 0; const lam = Math.atanh(Math.abs(effect)) * Math.sqrt(n - 3); if ((o.tails ?? 2) === 1) return normsf(normppf(1 - alpha) - lam); const c = normppf(1 - alpha / 2); return normsf(c - lam) + normcdf(-c - lam); }
  if (test === "regression") { const t1 = Math.max(o.predictors ?? 1, 1), tot = o.total_predictors ?? t1; const d2 = n - tot - 1; if (d2 <= 0) return 0; return 1 - ncfcdf(fppf(1 - alpha, t1, d2), t1, d2, effect * n); }
  const df = o.df ?? 1; if (df <= 0 || n <= 0) return 0; return 1 - ncx2cdf(chi2ppf(1 - alpha, df), df, effect ** 2 * n);
}
const aliases: Record<string, string> = { t_independent: "t_two_independent", t_two_sample: "t_two_independent", t_paired: "t_one_sample", t_single: "t_one_sample", anova: "anova_one_way", corr: "correlation", pearson: "correlation", multiple_regression: "regression", chisq: "chi_square" };
const labels: Record<string, [string, string, string]> = { t_two_independent: ["독립표본 t검정", "코헨 d", "집단당 사례 수"], t_one_sample: ["일표본·대응표본 t검정", "코헨 d", "사례 수"], anova_one_way: ["일원 분산분석", "코헨 f", "집단당 사례 수"], correlation: ["상관", "r", "사례 수"], regression: ["다중회귀 (R² 증가분)", "코헨 f²", "전체 사례 수"], chi_square: ["카이제곱", "코헨 w", "전체 사례 수"] };
export function M24(inp: Input): MResult {
  const r = mk("M24", "검정력·표본크기 분석"); const o = inp.options;
  const key0 = String(o.test ?? "t_two_independent").toLowerCase(); const test = aliases[key0] ?? key0; const [label, effName, nName] = labels[test];
  const num = (v: any) => (v === undefined || v === null || v === "" || v === 0 || v === "0" ? null : Number(v));
  const alpha = Number(o.alpha ?? 0.05), tails = Number(o.tails ?? 2); let eff = num(o.effect_size), n = num(o.n_per_group) ?? num(o.n), pw = num(o.power);
  const ctx = { tails, groups: Number(o.groups) || undefined, predictors: Number(o.predictors) || undefined, total_predictors: Number(o.total_predictors) || undefined, df: Number(o.df) || undefined };
  if (pw === null) pw = powerOf(test, eff!, Math.round(n!), alpha, ctx);
  else if (n === null) {
    const floor = ({ t_two_independent: 2, t_one_sample: 2, anova_one_way: 2, correlation: 4, regression: (ctx.total_predictors ?? 1) + 2, chi_square: 2 } as any)[test];
    let lo = floor, hi = 2000000; if (powerOf(test, eff!, hi, alpha, ctx) < pw) n = hi; else { while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (powerOf(test, eff!, mid, alpha, ctx) < pw) lo = mid + 1; else hi = mid; } n = lo; }
  } else { let lo = 0, hi = test === "correlation" ? 0.999 : 5; for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (powerOf(test, mid, Math.round(n), alpha, ctx) < pw) lo = mid; else hi = mid; } eff = (lo + hi) / 2; pw = powerOf(test, eff, Math.round(n), alpha, ctx); }
  let total = Math.round(n!); if (test === "t_two_independent") total *= 2; if (test === "anova_one_way") total *= ctx.groups ?? 1;
  const fmt = (v: number, d: number) => v.toFixed(d);
  r.tables.push({ id: "power", title: "표본크기·검정력", columns: ["항", "값"], rows: [["검정", label], [`효과크기 (${effName})`, fmt(eff!, 4)], [nName, Math.round(n!).toLocaleString("en-US")], ["전체 사례 수", total.toLocaleString("en-US")], ["검정력", fmt(pw!, 4)], ["유의수준 α", String(alpha)], ["검정 방향", tails === 1 ? "단측" : "양측"]] });
  return r;
}
