import {
  mean, sd, variance, median, quantile, sorted, tcdf, tppf, tp2, nctcdf, normppf, normsf, chi2sf, fsf, qtukey, ptukey,
  numCol, completeIdx, pick, levels, pearson, rank, betainc, fppf, binomCdf, lgamma, Table,
} from "./core";
import { Input, MResult, mk, Tbl } from "./types";

export const skewG1 = (x: number[]) => {
  const n = x.length, m = mean(x); let m2 = 0, m3 = 0;
  for (const v of x) { const d = v - m; m2 += d * d; m3 += d * d * d; }
  m2 /= n; m3 /= n; const g1 = m3 / Math.pow(m2, 1.5);
  return (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
};
export const kurtG2 = (x: number[]) => {
  const n = x.length, m = mean(x); let m2 = 0, m4 = 0;
  for (const v of x) { const d = v - m; m2 += d * d; m4 += d ** 4; }
  m2 /= n; m4 /= n; const g2 = m4 / (m2 * m2) - 3;
  return ((n - 1) / ((n - 2) * (n - 3))) * ((n + 1) * g2 + 6);
};

/** CI for noncentral t parameter by inversion (matches engine's _invert_nct) */
function invertNct(tObs: number, df: number, level: number): [number, number] {
  const alpha = (1 - level) / 2;
  const solve = (fn: (l: number) => number, target: number) => {
    let lo = tObs - 10 * Math.sqrt(df + 1) - 10, hi = tObs + 10 * Math.sqrt(df + 1) + 10;
    for (let i = 0; i < 200; i++) { const mid = 0.5 * (lo + hi); if (fn(mid) < target) lo = mid; else hi = mid; }
    return 0.5 * (lo + hi);
  };
  const lamLow = solve((l) => 1 - nctcdf(tObs, df, l), alpha);
  const lamHigh = solve((l) => 1 - nctcdf(tObs, df, l), 1 - alpha);
  return [lamLow, lamHigh];
}
export function dCiOneSample(d: number, n: number, level = 0.95): [number, number] {
  const df = n - 1, sc = Math.sqrt(n);
  const [a, b] = invertNct(d * sc, df, level);
  return [a / sc, b / sc];
}
export function dCiTwoSample(d: number, n1: number, n2: number, level = 0.95): [number, number] {
  const df = n1 + n2 - 2, sc = Math.sqrt((n1 * n2) / (n1 + n2));
  const [a, b] = invertNct(d * sc, df, level);
  return [a / sc, b / sc];
}

// ───────── M01 기술통계
export function M01(inp: Input): MResult {
  const r = mk("M01", "기술통계");
  const cols = ["변수", "N", "결측", "평균", "중위수", "최빈값", "표준편차", "표준오차", "분산", "최솟값", "최댓값", "범위", "Q1", "Q3", "IQR", "왜도", "왜도 SE", "첨도", "첨도 SE", "평균 CI 하", "평균 CI 상", "절사평균", "극단값 수"];
  const rows: any[][] = [];
  for (const v of inp.slots.outcome) {
    const all = numCol(inp.table, v);
    const x = all.filter((a): a is number => a !== null);
    const n = x.length, m = mean(x), s = sd(x), se = s / Math.sqrt(n), tc = tppf(0.975, n - 1);
    const sx = sorted(x);
    // mode: smallest value among most frequent
    const cnt = new Map<number, number>(); for (const a of x) cnt.set(a, (cnt.get(a) ?? 0) + 1);
    let mode = NaN, best = 0; for (const k of [...cnt.keys()].sort((a, b) => a - b)) if (cnt.get(k)! > best) { best = cnt.get(k)!; mode = k; }
    const cut = Math.floor(0.05 * n);
    const trimmed = mean(sx.slice(cut, n - cut));
    const skSE = Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3)));
    const kuSE = 2 * skSE * Math.sqrt((n * n - 1) / ((n - 3) * (n + 5)));
    const q1 = quantile(sx, 0.25, true), q3 = quantile(sx, 0.75, true);
    const ext = x.filter((a) => s > 0 && Math.abs((a - m) / s) > 3).length;
    rows.push([v, n, all.length - n, m, median(x), mode, s, se, variance(x), sx[0], sx[n - 1], sx[n - 1] - sx[0], q1, q3, q3 - q1,
      n > 2 ? skewG1(x) : 0, skSE, n > 3 ? kurtG2(x) : 0, kuSE, m - tc * se, m + tc * se, trimmed, ext]);
  }
  r.tables.push({ id: "descriptive_main", title: "기술통계", columns: cols, rows });
  return r;
}

