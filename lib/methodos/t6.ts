import {
  mean, sd, variance, quantile, numCol, completeIdx, pick, levels, inv, solve, matmul, T, zeros, eye, lgamma, chi2sf, normppf, normsf, normcdf, tppf, tp2, tsf, ols,
  Mat, mulberry32, randn, matvec, cholesky, binomCdf, betainc, gammainc, bisect, fsf,
} from "./core";
import { Input, MResult, mk } from "./types";
import { design } from "./t2";
import { logisticFit } from "./t3";

/** Python-style %g formatting */
export function pyG(v: number, prec = 6): string {
  if (!isFinite(v)) return String(v); if (v === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(v)));
  let s: string;
  if (exp < -4 || exp >= prec) { s = v.toExponential(prec - 1); s = s.replace(/\.?0+e/, "e"); s = s.replace(/e([+-])(\d)$/, "e$10$2"); }
  else { s = v.toPrecision(prec); if (s.includes("e")) s = Number(s).toString(); if (s.includes(".")) s = s.replace(/\.?0+$/, ""); }
  return s;
}
const f4 = (v: number) => v.toFixed(4);

// ───────── RNG helpers
function gammaSample(shape: number, rng: () => number): number {
  if (shape < 1) return gammaSample(shape + 1, rng) * Math.pow(rng() || 1e-12, 1 / shape);
  const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) { let x: number, v: number; do { x = randn(rng); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = rng(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; }
}
const chisqSample = (df: number, rng: () => number) => 2 * gammaSample(df / 2, rng);

// ───────── M37 결측
function ncolOf(t: Input["table"]): string[] { return t.headers.filter((h) => t.cols[h].every((v) => v === null || typeof v === "number") && t.cols[h].some((v) => v !== null)); }
export function M37(inp: Input): MResult {
  const r = mk("M37", "결측 처리 — 완전정보최대우도와 다중대체");
  const names = ncolOf(inp.table).slice(0, 20); const n = inp.table.n; const data: Record<string, number[]> = {}; names.forEach((nm) => (data[nm] = inp.table.cols[nm].map((v) => (v === null ? NaN : (v as number)))));
  const miss = names.map((nm) => data[nm].map((v) => !isFinite(v)));
  const prof = names.map((nm, a) => {
    const cnt = miss[a].filter(Boolean).length; let dep: string[] = [];
    if (cnt > 0 && cnt < n) {
      const others = names.filter((o) => o !== nm); const usable = others.filter((o) => data[o].filter((v) => isFinite(v)).length > n * 0.5);
      if (usable.length) {
        const cols = usable.map((o) => { const ok = data[o].filter((v) => isFinite(v)); const m = mean(ok); return data[o].map((v) => (isFinite(v) ? v : m)); });
        try { const f = ols(design(cols), miss[a].map((b) => (b ? 1 : 0))); usable.forEach((o, i) => { if (f.p[i + 1] < 0.05) dep.push(o); }); } catch { dep = []; }
      }
    }
    return { nm, cnt, rate: cnt / n, dep };
  });
  r.tables.push({ id: "miss_profile", title: "변수별 결측", columns: ["변수", "빠진 수", "결측률(%)", "무엇과 이어져 빠졌나"], rows: prof.map((p) => [p.nm, p.cnt, p.rate * 100, p.dep.length ? p.dep.join(", ") : "—"]) });
  const pat = new Map<string, number>(); for (let i = 0; i < n; i++) { const k = names.map((_, a) => (miss[a][i] ? "0" : "1")).join(""); pat.set(k, (pat.get(k) ?? 0) + 1); }
  const pats = [...pat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  r.tables.push({ id: "miss_pattern", title: "결측 무늬 (1=있음, 0=빠짐)", columns: ["무늬", "줄 수", "비율(%)"], rows: pats.map(([k, c]) => [k, c, (c / n) * 100]) });
  const yn = inp.slots.outcome?.[0]; const preds: string[] = inp.options.predictors ?? inp.slots.predictors ?? [];
  if (yn && preds.length) {
    const m = Math.max(2, Number(inp.options.m ?? 5)); const rng = mulberry32(Number(inp.options.random_seed ?? 20260822));
    const cn = [yn, ...preds]; const cols: Record<string, number[]> = {}; cn.forEach((c) => (cols[c] = data[c] ?? inp.table.cols[c].map((v) => (v === null ? NaN : Number(v)))));
    const draws: { b: number; s: number }[][] = [];
    for (let d = 0; d < m; d++) {
      const filled: Record<string, number[]> = {}; const ms: Record<string, boolean[]> = {};
      cn.forEach((c) => { const ok = cols[c].filter((v) => isFinite(v)); const mu = ok.length ? mean(ok) : 0; ms[c] = cols[c].map((v) => !isFinite(v)); filled[c] = cols[c].map((v) => (isFinite(v) ? v : mu)); });
      const targets = cn.filter((c) => ms[c].some(Boolean));
      for (let round = 0; round < 5; round++) for (const nm of targets) {
        const others = cn.filter((o) => o !== nm); const obs = ms[nm].map((x) => !x); const nObs = obs.filter(Boolean).length; if (nObs < others.length + 3) continue;
        const Xo = obs.map((o, i) => (o ? i : -1)).filter((i) => i >= 0).map((i) => [1, ...others.map((o) => filled[o][i])]); const yo = obs.map((o, i) => (o ? i : -1)).filter((i) => i >= 0).map((i) => filled[nm][i]);
        const f = ols(Xo, yo); const df = Math.max(1, f.dfResid); const sigma2 = (f.sigma2 * df) / Math.max(chisqSample(df, rng), 1e-9);
        const cov = f.XtXinv.map((rw) => rw.map((v) => v * sigma2)); let beta: number[];
        try { const L = cholesky(cov); const z = f.beta.map(() => randn(rng)); beta = f.beta.map((b, i) => b + L[i].reduce((s, l, j) => s + l * z[j], 0)); } catch { beta = f.beta; }
        ms[nm].forEach((isM, i) => { if (isM) filled[nm][i] = beta[0] + others.reduce((s, o, j) => s + beta[j + 1] * filled[o][i], 0) + Math.sqrt(Math.max(sigma2, 0)) * randn(rng); });
      }
      const f = ols(design(preds.map((p) => filled[p])), filled[yn]); draws.push(f.beta.map((b, i) => ({ b, s: f.se[i] })));
    }
    const labels = ["(상수)", ...preds];
    const rows = labels.map((lb, i) => {
      const est = draws.map((d) => d[i].b), ses = draws.map((d) => d[i].s); const q = mean(est); const u = mean(ses.map((s) => s * s)); const b = variance(est); const t = u + (1 + 1 / m) * b; const fmi = t > 0 ? ((1 + 1 / m) * b) / t : 0;
      return [lb, q, Math.sqrt(t), Math.sqrt(u), Math.sqrt(b), fmi * 100, 1 / (1 + fmi / m)];
    });
    r.tables.push({ id: "mi_pooled", title: `다중대체 통합 회귀 (m=${m})`, columns: ["항", "추정", "SE(전체)", "SE(대체내)", "SE(대체간)", "결측정보비율(%)", "상대효율"], rows });
    r.notes.push("대체값은 난수로 뽑으므로 실행마다 대체간 분산이 조금씩 달라집니다(씨앗값 고정).");
  } else r.notes.push("결과변수와 예측변수를 배정하면 다중대체 뒤 회귀까지 합쳐 보여 줍니다.");
  return r;
}

// ───────── M38 성향점수
function psFit(t: number[], covs: number[][]): number[] {
  const n = t.length; const mus = covs.map(mean), sds = covs.map((c) => sd(c) || 1);
  const X = Array.from({ length: n }, (_, i) => [1, ...covs.map((c, j) => (c[i] - mus[j]) / sds[j])]);
  const f = logisticFit(X, t); return X.map((row) => { const e = Math.min(30, Math.max(-30, row.reduce((s, v, j) => s + v * f.beta[j], 0))); const p = 1 / (1 + Math.exp(-e)); return Math.min(1 - 1e-6, Math.max(1e-6, p)); });
}
const wvar0 = (x: number[]) => (x.length > 1 ? variance(x) : 0);
function smdPlain(a: number[], b: number[]): number { if (!a.length || !b.length) return 0; const pooled = Math.sqrt((wvar0(a) + wvar0(b)) / 2); return pooled <= 0 ? 0 : (mean(a) - mean(b)) / pooled; }
function smdW(x: number[], t: number[], w: number[]): number {
  const ti = t.map((v, i) => (v === 1 ? i : -1)).filter((i) => i >= 0), ci = t.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0); const wt = ti.reduce((s, i) => s + w[i], 0), wc = ci.reduce((s, i) => s + w[i], 0); if (wt <= 0 || wc <= 0) return 0;
  const mt = ti.reduce((s, i) => s + w[i] * x[i], 0) / wt, mc = ci.reduce((s, i) => s + w[i] * x[i], 0) / wc; const pooled = Math.sqrt(((ti.length > 1 ? wvar0(ti.map((i) => x[i])) : 0) + (ci.length > 1 ? wvar0(ci.map((i) => x[i])) : 0)) / 2); return pooled <= 0 ? 0 : (mt - mc) / pooled;
}
export function M38(inp: Input): MResult {
  const r = mk("M38", "성향점수 매칭·가중");
  const tn = inp.options.treat ?? inp.slots.treat[0], yn = inp.options.outcome ?? inp.slots.outcome[0], cn: string[] = inp.options.covariates ?? inp.slots.covariates;
  const idx = completeIdx(inp.table, [tn, yn, ...cn]); let t = (pick(numCol(inp.table, tn), idx) as number[]).map((v) => (v > 0 ? 1 : 0)); let y = pick(numCol(inp.table, yn), idx) as number[]; let covs = cn.map((c) => pick(numCol(inp.table, c), idx) as number[]);
  const method = String(inp.options.ps_method ?? "iptw").toLowerCase(); const notes: string[] = [];
  const ps = psFit(t, covs); const t1 = ps.filter((_, i) => t[i] === 1), t0 = ps.filter((_, i) => t[i] === 0);
  const lo = Math.max(Math.min(...t1), Math.min(...t0)), hi = Math.min(Math.max(...t1), Math.max(...t0)); const sup = ps.map((p) => p >= lo && p <= hi); const dropped = sup.filter((s) => !s).length;
  const keep = sup.map((s, i) => (s ? i : -1)).filter((i) => i >= 0); const ts = keep.map((i) => t[i]), ys = keep.map((i) => y[i]), pss = keep.map((i) => ps[i]), cs = covs.map((c) => keep.map((i) => c[i]));
  const smdBefore = covs.map((c) => smdPlain(c.filter((_, i) => t[i] === 1), c.filter((_, i) => t[i] === 0)));
  let effect = 0, se = 0, estimand = "ATE", usedN = keep.length, smdAfter: number[] = [], label = "역확률가중", pmethod = "iptw";
  if (["matching", "psm", "짝짓기"].includes(method)) {
    const sdl = sd(pss.map((p) => Math.log(p / (1 - p)))); const caliper = sdl > 0 ? 0.2 * sdl : 0.2; const treated = ts.map((v, i) => (v === 1 ? i : -1)).filter((i) => i >= 0).sort((a, b) => pss[b] - pss[a]); const control = ts.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
    const pairs: [number, number][] = []; for (const i of treated) { if (!control.length) break; let bk = 0, bd = Infinity; control.forEach((j, k) => { const d = Math.abs(pss[i] - pss[j]); if (d < bd) { bd = d; bk = k; } }); if (bd <= caliper) { pairs.push([i, control[bk]]); control.splice(bk, 1); } }
    if (pairs.length) {
      const diffs = pairs.map(([a, b]) => ys[a] - ys[b]); effect = mean(diffs); se = diffs.length > 1 ? sd(diffs) / Math.sqrt(diffs.length) : NaN; estimand = "ATT"; usedN = pairs.length * 2; label = "최근접 짝짓기"; pmethod = "matching";
      const w = ts.map(() => 0); pairs.forEach(([a, b]) => { w[a] = 1; w[b] = 1; }); smdAfter = cs.map((c) => smdW(c, ts, w)); notes.push(`성향점수가 가장 가까운 통제 사례를 1:1 로 붙였습니다(허용폭 ${caliper.toFixed(3)}). ${pairs.length}쌍이 맺어졌고, 재는 값은 처치받은 쪽의 효과(ATT)입니다.`);
    }
  }
  if (pmethod === "iptw" && ["stratification", "층화", "strata"].includes(method)) {
    const nS = 5; const sp = pss.slice().sort((a, b) => a - b); const edges = Array.from({ length: nS + 1 }, (_, k) => quantile(sp, k / nS, true));
    const stratum = pss.map((p) => { let k = 0; for (let e = 1; e < nS; e++) if (p >= edges[e]) k = e; return k; }); const parts: { d: number; v: number; w: number }[] = []; let wTot = 0, used = 0; const w = ts.map(() => 0);
    for (let k = 0; k < nS; k++) { const ix = stratum.map((s, i) => (s === k ? i : -1)).filter((i) => i >= 0); const y1 = ix.filter((i) => ts[i] === 1).map((i) => ys[i]), y0 = ix.filter((i) => ts[i] === 0).map((i) => ys[i]); if (!y1.length || !y0.length) continue;
      const d = mean(y1) - mean(y0); let v = 0; if (y1.length > 1) v += variance(y1) / y1.length; if (y0.length > 1) v += variance(y0) / y0.length; parts.push({ d, v, w: ix.length }); wTot += ix.length; used += ix.length; ix.forEach((i) => (w[i] = 1)); }
    if (parts.length && wTot > 0) { effect = parts.reduce((s, p) => s + p.d * p.w, 0) / wTot; se = Math.sqrt(parts.reduce((s, p) => s + p.v * (p.w / wTot) ** 2, 0)); smdAfter = cs.map((c) => smdW(c, ts, w)); label = "성향점수 층화"; pmethod = "stratification"; usedN = used; notes.push(`성향점수를 ${parts.length}개 층으로 나눠 층마다 차이를 구하고 층 크기로 가중했습니다.`); }
  }
  if (pmethod === "iptw") {
    let w = ts.map((v, i) => (v === 1 ? 1 / pss[i] : 1 / (1 - pss[i])));
    if (w.length >= 20) { const cut = quantile(w, 0.99); const clipped = w.filter((v) => v > cut).length; if (clipped) { w = w.map((v) => Math.min(v, cut)); notes.push(`가중치가 지나치게 큰 ${clipped}건을 상위 1% 값으로 잘랐습니다.`); } }
    const X = ts.map((v) => [1, v]); const sw = w.reduce((a, b) => a + b, 0); const XtWX = zeros(2, 2), XtWy = [0, 0]; X.forEach((row, i) => { for (let a = 0; a < 2; a++) { XtWy[a] += row[a] * w[i] * ys[i]; for (let b = 0; b < 2; b++) XtWX[a][b] += row[a] * w[i] * row[b]; } });
    const bread = inv(XtWX); const beta = matvec(bread, XtWy); const res = ys.map((v, i) => v - beta[0] - beta[1] * ts[i]); const meat = zeros(2, 2); X.forEach((row, i) => { for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) meat[a][b] += row[a] * w[i] * w[i] * res[i] * res[i] * row[b]; });
    const cov = matmul(matmul(bread, meat), bread); effect = beta[1]; se = Math.sqrt(Math.max(cov[1][1], 0)); smdAfter = cs.map((c) => smdW(c, ts, w)); void sw;
    notes.push("처치받을 확률의 역수를 가중치로 주어 두 무리의 공변량 분포를 맞췄습니다.");
  }
  const z = 1.959963984540054;
  r.tables.push({ id: "ate", title: `처치효과 (${estimand})`, columns: ["방법", "추정량", "효과", "SE", "CI 하", "CI 상"], rows: [[label, estimand, effect, se, effect - z * se, effect + z * se]] });
  r.tables.push({ id: "balance", title: "공변량 균형 (표준화 평균차)", columns: ["공변량", "맞추기 전", "맞춘 뒤", "판정"], rows: cn.map((c, i) => [c, smdBefore[i], smdAfter[i], Math.abs(smdAfter[i]) <= 0.1 ? "균형" : "치우침"]) });
  const nT = ts.reduce((a, b) => a + b, 0);
  r.tables.push({ id: "ps_diag", title: "성향점수 진단", columns: ["항", "값"], rows: [["처치받은 사례", pyG(nT)], ["효과 계산에 쓴 사례", pyG(usedN)], ["공통지지 밖이라 뺀 사례", pyG(dropped)], ["성향점수 범위", `${Math.min(...pss).toFixed(3)} ~ ${Math.max(...pss).toFixed(3)}`], ["점수 추정", "로지스틱 회귀(IRLS)"]] });
  r.effects.push({ name: "효과크기", value: effect });
  r.cis.push({ parameter: `효과 (${label})`, estimate: effect, low: effect - z * se, high: effect + z * se });
  r.notes.push(...notes);
  return r;
}

