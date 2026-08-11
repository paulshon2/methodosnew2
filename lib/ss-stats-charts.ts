import type { CaChartSpec } from "./ca-charts";
import type { SsAutoResult } from "./ss-stats-automation";

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
  return { headers, rows };
}

function nums(col: string[]) {
  return col.map((x) => parseFloat(x)).filter((n) => !Number.isNaN(n));
}

function freq(values: string[]) {
  const m = new Map<string, number>();
  values.filter((v) => v !== "").forEach((v) => m.set(v, (m.get(v) || 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

/** 기법·CSV·분석결과에 맞는 시각화 스펙 생성 */
export function buildSsChartSpec(
  phaseId: string,
  techName: string,
  csvText: string,
  result: SsAutoResult | null,
): CaChartSpec | null {
  const { headers, rows } = parseCsv(csvText);
  if (!headers.length) return null;

  // 결과 표가 빈도형이면 막대
  if (result?.cols && result.rows && /빈도|비율/.test(result.cols.join(","))) {
    const labels = result.rows.map((r) => String(r[0]));
    const values = result.rows.map((r) => Number(r[1]) || 0);
    return {
      type: "bar",
      title: `${techName} — 범주별 빈도`,
      labels,
      series: [{ name: "빈도", values }],
      note: "막대 높이 = 해당 범주 응답 수",
    };
  }

  if (/교차|카이|crosstab|chi/i.test(techName) && headers.length >= 2) {
    const aVals = [...new Set(rows.map((r) => r[0]).filter(Boolean))];
    const bVals = [...new Set(rows.map((r) => r[1]).filter(Boolean))];
    const series = aVals.map((a) => ({
      name: String(a),
      values: bVals.map((b) => rows.filter((r) => r[0] === a && r[1] === b).length),
    }));
    return {
      type: "grouped",
      title: `${headers[0]} × ${headers[1]} 교차 빈도`,
      labels: aVals,
      cols: bVals,
      series,
      note: "묶음 막대 = 두 범주 조합의 응답 수",
    };
  }

  if (/빈도/i.test(techName)) {
    // 첫 분석 열(ID 제외) 또는 지정 열
    const colIdx = headers.findIndex((h) => !/^id$/i.test(h));
    const idx = colIdx >= 0 ? colIdx : 0;
    const entries = freq(rows.map((r) => r[idx]));
    return {
      type: "bar",
      title: `${headers[idx]} 빈도 분포`,
      labels: entries.map(([k]) => k),
      series: [{ name: "빈도", values: entries.map(([, c]) => c) }],
      note: "범주형 코딩값별 응답 수(코딩표와 함께 해석)",
    };
  }

  if (/상관|VIF|다중공선/i.test(techName) && headers.length >= 2) {
    const cols = headers.map((_, ci) => nums(rows.map((r) => r[ci])));
    const n = Math.min(3, cols.length);
    const labels = headers.slice(0, n);
    // 첫 두 열 산점도
    if (cols[0].length && cols[1]?.length) {
      return {
        type: "scatter",
        title: `${headers[0]} vs ${headers[1]}`,
        labels: cols[0].map(String),
        series: [
          { name: headers[0], values: cols[0] },
          { name: headers[1], values: cols[1].slice(0, cols[0].length) },
        ],
        note: "점이 대각선에 몰리면 상관이 큽니다",
      };
    }
    return {
      type: "bar",
      title: "변수 요약",
      labels,
      series: [{ name: "평균", values: cols.slice(0, n).map((c) => (c.length ? c.reduce((a, b) => a + b, 0) / c.length : 0)) }],
    };
  }

  if (/회귀|t-검정|ANOVA|평균|중앙|분산|표준|왜도|첨도|Z|백분위|범위|IQR|CV|SE|CI|정규|이상치|Box|Levene|Cronbach|문항/i.test(techName)
    || phaseId === "diagnostic" || phaseId === "inferential") {
    // 연속형: 마지막 숫자열 또는 score열
    let idx = headers.findIndex((h) => /score|value|y|만족|Satisfaction/i.test(h));
    if (idx < 0) {
      for (let i = headers.length - 1; i >= 0; i--) {
        if (nums(rows.map((r) => r[i])).length >= 3) { idx = i; break; }
      }
    }
    if (idx < 0) idx = 0;
    const v = nums(rows.map((r) => r[idx]));
    if (v.length < 2) return null;

    if (/회귀/i.test(techName) && headers.length >= 2) {
      const x = nums(rows.map((r) => r[1]));
      const y = nums(rows.map((r) => r[0]));
      const n = Math.min(x.length, y.length);
      return {
        type: "scatter",
        title: "회귀 산점도 (Y vs X1)",
        labels: x.slice(0, n).map(String),
        series: [
          { name: "X", values: x.slice(0, n) },
          { name: "Y", values: y.slice(0, n) },
        ],
        note: "직선 경향이 보이면 선형 관계가 있을 수 있습니다",
      };
    }

    if (/t-검정|ANOVA|등분산|Levene/i.test(techName) && headers.length >= 2) {
      const gIdx = headers.findIndex((h) => /group|집단|Gender/i.test(h));
      const gi = gIdx >= 0 ? gIdx : 0;
      const vi = gi === 0 ? 1 : idx;
      const groups = new Map<string, number[]>();
      rows.forEach((r) => {
        const g = r[gi];
        const val = parseFloat(r[vi]);
        if (!g || Number.isNaN(val)) return;
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g)!.push(val);
      });
      const keys = [...groups.keys()];
      if (keys.length >= 2) {
        return {
          type: "bar",
          title: "집단별 평균 비교",
          labels: keys,
          series: [{
            name: "평균",
            values: keys.map((k) => {
              const a = groups.get(k)!;
              return a.reduce((s, x) => s + x, 0) / a.length;
            }),
          }],
          note: "막대 = 집단 평균(등분산·정규성 가정과 함께 해석)",
        };
      }
    }

    if (/이상치|Box/i.test(techName)) {
      return {
        type: "boxplot",
        title: `${headers[idx]} 상자그림`,
        labels: [headers[idx]],
        series: [{ name: headers[idx], values: v }],
        note: "상자 밖 점은 이상치 후보일 수 있습니다",
      };
    }

    // 히스토그램: 원자료를 넘겨 CaChart가 구간화
    return {
      type: "histogram",
      title: `${headers[idx]} 분포`,
      labels: v.map(String),
      series: [{ name: "값", values: v }],
      note: /왜도|첨도|정규/i.test(techName)
        ? "분포 모양으로 왜도·정규성을 가늠합니다"
        : "구간별 관측 수(히스토그램)",
    };
  }

  // 기본: 첫 범주 열 빈도
  const entries = freq(rows.map((r) => r[0]));
  if (!entries.length) return null;
  return {
    type: "bar",
    title: `${headers[0]} 분포`,
    labels: entries.map(([k]) => k),
    series: [{ name: "빈도", values: entries.map(([, c]) => c) }],
  };
}