// ───────── M02 빈도분석
export function M02(inp: Input): MResult {
  const r = mk("M02", "빈도분석");
  for (const v of inp.slots.outcome) {
    const raw = inp.table.cols[v];
    const valid = raw.filter((a) => a !== null) as (string | number)[];
    const lv = levels(valid);
    const nTot = raw.length, nV = valid.length;
    let cum = 0; const rows: any[][] = [];
    for (const l of lv) {
      const f = valid.filter((a) => a === l).length; cum += f;
      rows.push([String(l), f, (100 * f) / nTot, (100 * f) / nV, (100 * cum) / nV]);
    }
    r.tables.push({ id: "freq_" + v, title: v + " 빈도", columns: ["범주", "빈도", "백분율", "유효 백분율", "누적 백분율"], rows });
  }
  return r;
}

// ───────── M03 교차분석
export function M03(inp: Input): MResult {
  const r = mk("M03", "교차분석과 카이제곱 검정");
  const rv = inp.slots.row[0], cv = inp.slots.col[0];
  const idx = completeIdx(inp.table, [rv, cv]);
  const R = pick(inp.table.cols[rv], idx) as (string | number)[], C = pick(inp.table.cols[cv], idx) as (string | number)[];
  const rl = levels(R), cl = levels(C), n = idx.length;
  const O: number[][] = rl.map((a) => cl.map((b) => R.reduce<number>((s, _, i) => s + (R[i] === a && C[i] === b ? 1 : 0), 0)));
  const rs = O.map((row) => row.reduce((a, b) => a + b, 0)), cs = cl.map((_, j) => O.reduce((a, row) => a + row[j], 0));
  const E = O.map((row, i) => row.map((_, j) => (rs[i] * cs[j]) / n));
  let chi = 0, chiY = 0;
  const yates = rl.length === 2 && cl.length === 2;
  for (let i = 0; i < rl.length; i++) for (let j = 0; j < cl.length; j++) {
    chi += (O[i][j] - E[i][j]) ** 2 / E[i][j];
    chiY += (Math.max(0, Math.abs(O[i][j] - E[i][j]) - 0.5)) ** 2 / E[i][j];
  }
  const dof = (rl.length - 1) * (cl.length - 1);
  const shown = yates ? chiY : chi;
  const rows: any[][] = [];
  for (let i = 0; i < rl.length; i++) for (let j = 0; j < cl.length; j++) {
    const sr = (O[i][j] - E[i][j]) / Math.sqrt(E[i][j]);
    const adj = (O[i][j] - E[i][j]) / Math.sqrt(E[i][j] * (1 - rs[i] / n) * (1 - cs[j] / n));
    rows.push([String(rl[i]), String(cl[j]), O[i][j], E[i][j], (100 * O[i][j]) / rs[i], sr, adj]);
  }
  r.tables.push({ id: "crosstab_obs", title: "교차표", columns: ["행", "열", "관측", "기대", "행%", "표준화 잔차", "수정 잔차"], rows });
  r.tables.push({ id: "chi_main", title: "카이제곱 검정", columns: ["카이제곱", "자유도", "유의확률", "기여도 합"], rows: [[shown, dof, chi2sf(shown, dof), chi]] });
  const phi = Math.sqrt(chi / n), V = Math.sqrt(chi / (n * Math.min(rl.length - 1, cl.length - 1)));
  if (yates) {
    const [a, b, c, d] = [O[0][0], O[0][1], O[1][0], O[1][1]];
    // event = first column level
    const p1 = a / rs[0], p2 = c / rs[1];
    r.tables.push({ id: "risk_table", title: "위험", columns: ["행", `'${cl[0]}' 빈도`, "행 합계", "위험(%)"], rows: [[String(rl[0]), a, rs[0], 100 * p1], [String(rl[1]), c, rs[1], 100 * p2]] });
    const or = (a * d) / (b * c), se = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
    const rd = p1 - p2, rdse = Math.sqrt((p1 * (1 - p1)) / rs[0] + (p2 * (1 - p2)) / rs[1]);
    const rr = p1 / p2, rrse = Math.sqrt(1 / a - 1 / rs[0] + 1 / c - 1 / rs[1]);
    r.effects.push({ name: "파이 (φ)", value: phi }, { name: "크레이머 V", value: V },
      { name: "오즈비", value: or, ciLow: Math.exp(Math.log(or) - 1.959963984540054 * se), ciHigh: Math.exp(Math.log(or) + 1.959963984540054 * se) },
      { name: "위험차", value: rd, ciLow: rd - 1.959963984540054 * rdse, ciHigh: rd + 1.959963984540054 * rdse },
      { name: "위험비", value: rr, ciLow: Math.exp(Math.log(rr) - 1.959963984540054 * rrse), ciHigh: Math.exp(Math.log(rr) + 1.959963984540054 * rrse) },
      { name: "치료필요수(NNT)", value: 1 / Math.abs(rd) });
  } else r.effects.push({ name: "크레이머 V", value: V });
  return r;
}

