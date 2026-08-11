export const SURVEY_WRITING_METHOD_ID = "SV-003";
export const SURVEY_WRITING_PERF_SLUG = "SV-003";
export const SS_STATS_LINK_METHOD_ID = "QT-013";

export type ScaleTypeId = "nominal" | "ordinal" | "interval" | "ratio";
export type ContentTypeId =
  | "attitude"
  | "knowledge"
  | "performance"
  | "psychographic"
  | "demographic"
  | "self_administered"
  | "nonsensitive_behavior"
  | "sensitive_behavior";

export interface SurveyItem {
  no: number;
  code: string;
  type: ContentTypeId | string;
  stem: string;
  responseScale: string;
  scaleType: ScaleTypeId | string;
  codingHint?: string;
  codingMap?: string;
  ssPhase?: string;
  ssTech?: string;
  note?: string;
}

export interface SurveyProtocol {
  version: string;
  purpose: string;
  sources: { abbr: string; citation: string; note: string }[];
  contentTypes: { id: string; ko: string; en: string; keys: string[] }[];
  measurementScales: {
    id: ScaleTypeId;
    ko: string;
    en: string;
    features: string;
    stats: string;
    ssLinks: { phase: string; techId: string; name: string }[];
  }[];
  stages: { id: string; order: number; name: string; goal: string; inputs: string[]; outputs: string[];
    why?: string; stepRole?: string[]; beginnerTip?: string; exampleText?: string }[];
  sheetOrder?: string[];
  sheets: Record<string, { title: string; headers: string[]; rows: Record<string, string>[] }>;
  examples: Record<string, {
    title: string;
    guidelines: string[];
    items: { code: string; stem: string; scale: string; scaleType: string; note: string }[];
    bad: string;
    good: string;
  }>;
  fullQuestionnaireExample: { topic: string; count: number; items: SurveyItem[] };
  aiFormFields: { id: string; label: string; placeholder: string; required: boolean }[];
}

export interface AiSurveyForm {
  topic: string;
  researchQuestion: string;
  population: string;
  mode: string;
  types: ContentTypeId[];
  minItems: number;
  likertPoints: number;
  includeSensitive: boolean;
  language: string;
  notes: string;
}

export async function loadSurveyProtocol(): Promise<SurveyProtocol> {
  const r = await fetch("/survey-question-protocol.json");
  if (!r.ok) throw new Error("survey protocol load failed");
  return r.json();
}

export const CONTENT_TYPE_LABEL: Record<string, string> = {
  attitude: "태도질문",
  knowledge: "지식 측정 질문",
  performance: "성과평가 질문",
  psychographic: "심리특성/사이코그래픽 질문",
  demographic: "인구통계 질문",
  self_administered: "자기기입식 질문",
  nonsensitive_behavior: "비민감 행동질문",
  sensitive_behavior: "민감 행동질문",
};

export const SCALE_LABEL: Record<ScaleTypeId, { ko: string; en: string }> = {
  nominal: { ko: "명목척도", en: "Nominal Scale" },
  ordinal: { ko: "서열척도", en: "Ordinal Scale" },
  interval: { ko: "등간척도", en: "Interval Scale" },
  ratio: { ko: "비율척도", en: "Ratio Scale" },
};

export const DEFAULT_AI_FORM: AiSurveyForm = {
  topic: "",
  researchQuestion: "",
  population: "",
  mode: "자기기입식 웹",
  types: ["attitude", "knowledge", "performance", "psychographic", "demographic", "self_administered"],
  minItems: 30,
  likertPoints: 5,
  includeSensitive: false,
  language: "일반 성인",
  notes: "",
};
