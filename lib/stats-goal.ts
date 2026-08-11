/**
 * "무엇을 알고 싶은가"에서 출발해 검정을 고르는 층.
 *
 * 계산 자체는 절대 새로 구현하지 않는다. 핵심 통계량은 검증된 엔진
 * (`runBasicStats` → `runStats47`)을 호출하고, 엔진에 없는 가정 점검·효과크기만
 * `lib/stats-core/techniques/*`의 순수 함수로 덧붙인다.
 */
import { runBasicStats, type BsResult, type BsTable } from "@/lib/basic-stats-engine";
import {
  cohensD,
  cohensDz,
  correlationEffect,
  cramersV,
  crosstab,
  dagostinoPearson,
  describeVec,
  etaSquared,
  leveneBrownForsythe,
  meanOf,
  omegaSquared,
  pairwiseT,
  sdOf,
  spearman,
  welchT,
  type Describe,
  type EffectSize,
} from "@/lib/stats-core";

/* ─────────────────────────── 자료 ─────────────────────────── */

export type VarType = "num" | "cat";

export type Variable = {
  name: string;
  index: number;
  type: VarType;
  /** 결측을 제외한 문자열 값. */
  values: string[];
  /** 수치 변수일 때만 채워진다. */
  numbers: number[];
  levels: string[];
  missing: number;
};

export type Dataset = { headers: string[]; rows: string[][]; variables: Variable[]; n: number };

const MISSING = new Set(["", "na", "n/a", "null", "none", "-", "."]);

function isMissing(v: string): boolean {
  return MISSING.has((v ?? "").trim().toLowerCase());
}

/** 열 하나를 보고 수치인지 범주인지 정한다. 90% 이상이 숫자면 수치로 본다. */
export function buildDataset(headers: string[], rows: string[][]): Dataset {
  const variables = headers.map((name, index) => {
    const raw = rows.map((r) => (r[index] ?? "").trim());
    const values = raw.filter((v) => !isMissing(v));
    const parsed = values.map((v) => Number(v));
    const numericCount = parsed.filter((v) => Number.isFinite(v)).length;
    const looksNumeric = values.length > 0 && numericCount >= values.length * 0.9;
    const levels = [...new Set(values)];
    // 0/1처럼 값이 두세 개뿐인 숫자열은 사실상 범주다.
    const type: VarType = looksNumeric && !(levels.length <= 2 && values.length > 8) ? "num" : "cat";
    return {
      name,
      index,
      type,
      values,
      numbers: type === "num" ? parsed.filter((v) => Number.isFinite(v)) : [],
      levels,
      missing: raw.length - values.length,
    };
  });
  return { headers, rows, variables, n: rows.length };
}

export function variableByName(ds: Dataset, name: string | undefined): Variable | null {
  if (!name) return null;
  return ds.variables.find((v) => v.name === name) ?? null;
}

/* ─────────────────────────── 목적 6종 ─────────────────────────── */

export type GoalId = "describe" | "two" | "paired" | "anova" | "corr" | "chi";

export type SlotSpec = {
  key: string;
  label: string;
  hint: string;
  accepts: (v: Variable) => boolean;
};

export type GoalSpec = {
  id: GoalId;
  label: string;
  sub: string;
  example: string;
  slots: SlotSpec[];
  /** 사용자가 검정 이름을 몰라도 되도록, 결과에서만 밝힌다. */
  testName: string;
};

const isNum = (v: Variable) => v.type === "num";
const isCat = (v: Variable) => v.type === "cat";
const catWith = (min: number, max = Infinity) => (v: Variable) =>
  v.type === "cat" && v.levels.length >= min && v.levels.length <= max;

