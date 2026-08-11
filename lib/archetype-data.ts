/** Methodological Archetype (방법론적 아키타입) data loaders */

export type ArchetypeTerm = {
  no?: number | null;
  term: string;
  term_ko?: string;
  term_en?: string;
  definition: string;
};

export type ArchetypeSample = {
  id: string;
  title: string;
  type: "choice" | "open";
  prompt: string;
  options?: string[];
  answer?: number;
  feedback?: string;
  example?: string;
  explain?: string;
  placeholder?: string;
  modelAnswer?: string;
  usable: string;
};

export type ArchetypeFormField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea";
  /** 쉬운 기입 예시(옆에 표시) */
  example?: string;
  /** 어려운 용어 설명 */
  gloss?: string;
  /** 무엇을 기입해야 하는지 한 줄 안내 */
  hint?: string;
};

export type ArchetypeExampleItem = {
  id: string;
  title: string;
  body: string;
  source?: string;
  relevance?: string;
};

export type ArchetypeAiTransform = {
  title: string;
  kind: string;
  hint: string;
  outputLabel: string;
};

export type ArchetypeTask = {
  id: string;
  task: string;
  taskRaw?: string;
  processKey: string;
  processLabel: string;
  stageLabel: string;
  why: string;
  how: string;
  protocol: string;
  sampleExplain?: string;
  samples: ArchetypeSample[];
  taskKind?: string;
  formFields?: ArchetypeFormField[];
  exampleGallery?: ArchetypeExampleItem[];
  excelSample?: string;
  aiTransform?: ArchetypeAiTransform;
  prevTaskId?: string | null;
  nextTaskId?: string | null;
  linkPrevStageTaskId?: string | null;
};

export type ArchetypeStage = {
  id: string;
  processKey: string;
  processLabel: string;
  name: string;
  name_ko?: string;
  procedure?: string;
  easy?: string;
  terms?: ArchetypeTerm[];
  tasks: ArchetypeTask[];
  prevStageId?: string | null;
  nextStageId?: string | null;
};

export type ArchetypeProcess = {
  id: string;
  label: string;
  label_ko?: string;
  label_en?: string;
  order: number;
  procedure: string;
  easy: string;
  steps: string[];
  terms: ArchetypeTerm[];
};

export type ArchetypeBundle = {
  id: number;
  name: string;
  name_ko: string;
  name_en: string;
  methodCount: number;
  methods: {
    no?: number | null;
    name: string;
    family?: string;
    label: string;
    /** L1 join key = registry id; null when pending-registration */
    methodKey?: string | null;
    caseId?: string;
    perfSlug?: string;
    status?: string;
  }[];
  overview: string;
  processes: ArchetypeProcess[];
  deliverable: string;
  stages: ArchetypeStage[];
  stats: { stageCount: number; taskCount: number };
};

export type ArchetypeCatalog = {
  title: string;
  intro: string;
  howTo: string[];
  stats: { archetypeCount: number; methodCoverage: number; taskCount: number; termCount: number };
  archetypes: {
    id: number;
    name: string;
    name_ko: string;
    name_en: string;
    methodCount: number;
    stageCount: number;
    taskCount: number;
    deliverable: string;
    processSummary: { id: string; label: string; procedure: string }[];
    methodNames: string[];
    methodTotal: number;
  }[];
  hubCards: { id: string; title: string; blurb: string }[];
};

export type ArchetypeGlossaryDoc = {
  title: string;
  intro: string;
  terms: ArchetypeTerm[];
};

let catalogCache: ArchetypeCatalog | null = null;
const bundleCache = new Map<number, ArchetypeBundle>();
let glossaryCache: ArchetypeGlossaryDoc | null = null;

export async function loadArchetypeCatalog(): Promise<ArchetypeCatalog> {
  if (catalogCache) return catalogCache;
  const r = await fetch("/archetypes/catalog.json");
  if (!r.ok) throw new Error("archetype catalog load failed");
  catalogCache = (await r.json()) as ArchetypeCatalog;
  return catalogCache;
}

export async function loadArchetypeGlossary(): Promise<ArchetypeGlossaryDoc> {
  if (glossaryCache) return glossaryCache;
  const r = await fetch("/archetypes/glossary.json");
  if (!r.ok) throw new Error("archetype glossary load failed");
  glossaryCache = (await r.json()) as ArchetypeGlossaryDoc;
  return glossaryCache;
}

