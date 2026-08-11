export interface SsAutoResult {
  summary: string;
  interpretation: string;
  cols?: string[];
  rows?: (string | number)[][];
  text?: string;
  stats?: Record<string, number | string | boolean>;
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
  return { headers, rows };
}

function nums(col: string[]): number[] {
  return col.map((x) => parseFloat(x)).filter((n) => !Number.isNaN(n));
}

function mean(a: number[]) {
  return a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN;
}

function median(a: number[]) {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function sd(a: number[]) {
  if (a.length < 2) return NaN;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
}

function skew(a: number[]) {
  if (a.length < 3) return NaN;
  const m = mean(a);
  const s = sd(a);
  if (!s) return 0;
  const n = a.length;
  return a.reduce((acc, v) => acc + ((v - m) / s) ** 3, 0) / n;
}

function kurt(a: number[]) {
  if (a.length < 4) return NaN;
  const m = mean(a);
  const s = sd(a);
  if (!s) return 0;
  const n = a.length;
  return a.reduce((acc, v) => acc + ((v - m) / s) ** 4, 0) / n - 3;
}

function freqTable(values: string[]) {
  const m = new Map<string, number>();
  values.forEach((v) => m.set(v, (m.get(v) || 0) + 1));
  const total = values.length;
  const rows: (string | number)[][] = [];
  let cum = 0;
  [...m.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, c]) => {
    cum += c;
    rows.push([k, c, ((c / total) * 100).toFixed(1) + "%", ((cum / total) * 100).toFixed(1) + "%"]);
  });
  return { columns: ["범주", "빈도", "비율", "누적%"], rows };
}

function crosstab(h1: string, h2: string, rows: string[][]) {
  const map = new Map<string, number>();
  const rSet = new Set<string>();
  const cSet = new Set<string>();
  rows.forEach((r) => {
    const a = r[0];
    const b = r[1];
    rSet.add(a);
    cSet.add(b);
    map.set(a + "||" + b, (map.get(a + "||" + b) || 0) + 1);
  });
  const rs = [...rSet];
  const cs = [...cSet];
  const out: (string | number)[][] = [];
  let total = 0;
  rs.forEach((a) => {
    const row: (string | number)[] = [a];
    let rowSum = 0;
    cs.forEach((b) => {
      const c = map.get(a + "||" + b) || 0;
      row.push(c);
      rowSum += c;
      total += c;
    });
    row.push(rowSum);
    out.push(row);
  });
  const footer: (string | number)[] = ["합계"];
  cs.forEach((b) => {
    let s = 0;
    rs.forEach((a) => {
      s += map.get(a + "||" + b) || 0;
    });
    footer.push(s);
  });
  footer.push(total);
  return { columns: [h1 + "\\" + h2, ...cs, "행합"], rows: out, total, colCount: cs.length };
}

function chiSquareFromCrosstab(table: { rows: (string | number)[][]; total: number; colCount: number }) {
  const { rows, total, colCount } = table;
  const dataRows = rows.slice(0, -1);
  const rowTotals = dataRows.map((r) => Number(r[r.length - 1]));
  const colTotals: number[] = [];
  for (let c = 1; c <= colCount; c++) {
    let s = 0;
    dataRows.forEach((r) => {
      s += Number(r[c]);
    });
    colTotals.push(s);
  }
  let chi2 = 0;
  dataRows.forEach((r, ri) => {
    for (let c = 1; c <= colCount; c++) {
      const obs = Number(r[c]);
      const exp = (rowTotals[ri] * colTotals[c - 1]) / total;
      if (exp > 0) chi2 += (obs - exp) ** 2 / exp;
    }
  });
  const df = (dataRows.length - 1) * (colCount - 1);
  return { chi2, df };
}

function welchT(a: number[], b: number[]) {
  const m1 = mean(a);
  const m2 = mean(b);
  const v1 = sd(a) ** 2;
  const v2 = sd(b) ** 2;
  const n1 = a.length;
  const n2 = b.length;
  const se = Math.sqrt(v1 / n1 + v2 / n2);
  const t = se ? (m1 - m2) / se : 0;
  const dfNum = (v1 / n1 + v2 / n2) ** 2;
  const dfDen = (v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1);
  const df = dfDen ? dfNum / dfDen : n1 + n2 - 2;
  const pooled = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
  const d = pooled ? (m1 - m2) / pooled : 0;
  return { t, df, m1, m2, cohensD: d };
}

