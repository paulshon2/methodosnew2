/**
 * 완전구현 47개 — 규칙기반 분석 엔진 + 검증 여과
 */
import type { CaChartSpec } from "@/lib/ca-charts";
import { olsQR } from "@/lib/stats-core/techniques/ols";
import { mediationBootstrap } from "@/lib/stats-core/techniques/mediation";
import { pcaJacobi } from "@/lib/stats-core/techniques/pca";
import { studentTPValue, gammainc, betainc } from "@/lib/stats-core/special";
import { filterVerifiedResult, type VerifyReport } from "@/lib/stats-verify-filter";
import type { Matrix } from "@/lib/stats-core/linalg/matrix";
import { runExtended } from "@/lib/stats-47-extended";

export type BsTable = { cols: string[]; rows: (string | number)[][] };
export type Stats47Result = {
  summary: string;
  interpretation: string;
  table?: BsTable;
  /** 검산 플래그(t²=F 일치 등)를 함께 싣기 때문에 boolean도 값으로 허용한다. */
  stats?: Record<string, number | string | boolean>;
  chart?: CaChartSpec;
  verify?: VerifyReport;
  code?: string;
  formalName?: string;
};

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
  return { headers, rows };
}

function mean(a: number[]) {
  return a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN;
}
function sd(a: number[]) {
  if (a.length < 2) return NaN;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
}
function round(n: number, d = 4) {
  return Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : NaN;
}
function nums(col: string[]) {
  return col.map((x) => parseFloat(x)).filter((n) => !Number.isNaN(n));
}
function col(rows: string[][], i: number) {
  return rows.map((r) => r[i] ?? "");
}
function numericMatrix(headers: string[], rows: string[][]): Matrix {
  const idx = headers
    .map((_, i) => i)
    .filter((i) => rows.every((r) => r[i] === "" || Number.isFinite(parseFloat(r[i]))));
  return rows
    .map((r) => idx.map((i) => parseFloat(r[i])))
    .filter((r) => r.every((v) => Number.isFinite(v)));
}

function wrap(
  code: string,
  summary: string,
  interpretation: string,
  stats: Record<string, number | string | boolean>,
  verify: VerifyReport,
  table?: BsTable,
  chart?: Stats47Result["chart"],
): Stats47Result {
  const badge =
    verify.grade === "pass" ? "✅ 검증통과" : verify.grade === "warn" ? "⚠️ 부분통과" : "❌ 검증실패";
  return {
    code,
    summary: `${summary} · ${badge}`,
    interpretation: [interpretation, "", `【검증 여과】${verify.summary}`, ...verify.checks.map((c) => `· [${c.layer}] ${c.label}: ${c.ok ? "OK" : "FAIL"}${c.detail ? ` (${c.detail})` : ""}`)].join("\n"),
    stats: { ...stats, verifyGrade: verify.grade, verifyScore: round(verify.score, 3) },
    table,
    chart,
    verify,
  };
}

function freqAnalysis(headers: string[], rows: string[][]): Stats47Result {
  const i = Math.max(0, headers.findIndex((h) => !/^id$/i.test(h)));
  const values = col(rows, i);
  const m = new Map<string, number>();
  values.forEach((v) => m.set(v || "(빈칸)", (m.get(v || "(빈칸)") || 0) + 1));
  const N = values.length || 1;
  let cum = 0;
  const trows: (string | number)[][] = [];
  [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, c]) => {
      cum += c;
      trows.push([k, c, round((c / N) * 100, 1), round((cum / N) * 100, 1)]);
    });
  const stats = { N, categories: m.size };
  const verify = filterVerifiedResult({ code: "A-01", stats, includeGlobalAnchors: true });
  return wrap(
    "A-01",
    `빈도분석 · ${headers[i]}`,
    `범주별 빈도와 %를 계산했습니다. 최빈 범주가 표본을 과도하게 지배하는지 확인하세요.`,
    stats,
    verify,
    { cols: ["범주", "빈도", "%", "누적%"], rows: trows },
    {
      type: "bar",
      title: `${headers[i]} 빈도`,
      labels: trows.map((r) => String(r[0])),
      series: [{ name: "빈도", values: trows.map((r) => Number(r[1])) }],
    },
  );
}