// ───────── M39 준실험
export function M39(inp: Input): MResult {
  const r = mk("M39", "준실험 인과추론 — 이중차분·회귀불연속·도구변수");
  const dz = String(inp.options.design ?? "did").toLowerCase(); const key = ["rd", "rdd", "회귀불연속"].includes(dz) ? "rdd" : ["iv", "2sls", "도구변수"].includes(dz) ? "iv" : "did";
  const yn = inp.options.outcome ?? inp.slots.outcome[0]; const have = new Set(inp.table.headers); const slot = (nm: string): string[] => { const g = inp.slots[nm] ?? inp.options[nm]; const arr = Array.isArray(g) ? g : g ? [g] : []; return arr.map(String).filter((v) => have.has(v)); };
  if (key === "did") {
    const tr = slot("treat"), po = slot("post"), pe = slot("period"); const names = [yn, tr[0], po[0], ...(pe.length ? [pe[0]] : [])];
    const idx = completeIdx(inp.table, names); const cols = names.map((n) => pick(numCol(inp.table, n), idx) as number[]); const y = cols[0]; const treat = cols[1].map((v) => (v > 0 ? 1 : 0)), post = cols[2].map((v) => (v > 0 ? 1 : 0)); const period = pe.length ? cols[3] : null;
    const X = design([treat, post, treat.map((v, i) => v * post[i])]); const f = ols(X, y); const n = y.length; const eff = f.beta[3], se = f.se[3]; const tc = tppf(0.975, n - 4);
    const cell = (tv: number, pv: number) => { const v = y.filter((_, i) => treat[i] === tv && post[i] === pv); return { m: v.length ? mean(v) : NaN, n: v.length }; };
    const c11 = cell(1, 1), c10 = cell(1, 0), c01 = cell(0, 1), c00 = cell(0, 0);
    r.tables.push({ id: "did", title: "이중차분 — 처치효과", columns: ["항", "값"], rows: [["처치효과 (T×Post)", eff], ["표준오차", se], ["p", f.p[3]], ["95% 하한", eff - tc * se], ["95% 상한", eff + tc * se], ["네 칸으로 직접 계산한 값", c11.m - c10.m - (c01.m - c00.m)]] });
    r.tables.push({ id: "did_cells", title: "네 칸의 평균", columns: ["집단", "처치 전 평균", "처치 전 N", "처치 후 평균", "처치 후 N", "변화"], rows: [["처치집단", c10.m, c10.n, c11.m, c11.n, c11.m - c10.m], ["통제집단", c00.m, c00.n, c01.m, c01.n, c01.m - c00.m]] });
    if (period) {
      const start = Math.min(...period.filter((_, i) => post[i] === 1)); const pre = period.map((p) => p < start); const ip = pre.map((b, i) => (b ? i : -1)).filter((i) => i >= 0); const ups = [...new Set(ip.map((i) => period[i]))].sort((a, b) => a - b);
      if (ip.length >= 6 && ups.length >= 2) {
        const Xp = ip.map((i) => [1, treat[i], period[i], treat[i] * period[i]]); const fp = ols(Xp, ip.map((i) => y[i]));
        const means = ups.map((pv) => { const a = ip.filter((i) => period[i] === pv && treat[i] === 1).map((i) => y[i]), b = ip.filter((i) => period[i] === pv && treat[i] === 0).map((i) => y[i]); return [pv, a.length ? mean(a) : NaN, b.length ? mean(b) : NaN]; });
        r.tables.push({ id: "parallel_trends", title: "처치 전 흐름이 나란했는가", columns: ["시점", "처치집단 평균", "통제집단 평균"], rows: means });
        r.notes.push(`처치 전 기울기 차이 ${fp.beta[3] >= 0 ? "+" : ""}${f4(fp.beta[3])}, p=${f4(fp.p[3])}.`);
      }
    }
  } else if (key === "rdd") {
    const rn = slot("running")[0]; const idx = completeIdx(inp.table, [yn, rn]); const y = pick(numCol(inp.table, yn), idx) as number[], x = pick(numCol(inp.table, rn), idx) as number[]; const cutoff = Number(inp.options.cutoff ?? 0); const bwOpt = Number(inp.options.bandwidth) || null;
    const span = Math.max(...x) - Math.min(...x); const fit = (h: number) => {
      const w = x.map((v) => Math.max(0, 1 - Math.abs(v - cutoff) / h)); const keep = w.map((v, i) => (v > 0 ? i : -1)).filter((i) => i >= 0);
      if (keep.filter((i) => x[i] < cutoff).length < 3 || keep.filter((i) => x[i] >= cutoff).length < 3) throw new Error("기준점 양쪽에 사례가 3개 이상 있어야 합니다.");
      const cen = x.map((v) => v - cutoff); const right = x.map((v) => (v >= cutoff ? 1 : 0)); const Xd = keep.map((i) => [1, right[i], cen[i], cen[i] * right[i]]);
      const XtWX = zeros(4, 4), XtWy = new Array(4).fill(0); keep.forEach((i, q) => { for (let a = 0; a < 4; a++) { XtWy[a] += Xd[q][a] * w[i] * y[i]; for (let b = 0; b < 4; b++) XtWX[a][b] += Xd[q][a] * w[i] * Xd[q][b]; } }); const beta = solve(XtWX, XtWy);
      let varTau = 0; for (const side of [keep.filter((i) => x[i] < cutoff), keep.filter((i) => x[i] >= cutoff)]) {
        const Xs = side.map((i) => [1, cen[i]]); const A = zeros(2, 2), b2 = [0, 0]; side.forEach((i, q) => { for (let a = 0; a < 2; a++) { b2[a] += Xs[q][a] * w[i] * y[i]; for (let b = 0; b < 2; b++) A[a][b] += Xs[q][a] * w[i] * Xs[q][b]; } });
        const bread = inv(A); const bs = matvec(bread, b2); const meat = zeros(2, 2); side.forEach((i, q) => { const e = y[i] - bs[0] - bs[1] * cen[i]; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) meat[a][b] += Xs[q][a] * (w[i] * e) ** 2 * Xs[q][b]; });
        varTau += matmul(matmul(bread, meat), bread)[0][0] * (side.length / Math.max(side.length - 2, 1)); }
      return { beta, se: Math.sqrt(Math.max(varTau, 0)), nl: keep.filter((i) => x[i] < cutoff).length, nr: keep.filter((i) => x[i] >= cutoff).length };
    };
    let h0 = bwOpt; if (!h0) { h0 = 1.06 * sd(x) * Math.pow(x.length, -0.2) * 2; h0 = Math.min(Math.max(h0, span / 20), span / 2); }
    const f0 = fit(h0); const tau = f0.beta[1]; const tt = f0.se > 0 ? tau / f0.se : NaN; const zc = normppf(0.975);
    r.tables.push({ id: "rd", title: "회귀불연속 — 기준점에서의 틈", columns: ["항", "값"], rows: [["처치효과 (기준점의 틈)", tau], ["표준오차", f0.se], ["z", tt], ["p", 2 * normsf(Math.abs(tt))], ["95% 하한", tau - zc * f0.se], ["95% 상한", tau + zc * f0.se], ["기준점", cutoff], ["대역폭", h0], ["왼쪽 사례 수", f0.nl], ["오른쪽 사례 수", f0.nr], ["왼쪽 기울기", f0.beta[2]], ["오른쪽 기울기", f0.beta[2] + f0.beta[3]]] });
    const sens: any[][] = []; for (const m of [0.5, 0.75, 1, 1.5, 2]) { try { const g = fit(h0 * m); sens.push([h0 * m, g.beta[1], g.se, g.nl + g.nr]); } catch { /* skip */ } }
    if (sens.length) r.tables.push({ id: "rd_sensitivity", title: "대역폭을 바꾸면", columns: ["대역폭", "추정 효과", "SE", "쓰인 사례 수"], rows: sens });
  } else {
    const en = (slot("endogenous").length ? slot("endogenous") : slot("treat"))[0], zn = slot("instrument")[0]; const ctrl = slot("covariates");
    const idx = completeIdx(inp.table, [yn, en, zn, ...ctrl]); const y = pick(numCol(inp.table, yn), idx) as number[], d = pick(numCol(inp.table, en), idx) as number[], z = pick(numCol(inp.table, zn), idx) as number[]; const covs = ctrl.map((c) => pick(numCol(inp.table, c), idx) as number[]); const n = y.length;
    const f1 = ols(design([z, ...covs]), d); const dhat = f1.fitted; const fr = ols(design(covs.length ? covs : []).length && covs.length ? design(covs) : y.map(() => [1]), d); const fstat = (fr.rss - f1.rss) / (f1.rss / f1.dfResid);
    const X2 = y.map((_, i) => [1, dhat[i], ...covs.map((c) => c[i])]); const b2 = ols(X2, y); const Xt = y.map((_, i) => [1, d[i], ...covs.map((c) => c[i])]); const res2 = y.map((v, i) => v - Xt[i].reduce((s, t, j) => s + t * b2.beta[j], 0)); const df2 = n - X2[0].length; const s2 = res2.reduce((s, v) => s + v * v, 0) / df2;
    const se = Math.sqrt(s2 * b2.XtXinv[1][1]); const beta = b2.beta[1]; const tv = beta / se; const tc = tppf(0.975, df2); const bo = ols(Xt, y); const so = bo.rss / df2; const seo = Math.sqrt(so * bo.XtXinv[1][1]);
    r.tables.push({ id: "iv", title: "도구변수 2단계 최소제곱", columns: ["항", "값"], rows: [["2SLS 처치효과", beta], ["표준오차", se], ["t", tv], ["p", tp2(tv, df2)], ["95% 하한", beta - tc * se], ["95% 상한", beta + tc * se], ["1단계 F", fstat], ["1단계 R²", f1.r2], ["견줌: 보통 최소제곱 추정", bo.beta[1]], ["견줌: 보통 최소제곱 SE", seo], ["사례 수", n]] });
  }
  return r;
}

