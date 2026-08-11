import type { Method } from "@/lib/types";
import type { Intake, RecRow } from "@/lib/recommend";
import { recommend } from "@/lib/recommend";
import type { ChecklistItem, ChecklistSection, PaperIntake } from "@/lib/research-checklist";

const STEP14_HINTS: { pattern: RegExp; methodIds: string[] }[] = [
  { pattern: /민족지|문화기술/, methodIds: ["ethnography", "QL-010", "QL-012"] },
  { pattern: /QL-008/, methodIds: ["QL-033", "QL-006"] },
  { pattern: /담화|텍스트|서사/, methodIds: ["QL-011", "QL-027", "TX-002"] },
  { pattern: /실험/, methodIds: ["CI-005", "field-experiment", "CI-008"] },
  { pattern: /서베이|횡단|설문/, methodIds: ["SV-003", "SV-004", "market-research"] },
  { pattern: /문항|설문지|질문지/, methodIds: ["SV-003"] },
  { pattern: /통계분석|기술통계|추론통계/, methodIds: ["QT-013"] },
  { pattern: /인과|계량/, methodIds: ["mostly-harmless-econometrics", "CI-004", "QT-026"] },
  { pattern: /혼합/, methodIds: ["MM-001"] },
  { pattern: /문헌|메타|리뷰/, methodIds: ["EV-011", "EV-005", "EV-012"] },
  { pattern: /소셜미디어|텍스트 마이닝|감성/, methodIds: ["text-mining", "TX-008", "TX-004"] },
];

function tagsToAims(tags: string[]): string[] {
  const aims = new Set<string>();
  tags.forEach((t) => {
    if (t === "quantitative") {
      aims.add("describe_distribution");
      aims.add("measure_effect");
    }
    if (t === "qualitative") {
      aims.add("explore_experience");
      aims.add("understand_phenomenon");
      aims.add("build_typology");
    }
    if (t === "mixed") {
      aims.add("describe_distribution");
      aims.add("explore_experience");
      aims.add("understand_phenomenon");
    }
    if (t === "literature") aims.add("synthesize_literature");
    if (t === "causal") aims.add("measure_effect");
  });
  return [...aims];
}

export function buildIntakeFromProfile(
  intake: PaperIntake,
  sections: ChecklistSection[],
  checked: Set<string>,
): Intake {
  const tags: string[] = [];
  let causal = false;
  let primary: boolean | null = null;
  const items: ChecklistItem[] = sections.flatMap((s) => s.items);
  items.forEach((it) => {
    if (!checked.has(it.id)) return;
    (it.recommendTags || []).forEach((t) => tags.push(t));
    if (it.recommendTags?.includes("causal")) causal = true;
    if (it.recommendTags?.includes("literature")) primary = false;
  });

  const textBlob = [intake.topic, intake.researchQuestions, intake.dataPlan, intake.preferredMethods].join(" ");
  if (/설문|인터뷰|관찰|실험|1차/.test(textBlob)) primary = primary === false ? false : true;
  if (/문헌|2차|기존 연구|메타/.test(textBlob)) primary = false;
  if (/인과|효과|개입|실험/.test(textBlob)) causal = true;

  const aims = tagsToAims(tags);
  if (!aims.length) {
    if (/탐색|경험|의미/.test(textBlob)) aims.push("explore_experience");
    if (/비교|효과|검증/.test(textBlob)) aims.push("measure_effect");
    if (/분포|현황|빈도/.test(textBlob)) aims.push("describe_distribution");
    if (/리뷰|고찰|종합/.test(textBlob)) aims.push("synthesize_literature");
  }
  if (!aims.length) aims.push("understand_phenomenon");

  let sample: number | null = null;
  const nMatch = textBlob.match(/(\d{2,5})\s*(명|명의|응답|cases|participants)/i);
  if (nMatch) sample = parseInt(nMatch[1], 10);

  let time_pref = "any";
  if (/1주|이번 주|급/.test(intake.timeline)) time_pref = "low";

  return {
    aims,
    needs_causality: causal,
    has_primary_data: primary,
    sample,
    team: null,
    time_pref,
    budget_pref: "any",
  };
}

export function boostFromStep14(
  rows: RecRow[],
  sections: ChecklistSection[],
  checked: Set<string>,
  methods: Method[],
): RecRow[] {
  const step14 = sections.find((s) => s.step === 14);
  if (!step14) return rows;
  const labels = step14.items.filter((i) => checked.has(i.id)).map((i) => i.label);
  if (!labels.length) return rows;
  const blob = labels.join(" ");
  const boostIds = new Set<string>();
  STEP14_HINTS.forEach((h) => {
    if (h.pattern.test(blob)) h.methodIds.forEach((id) => boostIds.add(id));
  });
  if (!boostIds.size) return rows;
  const idSet = new Set(methods.map((m) => m.id));
  return rows
    .map((r) => {
      if (!boostIds.has(r.id) || !idSet.has(r.id)) return r;
      return { ...r, match: Math.min(99, r.match + 8), reasons: [...r.reasons, "14단계 카탈로그 매칭 프로파일과 일치"] };
    })
    .sort((a, b) => b.match - a.match);
}

export function runProfileRecommend(
  methods: Method[],
  intake: PaperIntake,
  sections: ChecklistSection[],
  checked: Set<string>,
): RecRow[] {
  const built = buildIntakeFromProfile(intake, sections, checked);
  const rows = recommend(methods, built);
  return boostFromStep14(rows, sections, checked, methods);
}

export function sectionSummaryForAI(section: ChecklistSection, checked: Set<string>, intake: PaperIntake): string {
  const picked = section.items.filter((i) => checked.has(i.id));
  return [
    `【${section.step}단계】${section.title}`,
    section.whyNeeded ? `왜 필요한가: ${section.whyNeeded}` : "",
    `선택 항목 수: ${picked.length}/${section.items.length}`,
    ...picked.map((i) => `- ${i.label} → ${i.implication || "(시사점 없음)"}${i.easy ? ` / ${i.easy}` : ""}`),
    "",
    "【연구 기본정보 요약】",
    `주제: ${intake.topic || "(미입력)"}`,
    `연구질문: ${intake.researchQuestions || "(미입력)"}`,
    `자료계획: ${intake.dataPlan || "(미입력)"}`,
  ].filter(Boolean).join("\n");
}