export async function loadArchetypeBundle(id: number): Promise<ArchetypeBundle> {
  const hit = bundleCache.get(id);
  if (hit) return hit;
  const r = await fetch(`/archetypes/bundles/bundle-${String(id).padStart(2, "0")}.json`, { cache: "no-store" });
  if (!r.ok) throw new Error(`archetype bundle ${id} load failed`);
  const data = (await r.json()) as ArchetypeBundle;
  bundleCache.set(id, data);
  return data;
}

/** Clear cache so updated JSON is picked up after regenerate */
export function clearArchetypeBundleCache() {
  bundleCache.clear();
  catalogCache = null;
}

export function findStage(bundle: ArchetypeBundle, stageId: string): ArchetypeStage | undefined {
  return bundle.stages.find((s) => s.id === stageId);
}

export function findTask(bundle: ArchetypeBundle, taskId: string): { stage: ArchetypeStage; task: ArchetypeTask } | undefined {
  for (const stage of bundle.stages) {
    const task = stage.tasks.find((t) => t.id === taskId);
    if (task) return { stage, task };
  }
  return undefined;
}

/** 프로젝트 실습(Project Practice) — 정교화 샘플 JSON */
export type PracticeFigure = { caption: string; src: string };

export type PracticeTask = {
  label: string;
  detail: string;
  notes: string[];
  procedures: string[];
  procedureTable?: { headers: string[]; rows: string[][] };
  deliverableParas?: string[];
  deliverableTable?: { headers: string[]; rows: string[][] };
  figures: PracticeFigure[];
  aiTransform?: ArchetypeAiTransform;
};

export type PracticeStage = {
  label: string;
  summary: string;
  tasks: PracticeTask[];
};

export type PracticeTopic = {
  index: number;
  title: string;
  participants?: string;
  mode?: string;
  focus?: string;
  hypothesis?: string;
  analysis_key?: string;
  figures: PracticeFigure[];
  stages: PracticeStage[];
};

export type PracticeMethodDoc = {
  archetypeId: number;
  methodNo: number;
  methodName: string;
  methodEn: string;
  family?: string;
  label?: string;
  methodKey?: string | null;
  caseId?: string;
  perfSlug?: string;
  topics: PracticeTopic[];
};

export type PracticeIndex = {
  title: string;
  intro: string;
  archetypes: {
    id: number;
    name?: string;
    name_ko?: string;
    name_en?: string;
    methods: {
      no: number;
      name: string;
      en?: string;
      label?: string;
      topicCount: number;
      path: string;
      methodKey?: string | null;
      caseId?: string;
      perfSlug?: string;
      status?: string;
    }[];
  }[];
};

/** L2-b practice cases grouped by L1 methodKey (registry id). */
export type PracticeByMethodKey = Record<
  string,
  {
    archetypeId: number;
    archetypeName: string;
    caseId?: string;
    methodNo?: number | null;
    caseName: string;
    perfSlug?: string;
  }[]
>;

let practiceByKeyCache: PracticeByMethodKey | null = null;

export async function loadPracticeByMethodKey(): Promise<PracticeByMethodKey> {
  if (practiceByKeyCache) return practiceByKeyCache;
  const r = await fetch("/archetypes/practice-by-methodKey.json", { cache: "no-store" });
  if (!r.ok) return {};
  practiceByKeyCache = (await r.json()) as PracticeByMethodKey;
  return practiceByKeyCache;
}

let practiceIndexCache: PracticeIndex | null = null;
const practiceMethodCache = new Map<string, PracticeMethodDoc>();

export async function loadPracticeIndex(): Promise<PracticeIndex> {
  if (practiceIndexCache) return practiceIndexCache;
  const r = await fetch("/archetypes/project-practice/index.json", { cache: "no-store" });
  if (!r.ok) throw new Error("project practice index load failed");
  practiceIndexCache = (await r.json()) as PracticeIndex;
  return practiceIndexCache;
}

export async function loadPracticeMethod(archetypeId: number, methodNo: number): Promise<PracticeMethodDoc> {
  const key = `${archetypeId}:${methodNo}`;
  const hit = practiceMethodCache.get(key);
  if (hit) return hit;
  const r = await fetch(
    `/archetypes/project-practice/bundle-${String(archetypeId).padStart(2, "0")}/method-${methodNo}.json`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error(`practice method ${archetypeId}/${methodNo} load failed`);
  const data = (await r.json()) as PracticeMethodDoc;
  practiceMethodCache.set(key, data);
  return data;
}
