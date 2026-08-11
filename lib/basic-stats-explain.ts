/**
 * 기본통계 — 결과·검증·수식·통계량 쉬운 설명 (화면 표시용)
 * ※ 프로그램 문구에 ‘초등학생’ 등 메타 표현을 넣지 않음
 */
import type { CaChartSpec } from "@/lib/ca-charts";
import type { VerifyCheck, VerifyReport } from "@/lib/stats-verify-filter";

export const STAT_KEY_KO: Record<string, { name: string; meaning: string }> = {
  t: { name: "t값 (검정통계량)", meaning: "두 집단 평균 차이가 ‘우연히 나올 법한 크기’인지 재는 점수입니다. 절댓값이 클수록 차이가 뚜렷합니다." },
  df: { name: "자유도 (df)", meaning: "계산에 쓸 수 있는 ‘여유 정보’의 양입니다. 표본이 많을수록 보통 커집니다." },
  p: { name: "p값 (유의확률)", meaning: "‘사실 차이가 없는데도 이런 결과가 나올 확률’의 느낌입니다. 보통 0.05보다 작으면 차이가 있다고 말합니다." },
  pValue: { name: "p값", meaning: "우연으로 이런 결과가 나올 가능성입니다. 작을수록 ‘우연만으로는 설명하기 어렵다’는 뜻입니다." },
  mean: { name: "평균", meaning: "점수들을 모두 더해 개수로 나눈 가운데 값입니다." },
  mean1: { name: "집단1 평균", meaning: "첫 번째 집단의 점수 평균입니다." },
  mean2: { name: "집단2 평균", meaning: "두 번째 집단의 점수 평균입니다." },
  sd: { name: "표준편차 (SD)", meaning: "점수들이 평균 주변으로 얼마나 흩어져 있는지를 나타냅니다." },
  se: { name: "표준오차 (SE)", meaning: "표본 평균이 진짜 평균에서 얼마나 흔들릴 수 있는지 가늠하는 값입니다." },
  F: { name: "F값", meaning: "여러 집단(또는 모형) 차이를 한 번에 비교할 때 쓰는 점수입니다. 클수록 집단 간 차이가 큽니다." },
  dfb: { name: "집단 간 자유도", meaning: "집단 개수에 따른 자유도입니다. (보통 집단수−1)" },
  dfw: { name: "집단 내 자유도", meaning: "각 집단 안 흩어짐에 쓰는 자유도입니다." },
  SSB: { name: "집단 간 제곱합", meaning: "집단 평균들이 전체 평균과 얼마나 다른지를 모은 양입니다." },
  SSW: { name: "집단 내 제곱합", meaning: "같은 집단 안 사람들이 서로 얼마나 다른지를 모은 양입니다." },
  SST: { name: "전체 제곱합", meaning: "모든 점수 흩어짐의 총량입니다. SSB+SSW와 같아야 합니다." },
  r: { name: "상관계수 r", meaning: "두 변수가 함께 움직이는 정도(−1~+1)입니다. 0에 가까우면 거의 무관합니다." },
  pearson: { name: "Pearson 상관계수", meaning: "직선 관계의 세기를 −1~+1로 나타낸 값입니다." },
  alpha: { name: "Cronbach α (알파)", meaning: "문항들이 같은 개념을 재는지 보는 일관성 점수입니다. 보통 0.7 이상이면 괜찮다고 봅니다." },
  auc: { name: "AUC", meaning: "분류가 얼마나 잘 맞는지 보여주는 넓이입니다. 0.5는 동전 던지기, 1에 가까울수록 좋습니다." },
  chi2: { name: "카이제곱(χ²)", meaning: "표에서 ‘예상과 실제’가 얼마나 다른지 재는 점수입니다." },
  N: { name: "표본 수 N", meaning: "분석에 들어간 사람(또는 행) 수입니다." },
  n: { name: "표본 수 n", meaning: "분석에 들어간 관측 수입니다." },
  categories: { name: "범주 수", meaning: "서로 다른 답(범주)이 몇 가지인지입니다." },
  eig1: { name: "제1 고유값", meaning: "가장 큰 ‘묶음 설명력’입니다. 요인·주성분에서 첫 축의 세기입니다." },
  explained1: { name: "제1축 설명 %", meaning: "첫 축이 전체 흩어짐의 몇 %를 설명하는지입니다." },
  silhouette: { name: "실루엣 계수", meaning: "군집이 얼마나 또렷하게 나뉘었는지(−1~1)입니다. 클수록 좋습니다." },
  Q1: { name: "1사분위(Q1)", meaning: "아래쪽 25% 지점의 값입니다." },
  Q2: { name: "중위수(Q2)", meaning: "한가운데 값입니다. 평균보다 극단에 덜 흔들립니다." },
  Q3: { name: "3사분위(Q3)", meaning: "위쪽 25% 지점의 값입니다." },
  IQR: { name: "사분위범위(IQR)", meaning: "Q3−Q1로, 가운데 50%가 얼마나 퍼져 있는지입니다." },
  _t2EqualsF: { name: "t² = F 확인", meaning: "두 집단 t검정의 t²와 분산분석 F가 같은지 검산한 결과입니다. true면 계산이 맞습니다." },
  verifyGrade: { name: "검증 등급", meaning: "자체 검산(앵커·일관성) 통과 수준입니다. pass가 가장 좋습니다." },
  verifyScore: { name: "검증 점수", meaning: "검산 항목 중 통과 비율(0~1)입니다. 1에 가까울수록 좋습니다." },
  HotellingT2: { name: "Hotelling T²", meaning: "여러 점수를 한꺼번에 두 집단으로 비교할 때 쓰는 다변량 점수입니다." },
  Fapprox: { name: "근사 F", meaning: "T²를 익숙한 F 형태로 바꾼 값입니다." },
  M: { name: "통합 효과크기", meaning: "여러 연구를 모아 추정한 평균 효과입니다." },
  Q: { name: "이질성 Q", meaning: "연구들 결과가 서로 얼마나 다른지 보는 값입니다." },
  I2: { name: "I² (%)", meaning: "연구 간 차이가 ‘진짜 이질성’으로 설명되는 비율입니다." },
  mode: { name: "실행 모드", meaning: "데이터가 부족하거나 교육용 안내 모드인지 표시합니다." },
};