// ───────── M04–M06 t-tests
export function M04(inp: Input): MResult {
  const r = mk("M04", "일표본 t검정");
  const x = numCol(inp.table, inp.slots.outcome[0]).filter((a): a is number => a !== null);
  const mu0 = Number(inp.options.mu0 ?? 0), n = x.length, m = mean(x), s = sd(x), se = s / Math.sqrt(n);
  const t = (m - mu0) / se, df = n - 1, tc = tppf(0.975, df);
  r.tables.push({ id: "t_one_sample", title: "일표본 t검정", columns: ["N", "평균", "SD", "SE", "기준값", "차이", "t", "df", "p(양측)", "CI 하", "CI 상"], rows: [[n, m, s, se, mu0, m - mu0, t, df, tp2(t, df), m - mu0 - tc * se, m - mu0 + tc * se]] });
  const d = (m - mu0) / s; const [lo, hi] = dCiOneSample(d, n);
  r.effects.push({ name: "코헨 d", value: d, ciLow: lo, ciHigh: hi });
  r.cis.push({ parameter: "차이 (일표본 t검정)", estimate: m - mu0, low: m - mu0 - tc * se, high: m - mu0 + tc * se });
  return r;
}
export function groupSplit(t: Table, y: string, g: string) {
  const idx = completeIdx(t, [y, g]);
  const yv = pick(numCol(t, y), idx) as number[], gv = pick(t.cols[g], idx) as (string | number)[];
  const lv = levels(gv);
  return { lv, groups: lv.map((l) => yv.filter((_, i) => gv[i] === l)), y: yv, g: gv };
}
export function M05(inp: Input): MResult {
  const r = mk("M05", "독립표본 t검정");
  const { lv, groups } = groupSplit(inp.table, inp.slots.outcome[0], inp.slots.group[0]);
  const [a, b] = groups; const n1 = a.length, n2 = b.length, m1 = mean(a), m2 = mean(b), v1 = variance(a), v2 = variance(b);
  r.tables.push({ id: "group_desc", title: "집단별 기술통계", columns: ["집단", "N", "평균", "SD", "SE"], rows: lv.map((l, i) => [String(l), groups[i].length, mean(groups[i]), sd(groups[i]), sd(groups[i]) / Math.sqrt(groups[i].length)]) });
  const sp2 = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2), se1 = Math.sqrt(sp2 * (1 / n1 + 1 / n2)), df1 = n1 + n2 - 2;
  const se2 = Math.sqrt(v1 / n1 + v2 / n2), df2 = (v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
  const diff = m1 - m2, t1 = diff / se1, t2 = diff / se2, c1 = tppf(0.975, df1), c2 = tppf(0.975, df2);
  r.tables.push({ id: "t_independent", title: "독립표본 t검정", columns: ["방법", "t", "df", "p(양측)", "평균차", "SE(차)", "CI 하", "CI 상"], rows: [
    ["등분산 가정", t1, df1, tp2(t1, df1), diff, se1, diff - c1 * se1, diff + c1 * se1],
    ["Welch 보정", t2, df2, tp2(t2, df2), diff, se2, diff - c2 * se2, diff + c2 * se2]] });
  const d = diff / Math.sqrt(sp2); const [lo, hi] = dCiTwoSample(d, n1, n2);
  r.effects.push({ name: "코헨 d", value: d, ciLow: lo, ciHigh: hi }, { name: "헤지스 g", value: d * (1 - 3 / (4 * df1 - 1)) });
  r.cis.push({ parameter: "평균차 (등분산 가정)", estimate: diff, low: diff - c1 * se1, high: diff + c1 * se1 }, { parameter: "평균차 (Welch 보정)", estimate: diff, low: diff - c2 * se2, high: diff + c2 * se2 });
  return r;
}
export function M06(inp: Input): MResult {
  const r = mk("M06", "대응표본 t검정");
  const v1 = inp.slots.var1[0], v2 = inp.slots.var2[0];
  const idx = completeIdx(inp.table, [v1, v2]);
  const a = pick(numCol(inp.table, v1), idx) as number[], b = pick(numCol(inp.table, v2), idx) as number[];
  const dd = a.map((v, i) => v - b[i]); const n = dd.length, m = mean(dd), s = sd(dd), se = s / Math.sqrt(n), df = n - 1, t = m / se, tc = tppf(0.975, df);
  r.tables.push({ id: "t_paired", title: "대응표본 기술", columns: ["항목", "N", "평균", "SD"], rows: [[v1, n, mean(a), sd(a)], [v2, n, mean(b), sd(b)], ["차이(앞−뒤)", n, m, s]] });
  r.tables.push({ id: "t_paired_infer", title: "대응표본 t검정", columns: ["평균차", "SE(차)", "t", "df", "p", "CI 하", "CI 상"], rows: [[m, se, t, df, tp2(t, df), m - tc * se, m + tc * se]] });
  r.effects.push({ name: "코헨 d(차이)", value: m / s }, { name: "d(평균/SD차)", value: m / s });
  r.cis.push({ parameter: "평균차 (검정)", estimate: m, low: m - tc * se, high: m + tc * se });
  return r;
}