function gaussSolve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const div = M[col][col] || 1e-12;
    for (let j = col; j <= n; j++) M[col][j] /= div;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      for (let j = col; j <= n; j++) M[r][j] -= f * M[col][j];
    }
  }
  return M.map((row) => row[n]);
}

function ols(y: number[], xs: number[][]) {
  const n = y.length;
  const k = xs.length;
  const design: number[][] = [];
  for (let i = 0; i < n; i++) {
    design.push([1, ...xs.map((col) => col[i])]);
  }
  const p = k + 1;
  const XtX: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  const Xty: number[] = Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < p; a++) {
      Xty[a] += design[i][a] * y[i];
      for (let b = 0; b < p; b++) XtX[a][b] += design[i][a] * design[i][b];
    }
  }
  const beta = gaussSolve(XtX, Xty);
  const yhat = design.map((row) => row.reduce((s, v, j) => s + v * beta[j], 0));
  const ssRes = y.reduce((s, yi, i) => s + (yi - yhat[i]) ** 2, 0);
  const ssTot = y.reduce((s, yi) => s + (yi - mean(y)) ** 2, 0);
  const r2 = ssTot ? 1 - ssRes / ssTot : 0;
  return { beta, r2 };
}

function cronbachAlpha(cols: number[][]) {
  const k = cols.length;
  if (k < 2) return NaN;
  const n = cols[0].length;
  const itemVars = cols.map((c) => {
    const m = mean(c);
    return c.reduce((s, v) => s + (v - m) ** 2, 0) / (n - 1);
  });
  const totals = Array.from({ length: n }, (_, i) => cols.reduce((s, c) => s + c[i], 0));
  const m = mean(totals);
  const totalVar = totals.reduce((s, v) => s + (v - m) ** 2, 0) / (n - 1);
  const sumItemVar = itemVars.reduce((a, b) => a + b, 0);
  return totalVar ? (k / (k - 1)) * (1 - sumItemVar / totalVar) : NaN;
}