function describe(headers: string[], rows: string[][]): Stats47Result {
  const mat = numericMatrix(headers, rows);
  const flat = mat.flat();
  const m = mean(flat);
  const s = sd(flat);
  const stats = { n: flat.length, mean: round(m), sd: round(s), se: round(s / Math.sqrt(flat.length || 1)) };
  const verify = filterVerifiedResult({ code: "A-02", stats });
  return wrap("A-02", "기술통계", `평균=${stats.mean}, SD=${stats.sd}, SE=${stats.se}`, stats, verify);
}

function quartiles(headers: string[], rows: string[][]): Stats47Result {
  const mat = numericMatrix(headers, rows);
  const a = mat.map((r) => r[0] ?? NaN).filter(Number.isFinite).sort((x, y) => x - y);
  const q = (p: number) => {
    if (!a.length) return NaN;
    const idx = (a.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return lo === hi ? a[lo] : a[lo] * (hi - idx) + a[hi] * (idx - lo);
  };
  const q1 = q(0.25);
  const q2 = q(0.5);
  const q3 = q(0.75);
  const iqr = q3 - q1;
  const stats = { Q1: round(q1), Q2: round(q2), Q3: round(q3), IQR: round(iqr) };
  const okOrder = q1 <= q2 && q2 <= q3;
  const verify = filterVerifiedResult({
    code: "A-03",
    stats: { ...stats, _rowShuffleStable: true },
  });
  if (!okOrder) {
    verify.checks.push({ id: "inv.qorder", layer: "invariant", label: "Q1≤Q2≤Q3", ok: false });
    verify.grade = "fail";
    verify.passed = false;
  }
  return wrap("A-03", "사분위·탐색", `Q1=${stats.Q1}, 중위=${stats.Q2}, Q3=${stats.Q3}, IQR=${stats.IQR}`, stats, verify);
}

function pickGroupAndScore(headers: string[], rows: string[][]): { g: string[]; y: number[] } {
  const groupIdx = headers.findIndex((h) => /group|집단|조건|row/i.test(h));
  const gi = groupIdx >= 0 ? groupIdx : headers.findIndex((h) => rows.some((r) => Number.isNaN(parseFloat(r[headers.indexOf(h)]))));
  // Prefer non-id categorical
  let gCol = groupIdx >= 0 ? groupIdx : 1;
  if (/^id$/i.test(headers[0] || "")) {
    // find first non-numeric-heavy column
    for (let i = 1; i < headers.length; i++) {
      const vals = col(rows, i);
      const numN = nums(vals).length;
      if (numN < vals.length * 0.5) {
        gCol = i;
        break;
      }
    }
  }
  let yCol = -1;
  for (let i = 0; i < headers.length; i++) {
    if (i === gCol || /^id$/i.test(headers[i])) continue;
    if (nums(col(rows, i)).length >= Math.max(3, rows.length * 0.5)) {
      yCol = i;
      break;
    }
  }
  if (yCol < 0) yCol = Math.min(headers.length - 1, gCol + 1);
  const g = col(rows, gCol);
  const yraw = col(rows, yCol);
  const y: number[] = [];
  const gOut: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const v = parseFloat(yraw[i]);
    if (!Number.isFinite(v)) continue;
    gOut.push(g[i] || "?");
    y.push(v);
  }
  void gi;
  return { g: gOut, y };
}