// ───────── M07 일원분산분석
export function M07(inp: Input): MResult {
  const r = mk("M07", "일원분산분석과 사후검정");
  const { lv, groups, y } = groupSplit(inp.table, inp.slots.outcome[0], inp.slots.group[0]);
  const N = y.length, k = groups.length, gm = mean(y);
  const ssb = groups.reduce((s, g) => s + g.length * (mean(g) - gm) ** 2, 0);
  const ssw = groups.reduce((s, g) => { const m = mean(g); return s + g.reduce((a, v) => a + (v - m) ** 2, 0); }, 0);
  const dfb = k - 1, dfw = N - k, msb = ssb / dfb, msw = ssw / dfw, F = msb / msw;
  r.tables.push({ id: "group_means", title: "집단 평균", columns: ["집단", "N", "평균"], rows: lv.map((l, i) => [String(l), groups[i].length, mean(groups[i])]) });
  r.tables.push({ id: "anova", title: "분산분석", columns: ["원천", "SS", "df", "MS", "F", "p"], rows: [["집단 간", ssb, dfb, msb, F, fsf(F, dfb, dfw)], ["집단 내", ssw, dfw, msw, "", ""], ["전체", ssb + ssw, N - 1, null, "", ""]] });
  const ph: any[][] = [];
  const method = String(inp.options.posthoc ?? "bonferroni");
  // 사후검정의 짝 순서는 자료에서 처음 나온 순서(표 위쪽 기술표는 가나다순)
  const gAll = (inp.table.cols[inp.slots.group[0]] as (string | number | null)[]);
  const firstSeen: (string | number)[] = []; { const idxOk = completeIdx(inp.table, [inp.slots.outcome[0], inp.slots.group[0]]); for (const i of idxOk) { const v = gAll[i] as string | number; if (!firstSeen.includes(v)) firstSeen.push(v); } }
  const ordIdx = firstSeen.map((v) => lv.indexOf(v));
  const m = (k * (k - 1)) / 2;
  for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) {
    const i = ordIdx[a], j = ordIdx[b];
    const ni = groups[i].length, nj = groups[j].length, d = mean(groups[i]) - mean(groups[j]);
    const se = Math.sqrt(msw * (1 / ni + 1 / nj)), t = d / se;
    let p: number, half: number;
    if (method === "games_howell") {
      const vi = variance(groups[i]), vj = variance(groups[j]);
      const s2 = vi / ni + vj / nj, dfg = (s2 * s2) / ((vi / ni) ** 2 / (ni - 1) + (vj / nj) ** 2 / (nj - 1));
      const seg = Math.sqrt(s2), tg = d / seg;
      p = 1 - ptukey(Math.abs(tg) * Math.SQRT2, k, dfg); half = (qtukey(0.95, k, dfg) / Math.SQRT2) * seg;
      ph.push([String(lv[i]), String(lv[j]), d, seg, tg, Math.max(0, p), d - half, d + half]); continue;
    }
    if (method === "bonferroni") { p = Math.min(1, tp2(t, dfw) * m); half = tppf(1 - 0.05 / (2 * m), dfw) * se; }
    else { p = 1 - ptukey(Math.abs(t) * Math.SQRT2, k, dfw); half = (qtukey(0.95, k, dfw) / Math.SQRT2) * se; }
    ph.push([String(lv[i]), String(lv[j]), d, se, t, Math.max(0, p), d - half, d + half]);
  }
  r.tables.push({ id: "posthoc", title: "사후검정", columns: ["A", "B", "평균차", "SE", "t", "p(보정)", "CI 하", "CI 상"], rows: ph });
  r.effects.push({ name: "η²", value: ssb / (ssb + ssw) }, { name: "partial η²", value: ssb / (ssb + ssw) });
  return r;
}