export const GOALS: GoalSpec[] = [
  {
    id: "describe",
    label: "한 변수를 요약하고 싶다",
    sub: "평균·표준편차·분포 모양",
    example: "예: 만족도 점수는 대체로 어느 수준인가",
    testName: "기술통계 + 정규성 점검",
    slots: [{ key: "y", label: "요약할 변수", hint: "숫자 변수", accepts: isNum }],
  },
  {
    id: "two",
    label: "두 집단의 평균을 비교하고 싶다",
    sub: "예: 남녀 점수 차이",
    example: "집단이 둘인 범주 변수와 점수 변수가 필요합니다",
    testName: "독립표본 t (등분산이 깨지면 Welch)",
    slots: [
      { key: "y", label: "비교할 점수", hint: "숫자 변수", accepts: isNum },
      { key: "g", label: "집단 변수", hint: "값이 두 종류인 범주 변수", accepts: catWith(2, 2) },
    ],
  },
  {
    id: "paired",
    label: "같은 사람의 전후를 비교하고 싶다",
    sub: "예: 사전 vs 사후",
    example: "같은 사람에게서 두 번 측정한 두 열이 필요합니다",
    testName: "대응표본 t",
    slots: [
      { key: "pre", label: "이전 측정", hint: "숫자 변수", accepts: isNum },
      { key: "post", label: "이후 측정", hint: "숫자 변수", accepts: isNum },
    ],
  },
  {
    id: "anova",
    label: "세 집단 이상을 비교하고 싶다",
    sub: "예: 대조·온라인·혼합",
    example: "집단이 셋 이상인 범주 변수가 필요합니다",
    testName: "일원배치 분산분석",
    slots: [
      { key: "y", label: "비교할 점수", hint: "숫자 변수", accepts: isNum },
      { key: "g", label: "집단 변수", hint: "값이 세 종류 이상인 범주 변수", accepts: catWith(3) },
    ],
  },
  {
    id: "corr",
    label: "두 변수의 관계를 보고 싶다",
    sub: "예: 학습시간과 점수",
    example: "숫자 변수 두 개가 필요합니다",
    testName: "Pearson 상관 (필요하면 Spearman)",
    slots: [
      { key: "x", label: "첫 번째 변수", hint: "숫자 변수", accepts: isNum },
      { key: "y", label: "두 번째 변수", hint: "숫자 변수", accepts: isNum },
    ],
  },
  {
    id: "chi",
    label: "두 범주의 관련성을 보고 싶다",
    sub: "예: 집단별 수료율",
    example: "범주 변수 두 개가 필요합니다",
    testName: "카이제곱 독립성 검정",
    slots: [
      { key: "a", label: "행 변수", hint: "범주 변수", accepts: isCat },
      { key: "b", label: "열 변수", hint: "범주 변수", accepts: isCat },
    ],
  },
];

export const GOAL_BY_ID: Record<GoalId, GoalSpec> = Object.fromEntries(
  GOALS.map((g) => [g.id, g]),
) as Record<GoalId, GoalSpec>;

/** 목록에는 이 분석에 쓸 수 있는 변수만 나온다. */
export function slotCandidates(ds: Dataset, goal: GoalId, slotKey: string, chosen: Record<string, string>): Variable[] {
  const spec = GOAL_BY_ID[goal];
  const slot = spec.slots.find((s) => s.key === slotKey);
  if (!slot) return [];
  const usedElsewhere = new Set(
    Object.entries(chosen)
      .filter(([k, v]) => k !== slotKey && v)
      .map(([, v]) => v),
  );
  return ds.variables.filter((v) => slot.accepts(v) && !usedElsewhere.has(v.name));
}

/** 각 슬롯에 후보가 있는지 — 없으면 목적 카드를 잠근다. */
export function goalFeasible(ds: Dataset, goal: GoalId): { ok: boolean; reason: string } {
  const spec = GOAL_BY_ID[goal];
  for (const slot of spec.slots) {
    if (!ds.variables.some((v) => slot.accepts(v))) {
      return { ok: false, reason: `${slot.label}에 쓸 수 있는 변수(${slot.hint})가 자료에 없습니다.` };
    }
  }
  if (spec.slots.length >= 2 && ds.variables.length < 2) {
    return { ok: false, reason: "변수가 두 개 이상 필요합니다." };
  }
  return { ok: true, reason: "" };
}

/* ─────────────────────────── 결과 ─────────────────────────── */

export type AssumptionItem = {
  id: string;
  label: string;
  /** 통과·주의·위반 — 색만이 아니라 이 낱말도 함께 보여 준다. */
  status: "ok" | "warn" | "risk" | "na";
  detail: string;
  /** 위반했을 때 무엇으로 갈아탈지 지목한다. */
  fix?: string;
};

export type KeyNumber = { label: string; value: string; hint: string };

export type GoalChart =
  | { kind: "hist"; values: number[]; label: string }
  | { kind: "bar"; labels: string[]; values: number[]; errors?: number[]; label: string }
  | { kind: "scatter"; points: { x: number; y: number }[]; xLabel: string; yLabel: string }
  | { kind: "box"; groups: { label: string; values: number[] }[]; label: string };

export type GoalResult = {
  goal: GoalId;
  chosenTest: string;
  /** 왜 이 검정이 골라졌는지 — 결과 맨 위에 그대로 띄운다. */
  why: string;
  switched: boolean;
  descriptives: BsTable | null;
  keyNumbers: KeyNumber[];
  effects: EffectSize[];
  tables: { title: string; table: BsTable; note?: string }[];
  charts: GoalChart[];
  apa: string;
  assumptions: AssumptionItem[];
  engine: BsResult;
};