export const VERIFY_LAYER_KO: Record<string, string> = {
  anchor: "앵커 검산 — 알려진 정답(특수함수)으로 계산기가 제대로인지 확인",
  invariant: "불변 검산 — 수식상 항상 성립해야 하는 관계(예: 합 분해) 확인",
  consistency: "일관성 검산 — 같은 결과가 다른 공식으로도 맞는지 확인",
  boundary: "범위 검산 — p값처럼 0~1이어야 하는 값이 범위 안인지 확인",
};

const VERIFY_LABEL_KO: { re: RegExp; ko: string }[] = [
  { re: /Φ\(0\)|phi\(0\)|normalCdf/i, ko: "정규분포에서 가운데(0)까지의 확률은 정확히 ½이어야 합니다." },
  { re: /betainc/i, ko: "베타 불완전함수의 특수 경우(매개변수 1,1)는 입력값과 같아야 합니다. p값 계산의 뼈대입니다." },
  { re: /erf\(0\)/i, ko: "오차함수 erf(0)은 0이어야 합니다. 정규분포 계산에 쓰입니다." },
  { re: /lgamma\(5\)|ln\(24\)/i, ko: "감마함수의 로그값 검산입니다. 팩토리얼·카이제곱 계산의 기초입니다." },
  { re: /χ²|chi|gammainc/i, ko: "카이제곱 누적확률(감마 불완전함수)이 알려진 값과 같은지 확인합니다." },
  { re: /Cauchy|t\(df=1\)/i, ko: "자유도 1인 t분포는 코시분포와 같아야 합니다. t검정 p값 엔진 검산입니다." },
  { re: /p ∈|p\s*in/i, ko: "p값은 반드시 0과 1 사이여야 합니다." },
  { re: /t²\s*=\s*F|t2.*F/i, ko: "두 집단일 때 t²와 F는 같은 뜻입니다. 숫자가 맞으면 계산이 일관됩니다." },
  { re: /SST|SSB|SSW/i, ko: "전체 흩어짐 = 집단 간 흩어짐 + 집단 내 흩어짐이어야 합니다." },
  { re: /X.?T.?e|잔차|residual/i, ko: "회귀에서 설명변수와 잔차는 직교(곱의 합≈0)해야 합니다." },
];

export function explainVerifyCheck(c: VerifyCheck): string {
  const hit = VERIFY_LABEL_KO.find((x) => x.re.test(c.label) || (c.detail ? x.re.test(c.detail) : false));
  const layer = VERIFY_LAYER_KO[c.layer] || c.layer;
  const tip = hit?.ko || "계산기가 약속된 규칙을 지키는지 확인하는 항목입니다.";
  return `${layer}. ${tip}${c.detail ? ` (세부: ${c.detail})` : ""}`;
}