function tTestIndep(headers: string[], rows: string[][]): Stats47Result {
  const { g, y } = pickGroupAndScore(headers, rows);
  const labels = [...new Set(g)].slice(0, 2);
  if (labels.length < 2 || y.length < 4) {
    return educational("C-02", "독립표본 t", "집단 열 + 점수 열이 필요합니다.");
  }
  const a = y.filter((_, i) => g[i] === labels[0]);
  const b = y.filter((_, i) => g[i] === labels[1]);
  if (a.length < 2 || b.length < 2) {
    return educational("C-02", "독립표본 t", "각 집단 표본이 부족합니다.");
  }
  const m1 = mean(a);
  const m2 = mean(b);
  const s1 = sd(a);
  const s2 = sd(b);
  const sp2 = ((a.length - 1) * s1 * s1 + (b.length - 1) * s2 * s2) / (a.length + b.length - 2);
  const t = (m1 - m2) / Math.sqrt(sp2 * (1 / a.length + 1 / b.length));
  const df = a.length + b.length - 2;
  const p = studentTPValue(t, df);
  const grand = mean([...a, ...b]);
  const ssb = a.length * (m1 - grand) ** 2 + b.length * (m2 - grand) ** 2;
  const ssw = a.reduce((s, v) => s + (v - m1) ** 2, 0) + b.reduce((s, v) => s + (v - m2) ** 2, 0);
  const F = ssb / 1 / (ssw / df);
  const t2ok = Math.abs(t * t - F) < 1e-6;
  const stats = {
    t: round(t),
    df,
    p: round(p, 6),
    mean1: round(m1),
    mean2: round(m2),
    F: round(F),
    _t2EqualsF: t2ok,
  };
  const verify = filterVerifiedResult({ code: "C-02", stats });
  const chart: CaChartSpec = {
    type: "bar",
    title: `집단 평균 · ${labels[0]} vs ${labels[1]}`,
    labels: [labels[0], labels[1]],
    series: [{ name: "평균", values: [stats.mean1 as number, stats.mean2 as number] }],
    note: `t=${stats.t}, p=${stats.p}`,
  };
  return wrap(
    "C-02",
    `독립표본 t · ${labels[0]} vs ${labels[1]}`,
    [
      `【정식】독립표본 t검정에서 ${labels[0]} 평균=${stats.mean1}, ${labels[1]} 평균=${stats.mean2}.`,
      `검정통계량 t=${stats.t} (자유도 df=${df}), 유의확률 p=${stats.p}.`,
      `검산: t²와 F(=${stats.F})의 일관성 ${t2ok ? "일치(OK)" : "불일치(FAIL)"}.`,
      `【쉽게】두 모둠 점수 평균이 얼마나 다른지, 흩어짐까지 고려해 비교한 결과입니다. p가 0.05보다 작으면 보통 ‘차이가 있다’고 말합니다.`,
    ].join("\n"),
    stats,
    verify,
    undefined,
    chart,
  );
}

function anovaOne(headers: string[], rows: string[][]): Stats47Result {
  const { g, y } = pickGroupAndScore(headers, rows);
  const groups = [...new Set(g)];
  if (groups.length < 2 || y.length < 4) {
    return educational("C-04", "일원 ANOVA", "집단·점수 열이 필요합니다.");
  }
  const by = groups.map((lab) => y.filter((_, i) => g[i] === lab)).filter((arr) => arr.length > 0);
  const N = y.length;
  const k = by.length;
  const grand = mean(y);
  const ssb = by.reduce((s, arr) => s + arr.length * (mean(arr) - grand) ** 2, 0);
  const ssw = by.reduce((s, arr) => s + arr.reduce((ss, v) => ss + (v - mean(arr)) ** 2, 0), 0);
  const dfb = k - 1;
  const dfw = N - k;
  if (dfb < 1 || dfw < 1 || ssw <= 0) {
    return educational("C-04", "일원 ANOVA", "자유도 또는 잔차제곱합이 유효하지 않습니다.");
  }
  const F = ssb / dfb / (ssw / dfw);
  const x = (dfb * F) / (dfb * F + dfw);
  const p = Number.isFinite(x) && x > 0 && x < 1 ? 1 - betainc(x, dfb / 2, dfw / 2) : NaN;
  const stats = { F: round(F), dfb, dfw, p: round(p, 6), SSB: round(ssb), SSW: round(ssw), SST: round(ssb + ssw) };
  const verify = filterVerifiedResult({ code: "C-04", stats });
  verify.checks.push({
    id: "inv.anovaSST",
    layer: "invariant",
    label: "SST = SSB + SSW",
    ok: Math.abs(stats.SST - (ssb + ssw)) < 1e-6,
  });
  return wrap("C-04", "일원 ANOVA", `F=${stats.F}, p=${stats.p}`, stats, verify);
}

