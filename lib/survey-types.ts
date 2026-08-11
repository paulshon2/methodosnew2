/**
 * 설문 문항 타입 — 응답자가 보게 될 것과 같은 구조만 담는다.
 * 유형은 여덟 가지뿐이다. 비슷한 유형을 늘리면 만드는 사람이 매번 고민하게 된다.
 */
import { z } from "zod";

export type QType = "single" | "multi" | "scale" | "matrix" | "text" | "para" | "number" | "date";

export type Question = {
  id: string;
  type: QType;
  text: string;
  required: boolean;
  help: string;
  /** single · multi */
  options?: string[];
  /** matrix */
  rows?: string[];
  /** scale · matrix */
  points?: 4 | 5 | 6 | 7;
  /** 척도 양끝 라벨 */
  lo?: string;
  hi?: string;
  /** 표시 조건 — 이 문항 앞의 어떤 문항에서 특정 값을 골랐을 때만 보인다. */
  cond?: { q: string; v: string } | null;
};

export type Survey = { title: string; desc: string; questions: Question[] };

export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["single", "multi", "scale", "matrix", "text", "para", "number", "date"]),
  text: z.string(),
  required: z.boolean(),
  help: z.string(),
  options: z.array(z.string()).optional(),
  rows: z.array(z.string()).optional(),
  points: z.union([z.literal(4), z.literal(5), z.literal(6), z.literal(7)]).optional(),
  lo: z.string().optional(),
  hi: z.string().optional(),
  cond: z.object({ q: z.string(), v: z.string() }).nullable().optional(),
});

export const SurveySchema = z.object({
  title: z.string(),
  desc: z.string(),
  questions: z.array(QuestionSchema),
});

export function parseSurvey(raw: unknown): Survey | null {
  const r = SurveySchema.safeParse(raw);
  return r.success ? (r.data as Survey) : null;
}

export type QTypeMeta = {
  id: QType;
  label: string;
  /** 언제 쓰는지 — 유형을 고르는 사람이 실제로 궁금해하는 것. */
  useWhen: string;
  /** 이 유형이 만드는 자료의 척도 — 뒤에 쓸 수 있는 분석이 여기서 갈린다. */
  scale: string;
};

export const QTYPES: QTypeMeta[] = [
  { id: "single", label: "단일 선택", useWhen: "여러 보기 중 하나만 고르게 할 때", scale: "명목 — 빈도·교차표·카이제곱" },
  { id: "multi", label: "다중 선택", useWhen: "해당하는 것을 모두 고르게 할 때", scale: "보기마다 별도 이분 변수로 다뤄야 합니다" },
  { id: "scale", label: "리커트 척도", useWhen: "동의 정도·만족도처럼 정도를 물을 때", scale: "등간으로 취급 — 평균·t·ANOVA·상관" },
  { id: "matrix", label: "행렬", useWhen: "같은 척도로 여러 항목을 연달아 물을 때", scale: "등간 — 문항 묶음의 신뢰도(α) 계산" },
  { id: "text", label: "단답", useWhen: "짧은 낱말이나 숫자가 아닌 값을 받을 때", scale: "질적 — 코딩이 필요합니다" },
  { id: "para", label: "장문", useWhen: "이유나 경험을 자유롭게 쓰게 할 때", scale: "질적 — 코딩 스튜디오로 이어집니다" },
  { id: "number", label: "숫자", useWhen: "나이·횟수처럼 수치를 직접 받을 때", scale: "비율 — 평균·상관·회귀" },
  { id: "date", label: "날짜", useWhen: "사건 시점을 받을 때", scale: "구간 — 기간 계산에 씁니다" },
];

export const QTYPE_BY_ID: Record<QType, QTypeMeta> = Object.fromEntries(QTYPES.map((q) => [q.id, q])) as Record<QType, QTypeMeta>;

/** 문항 하나의 예상 응답시간(초). 합계는 응답자가 느낄 부담의 근사치다. */
export function seconds(q: Question): number {
  switch (q.type) {
    case "single":
      return 8 + (q.options?.length ?? 0) * 1.5;
    case "multi":
      return 12 + (q.options?.length ?? 0) * 1.5;
    case "scale":
      return 6;
    case "matrix":
      return (q.rows?.length ?? 0) * 5 + 8;
    case "text":
      return 15;
    case "para":
      return 60;
    default:
      return 8;
  }
}

export function totalSeconds(s: Survey): number {
  return s.questions.reduce((t, q) => t + seconds(q), 0);
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const r = Math.round(sec % 60);
  return m > 0 ? `${m}분 ${r}초` : `${r}초`;
}

let counter = 0;
export function newId(): string {
  counter += 1;
  return `q${Date.now().toString(36)}${counter.toString(36)}`;
}

export function newQuestion(type: QType): Question {
  const base: Question = { id: newId(), type, text: "", required: false, help: "" };
  if (type === "single" || type === "multi") return { ...base, options: ["", ""] };
  if (type === "scale") return { ...base, points: 5, lo: "전혀 그렇지 않다", hi: "매우 그렇다" };
  if (type === "matrix") return { ...base, points: 5, rows: ["", ""], lo: "전혀 그렇지 않다", hi: "매우 그렇다" };
  return base;
}
