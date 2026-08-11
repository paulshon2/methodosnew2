export interface ChecklistItem {
  id: string;
  label: string;
  implication: string;
  source: string;
  /** 초보용 쉬운 해석·예시 */
  easy?: string;
  recommendTags: string[];
}

export interface ChecklistSection {
  step: number;
  id: string;
  title: string;
  /** 이 단계가 왜 필요한지 (쉬운 설명) */
  whyNeeded?: string;
  items: ChecklistItem[];
}

export interface ResearchChecklistDoc {
  version: string;
  source: string;
  sections: ChecklistSection[];
}

export interface PaperIntake {
  topic: string;
  preferredMethods: string;
  researchQuestions: string;
  objectives: string;
  keywords: string;
  targetPopulation: string;
  dataPlan: string;
  expectedContribution: string;
  timeline: string;
}

export const EMPTY_PAPER_INTAKE: PaperIntake = {
  topic: "",
  preferredMethods: "",
  researchQuestions: "",
  objectives: "",
  keywords: "",
  targetPopulation: "",
  dataPlan: "",
  expectedContribution: "",
  timeline: "",
};

const INTAKE_KEY = "methodos.researchIntake.v1";
const CHECK_KEY = "methodos.researchChecklist.v1";

export async function loadResearchChecklist(): Promise<ResearchChecklistDoc> {
  const r = await fetch("/research-method-checklist.json");
  if (!r.ok) throw new Error("checklist load failed");
  return r.json();
}

export function loadPaperIntake(): PaperIntake {
  if (typeof window === "undefined") return { ...EMPTY_PAPER_INTAKE };
  try {
    const raw = localStorage.getItem(INTAKE_KEY);
    return raw ? { ...EMPTY_PAPER_INTAKE, ...JSON.parse(raw) } : { ...EMPTY_PAPER_INTAKE };
  } catch {
    return { ...EMPTY_PAPER_INTAKE };
  }
}

export function savePaperIntake(v: PaperIntake) {
  if (typeof window === "undefined") return;
  localStorage.setItem(INTAKE_KEY, JSON.stringify(v));
}

export function loadCheckedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(CHECK_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function saveCheckedIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHECK_KEY, JSON.stringify([...ids]));
}