// ───────── M40 메타분석 / M41 네트워크
export function M40(inp: Input): MResult {
  const r = mk("M40", "메타분석");
  const en = inp.slots.effect[0], sn = inp.slots.se[0], st = inp.slots.study?.[0]; const names = st ? [en, sn, st] : [en, sn]; const idx = completeIdx(inp.table, names);
  const eff = pick(numCol(inp.table, en), idx) as number[], se = pick(numCol(inp.table, sn), idx) as number[]; const labels = st ? (pick(inp.table.cols[st], idx) as any[]).map(String) : eff.map((_, i) => `연구 ${i + 1}`);
  const ok = eff.map((e, i) => isFinite(e) && isFinite(se[i]) && se[i] > 0); const y = eff.filter((_, i) => ok[i]), s = se.filter((_, i) => ok[i]), lb = labels.filter((_, i) => ok[i]); const k = y.length; const v = s.map((a) => a * a), w = v.map((a) => 1 / a); const sw = w.reduce((a, b) => a + b, 0);
  const fixed = w.reduce((a, wi, i) => a + wi * y[i], 0) / sw, fixedSe = Math.sqrt(1 / sw); const q = w.reduce((a, wi, i) => a + wi * (y[i] - fixed) ** 2, 0); const df = k - 1; const qp = df > 0 ? chi2sf(q, df) : NaN;
  let tau2 = 0, i2 = 0; if (df > 0) { const c = sw - w.reduce((a, b) => a + b * b, 0) / sw; tau2 = c > 0 ? Math.max(0, (q - df) / c) : 0; i2 = q > 0 ? Math.max(0, (q - df) / q) * 100 : 0; }
  const ws = v.map((a) => 1 / (a + tau2)); const sws = ws.reduce((a, b) => a + b, 0); const rnd = ws.reduce((a, wi, i) => a + wi * y[i], 0) / sws, rndSe = Math.sqrt(1 / sws); const z = 1.959963984540054;
  let pred: [number, number] | null = null; if (df >= 2) { const tc = tppf(0.975, df - 1); const sp = Math.sqrt(tau2 + rndSe * rndSe); pred = [rnd - tc * sp, rnd + tc * sp]; }
  let eb: number | null = null, ep: number | null = null;
  if (k >= 3) { const xs = s.map((a) => 1 / a), ys = y.map((a, i) => a / s[i]); const f = ols(xs.map((a) => [1, a]), ys); eb = f.beta[0]; const sei = f.se[0]; if (sei > 0) ep = tp2(eb / sei, k - 2); }
  r.tables.push({ id: "meta_pooled", title: "합성효과", columns: ["모형", "추정", "SE", "CI 하", "CI 상"], rows: [["고정효과 (역분산)", fixed, fixedSe, fixed - z * fixedSe, fixed + z * fixedSe], ["임의효과 (DerSimonian-Laird)", rnd, rndSe, rnd - z * rndSe, rnd + z * rndSe]] });
  r.tables.push({ id: "meta_studies", title: "연구별 효과크기", columns: ["연구", "효과크기", "SE", "CI 하", "CI 상", "고정 가중%", "임의 가중%"], rows: lb.map((l, i) => [l, y[i], s[i], y[i] - z * s[i], y[i] + z * s[i], (w[i] / sw) * 100, (ws[i] / sws) * 100]) });
  const het: any[][] = [["연구 수 k", String(k)], ["Q", `${q.toFixed(4)} (df=${df}, p=${qp.toFixed(4)})`], ["I2", `${i2.toFixed(1)}%  — 25·50·75% 를 낮음·중간·높음 눈금으로 씁니다`], ["tau2", Math.abs(tau2) >= 1e-3 || tau2 === 0 ? tau2.toFixed(5) : pyG(tau2, 4)]];
  if (pred) het.push(["예측구간(95%)", `${pred[0].toFixed(4)} ~ ${pred[1].toFixed(4)} — 다음 연구 하나가 떨어질 만한 범위`]);
  if (eb !== null) het.push(["Egger 절편", `${eb.toFixed(4)}${ep !== null ? `, p=${ep.toFixed(4)}` : ""} — 깔때기 좌우가 기울었는지`]);
  r.tables.push({ id: "meta_het", title: "이질성과 편향 점검", columns: ["항", "값"], rows: het });
  r.effects.push({ name: "합성효과(임의)", value: rnd, ciLow: rnd - z * rndSe, ciHigh: rnd + z * rndSe });
  r.cis.push({ parameter: "추정 (고정효과 (역분산))", estimate: fixed, low: fixed - z * fixedSe, high: fixed + z * fixedSe }, { parameter: "추정 (임의효과 (DerSimonian-Laird))", estimate: rnd, low: rnd - z * rndSe, high: rnd + z * rndSe });
  lb.forEach((l, i) => r.cis.push({ parameter: `효과크기 (${l})`, estimate: y[i], low: y[i] - z * s[i], high: y[i] + z * s[i] }));
  return r;
}
export function M41(inp: Input): MResult {
  const r = mk("M41", "네트워크·다변량 메타분석");
  const an = inp.slots.treat_a[0], bn = inp.slots.treat_b[0], en = inp.slots.effect[0], sn = inp.slots.se[0]; const idx = completeIdx(inp.table, [an, bn, en, sn]);
  const A = pick(inp.table.cols[an], idx).map(String), B = pick(inp.table.cols[bn], idx).map(String), E = pick(numCol(inp.table, en), idx) as number[], S = pick(numCol(inp.table, sn), idx) as number[];
  const pairs = new Map<string, { a: string; b: string; items: [number, number][] }>(); A.forEach((a, i) => { if (!isFinite(E[i]) || !isFinite(S[i]) || S[i] <= 0) return; const key = a + "\u0000" + B[i]; if (!pairs.has(key)) pairs.set(key, { a, b: B[i], items: [] }); pairs.get(key)!.items.push([E[i], S[i]]); });
  const merged = [...pairs.values()].map((p) => { const w = p.items.map(([, s]) => 1 / (s * s)); const sw = w.reduce((x, y) => x + y, 0); return { a: p.a, b: p.b, eff: p.items.reduce((s, [e], i) => s + w[i] * e, 0) / sw, se: Math.sqrt(1 / sw), k: p.items.length }; });
  const tr = [...new Set(merged.flatMap((c) => [c.a, c.b]))].sort(); const ref = tr[0]; const ix = new Map(tr.map((t, i) => [t, i])); const others = tr.filter((t) => t !== ref);
  const X = merged.map((c) => { const row = new Array(tr.length).fill(0); row[ix.get(c.b)!] += 1; row[ix.get(c.a)!] -= 1; return row.filter((_, j) => j !== ix.get(ref)!).map((v, j) => v * Math.sqrt(1 / (c.se * c.se))); }); const yv = merged.map((c) => c.eff / c.se);
  const XtX = matmul(T(X), X); const beta = solve(XtX, matvec(T(X), yv)); const cov = inv(XtX); const z = 1.959963984540054;
  const rows: any[][] = tr.map((t) => { if (t === ref) return [t, "기준", 0, 0, 0, 0]; const i = others.indexOf(t); const e = beta[i], s = Math.sqrt(Math.max(cov[i][i], 0)); return [t, "", e, s, e - z * s, e + z * s]; });
  r.tables.push({ id: "nma_effects", title: `${ref} 대비 효과`, columns: ["처치", "비고", "효과", "SE", "CI 하", "CI 상"], rows });
  r.tables.push({ id: "nma_pairs", title: "직접 비교 (쌍마다 합친 값)", columns: ["처치 A", "처치 B", "효과", "SE", "연구 수"], rows: merged.map((c) => [c.a, c.b, c.eff, c.se, c.k]) });
  others.forEach((t, i) => r.effects.push({ name: `효과크기 (${t})`, value: beta[i] }));
  merged.forEach((c) => r.effects.push({ name: `효과크기 (${c.a}−${c.b})`, value: c.eff }));
  others.forEach((t, i) => { const e = beta[i], s = Math.sqrt(Math.max(cov[i][i], 0)); r.cis.push({ parameter: `효과 (${t})`, estimate: e, low: e - z * s, high: e + z * s }); });
  return r;
}