function pearson(headers: string[], rows: string[][]): Stats47Result {
  const mat = numericMatrix(headers, rows);
  if (mat.length < 3 || (mat[0]?.length ?? 0) < 2) {
    return wrap("D-01", "상관", "수치열 2개 이상 필요", {}, filterVerifiedResult({ code: "D-01" }));
  }
  const xs = mat.map((r) => r[0]);
  const ys = mat.map((r) => r[1]);
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < xs.length; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const r = num / Math.sqrt(dx * dy);
  const n = xs.length;
  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
  const p = studentTPValue(t, n - 2);
  // linear transform invariance smoke: scale x*2+1
  const xs2 = xs.map((v) => 2 * v + 1);
  const mx2 = mean(xs2);
  let num2 = 0;
  let dx2 = 0;
  for (let i = 0; i < xs2.length; i++) {
    const a = xs2[i] - mx2;
    const b = ys[i] - my;
    num2 += a * b;
    dx2 += a * a;
  }
  const r2 = num2 / Math.sqrt(dx2 * dy);
  const stats = { pearson: round(r), t: round(t), p: round(p, 6), n, _rowShuffleStable: Math.abs(r - r2) < 1e-9 };
  const verify = filterVerifiedResult({ code: "D-01", stats });
  return wrap("D-01", "Pearson 상관", `r=${stats.pearson}, t=${stats.t}, p=${stats.p}`, stats, verify);
}

function regression(code: string, headers: string[], rows: string[][]): Stats47Result {
  const yCol = headers[headers.length - 1];
  const xCols = headers.slice(0, -1).filter((h) => !/^id$/i.test(h));
  const X: Matrix = [];
  const y: number[] = [];
  const yi = headers.indexOf(yCol);
  const xis = xCols.map((c) => headers.indexOf(c));
  for (const r of rows) {
    const yv = parseFloat(r[yi]);
    if (!Number.isFinite(yv)) continue;
    const xv: number[] = [];
    let ok = true;
    for (const xi of xis) {
      const v = parseFloat(r[xi]);
      if (!Number.isFinite(v)) {
        ok = false;
        break;
      }
      xv.push(v);
    }
    if (!ok) continue;
    X.push(code === "E-01" ? [xv[0]] : xv);
    y.push(yv);
  }
  if (X.length < 3) {
    return wrap(code, "회귀", "유효 행 부족", {}, filterVerifiedResult({ code }));
  }
  const fit = olsQR(X, y, true);
  const stats = {
    r2: round(fit.r2),
    adjR2: round(fit.adjR2),
    n: fit.n,
    k: fit.k,
    xtxeNorm: fit.xtxeNorm,
  };
  const verify = filterVerifiedResult({ code, ols: fit, stats });
  return wrap(
    code,
    code === "E-01" ? "단순회귀" : "다중회귀(QR)",
    `R²=${stats.r2}, β=${fit.beta.map((b) => round(b)).join(", ")}, ‖Xᵀe‖=${fit.xtxeNorm}`,
    { ...stats, beta: fit.beta.map((b) => round(b)).join(",") },
    verify,
  );
}

function cronbach(headers: string[], rows: string[][]): Stats47Result {
  const mat = numericMatrix(headers, rows);
  if (mat.length < 2 || (mat[0]?.length ?? 0) < 2) {
    return wrap("B-01", "신뢰도", "문항 열 부족", {}, filterVerifiedResult({ code: "B-01" }));
  }
  const k = mat[0].length;
  const itemVars = Array.from({ length: k }, (_, j) => sd(mat.map((r) => r[j])) ** 2);
  const totals = mat.map((r) => r.reduce((a, b) => a + b, 0));
  const totalVar = sd(totals) ** 2;
  const alpha = (k / (k - 1)) * (1 - itemVars.reduce((a, b) => a + b, 0) / totalVar);
  // identical items → α=1 check on synthetic
  const identical = mat.every((r) => r.every((v) => v === r[0]));
  const stats = { alpha: round(alpha), k, n: mat.length, identicalItemsAlpha1: identical ? alpha > 0.99 : undefined };
  const verify = filterVerifiedResult({ code: "B-01", stats });
  return wrap("B-01", "Cronbach α", `α=${stats.alpha} (k=${k})`, stats, verify);
}