function pearson(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

function corMatrix(cols: number[][], headers: string[]) {
  const out: (string | number)[][] = [];
  for (let i = 0; i < cols.length; i++) {
    const row: (string | number)[] = [headers[i] || `V${i + 1}`];
    for (let j = 0; j < cols.length; j++) {
      row.push(pearson(cols[i], cols[j]).toFixed(3));
    }
    out.push(row);
  }
  return out;
}

export function runSsAutomation(phaseId: string, techName: string, csvText: string): SsAutoResult {
  const { headers, rows } = parseCsv(csvText);
  if (!headers.length) {
    return { summary: "데이터 없음", interpretation: "CSV 형식(헤더+행)으로 데이터를 입력하세요." };
  }

  if (/빈도/i.test(techName) && !/교차/i.test(techName)) {
    const col = rows.map((r) => r[0]).filter(Boolean);
    const t = freqTable(col);
    return {
      summary: `빈도분석 — N=${col.length}`,
      interpretation: "범주별 응답 분포를 확인했습니다. 비율이 극단적으로 치우치면 후속 분석 전에 표본 특성을 서론에 기술하세요.",
      cols: t.columns,
      rows: t.rows,
    };
  }

  if (/교차표|crosstab/i.test(techName)) {
    if (headers.length < 2) return { summary: "교차표", interpretation: "두 범주형 열이 필요합니다." };
    const ct = crosstab(headers[0], headers[1], rows);
    const chi = chiSquareFromCrosstab(ct);
    return {
      summary: `교차표 · χ²=${chi.chi2.toFixed(3)} (df=${chi.df})`,
      interpretation: "기대빈도 5 미만 셀이 많으면 Fisher 정확검정 등 대안을 검토하세요.",
      cols: ct.columns,
      rows: ct.rows,
      stats: { chi2: chi.chi2, df: chi.df },
    };
  }

  if (/평균/.test(techName) && !/회귀/.test(techName)) {
    const v = nums(rows.map((r) => r[0]));
    return {
      summary: `평균=${mean(v).toFixed(3)}, N=${v.length}`,
      interpretation: "이상치가 있으면 평균 대신 중앙값을 병기하는 것이 안전합니다.",
      cols: ["통계량", "값"],
      rows: [["평균", mean(v).toFixed(4)], ["N", v.length]],
    };
  }

  if (/중앙값|median/i.test(techName)) {
    const v = nums(rows.map((r) => r[0]));
    return {
      summary: `중앙값=${median(v).toFixed(3)}`,
      interpretation: "치우친 분포에서 대표값으로 적합합니다.",
      cols: ["통계량", "값"],
      rows: [["중앙값", median(v).toFixed(4)]],
    };
  }

  if (/표준편차|분산/i.test(techName)) {
    const v = nums(rows.map((r) => r[0]));
    return {
      summary: `M=${mean(v).toFixed(2)}, SD=${sd(v).toFixed(3)}`,
      interpretation: "집단 간 SD를 비교할 때는 측정 단위가 동일한지 확인하세요.",
      cols: ["통계량", "값"],
      rows: [["평균", mean(v).toFixed(4)], ["표준편차", sd(v).toFixed(4)], ["분산", (sd(v) ** 2).toFixed(4)]],
    };
  }

  if (/왜도|skew/i.test(techName)) {
    const v = nums(rows.map((r) => r[0]));
    const sk = skew(v);
    return {
      summary: `왜도=${sk.toFixed(3)}`,
      interpretation: Math.abs(sk) <= 2 ? "±2 기준 내 — 정규성 보조지표로 무난합니다." : "±2 초과 — 변환 또는 비모수 대안을 검토하세요.",
      stats: { skewness: sk },
    };
  }

  if (/첨도|kurt/i.test(techName)) {
    const v = nums(rows.map((r) => r[0]));
    const ku = kurt(v);
    return {
      summary: `첨도(초과)=${ku.toFixed(3)}`,
      interpretation: Math.abs(ku) <= 3 ? "±3 기준 내 — 정규성 보조지표로 무난합니다." : "꼬리가 두꺼우거나 뾰족할 수 있습니다.",
      stats: { kurtosis: ku },
    };
  }

  if (/표본크기|결측/i.test(techName)) {
    const flat = rows.flat();
    const missing = flat.filter((x) => x === "" || x === "NA" || x === "-999").length;
    return {
      summary: `유효 N=${flat.length - missing}, 결측=${missing}`,
      interpretation: "결측 처리 규칙을 방법 섹션에 명시하세요.",
      cols: ["항목", "값"],
      rows: [["관측치", flat.length], ["결측", missing], ["유효", flat.length - missing]],
    };
  }

  if (/Z-score|표준점수/i.test(techName)) {
    const v = nums(rows.map((r) => r[0]));
    const m = mean(v);
    const s = sd(v);
    const z = v.map((x) => (s ? ((x - m) / s).toFixed(3) : "0"));
    return {
      summary: "표준점수 산출",
      interpretation: "서로 다른 척도의 상대 위치 비교에 사용합니다.",
      cols: ["원점수", "Z"],
      rows: v.map((x, i) => [x, z[i]]),
    };
  }

  if (/상관|correlation/i.test(techName)) {
    const cols = headers.map((_, ci) => nums(rows.map((r) => r[ci])));
    return {
      summary: "상관행렬",
      interpretation: "r>|.8| 쌍은 VIF 점검으로 이어가세요.",
      cols: ["", ...headers],
      rows: corMatrix(cols, headers),
    };
  }

  if (/Cronbach|내적일관성/i.test(techName)) {
    const cols = headers.map((_, ci) => nums(rows.map((r) => r[ci])));
    const a = cronbachAlpha(cols);
    return {
      summary: `Cronbach α = ${a.toFixed(3)}`,
      interpretation: a >= 0.7 ? "내적일관성 0.7 이상 — 척도 사용에 무리가 적습니다." : "0.7 미만 — 문항 정제를 검토하세요.",
      stats: { alpha: a },
    };
  }

  if (/t-검정|t검정/i.test(techName)) {
    const gi = headers.findIndex((h) => /group|집단/i.test(h));
    const vi = headers.findIndex((h) => /score|value|점수/i.test(h));
    const gcol = gi >= 0 ? gi : 0;
    const vcol = vi >= 0 ? vi : 1;
    const keys = [...new Set(rows.map((r) => r[gcol]))].slice(0, 2);
    const a = nums(rows.filter((r) => r[gcol] === keys[0]).map((r) => r[vcol]));
    const b = nums(rows.filter((r) => r[gcol] === keys[1]).map((r) => r[vcol]));
    const t = welchT(a, b);
    return {
      summary: `Welch t=${t.t.toFixed(3)}, df≈${t.df.toFixed(1)}, d=${t.cohensD.toFixed(3)}`,
      interpretation: "p값·등분산·정규성은 가정검토 단계와 함께 보고하세요.",
      cols: ["집단", "n", "평균", "SD"],
      rows: [
        [keys[0], a.length, mean(a).toFixed(2), sd(a).toFixed(3)],
        [keys[1], b.length, mean(b).toFixed(2), sd(b).toFixed(3)],
      ],
      stats: { t: t.t, df: t.df, cohensD: t.cohensD },
    };
  }

  if (/ANOVA/i.test(techName) && !/MANOVA/i.test(techName)) {
    const groups = new Map<string, number[]>();
    rows.forEach((r) => {
      const g = r[0];
      const v = parseFloat(r[1]);
      if (!g || Number.isNaN(v)) return;
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(v);
    });
    const keys = [...groups.keys()];
    const grand = nums(rows.map((r) => r[1]));
    const gm = mean(grand);
    let ssB = 0;
    let ssW = 0;
    groups.forEach((arr) => {
      ssB += arr.length * (mean(arr) - gm) ** 2;
      arr.forEach((v) => {
        ssW += (v - mean(arr)) ** 2;
      });
    });
    const dfB = keys.length - 1;
    const dfW = grand.length - keys.length;
    const F = dfW ? (ssB / dfB) / (ssW / dfW) : 0;
    return {
      summary: `일원분산 F=${F.toFixed(3)} (df=${dfB},${dfW})`,
      interpretation: "유의 시 Tukey·Bonferroni 사후검정을 검토하세요.",
      cols: ["집단", "n", "평균"],
      rows: keys.map((k) => [k, groups.get(k)!.length, mean(groups.get(k)!).toFixed(2)]),
      stats: { F, dfBetween: dfB, dfWithin: dfW },
    };
  }

  if (/회귀/i.test(techName) && !/로지스틱/i.test(techName)) {
    const y = nums(rows.map((r) => r[0]));
    const xs = headers.slice(1).map((_, ci) => nums(rows.map((r) => r[ci + 1])));
    const fit = ols(y, xs);
    return {
      summary: `OLS R²=${fit.r2.toFixed(3)}`,
      interpretation: "계수 해석과 VIF를 함께 보고하세요.",
      cols: ["항목", "계수"],
      rows: [["절편", fit.beta[0].toFixed(4)], ...xs.map((_, i) => [`β(${headers[i + 1]})`, fit.beta[i + 1].toFixed(4)])],
      stats: { r2: fit.r2 },
    };
  }

  if (/카이|chi/i.test(techName)) {
    const ct = crosstab(headers[0], headers[1], rows);
    const chi = chiSquareFromCrosstab(ct);
    return {
      summary: `χ²=${chi.chi2.toFixed(3)}, df=${chi.df}`,
      interpretation: "효과크기(Cramér's V)와 잔차분석을 보완하세요.",
      cols: ct.columns,
      rows: ct.rows,
      stats: { chi2: chi.chi2, df: chi.df },
    };
  }

  const v = nums(rows.map((r) => r[r.length - 1] || r[0]));
  if (v.length) {
    return {
      summary: `${techName} — 기술통계 요약`,
      interpretation: phaseId === "diagnostic"
        ? "검정통계량은 자동 산출되었습니다. 임계값·대안기법은 연구자 판단입니다."
        : "논문 표에 N과 함께 보고하세요.",
      cols: ["통계량", "값"],
      rows: [
        ["N", v.length],
        ["평균", mean(v).toFixed(4)],
        ["SD", sd(v).toFixed(4)],
        ["중앙값", median(v).toFixed(4)],
      ],
    };
  }

  return { summary: techName, interpretation: "지원되는 CSV 형식을 확인하거나 AI 샘플 작성을 사용하세요." };
}