export function formatStatRows(
  stats: Record<string, number | string | boolean> | undefined,
): { key: string; value: string; name: string; meaning: string }[] {
  if (!stats) return [];
  return Object.entries(stats)
    .filter(([k]) => !/^_/i.test(k) || k === "_t2EqualsF")
    .map(([key, value]) => {
      const g = STAT_KEY_KO[key] || {
        name: key,
        meaning: "이 분석에서 산출된 수치입니다. 위 정식 결과·해석과 함께 보세요.",
      };
      return { key, value: String(value), name: g.name, meaning: g.meaning };
    });
}

export function buildFormalResultText(opts: {
  moduleName: string;
  englishName?: string;
  code?: string;
  summary: string;
  stats?: Record<string, number | string | boolean>;
  demoTitle?: string;
}): string {
  const { moduleName, englishName, code, summary, stats, demoTitle } = opts;
  const lines: string[] = [];
  lines.push(`【정식 결과】${moduleName}${englishName ? ` · ${englishName}` : ""}${code ? ` (${code})` : ""}`);
  if (demoTitle) lines.push(`【사용 데이터】${demoTitle}`);
  lines.push(`【한줄 요약】${summary.replace(/\s*·\s*[✅⚠❌].*$/, "").trim()}`);
  if (stats) {
    const interesting = ["t", "F", "df", "dfb", "dfw", "p", "mean1", "mean2", "r", "pearson", "alpha", "chi2", "auc", "N"];
    const bits = interesting
      .filter((k) => stats[k] !== undefined)
      .map((k) => {
        const g = STAT_KEY_KO[k];
        return `${g?.name || k} = ${stats[k]}`;
      });
    if (bits.length) lines.push(`【핵심 수치】${bits.join(" · ")}`);
    const p = stats.p ?? stats.pValue;
    if (p !== undefined && Number.isFinite(Number(p))) {
      const pv = Number(p);
      lines.push(
        pv < 0.05
          ? `【판정】p=${pv}로 통상 기준(0.05)보다 작아, ‘차이가 없다/관계가 없다’는 가정을 유지하기 어렵습니다.`
          : `【판정】p=${pv}로 통상 기준(0.05)보다 크거나 같아, 이번 표본만으로는 뚜렷한 차이를 단정하기 어렵습니다.`,
      );
    }
  }
  return lines.join("\n");
}

export function buildEasyResultText(opts: {
  moduleName: string;
  stats?: Record<string, number | string | boolean>;
  interpretation?: string;
}): string {
  const { moduleName, stats } = opts;
  const lines: string[] = [];
  lines.push(`【쉽게 읽기】「${moduleName}」 결과를 일상 말로 풀면 다음과 같습니다.`);
  if (stats?.mean1 !== undefined && stats?.mean2 !== undefined) {
    lines.push(
      `· 한 집단 평균은 ${stats.mean1}, 다른 집단 평균은 ${stats.mean2}입니다. 두 숫자 차이가 우연인지, 의미 있는 차이인지 검정합니다.`,
    );
  }
  if (stats?.t !== undefined) {
    lines.push(`· t값 ${stats.t}는 ‘평균 차이를 흩어짐으로 나눈 점수’입니다. 절댓값이 클수록 차이가 또렷합니다.`);
  }
  if (stats?.F !== undefined && stats?.t === undefined) {
    lines.push(`· F값 ${stats.F}는 집단(또는 모형) 차이를 한 번에 보는 점수입니다.`);
  }
  if (stats?.p !== undefined) {
    const pv = Number(stats.p);
    lines.push(
      Number.isFinite(pv)
        ? `· p값 ${pv}는 ‘우연히 이런 차이가 나올 법한가’를 나타냅니다. 0.05보다 작으면 보통 “차이가 있다”고 보고합니다.`
        : `· p값을 함께 보고 판단합니다.`,
    );
  }
  if (stats?.r !== undefined || stats?.pearson !== undefined) {
    const r = stats.r ?? stats.pearson;
    lines.push(`· 상관계수 ${r}는 두 변수가 함께 움직이는 세기입니다. 0에 가까우면 거의 무관합니다.`);
  }
  if (stats?.alpha !== undefined) {
    lines.push(`· 신뢰도 α=${stats.alpha}는 문항들이 한 개념을 일관되게 재는지 봅니다.`);
  }
  if (stats?._t2EqualsF !== undefined) {
    lines.push(
      `· t²=F 검산이 ${stats._t2EqualsF}입니다. true면 서로 다른 공식으로도 같은 결론이라 계산이 믿을 만합니다.`,
    );
  }
  lines.push(`· 아래 검증 항목은 “계산기가 약속된 규칙을 지키는지” 스스로 확인한 성적표입니다.`);
  return lines.join("\n");
}