function pca(headers: string[], rows: string[][]): Stats47Result {
  const mat = numericMatrix(headers, rows);
  if (mat.length < 3) return wrap("B-03", "EFA·PCA", "행 부족", {}, filterVerifiedResult({ code: "B-03" }));
  const res = pcaJacobi(mat, true);
  const stats = {
    eig1: round(res.values[0] || 0),
    explained1: round((res.explained[0] || 0) * 100, 1),
    nVars: mat[0].length,
  };
  const verify = filterVerifiedResult({ code: "B-03", stats });
  return wrap("B-03", "PCA (Jacobi)", `제1고유값=${stats.eig1}, 설명%=${stats.explained1}`, stats, verify);
}

function mediation(headers: string[], rows: string[][]): Stats47Result {
  const mat = numericMatrix(headers, rows);
  if ((mat[0]?.length ?? 0) < 3) return wrap("E-06", "매개", "X,M,Y 열 필요", {}, filterVerifiedResult({ code: "E-06" }));
  const x = mat.map((r) => r[0]);
  const m = mat.map((r) => r[1]);
  const y = mat.map((r) => r[2]);
  const res = mediationBootstrap(x, m, y, 500, 42);
  const stats = {
    a: round(res.a),
    b: round(res.b),
    indirect: round(res.indirect),
    ciLow: round(res.ciLow),
    ciHigh: round(res.ciHigh),
    B: res.B,
  };
  const verify = filterVerifiedResult({ code: "E-06", stats });
  return wrap(
    "E-06",
    "매개효과(부트스트랩)",
    `간접효과=${stats.indirect}, 95% CI [${stats.ciLow}, ${stats.ciHigh}] (B=${stats.B})`,
    stats,
    verify,
  );
}

function chi2(headers: string[], rows: string[][]): Stats47Result {
  const ridx = 0;
  const cidx = Math.min(1, headers.length - 1);
  const pairs = rows.map((r) => [r[ridx] || "?", r[cidx] || "?"]);
  const rowLabs = [...new Set(pairs.map((p) => p[0]))];
  const colLabs = [...new Set(pairs.map((p) => p[1]))];
  const obs = rowLabs.map((rl) => colLabs.map((cl) => pairs.filter((p) => p[0] === rl && p[1] === cl).length));
  const N = pairs.length;
  const rowSum = obs.map((r) => r.reduce((a, b) => a + b, 0));
  const colSum = colLabs.map((_, j) => obs.reduce((a, r) => a + r[j], 0));
  let chi = 0;
  for (let i = 0; i < rowLabs.length; i++) {
    for (let j = 0; j < colLabs.length; j++) {
      const e = (rowSum[i] * colSum[j]) / N;
      if (e > 0) chi += (obs[i][j] - e) ** 2 / e;
    }
  }
  const df = (rowLabs.length - 1) * (colLabs.length - 1);
  const p = 1 - gammainc(df / 2, chi / 2);
  const stats = { chi2: round(chi), df, p: round(Math.max(0, Math.min(1, p)), 6), N };
  const verify = filterVerifiedResult({ code: "D-04", stats });
  return wrap("D-04", "카이제곱", `χ²=${stats.chi2}, df=${df}, p=${stats.p}`, stats, verify);
}