// ───────── M42 베이지안 (켤레)
function betaPpf(p: number, a: number, b: number) { return bisect((x) => betainc(Math.min(Math.max(x, 0), 1), a, b) - p, 0, 1, 1e-15); }
function gammaPpf(p: number, shape: number, rate: number) { let hi = Math.max(1, shape / rate); while (gammainc(shape, hi * rate) < p) hi *= 2; return bisect((x) => gammainc(shape, x * rate) - p, 0, hi, 1e-15 * hi); }
export function M42(inp: Input): MResult {
  const r = mk("M42", "베이지안 추정");
  const vals = (numCol(inp.table, inp.slots.outcome[0]).filter((v) => v !== null)) as number[]; const n = vals.length; const o = inp.options;
  let model = String(o.model ?? "normal").toLowerCase(); if (["이항", "비율", "binary", "bernoulli"].includes(model)) model = "binomial"; else if (["포아송", "계수", "count"].includes(model)) model = "poisson"; else if (["정규", "연속", "gaussian", "continuous"].includes(model)) model = "normal";
  let rows: any[][];
  if (model === "binomial") {
    const k = vals.reduce((a, b) => a + b, 0); const a0 = Number(o.prior_alpha ?? 0.5), b0 = Number(o.prior_beta ?? 0.5); const a1 = a0 + k, b1 = b0 + n - k;
    const lab = Math.abs(a0 - 0.5) < 1e-12 && Math.abs(b0 - 0.5) < 1e-12 ? "제프리스 Beta(0.5, 0.5)" : `Beta(${pyG(a0)}, ${pyG(b0)})`;
    rows = [["모형", "이항 — 0/1 결과의 비율 π"], ["사전분포", `π ~ ${lab}`], ["사후분포", `π ~ Beta(${pyG(a1)}, ${pyG(b1)})`], ["성공 수 k", k], ["시행 수 n", n], ["표본 비율 k/n", k / n], ["π 사후 평균", a1 / (a1 + b1)], ["π 사후 최빈값", a1 > 1 && b1 > 1 ? (a1 - 1) / (a1 + b1 - 2) : NaN], ["π 사후 표준편차", Math.sqrt((a1 * b1) / ((a1 + b1) ** 2 * (a1 + b1 + 1)))], ["π 2.5% 분위", betaPpf(0.025, a1, b1)], ["π 50% 분위", betaPpf(0.5, a1, b1)], ["π 97.5% 분위", betaPpf(0.975, a1, b1)]];
  } else if (model === "poisson") {
    const tot = vals.reduce((a, b) => a + b, 0); const s0 = Number(o.prior_shape ?? 0.5), r0 = Number(o.prior_rate ?? 0); const s1 = s0 + tot, r1 = r0 + n;
    const lab = Math.abs(s0 - 0.5) < 1e-12 && r0 === 0 ? "제프리스 Gamma(0.5, 0)" : `Gamma(${pyG(s0)}, ${pyG(r0)})`;
    rows = [["모형", "포아송 — 0 이상 정수 결과의 발생률 λ"], ["사전분포", `λ ~ ${lab}`], ["사후분포", `λ ~ Gamma(${pyG(s1)}, ${pyG(r1)})`], ["합계 Σy", tot], ["관측 수 n", n], ["표본 평균 Σy/n", tot / n], ["λ 사후 평균", s1 / r1], ["λ 사후 최빈값", s1 > 1 ? (s1 - 1) / r1 : NaN], ["λ 사후 표준편차", Math.sqrt(s1) / r1], ["λ 2.5% 분위", gammaPpf(0.025, s1, r1)], ["λ 50% 분위", gammaPpf(0.5, s1, r1)], ["λ 97.5% 분위", gammaPpf(0.975, s1, r1)]];
  } else {
    const m = mean(vals); const ss = vals.reduce((a, v) => a + (v - m) ** 2, 0); const vr = n > 1 ? ss / (n - 1) : 0; const sdv = Math.sqrt(vr); const prior = String(o.prior ?? "noninformative").toLowerCase();
    if (["normal", "정규", "conjugate_normal"].includes(prior) && n > 0) {
      const pm = Number(o.prior_mean ?? 0), ps = Number(o.prior_sd ?? 1); const lv = vr > 0 ? vr : 1; const prec = 1 / ps ** 2 + n / lv; const post = (pm / ps ** 2 + (n * m) / lv) / prec; const psd = Math.sqrt(1 / prec);
      rows = [["모형", "정규 — 연속 결과의 평균 μ"], ["사전분포", `μ ~ N(${pyG(pm)}, ${pyG(ps)}²) · σ 는 표본값 고정`], ["μ 사후 평균", post], ["μ 사후 표준편차", psd], ["μ 2.5% 분위", post + normppf(0.025) * psd], ["μ 50% 분위", post], ["μ 97.5% 분위", post + normppf(0.975) * psd], ["표본 크기", n]];
    } else {
      const df = n - 1, scale = sdv / Math.sqrt(n); const muSd = df > 2 ? scale * Math.sqrt(df / (df - 2)) : NaN; const q = [0.025, 0.5, 0.975].map((p) => tppf(p, df));
      const a = df / 2, b = ss / 2; const sMean = a > 0.5 && b > 0 ? Math.sqrt(b) * Math.exp(lgamma(a - 0.5) - lgamma(a)) : NaN; const m2 = a > 1 ? b / (a - 1) : NaN; const sSd = isFinite(m2) && isFinite(sMean) ? Math.sqrt(Math.max(0, m2 - sMean ** 2)) : NaN;
      // sigma^2 ~ InvGamma(a, b): quantile via gamma of 1/x
      const sq = [0.025, 0.5, 0.975].map((p) => Math.sqrt(b / gammaPpf(1 - p, a, 1)));
      rows = [["모형", "정규 — 연속 결과의 평균 μ 와 표준편차 σ"], ["사전분포", "무정보(제프리스) p(μ, σ) ∝ 1/σ"], ["μ 사후 평균", m], ["μ 사후 표준편차", muSd], ["μ 2.5% 분위", m + scale * q[0]], ["μ 50% 분위", m + scale * q[1]], ["μ 97.5% 분위", m + scale * q[2]], ["σ 사후 평균", sMean], ["σ 사후 표준편차", sSd], ["σ 2.5% 분위", sq[0]], ["σ 50% 분위", sq[1]], ["σ 97.5% 분위", sq[2]], ["표본 크기", n]];
    }
  }
  r.tables.push({ id: "bayes", title: "사후분포 요약", columns: ["항", "값"], rows });
  return r;
}