export function buildVerifyPlain(report?: VerifyReport): string {
  if (!report) return "";
  const ok = report.checks.filter((c) => c.ok).length;
  const n = report.checks.length;
  return [
    `【검증 성적표】${report.summary}`,
    `통과 ${ok}/${n} · 등급 ${report.grade} · 점수 ${Math.round(report.score * 1000) / 1000}`,
    "각 항목은 외부 프로그램 없이, 알려진 정답·수식 규칙으로 결과를 검산합니다.",
  ].join("\n");
}

/** 결과가 차트를 안 줄 때 CSV·통계로 기본 시각화 생성 */
export function ensureCharts(
  primary: CaChartSpec | undefined,
  stats: Record<string, number | string | boolean> | undefined,
  csv: string,
  title: string,
): CaChartSpec[] {
  const list: CaChartSpec[] = [];
  if (primary?.labels?.length) list.push({ ...primary, title: primary.title || title });

  if (stats?.mean1 !== undefined && stats?.mean2 !== undefined) {
    list.push({
      type: "bar",
      title: `${title} · 집단 평균 비교`,
      labels: ["집단1", "집단2"],
      series: [{ name: "평균", values: [Number(stats.mean1), Number(stats.mean2)] }],
      note: "두 집단 평균을 막대로 비교합니다.",
    });
    list.push({
      type: "hbar",
      title: `${title} · 가로 막대 비교`,
      labels: ["집단1", "집단2"],
      series: [{ name: "평균", values: [Number(stats.mean1), Number(stats.mean2)] }],
    });
    list.push({
      type: "lollipop",
      title: `${title} · 롤리팝`,
      labels: ["집단1", "집단2"],
      series: [{ name: "평균", values: [Number(stats.mean1), Number(stats.mean2)] }],
    });
  }

  // CSV 첫 수치열 히스토그램 근사
  const lines = (csv || "").trim().split(/\r?\n/).filter(Boolean);
  if (lines.length > 2) {
    const headers = lines[0].split(",");
    const rows = lines.slice(1).map((l) => l.split(","));
    let numIdx = headers.findIndex((h, i) => i > 0 && rows.every((r) => r[i] === "" || /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test((r[i] || "").trim())));
    if (numIdx < 0) numIdx = headers.findIndex((h) => !/^id$/i.test(h));
    if (numIdx >= 0) {
      const vals = rows.map((r) => parseFloat(r[numIdx])).filter((v) => Number.isFinite(v));
      if (vals.length >= 4) {
        const lo = Math.min(...vals);
        const hi = Math.max(...vals);
        const bins = 5;
        const w = (hi - lo) / bins || 1;
        const counts = Array.from({ length: bins }, () => 0);
        vals.forEach((v) => {
          let b = Math.min(bins - 1, Math.floor((v - lo) / w));
          if (b < 0) b = 0;
          counts[b]++;
        });
        const labels = counts.map((_, i) => `${(lo + i * w).toFixed(0)}–${(lo + (i + 1) * w).toFixed(0)}`);
        list.push({
          type: "histogram",
          title: `${title} · 분포(히스토그램)`,
          labels,
          series: [{ name: "빈도", values: counts }],
          note: `${headers[numIdx]} 분포`,
        });
        list.push({
          type: "boxplot",
          title: `${title} · 상자그림 요약`,
          labels: [headers[numIdx]],
          series: [{ name: "값", values: vals.slice(0, 40) }],
        });
      }
    }
    // 범주 빈도
    const catIdx = headers.findIndex((h) => /group|집단|학년|부서/i.test(h)) >= 0
      ? headers.findIndex((h) => /group|집단|학년|부서/i.test(h))
      : headers.findIndex((h) => !/^id$/i.test(h) && rows.some((r) => Number.isNaN(parseFloat(r[headers.indexOf(h)]))));
    if (catIdx >= 0) {
      const m = new Map<string, number>();
      rows.forEach((r) => {
        const k = r[catIdx] || "(빈칸)";
        m.set(k, (m.get(k) || 0) + 1);
      });
      const entries = [...m.entries()].slice(0, 8);
      if (entries.length >= 2) {
        list.push({
          type: "pie",
          title: `${title} · 구성비`,
          labels: entries.map(([k]) => k),
          series: [{ name: "빈도", values: entries.map(([, v]) => v) }],
        });
        list.push({
          type: "donut",
          title: `${title} · 도넛`,
          labels: entries.map(([k]) => k),
          series: [{ name: "빈도", values: entries.map(([, v]) => v) }],
        });
      }
    }
  }

  // 중복 타입 제거·최대 10
  const seen = new Set<string>();
  const out: CaChartSpec[] = [];
  for (const c of list) {
    const key = `${c.type}:${(c.labels || []).join(",")}:${c.series?.[0]?.values?.slice(0, 3).join(",")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= 10) break;
  }
  return out;
}