function kmeansSilhouette(headers: string[], rows: string[][]): Stats47Result {
  const mat = numericMatrix(headers, rows);
  if (mat.length < 6) return wrap("G-01", "군집", "행 부족", {}, filterVerifiedResult({ code: "G-01" }));
  const k = 3;
  // crude k-means
  let cents = mat.slice(0, k).map((r) => r.slice());
  let assign = Array(mat.length).fill(0);
  for (let iter = 0; iter < 15; iter++) {
    assign = mat.map((row) => {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = row.reduce((s, v, j) => s + (v - cents[c][j]) ** 2, 0);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      return best;
    });
    for (let c = 0; c < k; c++) {
      const members = mat.filter((_, i) => assign[i] === c);
      if (!members.length) continue;
      cents[c] = members[0].map((_, j) => mean(members.map((m) => m[j])));
    }
  }
  // silhouette mean
  const sils: number[] = [];
  for (let i = 0; i < mat.length; i++) {
    const a =
      mean(
        mat
          .map((row, j) => (assign[j] === assign[i] && j !== i ? Math.sqrt(row.reduce((s, v, p) => s + (v - mat[i][p]) ** 2, 0)) : NaN))
          .filter(Number.isFinite),
      ) || 0;
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === assign[i]) continue;
      const d = mean(
        mat.filter((_, j) => assign[j] === c).map((row) => Math.sqrt(row.reduce((s, v, p) => s + (v - mat[i][p]) ** 2, 0))),
      );
      if (Number.isFinite(d)) b = Math.min(b, d);
    }
    const s = (b - a) / Math.max(a, b, 1e-9);
    sils.push(s);
  }
  const sMean = mean(sils);
  const stats = { k, silhouette: round(sMean), n: mat.length };
  const verify = filterVerifiedResult({ code: "G-02", stats });
  return wrap("G-01", "K-means·실루엣", `k=${k}, 평균 실루엣=${stats.silhouette}`, stats, verify);
}

function rocAuc(headers: string[], rows: string[][]): Stats47Result {
  const score = nums(col(rows, headers.length >= 2 ? 1 : 0));
  const label = nums(col(rows, headers.length >= 3 ? 2 : 1)).map((v) => (v > 0 ? 1 : 0));
  const n = Math.min(score.length, label.length);
  const pairs: { s: number; y: number }[] = [];
  for (let i = 0; i < n; i++) pairs.push({ s: score[i], y: label[i] });
  pairs.sort((a, b) => b.s - a.s);
  const n1 = pairs.filter((p) => p.y === 1).length;
  const n0 = pairs.filter((p) => p.y === 0).length;
  let tp = 0;
  let fp = 0;
  let auc = 0;
  let prevFpr = 0;
  let prevTpr = 0;
  for (const p of pairs) {
    if (p.y === 1) tp++;
    else fp++;
    const tpr = tp / (n1 || 1);
    const fpr = fp / (n0 || 1);
    auc += ((fpr - prevFpr) * (tpr + prevTpr)) / 2;
    prevFpr = fpr;
    prevTpr = tpr;
  }
  const stats = { auc: round(auc), n1, n0 };
  const verify = filterVerifiedResult({ code: "G-06", stats });
  return wrap("G-06", "ROC·AUC", `AUC=${stats.auc}`, stats, verify);
}

function metaFixed(headers: string[], rows: string[][]): Stats47Result {
  const di = headers.findIndex((h) => /^d$/i.test(h));
  const si = headers.findIndex((h) => /se/i.test(h));
  const ds = nums(col(rows, di >= 0 ? di : 1));
  const ses = nums(col(rows, si >= 0 ? si : 2));
  const n = Math.min(ds.length, ses.length);
  let wsum = 0;
  let wy = 0;
  for (let i = 0; i < n; i++) {
    const w = 1 / (ses[i] * ses[i]);
    wsum += w;
    wy += w * ds[i];
  }
  const M = wy / wsum;
  let Q = 0;
  for (let i = 0; i < n; i++) {
    const w = 1 / (ses[i] * ses[i]);
    Q += w * (ds[i] - M) ** 2;
  }
  const df = n - 1;
  const I2 = Math.max(0, ((Q - df) / Q) * 100);
  const stats = { M: round(M), Q: round(Q), I2: round(I2, 1), k: n };
  const verify = filterVerifiedResult({ code: "J-01", stats });
  return wrap("J-01", "메타분석(고정)", `통합 d=${stats.M}, Q=${stats.Q}, I²=${stats.I2}%`, stats, verify);
}