// ───────── M08 상관
export function M08(inp: Input): MResult {
  const r = mk("M08", "피어슨·스피어만 상관");
  const vars = [...(inp.slots.x ?? []), ...(inp.slots.y ?? [])].filter((v, i, a) => a.indexOf(v) === i);
  const method = String(inp.options.method ?? "pearson");
  const rows: any[][] = [];
  for (let i = 0; i < vars.length; i++) for (let j = i; j < vars.length; j++) {
    if (i === j) { const n = completeIdx(inp.table, [vars[i]]).length; rows.push([vars[i], vars[j], method, n, 1, null, null, null]); continue; }
    const idx = completeIdx(inp.table, [vars[i], vars[j]]);
    let a = pick(numCol(inp.table, vars[i]), idx) as number[], b = pick(numCol(inp.table, vars[j]), idx) as number[];
    if (method === "spearman") { a = rank(a); b = rank(b); }
    const n = a.length, rr = pearson(a, b), t = rr * Math.sqrt((n - 2) / (1 - rr * rr)), p = tp2(t, n - 2);
    const z = Math.atanh(rr), zc = normppf(0.975) / Math.sqrt(n - 3);
    rows.push([vars[i], vars[j], method, n, rr, p, Math.tanh(z - zc), Math.tanh(z + zc)]);
    r.effects.push({ name: "상관 r", value: rr });
    r.cis.push({ parameter: `r (${vars[i]}–${vars[j]})`, estimate: rr, low: Math.tanh(z - zc), high: Math.tanh(z + zc) });
  }
  r.tables.push({ id: "corr_matrix", title: "상관", columns: ["X", "Y", "방법", "N", "r", "p", "CI 하", "CI 상"], rows });
  return r;
}