// ───────── M43 비선형회귀
interface NLModel { id: string; label: string; formula: string; params: number; npred: number; fn: (b: number[], x: number[][], i: number) => number; guess: (x: number[][], y: number[]) => number[]; logResp?: boolean; posX?: boolean }
const span = (v: number[]) => { const lo = Math.min(...v), hi = Math.max(...v); return hi > lo ? hi - lo : Math.abs(hi) || 1; };
const maxOf = (v: number[]) => Math.max(...v);
export const NL_MODELS: NLModel[] = [
  { id: "exp_rise", label: "지수 포화 — b1·(1−e^(−b2·x))", formula: "y = b1 · (1 − exp(−b2·x))", params: 2, npred: 1, fn: (b, x, i) => b[0] * (1 - Math.exp(-b[1] * x[0][i])), guess: (x, y) => [maxOf(y) * 1.5, 1 / (Math.abs(mean(x[0])) || 1)] },
  { id: "exp_decay_ratio", label: "지수·일차식 비 — e^(−b1·x)/(b2+b3·x)", formula: "y = exp(−b1·x) / (b2 + b3·x)", params: 3, npred: 1, fn: (b, x, i) => Math.exp(-b[0] * x[0][i]) / (b[1] + b[2] * x[0][i]), guess: () => [0.1, 0.01, 0.02] },
  { id: "exp_sum3", label: "지수 셋의 합", formula: "y = b1·exp(−b2·x) + b3·exp(−b4·x) + b5·exp(−b6·x)", params: 6, npred: 1, fn: (b, x, i) => b[0] * Math.exp(-b[1] * x[0][i]) + b[2] * Math.exp(-b[3] * x[0][i]) + b[4] * Math.exp(-b[5] * x[0][i]), guess: () => [1.2, 0.3, 0.6, 5.5, 6.5, 7.6] },
  { id: "exp_sum2_offset", label: "밑값 + 지수 둘", formula: "y = b1 + b2·exp(−b4·x) + b3·exp(−b5·x)", params: 5, npred: 1, fn: (b, x, i) => b[0] + b[1] * Math.exp(-x[0][i] * b[3]) + b[2] * Math.exp(-x[0][i] * b[4]), guess: () => [0.5, 1.5, -1, 0.01, 0.02] },
  { id: "gauss_exp_two_peak", label: "지수 바탕 + 정규 봉우리 둘", formula: "y = b1·exp(−b2·x) + b3·exp(−(x−b4)²/b5²) + b6·exp(−(x−b7)²/b8²)", params: 8, npred: 1, fn: (b, x, i) => b[0] * Math.exp(-b[1] * x[0][i]) + b[2] * Math.exp(-((x[0][i] - b[3]) ** 2) / b[4] ** 2) + b[5] * Math.exp(-((x[0][i] - b[6]) ** 2) / b[7] ** 2), guess: () => [97, 0.009, 100, 65, 20, 70, 178, 16.5] },
  { id: "gauss_peak", label: "정규 봉우리 하나", formula: "y = (b1/b2) · exp(−½·((x−b3)/b2)²)", params: 3, npred: 1, fn: (b, x, i) => (b[0] / b[1]) * Math.exp(-0.5 * ((x[0][i] - b[2]) / b[1]) ** 2), guess: (x, y) => [1, span(x[0]) / 20 || 1, x[0][y.indexOf(maxOf(y))]] },
  { id: "power", label: "거듭제곱 — b1·x^b2", formula: "y = b1 · x^b2", params: 2, npred: 1, posX: true, fn: (b, x, i) => b[0] * Math.pow(x[0][i], b[1]), guess: () => [1, 5] },
  { id: "power_shift", label: "자리옮김 거듭제곱", formula: "y = b1 · (b2 + x)^(−1/b3)", params: 3, npred: 1, fn: (b, x, i) => b[0] * Math.pow(b[1] + x[0][i], -1 / b[2]), guess: () => [-2000, 50, 0.8] },
  { id: "exp_inverse", label: "역수 지수 — b1·e^(b2/(x+b3))", formula: "y = b1 · exp(b2 / (x + b3))", params: 3, npred: 1, fn: (b, x, i) => b[0] * Math.exp(b[1] / (x[0][i] + b[2])), guess: () => [2, 400000, 25000] },
  { id: "saturation_1", label: "포화 1형 — b1·(1−(1+b2·x/2)^−2)", formula: "y = b1 · (1 − (1 + b2·x/2)^(−2))", params: 2, npred: 1, fn: (b, x, i) => b[0] * (1 - Math.pow(1 + (b[1] * x[0][i]) / 2, -2)), guess: (x, y) => [maxOf(y) * 1.5, 0.0005] },
  { id: "saturation_2", label: "포화 2형 — b1·(1−(1+2·b2·x)^−½)", formula: "y = b1 · (1 − (1 + 2·b2·x)^(−1/2))", params: 2, npred: 1, fn: (b, x, i) => b[0] * (1 - Math.pow(1 + 2 * b[1] * x[0][i], -0.5)), guess: (x, y) => [maxOf(y) * 1.5, 0.0002] },
  { id: "michaelis", label: "미하엘리스-멘텐 꼴", formula: "y = b1·b2·x / (1 + b2·x)", params: 2, npred: 1, fn: (b, x, i) => b[0] * b[1] * x[0][i] / (1 + b[1] * x[0][i]), guess: (x, y) => [maxOf(y) * 1.5, 0.0002] },
  { id: "logistic3", label: "로지스틱 성장 — 모수 셋", formula: "y = b1 / (1 + exp(b2 − b3·x))", params: 3, npred: 1, fn: (b, x, i) => b[0] / (1 + Math.exp(b[1] - b[2] * x[0][i])), guess: (x, y) => [maxOf(y) * 1.1, 5, 0.05] },
  { id: "richards", label: "리처즈 성장 — 모수 넷", formula: "y = b1 / (1 + exp(b2 − b3·x))^(1/b4)", params: 4, npred: 1, fn: (b, x, i) => b[0] / Math.pow(1 + Math.exp(b[1] - b[2] * x[0][i]), 1 / b[3]), guess: (x, y) => [maxOf(y) * 1.1, 5, 0.8, 1] },
  { id: "rational_22", label: "유리함수 2/2차", formula: "y = (b1 + b2·x + b3·x²) / (1 + b4·x + b5·x²)", params: 5, npred: 1, fn: (b, x, i) => (b[0] + b[1] * x[0][i] + b[2] * x[0][i] ** 2) / (1 + b[3] * x[0][i] + b[4] * x[0][i] ** 2), guess: () => [2, -0.1, 0.003, -0.001, 0.00001] },
  { id: "rational_33", label: "유리함수 3/3차", formula: "y = (b1 + b2·x + b3·x² + b4·x³) / (1 + b5·x + b6·x² + b7·x³)", params: 7, npred: 1, fn: (b, x, i) => (b[0] + b[1] * x[0][i] + b[2] * x[0][i] ** 2 + b[3] * x[0][i] ** 3) / (1 + b[4] * x[0][i] + b[5] * x[0][i] ** 2 + b[6] * x[0][i] ** 3), guess: () => [10, -1, 0.05, -0.00001, -0.05, 0.001, -0.000001] },
  { id: "rational_shift", label: "이차/이차 자리옮김", formula: "y = b1·(x² + b2·x) / (x² + b3·x + b4)", params: 4, npred: 1, fn: (b, x, i) => b[0] * (x[0][i] ** 2 + x[0][i] * b[1]) / (x[0][i] ** 2 + x[0][i] * b[2] + b[3]), guess: () => [0.25, 0.39, 0.415, 0.39] },
  { id: "arctan_step", label: "아크탄젠트 층계", formula: "y = b1 − b2·x − arctan(b3/(x − b4))/π", params: 4, npred: 1, fn: (b, x, i) => b[0] - b[1] * x[0][i] - Math.atan(b[2] / (x[0][i] - b[3])) / Math.PI, guess: () => [0.2, -0.000005, 1200, -150] },
  { id: "harmonic3", label: "주기 셋 겹친 조화 모형", formula: "y = b1 + b2·cos(2πx/12) + b3·sin(2πx/12) + b5·cos(2πx/b4) + b6·sin(2πx/b4) + b8·cos(2πx/b7) + b9·sin(2πx/b7)", params: 9, npred: 1, fn: (b, x, i) => b[0] + b[1] * Math.cos((2 * Math.PI * x[0][i]) / 12) + b[2] * Math.sin((2 * Math.PI * x[0][i]) / 12) + b[4] * Math.cos((2 * Math.PI * x[0][i]) / b[3]) + b[5] * Math.sin((2 * Math.PI * x[0][i]) / b[3]) + b[7] * Math.cos((2 * Math.PI * x[0][i]) / b[6]) + b[8] * Math.sin((2 * Math.PI * x[0][i]) / b[6]), guess: () => [10, 3, 0.5, 44, -1.5, 0.5, 26, 0.1, 1.5] },
  { id: "log_exp_two_x", label: "로그 반응 · 예측변수 둘", formula: "log(y) = b1 − b2·x₁·exp(−b3·x₂)", params: 3, npred: 2, logResp: true, fn: (b, x, i) => b[0] - b[1] * x[0][i] * Math.exp(-b[2] * x[1][i]), guess: () => [2.5, 0.000000005, -0.05] },
];
function lmFit(res: (b: number[]) => number[], jac: (b: number[]) => Mat, b0: number[], maxIter = 2000) {
  let b = b0.slice(); let r = res(b); let ss = r.reduce((s, v) => s + v * v, 0); let lam = 1e-3; let nfev = 1;
  for (let it = 0; it < maxIter; it++) {
    const J = jac(b); const JtJ = matmul(T(J), J); const g = matvec(T(J), r); let improved = false;
    for (let tries = 0; tries < 40; tries++) {
      const A = JtJ.map((rw, i) => rw.map((v, j) => v + (i === j ? lam * Math.max(v, 1e-12) : 0)));
      let step: number[]; try { step = solve(A, g.map((v) => -v)); } catch { lam *= 10; continue; }
      const nb = b.map((v, i) => v + step[i]); const nr = res(nb); nfev++; const nss = nr.reduce((s, v) => s + v * v, 0);
      if (isFinite(nss) && nss < ss) { const rel = (ss - nss) / ss; b = nb; r = nr; ss = nss; lam = Math.max(lam / 10, 1e-15); improved = true; if (rel < 1e-16 && Math.max(...step.map((s_, i) => Math.abs(s_) / (Math.abs(b[i]) + 1e-30))) < 1e-14) return { b, ss, nfev, ok: true }; break; }
      lam *= 10; if (lam > 1e15) break;
    }
    if (!improved) break;
  }
  return { b, ss, nfev, ok: true };
}
export function M43(inp: Input): MResult {
  const r = mk("M43", "비선형회귀");
  const model = NL_MODELS.find((m) => m.id === (inp.options.model ?? "exp_rise")) ?? NL_MODELS[0]; const yn = inp.slots.outcome[0]; const xn = (inp.slots.predictor ?? inp.slots.predictors).slice(0, model.npred);
  const idx = completeIdx(inp.table, [yn, ...xn]); const y0 = pick(numCol(inp.table, yn), idx) as number[]; const xs = xn.map((n) => pick(numCol(inp.table, n), idx) as number[]); const n = y0.length;
  if (model.posX && Math.min(...xs[0]) <= 0) throw new Error("이 모형은 예측변수가 모두 0보다 커야 합니다."); if (model.logResp && Math.min(...y0) <= 0) throw new Error("이 모형은 결과변수가 모두 0보다 커야 합니다.");
  const target = model.logResp ? y0.map(Math.log) : y0; const given: number[] = (inp.options.start_values ?? []).map(Number); const user = given.length === model.params; const start = user ? given : model.guess(xs, y0);
  const res = (b: number[]) => target.map((t, i) => model.fn(b, xs, i) - t);
  const jac = (b: number[]): Mat => { const J = zeros(n, model.params); for (let j = 0; j < model.params; j++) { const col = (h: number) => { const bp = b.slice(), bm = b.slice(); bp[j] += h; bm[j] -= h; const rp = res(bp), rm = res(bm); return rp.map((v, i) => (v - rm[i]) / (2 * h)); }; const h1 = 1e-5 * Math.max(Math.abs(b[j]), 1e-3), h2 = h1 / 2; const c1 = col(h1), c2 = col(h2); for (let i = 0; i < n; i++) J[i][j] = (4 * c2[i] - c1[i]) / 3; } return J; };
  const seeds: number[][] = [start]; if (!user) { const rng = mulberry32(20260824); const nx = model.params >= 4 ? 24 : 8; for (let k = 0; k < nx; k++) seeds.push(start.map((v) => (v === 0 ? rng() * 2 - 1 : v * Math.pow(10, rng() * 2 - 1)))); }
  let best = { b: start, ss: Infinity, nfev: 0, ok: false }; let calls = 0;
  const polished = seeds.map((s0) => { try { const f = lmFit(res, jac, s0, 2000); calls += f.nfev; return f; } catch { return { b: s0, ss: Infinity, nfev: 0, ok: false }; } }).filter((f) => isFinite(f.ss)).sort((a, b) => a.ss - b.ss);
  for (const f of polished.slice(0, 3)) { let cur = f; for (let rr = 0; rr < 4; rr++) { const g = lmFit(res, jac, cur.b, 2000); calls += g.nfev; if (g.ss <= cur.ss) cur = g; } if (cur.ss < best.ss) best = cur; }
  if (!isFinite(best.ss)) throw new Error("적합이 수렴하지 않았습니다. 모형이나 시작값을 바꿔 다시 해 보세요.");
  const p = best.b, dfRes = n - model.params, ssr = best.ss, sigma2 = ssr / dfRes; const J = jac(p);
  // 표준오차 = √(σ² · diag((JᵀJ)⁻¹)) — 열을 단위 길이로 맞춘 직교화(MGS)로 구한다. 열이 서로 겹쳐(자료가 정하지 못하는 모수) 풀리지 않으면 그 모수는 비운다.
  const seOfCols = (cols: number[]): number[] | null => {
    const m = cols.length; const nrm = cols.map((c) => Math.sqrt(J.reduce((s2, rw) => s2 + rw[c] * rw[c], 0)) || 1);
    const Qc = cols.map((c, a) => J.map((rw) => rw[c] / nrm[a])); const R = zeros(m, m);
    for (let a = 0; a < m; a++) { for (let b = 0; b < a; b++) { const d = Qc[a].reduce((s2, v, i) => s2 + v * Qc[b][i], 0); R[b][a] = d; for (let i = 0; i < n; i++) Qc[a][i] -= d * Qc[b][i]; } const l = Math.sqrt(Qc[a].reduce((s2, v) => s2 + v * v, 0)); if (!(l > 1e-9)) return null; R[a][a] = l; for (let i = 0; i < n; i++) Qc[a][i] /= l; }
    const Ri = zeros(m, m); for (let c = 0; c < m; c++) { Ri[c][c] = 1 / R[c][c]; for (let rI = c - 1; rI >= 0; rI--) { let sum = 0; for (let q = rI + 1; q <= c; q++) sum += R[rI][q] * Ri[q][c]; Ri[rI][c] = -sum / R[rI][rI]; } }
    return cols.map((_, a) => { let v = 0; for (let q = a; q < m; q++) v += Ri[a][q] * Ri[a][q]; return Math.sqrt(sigma2 * v) / nrm[a]; });
  };
  const allCols = p.map((_, i) => i); let se: number[] = p.map(() => NaN); const full = seOfCols(allCols);
  if (full) { se = full; const bad = se.map((v, i) => !isFinite(v) || v > 1e8 * Math.max(Math.abs(p[i]), 1)); if (bad.some(Boolean) && !bad.every(Boolean)) { const good = allCols.filter((i) => !bad[i]); const sub = seOfCols(good); se = p.map(() => NaN); if (sub) good.forEach((c, a) => (se[c] = sub[a])); } }
  else {
    // 직교화 중 겹쳐서 길이가 0 에 가까워지는 열(자료가 정하지 못하는 모수)을 가려내고 나머지만으로 다시 구한다.
    const good: number[] = []; for (const c of allCols) { if (seOfCols([...good, c])) good.push(c); }
    const sub = good.length ? seOfCols(good) : null; if (sub) good.forEach((c, a) => (se[c] = sub[a]));
  }
  const tbar = mean(target); const sst = target.reduce((s, v) => s + (v - tbar) ** 2, 0); const r2 = 1 - ssr / sst; const tc = tppf(0.975, dfRes);
  r.tables.push({ id: "coefficients", title: "계수", columns: ["모수", "추정값", "SE", "t", "p", "CI 하", "CI 상", "시작값"], rows: p.map((b, i) => [`b${i + 1}`, b, se[i], b / se[i], tp2(b / se[i], dfRes), b - tc * se[i], b + tc * se[i], start[i]].map((v, j) => (typeof v === 'number' && Number.isNaN(v) ? null : v))) });
  r.tables.push({ id: "model_summary", title: "모형 요약", columns: ["항", "값"], rows: [["모형", model.label], ["모형식", model.formula], ["관측 수", pyG(n)], ["모수 수", String(model.params)], ["잔차 자유도", pyG(dfRes)], ["잔차제곱합", pyG(ssr, 10)], ["잔차 표준편차", pyG(Math.sqrt(sigma2), 10)], ["R²(설명 비율)", r2.toFixed(6)], ["함수 계산 횟수", String(calls)], ["잔차제곱합 고정밀 재계산", "아니오"]] });
  r.effects.push({ name: "R²", value: r2 });
  p.forEach((b, i) => r.cis.push({ parameter: `추정값 (b${i + 1})`, estimate: b, low: b - tc * se[i], high: b + tc * se[i] }));
  return r;
}
