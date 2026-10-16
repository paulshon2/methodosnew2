/** M27 문항반응이론 — 1·2·3모수 로지스틱을 주변최대우도(EM)로 추정하고 벌점 우도를 뉴턴으로 조인다(엔진 latent/irt.py 와 같은 정의). */
import { mean, sd, pearson, completeIdx, solve, inv, zeros, bfgs, brentMin, Mat } from "./core";
import { Input, MResult, mk } from "./types";

const A_MAX = 10;
const irtProb = (theta: number, a: number, b: number, c = 0) => { const z = Math.min(30, Math.max(-30, a * (theta - b))); return c + (1 - c) / (1 + Math.exp(-z)); };

export function M27(inp: Input): MResult {
  const r = mk("M27", "문항반응이론");
  const items = inp.slots.items; const idx = completeIdx(inp.table, items); const X = idx.map((i) => items.map((it) => Number(inp.table.cols[it][i])));
  const med = items.map((_, j) => { const c = X.map((rw) => rw[j]).sort((a, b) => a - b); const m = c.length >> 1; return c.length % 2 ? c[m] : (c[m - 1] + c[m]) / 2; });
  const alreadyBinary = X.every((rw) => rw.every((v) => v === 0 || v === 1));
  if (!alreadyBinary) for (const rw of X) for (let j = 0; j < rw.length; j++) rw[j] = rw[j] >= med[j] ? 1 : 0;
  const n = X.length, k = items.length;
  const key = ({ "1pl": "1pl", rasch: "1pl", "3pl": "3pl" } as Record<string, string>)[String(inp.options.irt_model ?? "2PL").toLowerCase()] ?? "2pl";
  const pVals = items.map((_, j) => mean(X.map((rw) => rw[j]))); const total = X.map((rw) => rw.reduce((a, b) => a + b, 0));
  const cr = items.map((_, j) => { const rest = total.map((t, i) => t - X[i][j]); return sd(rest) > 0 ? pearson(X.map((rw) => rw[j]), rest) : 0; });
  // 같은 응답 패턴은 한 번만 센다(문항 수가 적으면 패턴이 사람 수보다 훨씬 적다)
  const patMap = new Map<string, number>(); X.forEach((rw, i) => { const key2 = rw.join(""); patMap.set(key2, (patMap.get(key2) ?? 0) + 1); void i; });
  const pats: number[][] = [], wgt: number[] = []; patMap.forEach((c, k2) => { pats.push(k2.split("").map(Number)); wgt.push(c); });
  const P = pats.length;
  const Q = 41; const nodes = Array.from({ length: Q }, (_, i) => -4 + (8 * i) / (Q - 1)); let w = nodes.map((t) => Math.exp(-0.5 * t * t)); const ws = w.reduce((a, b) => a + b, 0); w = w.map((v) => v / ws);
  const logit = (p: number) => { p = Math.min(Math.max(p, 0.01), 0.99); return Math.log(p / (1 - p)); };
  let a = key === "1pl" ? Array(k).fill(1) : cr.map((rr) => Math.min(2.5, Math.max(0.3, 1 + 2 * rr))); let b = pVals.map((p) => Math.min(3, Math.max(-3, -logit(p)))); let c: number[] = key === "3pl" ? Array(k).fill(0.15) : Array(k).fill(0);

  const posterior = (a: number[], b: number[], c: number[]) => {
    const logp: number[][] = [], log1p: number[][] = [];
    for (let q = 0; q < Q; q++) { const lp: number[] = [], l1: number[] = []; for (let j = 0; j < k; j++) { const p = Math.min(1 - 1e-9, Math.max(1e-9, irtProb(nodes[q], a[j], b[j], c[j]))); lp.push(Math.log(p)); l1.push(Math.log1p(-p)); } logp.push(lp); log1p.push(l1); }
    const post: number[][] = []; let ll = 0; const li = new Array(Q);
    for (let m = 0; m < P; m++) {
      let mx = -Infinity; for (let q = 0; q < Q; q++) { let s = 0; for (let j = 0; j < k; j++) s += pats[m][j] ? logp[q][j] : log1p[q][j]; li[q] = s; if (s > mx) mx = s; }
      let dn = 0; const lk = new Array(Q); for (let q = 0; q < Q; q++) { lk[q] = Math.exp(li[q] - mx) * w[q]; dn += lk[q]; }
      post.push(lk.map((v: number) => v / dn)); ll += wgt[m] * (Math.log(dn) + mx);
    }
    return { post, ll };
  };
  let converged = false, it = 0;
  for (it = 1; it <= 200; it++) {
    const { post } = posterior(a, b, c); const nq = new Array(Q).fill(0); const rjq = items.map(() => new Array(Q).fill(0));
    for (let m = 0; m < P; m++) for (let q = 0; q < Q; q++) { const pw = post[m][q] * wgt[m]; nq[q] += pw; for (let j = 0; j < k; j++) if (pats[m][j]) rjq[j][q] += pw; }
    const an = a.slice(), bn = b.slice(), cn = c.slice();
    const itemNeg = (j: number) => (par: number[]) => {
      if (par[0] < 0.05 || par[0] > A_MAX || Math.abs(par[1]) > 5 || (key === "3pl" && (par[2] < 0 || par[2] > 0.5))) return 1e12;
      const cc = key === "3pl" ? par[2] : 0; let v = 0; for (let q = 0; q < Q; q++) { const pj = Math.min(1 - 1e-9, Math.max(1e-9, irtProb(nodes[q], par[0], par[1], cc))); v -= rjq[j][q] * Math.log(pj) + (nq[q] - rjq[j][q]) * Math.log1p(-pj); }
      if (key === "3pl") v -= 4 * Math.log(Math.max(cc, 1e-6)) + 16 * Math.log(Math.max(1 - cc, 1e-6)); return v;
    };
    if (key === "1pl") {
      const f = (th: number[]) => { if (th[0] < 0.05 || th[0] > A_MAX || th.slice(1).some((v) => Math.abs(v) > 5)) return 1e12; let v = 0; for (let j = 0; j < k; j++) for (let q = 0; q < Q; q++) { const pj = Math.min(1 - 1e-9, Math.max(1e-9, irtProb(nodes[q], th[0], th[1 + j], 0))); v -= rjq[j][q] * Math.log(pj) + (nq[q] - rjq[j][q]) * Math.log1p(-pj); } return v; };
      const res = bfgs(f, [a[0], ...b], { maxIter: 500, gtol: 1e-9 }); for (let j = 0; j < k; j++) { an[j] = Math.max(res.x[0], 0.05); bn[j] = res.x[1 + j]; }
    } else for (let j = 0; j < k; j++) {
      const f = itemNeg(j); const st = key === "3pl" ? [a[j], b[j], c[j]] : [a[j], b[j]]; const res = bfgs(f, st, { maxIter: 500, gtol: 1e-10 });
      an[j] = Math.max(res.x[0], 0.05); bn[j] = res.x[1]; if (key === "3pl") cn[j] = Math.min(Math.max(res.x[2], 0), 0.5);
    }
    const shift = Math.max(...an.map((v, j) => Math.abs(v - a[j])), ...bn.map((v, j) => Math.abs(v - b[j])), ...cn.map((v, j) => Math.abs(v - c[j])));
    a = an; b = bn; c = cn; if (shift < 1e-5) { converged = true; break; }
  }
  const pack = (a: number[], b: number[], c: number[]) => key === "1pl" ? [a[0], ...b] : key === "3pl" ? a.flatMap((v, j) => [v, b[j], c[j]]) : a.flatMap((v, j) => [v, b[j]]);
  const unpack = (v: number[]) => key === "1pl" ? { a: Array(k).fill(v[0]), b: v.slice(1), c: Array(k).fill(0) } : key === "3pl" ? { a: items.map((_, j) => v[3 * j]), b: items.map((_, j) => v[3 * j + 1]), c: items.map((_, j) => v[3 * j + 2]) } : { a: items.map((_, j) => v[2 * j]), b: items.map((_, j) => v[2 * j + 1]), c: Array(k).fill(0) };
  const outOfBounds = (a: number[], b: number[], c: number[]) => a.some((x) => x < 0.05 || x > A_MAX) || b.some((x) => Math.abs(x) > 5) || (key === "3pl" && c.some((x) => x < 0 || x > 0.5));
  /** 벌점 주변 −로그우도와 해석적 기울기 */
  const objg = (v: number[]) => {
    const { a, b, c } = unpack(v);
    const s: number[][] = [], pj: number[][] = [];
    for (let q = 0; q < Q; q++) { const sq: number[] = [], pq: number[] = []; for (let j = 0; j < k; j++) { const z = Math.min(30, Math.max(-30, a[j] * (nodes[q] - b[j]))); const sg = 1 / (1 + Math.exp(-z)); sq.push(sg); pq.push(Math.min(1 - 1e-9, Math.max(1e-9, c[j] + (1 - c[j]) * sg))); } s.push(sq); pj.push(pq); }
    const nq = new Array(Q).fill(0); const rjq = items.map(() => new Array(Q).fill(0)); let ll = 0; const li = new Array(Q);
    for (let m = 0; m < P; m++) {
      let mx = -Infinity; for (let q = 0; q < Q; q++) { let sm = 0; for (let j = 0; j < k; j++) sm += pats[m][j] ? Math.log(pj[q][j]) : Math.log1p(-pj[q][j]); li[q] = sm; if (sm > mx) mx = sm; }
      let dn = 0; const lk = new Array(Q); for (let q = 0; q < Q; q++) { lk[q] = Math.exp(li[q] - mx) * w[q]; dn += lk[q]; }
      ll += wgt[m] * (Math.log(dn) + mx); for (let q = 0; q < Q; q++) { const pw = (lk[q] / dn) * wgt[m]; nq[q] += pw; for (let j = 0; j < k; j++) if (pats[m][j]) rjq[j][q] += pw; }
    }
    const ga = new Array(k).fill(0), gb = new Array(k).fill(0), gc = new Array(k).fill(0);
    for (let j = 0; j < k; j++) for (let q = 0; q < Q; q++) { const w_ = (rjq[j][q] - nq[q] * pj[q][j]) / (pj[q][j] * (1 - pj[q][j])); const sdv = (1 - c[j]) * s[q][j] * (1 - s[q][j]); ga[j] += w_ * sdv * (nodes[q] - b[j]); gb[j] += w_ * (-sdv * a[j]); gc[j] += w_ * (1 - s[q][j]); }
    let prior = 0; if (key === "3pl") for (let j = 0; j < k; j++) { const cc = Math.min(Math.max(c[j], 1e-6), 1 - 1e-6); prior += 4 * Math.log(cc) + 16 * Math.log1p(-cc); gc[j] += 4 / cc - 16 / (1 - cc); }
    const grad = key === "1pl" ? [ga.reduce((x, y) => x + y, 0), ...gb] : key === "3pl" ? items.flatMap((_, j) => [ga[j], gb[j], gc[j]]) : items.flatMap((_, j) => [ga[j], gb[j]]);
    return { f: -(ll + prior), g: grad.map((x) => -x) };
  };
  const hessian = (v: number[]) => { const m = v.length; const H = zeros(m, m); for (let i = 0; i < m; i++) { const h = 1e-5 * (1 + Math.abs(v[i])); const vp = v.slice(), vm = v.slice(); vp[i] += h; vm[i] -= h; const gp = objg(vp).g, gm = objg(vm).g; for (let j = 0; j < m; j++) H[j][i] = (gp[j] - gm[j]) / (2 * h); } return H.map((rw, i) => rw.map((x, j) => 0.5 * (x + H[j][i]))) as Mat; };
  // 투영 뉴턴 마무리 — EM 은 끝자락에서 느리게 기어가므로 해석적 기울기와 헤시안으로 직접 조인다.
  // 모수는 상자 제약(a∈[0.05,10], b∈[−5,5], c∈[0,0.5])이 있다. 경계에 붙어 기울기가 바깥을 가리키는 모수는 고정하고 나머지만 푼다.
  const lo: number[] = [], hi: number[] = [];
  if (key === "1pl") { lo.push(0.05); hi.push(A_MAX); for (let j = 0; j < k; j++) { lo.push(-5); hi.push(5); } }
  else for (let j = 0; j < k; j++) { lo.push(0.05, -5); hi.push(A_MAX, 5); if (key === "3pl") { lo.push(0); hi.push(0.5); } }
  const clip = (v: number[]) => v.map((x, i) => Math.min(hi[i], Math.max(lo[i], x)));
  let vcur = clip(pack(a, b, c)); let cur = objg(vcur);
  for (let iter = 0; iter < 60; iter++) {
    const free = vcur.map((x, i) => !((x <= lo[i] + 1e-12 && cur.g[i] > 0) || (x >= hi[i] - 1e-12 && cur.g[i] < 0)));
    const fi = free.map((f, i) => (f ? i : -1)).filter((i) => i >= 0);
    if (!fi.length || Math.max(...fi.map((i) => Math.abs(cur.g[i]))) < 1e-9) break;
    const gF = fi.map((i) => cur.g[i]); let stepF: number[];
    try { const Hf = hessian(vcur); stepF = solve(fi.map((i) => fi.map((j) => Hf[i][j])), gF); } catch { stepF = gF; }
    if (!stepF.every((x) => isFinite(x))) stepF = gF;
    let t = 1, nv = vcur, nf = cur, ok = false;
    for (let ls = 0; ls < 50; ls++) { const cand = vcur.slice(); fi.forEach((i, q) => (cand[i] = vcur[i] - t * stepF[q])); nv = clip(cand); nf = objg(nv); if (isFinite(nf.f) && nf.f < cur.f - 1e-13 * Math.abs(cur.f)) { ok = true; break; } t /= 2; }
    if (!ok) { // 곡률이 맞지 않으면 기울기 방향으로 한 걸음
      t = 1; for (let ls = 0; ls < 50; ls++) { const cand = vcur.slice(); fi.forEach((i, q) => (cand[i] = vcur[i] - t * gF[q])); nv = clip(cand); nf = objg(nv); if (isFinite(nf.f) && nf.f < cur.f) { ok = true; break; } t /= 2; }
      if (!ok) break;
    }
    const df = cur.f - nf.f; vcur = nv; cur = nf; if (df < 1e-15 * (Math.abs(cur.f) + 1)) break;
  }
  { const u = unpack(vcur); if (!outOfBounds(u.a, u.b, u.c)) { a = u.a; b = u.b; c = u.c; } }
  const { ll } = posterior(a, b, c);
  const vf = pack(a, b, c); const Hs = hessian(vf); let seAll: number[]; try { const C = inv(Hs); seAll = C.map((rw, i) => (rw[i] > 0 ? Math.sqrt(rw[i]) : NaN)); } catch { seAll = Array(vf.length).fill(NaN); }
  const seA = key === "1pl" ? Array(k).fill(seAll[0]) : key === "3pl" ? items.map((_, j) => seAll[3 * j]) : items.map((_, j) => seAll[2 * j]);
  const seB = key === "1pl" ? seAll.slice(1) : key === "3pl" ? items.map((_, j) => seAll[3 * j + 1]) : items.map((_, j) => seAll[2 * j + 1]);
  const info = (t: number) => items.reduce((s, _, j) => { const p = irtProb(t, a[j], b[j], c[j]); return s + (c[j] > 0 ? (a[j] ** 2 * (p - c[j]) ** 2 * (1 - p)) / ((1 - c[j]) ** 2 * Math.max(p, 1e-9)) : a[j] ** 2 * p * (1 - p)); }, 0);
  const grid = Array.from({ length: 161 }, (_, i) => -4 + i * 0.05); const gv = grid.map(info); const ig = gv.indexOf(Math.max(...gv));
  const refn = brentMin((t) => -info(t), grid[Math.max(ig - 1, 0)], grid[Math.min(ig + 1, grid.length - 1)], 1e-10); const maxInfo = Math.max(gv[ig], -refn.fx);
  const nPar = k * (key === "1pl" ? 1 : key === "2pl" ? 2 : 3) + (key === "1pl" ? 1 : 0);
  r.tables.push({ id: "irt_params", title: "문항모수", columns: ["문항", "곤란도 b", "SE(b)", "변별도 a", "SE(a)", "추측 c", "고전 정답률 p", "고전 변별 r"], rows: items.map((it2, j) => [it2, b[j], seB[j], a[j], seA[j], c[j], pVals[j], cr[j]]) });
  r.tables.push({ id: "irt_fit", title: "적합", columns: ["항", "값"], rows: [["로그우도", ll], ["AIC", -2 * ll + 2 * nPar], ["BIC", -2 * ll + nPar * Math.log(n)], ["EM 되풀이 횟수", it > 200 ? 200 : it], ["최대 검사정보", maxInfo], ["문항 수", k], ["사례 수", n]] });
  if (!alreadyBinary) r.notes.push("리커트 문항을 문항마다의 중앙값으로 갈라 0/1 로 바꿔 분석했습니다. 이 과정에서 눈금 안의 정보가 줄어듭니다.");
  if (!converged) r.notes.push("EM 이 완전히 수렴하지 않았습니다.");
  return r;
}
