/** M19 다항·순서형 로지스틱 — 엔진 stats/glm/polytomous.py 와 같은 정의(소프트맥스 / 누적 로짓·비례오즈). */
import { chi2sf, normppf, normsf, solve, inv, zeros, eye, matmul, T, matvec, mean, sd, lgamma, Mat } from "./core";
import { logisticFit } from "./t3";

export interface PolyCoef { outcome: string; name: string; b: number; se: number; z: number; p: number; or: number; orLo: number; orHi: number }
export interface PolyResult {
  kind: "multinomial" | "ordinal"; categories: string[]; reference: string; coefs: PolyCoef[]; thresholds: [string, number, number][];
  ll: number; ll0: number; lr: number; lrDf: number; lrP: number; mcfadden: number; nagelkerke: number; aic: number; bic: number; n: number; acc: number;
  poChi2: number; poDf: number; poP: number; notes: string[];
}
const expSafe = (v: number) => (v !== v ? NaN : v > 709.78 ? Infinity : Math.exp(Math.max(v, -745)));
function summarize(beta: number[], cov: Mat, labels: string[], outcome = ""): PolyCoef[] {
  const zc = normppf(0.975);
  return labels.map((nm, i) => { const se = Math.sqrt(Math.max(cov[i][i], 0)); const z = se > 0 ? beta[i] / se : NaN; return { outcome, name: nm, b: beta[i], se, z, p: z === z ? 2 * normsf(Math.abs(z)) : NaN, or: expSafe(beta[i]), orLo: expSafe(beta[i] - zc * se), orHi: expSafe(beta[i] + zc * se) }; });
}
function nagel(ll: number, ll0: number, n: number) { const cox = 1 - Math.exp((2 * (ll0 - ll)) / n); return cox / (1 - Math.exp((2 * ll0) / n)); }
function stdDesign(preds: number[][]) {
  const n = preds[0].length, q = preds.length; const mus = preds.map(mean), sds = preds.map((c) => sd(c) || 1);
  const X = Array.from({ length: n }, (_, i) => [1, ...preds.map((c, j) => (c[i] - mus[j]) / sds[j])]);
  const p = q + 1; const M = eye(p); for (let j = 1; j < p; j++) { M[j][j] = 1 / sds[j - 1]; M[0][j] = -mus[j - 1] / sds[j - 1]; }
  return { X, M, mus, sds };
}

export function multinomial(preds: number[][], labels: string[], names: string[], reference?: string): PolyResult {
  const cats = [...new Set(labels)].sort(); if (cats.length < 3) throw new Error("다항 로지스틱은 결과 범주가 3개 이상이어야 합니다.");
  const ref = reference && cats.includes(reference) ? reference : cats[0]; const others = cats.filter((c) => c !== ref); const k = others.length;
  const { X, M } = stdDesign(preds); const n = X.length, p = X[0].length; const codes = labels.map((l) => others.indexOf(l));
  const probs = (theta: number[]) => { const out: number[][] = [], dens: number[] = [], ms: number[] = []; for (let i = 0; i < n; i++) { const eta = others.map((_, a) => { let s = 0; for (let j = 0; j < p; j++) s += X[i][j] * theta[a * p + j]; return s; }); const m = Math.max(0, ...eta); const ex = eta.map((e) => Math.exp(e - m)); const den = Math.exp(-m) + ex.reduce((x, y) => x + y, 0); out.push(ex.map((e) => e / den)); dens.push(den); ms.push(m); } return { pr: out, dens, ms }; };
  const negLl = (theta: number[]) => { let ll = 0; for (let i = 0; i < n; i++) { const eta = others.map((_, a) => { let s = 0; for (let j = 0; j < p; j++) s += X[i][j] * theta[a * p + j]; return s; }); const m = Math.max(0, ...eta); const ld = m + Math.log(Math.exp(-m) + eta.reduce((s, e) => s + Math.exp(e - m), 0)); ll += (codes[i] >= 0 ? eta[codes[i]] : 0) - ld; } return -ll; };
  const grad = (theta: number[]) => { const { pr } = probs(theta); const g = new Array(k * p).fill(0); for (let i = 0; i < n; i++) for (let a = 0; a < k; a++) { const r = (codes[i] === a ? 1 : 0) - pr[i][a]; for (let j = 0; j < p; j++) g[a * p + j] -= r * X[i][j]; } return g; };
  const info = (theta: number[]) => { const { pr } = probs(theta); const H = zeros(k * p, k * p); for (let i = 0; i < n; i++) for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) { const w = pr[i][a] * ((a === b ? 1 : 0) - pr[i][b]); if (w === 0) continue; for (let j = 0; j < p; j++) for (let l = 0; l < p; l++) H[a * p + j][b * p + l] += w * X[i][j] * X[i][l]; } return H; };
  let theta = new Array(k * p).fill(0); let f0 = negLl(theta);
  for (let it = 0; it < 200; it++) {
    const g = grad(theta); if (Math.max(...g.map(Math.abs)) < 1e-11) break; const step = solve(info(theta), g);
    let t = 1, nt = theta, fn = f0; for (let ls = 0; ls < 40; ls++) { nt = theta.map((v, i) => v - t * step[i]); fn = negLl(nt); if (isFinite(fn) && fn <= f0 + 1e-12) break; t /= 2; }
    if (!(fn <= f0 + 1e-12)) break; theta = nt; f0 = fn;
  }
  const H = info(theta); let cov: Mat; try { cov = inv(H); } catch { cov = zeros(k * p, k * p).map((r) => r.map(() => NaN)); }
  const labelsC = ["(상수)", ...names]; const coefs: PolyCoef[] = [];
  others.forEach((cat, a) => { const b = theta.slice(a * p, (a + 1) * p); const bo = matvec(M, b); const block = cov.slice(a * p, (a + 1) * p).map((r) => r.slice(a * p, (a + 1) * p)); const Co = matmul(matmul(M, block), T(M)); coefs.push(...summarize(bo, Co, labelsC, cat)); });
  const ll = -negLl(theta); const counts = cats.map((c) => labels.filter((l) => l === c).length); const ll0 = counts.reduce((s, c) => s + c * Math.log(c / n), 0); const lr = 2 * (ll - ll0); const lrDf = k * (p - 1);
  const { pr, dens, ms } = probs(theta); let correct = 0; for (let i = 0; i < n; i++) { const refP = Math.exp(-ms[i]) / dens[i]; const all = [refP, ...pr[i]]; const best = all.indexOf(Math.max(...all)); const lab = best === 0 ? ref : others[best - 1]; if (lab === labels[i]) correct++; }
  const nPar = k * p;
  return { kind: "multinomial", categories: cats, reference: ref, coefs, thresholds: [], ll, ll0, lr, lrDf, lrP: lrDf > 0 ? chi2sf(lr, lrDf) : NaN, mcfadden: ll0 !== 0 ? 1 - ll / ll0 : NaN, nagelkerke: nagel(ll, ll0, n), aic: -2 * ll + 2 * nPar, bic: -2 * ll + nPar * Math.log(n), n, acc: correct / n, poChi2: NaN, poDf: 0, poP: NaN,
    notes: [`기준 범주는 '${ref}' 입니다. 계수는 「기준 대신 그 범주를 고를 로그오즈」이고, 오즈비는 기준 범주 대비입니다.`, "기준 범주를 바꾸면 계수는 달라지지만 모형 전체의 적합은 같습니다.", "차례가 있는 범주(만족도 1~5 등)라면 순서형이 더 적은 모수로 같은 것을 잡습니다."] };
}