/* 숫자 표기 — NaN·Infinity·undefined가 화면에 새어 나가지 않게 한 곳에서 막는다. */
export function num(v: unknown, digits = 2): string {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

/** APA: 소수점 앞 0을 지운다. */
export function apaDecimal(v: number, digits = 3): string {
  if (!Number.isFinite(v)) return "—";
  const s = Math.abs(v).toFixed(digits).replace(/^0/, "");
  return (v < 0 ? "-" : "") + s;
}

/** APA: p < .001은 .000으로 쓰지 않는다. */
export function apaP(p: number): string {
  if (!Number.isFinite(p)) return "p = —";
  return p < 0.001 ? "p < .001" : `p = ${apaDecimal(p, 3)}`;
}

function csvOf(cols: string[], rows: (string | number)[][]): string {
  return [cols.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function engineStat(res: BsResult, key: string): number {
  const v = res.stats?.[key];
  return typeof v === "number" ? v : Number.NaN;
}

function descRow(label: string, d: Describe): (string | number)[] {
  return [label, d.n, num(d.mean), num(d.sd), num(d.se), `[${num(d.ciLow)}, ${num(d.ciHigh)}]`];
}

const DESC_COLS = ["집단", "n", "M", "SD", "SE", "95% CI"];

function normalityAssumption(label: string, values: number[]): AssumptionItem {
  const r = dagostinoPearson(values);
  if (!r.usable) {
    return {
      id: `norm-${label}`,
      label: `정규성 · ${label}`,
      status: r.klineOk ? "ok" : "warn",
      detail: `표본이 ${r.n}개로 20 미만이라 검정 대신 왜도(${num(r.skew)})·첨도(${num(r.kurtosis)})로 판단합니다. 기준은 |왜도| < 2, |첨도| < 7입니다.`,
      fix: r.klineOk ? undefined : "정규성이 의심되면 Mann-Whitney U · Wilcoxon 부호순위 · Kruskal-Wallis 같은 순위 기반 방법을 쓰세요.",
    };
  }
  const violated = r.p < 0.05 && !r.klineOk;
  return {
    id: `norm-${label}`,
    label: `정규성 · ${label}`,
    status: violated ? "risk" : r.p < 0.05 ? "warn" : "ok",
    detail: `D'Agostino–Pearson K² = ${num(r.k2)}, ${apaP(r.p)} · 왜도 ${num(r.skew)}, 첨도 ${num(r.kurtosis)}.`,
    fix: violated
      ? "정규성 위배 → Mann-Whitney U(두 집단) · Wilcoxon 부호순위(대응) · Kruskal-Wallis(세 집단 이상)로 바꾸세요."
      : undefined,
  };
}

/* ─────────────────────────── 실행 ─────────────────────────── */

export function runGoal(ds: Dataset, goal: GoalId, chosen: Record<string, string>): GoalResult | null {
  const spec = GOAL_BY_ID[goal];
  const picked = spec.slots.map((s) => variableByName(ds, chosen[s.key]));
  if (picked.some((v) => !v)) return null;

  switch (goal) {
    case "describe":
      return runDescribe(picked[0]!);
    case "two":
      return runTwoGroup(ds, picked[0]!, picked[1]!);
    case "paired":
      return runPaired(ds, picked[0]!, picked[1]!);
    case "anova":
      return runAnova(ds, picked[0]!, picked[1]!);
    case "corr":
      return runCorrelation(ds, picked[0]!, picked[1]!);
    case "chi":
      return runChiSquare(ds, picked[0]!, picked[1]!);
    default:
      return null;
  }
}

function runDescribe(y: Variable): GoalResult {
  const values = y.numbers;
  const csv = csvOf([y.name], values.map((v) => [v]));
  const engine = runBasicStats("A-02", csv);
  const quart = runBasicStats("A-03", csv);
  const d = describeVec(values);
  const norm = dagostinoPearson(values);

  return {
    goal: "describe",
    chosenTest: "기술통계 + 정규성 점검",
    why: `「${y.name}」 한 변수를 요약하려 하셨으므로 평균·표준편차·분포 모양을 계산하고, 뒤에 이어질 분석을 위해 정규성을 함께 확인했습니다.`,
    switched: false,
    descriptives: { cols: DESC_COLS, rows: [descRow(y.name, d)] },
    keyNumbers: [
      { label: "n", value: String(d.n), hint: "결측을 뺀 유효 응답 수" },
      { label: "평균 M", value: num(d.mean), hint: "값을 모두 더해 개수로 나눈 값" },
      { label: "표준편차 SD", value: num(d.sd), hint: "평균에서 얼마나 흩어져 있는지" },
      { label: "중위수", value: num(d.median), hint: "가운데 값 — 평균과 크게 다르면 치우친 분포" },
      { label: "왜도", value: num(d.skew), hint: "|2| 넘으면 한쪽으로 치우침" },
      { label: "첨도", value: num(d.kurtosis), hint: "|7| 넘으면 꼬리가 두꺼움" },
    ],
    effects: [],
    tables: [
      {
        title: "사분위 요약",
        table: {
          cols: ["최솟값", "Q1", "중위수", "Q3", "최댓값", "IQR"],
          rows: [[num(d.min), num(d.q1), num(d.median), num(d.q3), num(d.max), num(d.q3 - d.q1)]],
        },
        note: `엔진 검산: ${quart.summary}`,
      },
    ],
    charts: [{ kind: "hist", values, label: y.name }],
    apa: `${y.name}의 평균은 ${num(d.mean)}(SD = ${num(d.sd)}, n = ${d.n})이었으며, 95% 신뢰구간은 [${num(d.ciLow)}, ${num(d.ciHigh)}]이었다.`,
    assumptions: [
      normalityAssumption(y.name, values),
      {
        id: "n",
        label: "표본 크기",
        status: d.n >= 30 ? "ok" : d.n >= 10 ? "warn" : "risk",
        detail: `유효 응답 ${d.n}개. 30개 미만이면 평균 추정이 불안정합니다.`,
        fix: d.n < 10 ? "표본을 더 모으거나, 요약 대신 개별 값을 그대로 제시하세요." : undefined,
      },
      {
        id: "norm-detail",
        label: "정규성 검정 사용 여부",
        status: norm.usable ? "ok" : "na",
        detail: norm.usable ? "표본이 20개 이상이라 K² 검정을 사용했습니다." : "표본이 20개 미만이라 검정 대신 왜도·첨도로 판단했습니다.",
      },
    ],
    engine,
  };
}

/** 집단 열과 점수 열을 행 단위로 짝지어, 한쪽이라도 비면 그 행을 버린다. */
function pairRows(rows: string[][], yIdx: number, gIdx: number): { g: string; y: number }[] {
  return rows
    .map((r) => ({ g: (r[gIdx] ?? "").trim(), y: Number((r[yIdx] ?? "").trim()) }))
    .filter((r) => r.g !== "" && Number.isFinite(r.y));
}

/** 숫자 열 두 개를 행 단위로 짝짓는다. */
function numPairs(rows: string[][], iA: number, iB: number): { a: number; b: number }[] {
  return rows
    .map((r) => ({ a: Number((r[iA] ?? "").trim()), b: Number((r[iB] ?? "").trim()) }))
    .filter((p) => Number.isFinite(p.a) && Number.isFinite(p.b));
}

function runTwoGroup(ds: Dataset, y: Variable, g: Variable): GoalResult {
  const rows = pairRows(ds.rows, y.index, g.index);
  const labels = [...new Set(rows.map((r) => r.g))].slice(0, 2);
  const a = rows.filter((r) => r.g === labels[0]).map((r) => r.y);
  const b = rows.filter((r) => r.g === labels[1]).map((r) => r.y);

  const csv = csvOf(["group", "score"], rows.map((r) => [r.g, r.y]));
  const engine = runBasicStats("C-02", csv);

  const lev = leveneBrownForsythe([a, b]);
  const switched = Number.isFinite(lev.p) && lev.p < 0.05;
  const student = { t: engineStat(engine, "t"), df: engineStat(engine, "df"), p: engineStat(engine, "p") };
  const welch = welchT(a, b);
  const used = switched ? welch : student;

  const da = describeVec(a);
  const db = describeVec(b);
  const eff = cohensD(a, b);

  return {
    goal: "two",
    chosenTest: switched ? "Welch 이분산 t검정" : "독립표본 t검정",
    why: switched
      ? `등분산 검정(Brown–Forsythe)에서 ${apaP(lev.p)}로 두 집단의 흩어짐이 다르다고 나왔기 때문에, 등분산을 가정하지 않는 Welch 검정으로 자동 전환했습니다.`
      : `집단이 둘이고 점수가 숫자이며, 등분산 검정에서 ${apaP(lev.p)}로 흩어짐이 비슷했기 때문에 독립표본 t검정을 사용했습니다.`,
    switched,
    descriptives: { cols: DESC_COLS, rows: [descRow(labels[0], da), descRow(labels[1], db)] },
    keyNumbers: [
      { label: "t", value: num(used.t), hint: "두 평균 차이를 흩어짐으로 나눈 값" },
      { label: "자유도 df", value: num(used.df, switched ? 1 : 0), hint: "표본 크기에서 정해지는 값" },
      { label: "p", value: apaDecimal(used.p, 3), hint: "차이가 없다고 가정했을 때 이 정도 차이가 나올 확률" },
      { label: "평균 차이", value: num(da.mean - db.mean), hint: `${labels[0]} − ${labels[1]}` },
    ],
    effects: [eff],
    tables: [
      {
        title: "등분산 점검 (Brown–Forsythe)",
        table: { cols: ["W", "df1", "df2", "p", "판정"], rows: [[num(lev.W), lev.df1, lev.df2, apaDecimal(lev.p, 3), lev.ok ? "등분산 유지" : "등분산 위배"]] },
        note: "중앙값 기준 Levene 검정입니다. p < .05면 Welch로 자동 전환합니다.",
      },
    ],
    charts: [
      { kind: "bar", labels: [labels[0], labels[1]], values: [da.mean, db.mean], errors: [da.se, db.se], label: `${y.name} 평균 (오차막대 = ±1 SE)` },
      { kind: "box", groups: [{ label: labels[0], values: a }, { label: labels[1], values: b }], label: `${y.name} 분포` },
    ],
    apa: apaTwoGroup(labels, da, db, y.name, used, eff, switched),
    assumptions: [
      {
        id: "levene",
        label: "등분산성",
        status: lev.ok ? "ok" : "warn",
        detail: `Brown–Forsythe W = ${num(lev.W)}, ${apaP(lev.p)}.`,
        fix: lev.ok ? undefined : "등분산 위배 → Welch t검정을 사용했습니다. 세 집단 이상이라면 Welch ANOVA + Games-Howell이 대응 방법입니다.",
      },
      normalityAssumption(labels[0], a),
      normalityAssumption(labels[1], b),
      {
        id: "indep",
        label: "독립성",
        status: "na",
        detail: "두 집단의 관측치가 서로 다른 대상에게서 나왔는지는 자료만으로 알 수 없습니다. 같은 사람을 두 번 측정했다면 '같은 사람의 전후 비교'를 선택하세요.",
      },
    ],
    engine,
  };
}

function apaTwoGroup(
  labels: string[],
  da: Describe,
  db: Describe,
  varName: string,
  used: { t: number; df: number; p: number },
  eff: EffectSize,
  switched: boolean,
): string {
  const sig = Number.isFinite(used.p) && used.p < 0.05;
  return (
    `${labels[0]}(M = ${num(da.mean)}, SD = ${num(da.sd)})과 ${labels[1]}(M = ${num(db.mean)}, SD = ${num(db.sd)})의 ${varName} 차이를 ` +
    `${switched ? "Welch 이분산 t검정으로 " : ""}검증한 결과, t(${num(used.df, switched ? 1 : 0)}) = ${apaDecimal(used.t, 2)}, ${apaP(used.p)}, ` +
    `Cohen's d = ${apaDecimal(eff.value, 2)}로 통계적으로 유의한 차이가 ${sig ? "있었다" : "없었다"}.`
  );
}

function runPaired(ds: Dataset, pre: Variable, post: Variable): GoalResult {
  const rows = ds.rows;
  const pairs = numPairs(rows, pre.index, post.index);
  const diff = pairs.map((p) => p.b - p.a);

  const csv = csvOf(["id", "pre", "post"], pairs.map((p, i) => [i + 1, p.a, p.b]));
  const engine = runBasicStats("C-03", csv);
  // 엔진은 pre - post 순서로 계산한다. 화면에는 변화량(post - pre)으로 말한다.
  const t = -engineStat(engine, "t");
  const p = engineStat(engine, "p");
  const df = pairs.length - 1;

  const dPre = describeVec(pairs.map((x) => x.a));
  const dPost = describeVec(pairs.map((x) => x.b));
  const dDiff = describeVec(diff);
  const eff = cohensDz(diff);
  const sig = Number.isFinite(p) && p < 0.05;

  return {
    goal: "paired",
    chosenTest: "대응표본 t검정",
    why: `같은 대상에게서 두 번 측정한 값을 비교하려 하셨으므로, 두 값의 차이를 개인별로 계산하는 대응표본 t검정을 사용했습니다.`,
    switched: false,
    descriptives: { cols: DESC_COLS, rows: [descRow(pre.name, dPre), descRow(post.name, dPost), descRow("변화량", dDiff)] },
    keyNumbers: [
      { label: "t", value: num(t), hint: "평균 변화량을 변화량의 흩어짐으로 나눈 값" },
      { label: "자유도 df", value: String(df), hint: "짝지어진 관측 수 − 1" },
      { label: "p", value: apaDecimal(p, 3), hint: "변화가 없다고 가정했을 때 이 정도 변화가 나올 확률" },
      { label: "평균 변화량", value: num(dDiff.mean), hint: `${post.name} − ${pre.name}` },
    ],
    effects: [eff],
    tables: [
      {
        title: "변화량 요약",
        table: {
          cols: ["짝 수", "평균 변화", "SD", "95% CI", "증가한 사례", "감소한 사례"],
          rows: [[
            diff.length,
            num(dDiff.mean),
            num(dDiff.sd),
            `[${num(dDiff.ciLow)}, ${num(dDiff.ciHigh)}]`,
            diff.filter((v) => v > 0).length,
            diff.filter((v) => v < 0).length,
          ]],
        },
        note: "신뢰구간이 0을 포함하면 변화가 있다고 말하기 어렵습니다.",
      },
    ],
    charts: [
      { kind: "bar", labels: [pre.name, post.name], values: [dPre.mean, dPost.mean], errors: [dPre.se, dPost.se], label: "측정 시점별 평균 (오차막대 = ±1 SE)" },
      { kind: "hist", values: diff, label: "개인별 변화량 분포" },
    ],
    apa:
      `${pre.name}(M = ${num(dPre.mean)}, SD = ${num(dPre.sd)})에서 ${post.name}(M = ${num(dPost.mean)}, SD = ${num(dPost.sd)})으로의 변화를 ` +
      `대응표본 t검정으로 검증한 결과, t(${df}) = ${apaDecimal(t, 2)}, ${apaP(p)}, Cohen's d_z = ${apaDecimal(eff.value, 2)}로 ` +
      `통계적으로 유의한 변화가 ${sig ? "있었다" : "없었다"}.`,
    assumptions: [
      normalityAssumption("변화량", diff),
      {
        id: "pairing",
        label: "짝 맞추기",
        status: pairs.length === rows.length ? "ok" : "warn",
        detail: `${rows.length}행 중 두 값이 모두 있는 ${pairs.length}행만 사용했습니다.`,
        fix: pairs.length === rows.length ? undefined : "결측이 한쪽에만 있는 행은 제외됩니다. 결측이 많다면 그 이유를 본문에 밝히세요.",
      },
    ],
    engine,
  };
}

function runAnova(ds: Dataset, y: Variable, g: Variable): GoalResult {
  const rows = pairRows(ds.rows, y.index, g.index);
  const labels = [...new Set(rows.map((r) => r.g))];
  const groups = labels.map((l) => rows.filter((r) => r.g === l).map((r) => r.y));

  const csv = csvOf(["group", "score"], rows.map((r) => [r.g, r.y]));
  const engine = runBasicStats("C-04", csv);
  const F = engineStat(engine, "F");
  const dfb = engineStat(engine, "dfb");
  const dfw = engineStat(engine, "dfw");
  const p = engineStat(engine, "p");
  const ssb = engineStat(engine, "SSB");
  const ssw = engineStat(engine, "SSW");
  const sst = engineStat(engine, "SST");

  const lev = leveneBrownForsythe(groups);
  const eta = etaSquared(ssb, sst);
  const omega = omegaSquared(ssb, ssw, dfb, dfw);
  const sig = Number.isFinite(p) && p < 0.05;
  const post = pairwiseT(labels, groups);

  const tables: GoalResult["tables"] = [
    {
      title: "분산분석표",
      table: {
        cols: ["원천", "제곱합 SS", "자유도 df", "평균제곱 MS", "F", "p"],
        rows: [
          ["집단 간", num(ssb), dfb, num(ssb / dfb), num(F), apaDecimal(p, 3)],
          ["집단 내", num(ssw), dfw, num(ssw / dfw), "", ""],
          ["전체", num(sst), dfb + dfw, "", "", ""],
        ],
      },
      note: "SST = SSB + SSW가 성립하는지는 엔진이 자동 검산합니다.",
    },
    {
      title: "등분산 점검 (Brown–Forsythe)",
      table: { cols: ["W", "df1", "df2", "p", "판정"], rows: [[num(lev.W), lev.df1, lev.df2, apaDecimal(lev.p, 3), lev.ok ? "등분산 유지" : "등분산 위배"]] },
    },
  ];

  if (sig) {
    tables.push({
      title: "사후검정 (Bonferroni 보정)",
      table: {
        cols: ["비교", "t", "df", "p", "보정 p", "판정"],
        rows: post.map((r) => [
          `${r.a} vs ${r.b}`,
          apaDecimal(r.t, 2),
          r.df,
          apaDecimal(r.p, 3),
          apaDecimal(r.pAdj, 3),
          r.pAdj < 0.05 ? "차이 있음" : "차이 없음",
        ]),
      },
      note: "분산분석이 유의하다는 것은 '어딘가에 차이가 있다'는 뜻일 뿐, 어느 집단끼리 다른지는 말해 주지 않습니다. 그래서 쌍별로 다시 비교합니다.",
    });
  }

  const desc = labels.map((l, i) => descRow(l, describeVec(groups[i])));

  return {
    goal: "anova",
    chosenTest: "일원배치 분산분석",
    why: `집단이 ${labels.length}개이고 점수가 숫자이므로, 세 집단 이상의 평균을 한 번에 비교하는 일원배치 분산분석을 사용했습니다.`,
    switched: false,
    descriptives: { cols: DESC_COLS, rows: desc },
    keyNumbers: [
      { label: "F", value: num(F), hint: "집단 간 분산을 집단 내 분산으로 나눈 값" },
      { label: "자유도", value: `${num(dfb, 0)}, ${num(dfw, 0)}`, hint: "집단 간, 집단 내" },
      { label: "p", value: apaDecimal(p, 3), hint: "모든 집단 평균이 같다고 가정했을 때의 확률" },
      { label: "집단 수", value: String(labels.length), hint: "비교하는 집단의 개수" },
    ],
    effects: [eta, omega],
    tables,
    charts: [
      { kind: "bar", labels, values: groups.map(meanOf), errors: groups.map((a) => sdOf(a) / Math.sqrt(a.length)), label: `${y.name} 집단별 평균 (오차막대 = ±1 SE)` },
      { kind: "box", groups: labels.map((l, i) => ({ label: l, values: groups[i] })), label: `${y.name} 집단별 분포` },
    ],
    apa:
      `${g.name}에 따른 ${y.name}의 차이를 일원배치 분산분석으로 검증한 결과, ` +
      `F(${num(dfb, 0)}, ${num(dfw, 0)}) = ${apaDecimal(F, 2)}, ${apaP(p)}, η² = ${apaDecimal(eta.value, 2)}(ω² = ${apaDecimal(omega.value, 2)})로 ` +
      `집단 간 차이가 통계적으로 유의하${sig ? "였다" : "지 않았다"}.`,
    assumptions: [
      {
        id: "levene",
        label: "등분산성",
        status: lev.ok ? "ok" : "risk",
        detail: `Brown–Forsythe W = ${num(lev.W)}, ${apaP(lev.p)}.`,
        fix: lev.ok ? undefined : "등분산 위배 → Welch ANOVA + Games-Howell 사후검정으로 바꾸는 것이 표준 대응입니다.",
      },
      ...labels.map((l, i) => normalityAssumption(l, groups[i])),
      {
        id: "balance",
        label: "집단 크기 균형",
        status: Math.min(...groups.map((a) => a.length)) >= 0.5 * Math.max(...groups.map((a) => a.length)) ? "ok" : "warn",
        detail: `집단별 사례 수: ${labels.map((l, i) => `${l} ${groups[i].length}`).join(" · ")}.`,
        fix: "집단 크기가 크게 다르면 등분산 위배의 영향이 커집니다. Welch ANOVA를 함께 보고하세요.",
      },
    ],
    engine,
  };
}

function runCorrelation(ds: Dataset, x: Variable, y: Variable): GoalResult {
  const pairs = numPairs(ds.rows, x.index, y.index).map((p) => ({ x: p.a, y: p.b }));

  const csv = csvOf([x.name, y.name], pairs.map((p) => [p.x, p.y]));
  const engine = runBasicStats("D-01", csv);
  const r = engineStat(engine, "pearson");
  const t = engineStat(engine, "t");
  const p = engineStat(engine, "p");
  const n = pairs.length;
  const df = n - 2;

  const sp = spearman(pairs.map((v) => v.x), pairs.map((v) => v.y));
  const normX = dagostinoPearson(pairs.map((v) => v.x));
  const normY = dagostinoPearson(pairs.map((v) => v.y));
  const useSpearman = (normX.usable && normX.p < 0.05) || (normY.usable && normY.p < 0.05);
  const sig = Number.isFinite(p) && p < 0.05;
  const effects = correlationEffect(r);

  return {
    goal: "corr",
    chosenTest: useSpearman ? "Pearson 상관 (Spearman 함께 보고)" : "Pearson 상관",
    why: useSpearman
      ? "두 변수가 모두 숫자여서 Pearson 상관을 계산했지만, 한쪽 이상이 정규분포에서 벗어나 순위 기반 Spearman 상관도 함께 보여 드립니다."
      : "두 변수가 모두 숫자이고 분포에 큰 문제가 없어 Pearson 상관을 계산했습니다.",
    switched: useSpearman,
    descriptives: {
      cols: DESC_COLS,
      rows: [descRow(x.name, describeVec(pairs.map((v) => v.x))), descRow(y.name, describeVec(pairs.map((v) => v.y)))],
    },
    keyNumbers: [
      { label: "r", value: apaDecimal(r, 3), hint: "−1에서 1 사이. 부호는 방향, 크기는 강도" },
      { label: "t", value: num(t), hint: "상관이 0인지 검정한 통계량" },
      { label: "자유도 df", value: String(df), hint: "짝 수 − 2" },
      { label: "p", value: apaDecimal(p, 3), hint: "상관이 0이라고 가정했을 때의 확률" },
      { label: "Spearman ρ", value: apaDecimal(sp.rho, 3), hint: "순위만 쓰기 때문에 이상치에 덜 흔들립니다" },
    ],
    effects,
    tables: [
      {
        title: "상관 요약",
        table: {
          cols: ["짝 수 n", "Pearson r", "R²", "Spearman ρ", "p"],
          rows: [[n, apaDecimal(r, 3), apaDecimal(r * r, 3), apaDecimal(sp.rho, 3), apaDecimal(p, 3)]],
        },
        note: "상관은 인과가 아닙니다. 세 번째 변수가 두 변수를 함께 움직이게 했을 수 있습니다.",
      },
    ],
    charts: [{ kind: "scatter", points: pairs, xLabel: x.name, yLabel: y.name }],
    apa:
      `${x.name}과 ${y.name}의 관계를 검증한 결과, r(${df}) = ${apaDecimal(r, 2)}, ${apaP(p)}로 ` +
      `통계적으로 유의한 상관이 ${sig ? "있었다" : "없었다"}. 결정계수는 R² = ${apaDecimal(r * r, 2)}이었다.`,
    assumptions: [
      normalityAssumption(x.name, pairs.map((v) => v.x)),
      normalityAssumption(y.name, pairs.map((v) => v.y)),
      {
        id: "linear",
        label: "선형성",
        status: "na",
        detail: "산점도에서 점들이 곡선을 그리면 Pearson 상관은 관계를 과소평가합니다. 그림을 반드시 확인하세요.",
        fix: "곡선 관계라면 변수 변환이나 비선형 모형을 검토하세요.",
      },
      {
        id: "outlier",
        label: "이상치",
        status: Math.abs(r - sp.rho) > 0.15 ? "warn" : "ok",
        detail: `Pearson r(${apaDecimal(r, 2)})와 Spearman ρ(${apaDecimal(sp.rho, 2)})의 차이가 ${Math.abs(r - sp.rho) > 0.15 ? "큽니다" : "크지 않습니다"}.`,
        fix: Math.abs(r - sp.rho) > 0.15 ? "두 값이 크게 다르면 소수의 극단값이 결과를 끌고 있을 수 있습니다. 산점도에서 확인하세요." : undefined,
      },
    ],
    engine,
  };
}

function runChiSquare(ds: Dataset, a: Variable, b: Variable): GoalResult {
  const pairs = ds.rows
    .map((r) => ({ a: (r[a.index] ?? "").trim(), b: (r[b.index] ?? "").trim() }))
    .filter((p) => p.a !== "" && p.b !== "");

  const csv = csvOf([a.name, b.name], pairs.map((p) => [p.a, p.b]));
  const engine = runBasicStats("D-04", csv);
  const ct = crosstab(pairs.map((p) => p.a), pairs.map((p) => p.b));
  const chi = engineStat(engine, "chi2");
  const p = engineStat(engine, "p");
  const eff = cramersV(ct.chi2, ct.n, ct.rowLabels.length, ct.colLabels.length);
  const sig = Number.isFinite(p) && p < 0.05;
  const lowExpected = ct.lowExpectedRatio > 0.2;

  return {
    goal: "chi",
    chosenTest: "카이제곱 독립성 검정",
    why: `두 변수가 모두 범주형이므로, 관측 빈도가 '서로 관련이 없을 때 기대되는 빈도'와 얼마나 다른지를 보는 카이제곱 독립성 검정을 사용했습니다.`,
    switched: false,
    descriptives: null,
    keyNumbers: [
      { label: "χ²", value: num(chi), hint: "관측빈도와 기대빈도의 차이를 합한 값" },
      { label: "자유도 df", value: String(ct.df), hint: "(행 수 − 1) × (열 수 − 1)" },
      { label: "p", value: apaDecimal(p, 3), hint: "두 변수가 무관하다고 가정했을 때의 확률" },
      { label: "사례 수 N", value: String(ct.n), hint: "두 값이 모두 있는 행 수" },
    ],
    effects: [eff],
    tables: [
      {
        title: "교차표 (관측빈도)",
        table: {
          cols: [`${a.name} \\ ${b.name}`, ...ct.colLabels, "합계"],
          rows: ct.rowLabels.map((rl, i) => [rl, ...ct.observed[i], ct.observed[i].reduce((s, v) => s + v, 0)]),
        },
      },
      {
        title: "기대빈도",
        table: {
          cols: [`${a.name} \\ ${b.name}`, ...ct.colLabels],
          rows: ct.rowLabels.map((rl, i) => [rl, ...ct.expected[i].map((e) => num(e, 1))]),
        },
        note: `기대빈도가 5 미만인 칸이 전체의 ${(ct.lowExpectedRatio * 100).toFixed(0)}%입니다. 20%를 넘으면 카이제곱을 신뢰하기 어렵습니다.`,
      },
    ],
    charts: [
      {
        kind: "bar",
        labels: ct.rowLabels,
        values: ct.rowLabels.map((_, i) => ct.observed[i].reduce((s, v) => s + v, 0)),
        label: `${a.name} 범주별 사례 수`,
      },
    ],
    apa:
      `${a.name}과 ${b.name}의 관련성을 검증한 결과, χ²(${ct.df}, N = ${ct.n}) = ${apaDecimal(chi, 2)}, ${apaP(p)}, ` +
      `Cramér's V = ${apaDecimal(eff.value, 2)}로 두 변수는 통계적으로 유의한 관련이 ${sig ? "있었다" : "없었다"}.`,
    assumptions: [
      {
        id: "expected",
        label: "기대빈도",
        status: lowExpected ? "risk" : ct.minExpected < 5 ? "warn" : "ok",
        detail: `가장 작은 기대빈도는 ${num(ct.minExpected, 1)}이고, 5 미만인 칸은 ${(ct.lowExpectedRatio * 100).toFixed(0)}%입니다.`,
        fix: lowExpected ? "기대빈도 부족 → 인접한 범주를 병합하거나 Fisher 정확검정을 사용하세요." : undefined,
      },
      {
        id: "indep-cells",
        label: "관측의 독립성",
        status: "na",
        detail: "한 사람이 여러 칸에 들어가면 카이제곱을 쓸 수 없습니다. 같은 사람의 전후 범주 변화라면 McNemar 검정을 쓰세요.",
      },
      {
        id: "size",
        label: "표 크기",
        status: ct.rowLabels.length * ct.colLabels.length <= 20 ? "ok" : "warn",
        detail: `${ct.rowLabels.length} × ${ct.colLabels.length} 표입니다.`,
        fix: ct.rowLabels.length * ct.colLabels.length > 20 ? "칸이 너무 많으면 해석이 어렵습니다. 범주를 묶어 보세요." : undefined,
      },
    ],
    engine,
  };
}