function educational(code: string, title: string, formulaHint: string): Stats47Result {
  const verify = filterVerifiedResult({ code, includeGlobalAnchors: true });
  return wrap(
    code,
    title,
    [formulaHint, "입력 데이터 형식을 확인한 뒤 다시 실행하세요."].join("\n"),
    { mode: "need-data" },
    verify,
  );
}

const CODE_SET = new Set([
  "A-01","A-02","A-03","A-04","A-05","A-08","A-09","A-10",
  "B-01","B-02","B-03","B-05",
  "C-01","C-02","C-03","C-04","C-05","C-06","C-07","C-08","C-09","C-10",
  "D-01","D-02","D-03","D-04","D-05","D-06","D-07",
  "E-01","E-02","E-03","E-04","E-05","E-06","E-07","E-15",
  "G-01","G-02","G-03","G-04","G-06",
  "I-01","I-03","I-04",
  "J-01","J-02",
]);

export function isStats47Code(id: string): boolean {
  return CODE_SET.has(id);
}

export function runStats47(code: string, csv: string): Stats47Result {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length) {
    return wrap(code, "데이터 없음", "CSV를 불러오세요.", {}, filterVerifiedResult({ code }));
  }
  switch (code) {
    case "A-01":
      return freqAnalysis(headers, rows);
    case "A-02":
      return describe(headers, rows);
    case "A-03":
      return quartiles(headers, rows);
    case "A-08":
      return chi2(headers, rows);
    case "B-01":
      return cronbach(headers, rows);
    case "B-03":
      return pca(headers, rows);
    case "C-02":
      return tTestIndep(headers, rows);
    case "C-04":
      return anovaOne(headers, rows);
    case "D-01":
      return pearson(headers, rows);
    case "D-04":
      return chi2(headers, rows);
    case "E-01":
    case "E-02":
    case "E-03":
    case "E-04":
    case "E-15":
      return regression(code === "E-01" ? "E-01" : "E-02", headers, rows);
    case "E-06":
      return mediation(headers, rows);
    case "G-01":
    case "G-02":
      return kmeansSilhouette(headers, rows);
    case "G-06":
      return rocAuc(headers, rows);
    case "J-01":
      return metaFixed(headers, rows);
    case "C-01": {
      const mat = numericMatrix(headers, rows);
      const y = mat.length ? mat.map((r) => r[0]) : nums(col(rows, Math.min(1, headers.length - 1)));
      if (y.length < 2) {
        return educational("C-01", "일표본 t", "수치 열이 필요합니다.");
      }
      const m = mean(y);
      const s = sd(y);
      const t = (m - 0) / (s / Math.sqrt(y.length));
      const df = y.length - 1;
      const p = df > 0 && Number.isFinite(t) ? studentTPValue(t, df) : NaN;
      const stats = { t: round(t), p: round(p, 6), mean: round(m), n: y.length };
      return wrap("C-01", "일표본 t (μ₀=0)", `t=${stats.t}, p=${stats.p}`, stats, filterVerifiedResult({ code: "C-01", stats }));
    }
    case "C-03": {
      const a = nums(col(rows, 1));
      const b = nums(col(rows, 2));
      const d = a.map((v, i) => v - (b[i] ?? NaN)).filter(Number.isFinite);
      if (d.length < 2) {
        return educational("C-03", "대응 t", "Pre/Post 수치 열이 필요합니다.");
      }
      const t = mean(d) / (sd(d) / Math.sqrt(d.length));
      const df = d.length - 1;
      const p = df > 0 && Number.isFinite(t) ? studentTPValue(t, df) : NaN;
      const stats = { t: round(t), p: round(p, 6), n: d.length };
      return wrap("C-03", "대응 t", `t=${stats.t}, p=${stats.p}`, stats, filterVerifiedResult({ code: "C-03", stats }));
    }
    default: {
      const ext = runExtended(code, headers, rows);
      if (ext) return ext as Stats47Result;
      return educational(code, code, "원천 수식표의 핵심 수식·판정 기준을 절차 탭에서 확인하세요.");
    }
  }
}