export function ordinal(preds: number[][], labels: string[], names: string[], order?: string[]): PolyResult {
  const uniq = [...new Set(labels)]; const guess = () => (uniq.every((u) => Number.isFinite(Number(u))) ? uniq.slice().sort((a, b) => Number(a) - Number(b)) : uniq.slice().sort());
  const cats = order && order.length ? order : guess(); if (cats.length < 3) throw new Error("순서형 로지스틱은 결과 범주가 3개 이상이어야 합니다.");
  const k = cats.length; const codes = labels.map((l) => cats.indexOf(l)); const n = labels.length; const q = preds.length;
  const { X, M } = stdDesign(preds); const Z = X.map((r) => r.slice(1));
  const sig = (u: number) => (u >= 0 ? 1 / (1 + Math.exp(-u)) : Math.exp(u) / (1 + Math.exp(u)));
  const nllGrad = (v: number[]) => {
    const alpha = v.slice(0, k - 1), beta = v.slice(k - 1); let ll = 0; const g = new Array(v.length).fill(0);
    for (let i = 0; i < n; i++) {
      const eta = Z[i].reduce((s, z, j) => s + z * beta[j], 0); const j = codes[i];
      const u = j < k - 1 ? alpha[j] - eta : Infinity, lo = j > 0 ? alpha[j - 1] - eta : -Infinity;
      const fu = isFinite(u) ? sig(u) : 1, fl = isFinite(lo) ? sig(lo) : 0; const pu = isFinite(u) ? fu * (1 - fu) : 0, pl = isFinite(lo) ? fl * (1 - fl) : 0; const pr = Math.max(fu - fl, 1e-300);
      ll += Math.log(pr); if (j < k - 1) g[j] += pu / pr; if (j > 0) g[j - 1] += -pl / pr; const de = -(pu - pl) / pr; for (let q2 = 0; q2 < q; q2++) g[k - 1 + q2] += de * Z[i][q2];
    }
    return { f: -ll, g: g.map((x) => -x) };
  };
  const hessian = (v: number[]) => { const m = v.length; const H = zeros(m, m); for (let i = 0; i < m; i++) { const h = 1e-6 * (1 + Math.abs(v[i])); const vp = v.slice(), vm = v.slice(); vp[i] += h; vm[i] -= h; const gp = nllGrad(vp).g, gm = nllGrad(vm).g; for (let j = 0; j < m; j++) H[j][i] = (gp[j] - gm[j]) / (2 * h); } return H.map((r, i) => r.map((x, j) => 0.5 * (x + H[j][i]))); };
  const counts = cats.map((c) => labels.filter((l) => l === c).length); let cum = 0; const a0 = counts.slice(0, k - 1).map((c) => { cum += c; const pcum = Math.min(Math.max(cum / n, 1e-6), 1 - 1e-6); return Math.log(pcum / (1 - pcum)); });
  let v = [...a0, ...new Array(q).fill(0)]; let { f: f0 } = nllGrad(v);
  for (let it = 0; it < 200; it++) {
    const { g } = nllGrad(v); if (Math.max(...g.map(Math.abs)) < 1e-11) break; let step: number[]; try { step = solve(hessian(v), g); } catch { break; }
    let t = 1, nv = v, fn = f0, ok = false; for (let ls = 0; ls < 40; ls++) { nv = v.map((x, i) => x - t * step[i]); let mono = true; for (let a = 1; a < k - 1; a++) if (!(nv[a] > nv[a - 1])) mono = false; if (mono) { fn = nllGrad(nv).f; if (isFinite(fn) && fn <= f0 + 1e-12) { ok = true; break; } } t /= 2; }
    if (!ok) break; v = nv; f0 = fn;
  }
  const covZ = inv(hessian(v)); const A = eye(k - 1 + q); for (let a = 0; a < k - 1; a++) for (let j = 0; j < q; j++) A[a][k - 1 + j] = -M[0][j + 1]; for (let j = 0; j < q; j++) A[k - 1 + j][k - 1 + j] = M[j + 1][j + 1];
  const vo = matvec(A, v); const cov = matmul(matmul(A, covZ), T(A)); const alpha = vo.slice(0, k - 1), beta = vo.slice(k - 1); const covBeta = cov.slice(k - 1).map((r) => r.slice(k - 1));
  const coefs = summarize(beta, covBeta, names); const thr: [string, number, number][] = alpha.map((a, j) => [`${cats[j]} | ${cats[j + 1]}`, a, Math.sqrt(Math.max(cov[j][j], 0))]);
  const ll = -nllGrad(v).f; const ll0 = counts.filter((c) => c > 0).reduce((s, c) => s + c * Math.log(c / n), 0); const lr = 2 * (ll - ll0);
  // 비례오즈 검정(끊는 지점마다 이항 로지스틱)
  let poChi2 = NaN, poDf = 0, poP = NaN;
  try {
    const Xnc = preds[0].map((_, i) => [1, ...preds.map((c) => c[i])]); const betas: number[][] = [];
    for (let j = 0; j < k - 1; j++) { const y = codes.map((c) => (c > j ? 1 : 0)); const s = y.reduce((a, b) => a + b, 0); if (s === 0 || s === n) throw new Error("x"); betas.push(logisticFit(Xnc, y).beta.slice(1)); }
    const mb = betas[0].map((_, j) => mean(betas.map((b) => b[j]))); const ci = inv(covBeta); let chi = 0; for (const b of betas) { const sp = b.map((x, j) => x - mb[j]); const t = matvec(ci, sp); chi += sp.reduce((s, x, j) => s + x * t[j], 0); }
    poChi2 = chi; poDf = q * (k - 2); poP = poDf > 0 ? chi2sf(chi, poDf) : NaN;
  } catch { /* leave NaN */ }
  let correct = 0; for (let i = 0; i < n; i++) { const eta = Z[i].reduce((s, z, j) => s + z * v[k - 1 + j], 0); let prev = 0; const pr: number[] = []; for (let j = 0; j < k - 1; j++) { const c = sig(v[j] - eta); pr.push(c - prev); prev = c; } pr.push(1 - prev); if (pr.indexOf(Math.max(...pr)) === codes[i]) correct++; }
  const nPar = k - 1 + q;
  return { kind: "ordinal", categories: cats, reference: "", coefs, thresholds: thr, ll, ll0, lr, lrDf: q, lrP: q > 0 ? chi2sf(lr, q) : NaN, mcfadden: ll0 !== 0 ? 1 - ll / ll0 : NaN, nagelkerke: nagel(ll, ll0, n), aic: -2 * ll + 2 * nPar, bic: -2 * ll + nPar * Math.log(n), n, acc: correct / n, poChi2, poDf, poP,
    notes: ["누적 로짓 모형입니다 — 「이 범주 이하일 오즈」를 봅니다.", "오즈비는 예측변수가 1 늘 때 더 높은 범주로 갈 오즈가 몇 배가 되는지입니다. 어디서 끊든 그 배수가 같다고 보는 것이 비례오즈 가정입니다.", `문턱 ${k - 1}개는 범주 사이를 가르는 자리입니다. 순서대로 커져야 하며, 여기서는 그렇게 되도록 눌러 추정했습니다.`, poP === poP ? `비례오즈 가정 검정 χ²(${poDf})=${poChi2.toFixed(3)}, p=${poP.toPrecision(4)} — ${poP < 0.05 ? "가정이 깨졌습니다. 다항 로지스틱이나 부분비례오즈를 검토하세요." : "가정을 버릴 근거가 약합니다."}` : ""].filter(Boolean) };
}
void lgamma;
