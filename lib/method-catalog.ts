"use client";
import type { CaStageView } from "@/lib/content-analysis-spec";
import type { GtStage } from "@/lib/grounded-theory-spec";

export interface MethodCatalogEntry {
  methodId: string;
  perfSlug: string;
  legacyPerf?: "ca" | "gt" | "q" | null;
  name_ko: string;
  name_hint?: string;
  family: string;
  family_ko?: string;
  macro: string;
  source?: string;
  purpose?: string;
  stageCount: number;
  taskCount: number;
  xlsxFile?: string;
  kind?: string;
  practiceRows?: number;
  rwos?: string;
  variant?: number | null;
  variantTotal?: number;
  /** L1 join key = registry.json id (QL-008 …). Null when pending manual mapping. */
  methodKey?: string | null;
  methodKeyStatus?: string;
  /** Standard method label without variant suffix (-01…). */
  canonicalName?: string;
  /** Primary methodological archetype (1–31). */
  archetypeId?: number | null;
  archetypeSecondary?: number[];
  /** UI card fields (renew) */
  requiredData?: string;
  deliverable?: string;
  duration?: string;
  difficulty?: string;
}

export interface MethodCatalog {
  version: number;
  macroOrder: string[];
  method_count: number;
  methods: MethodCatalogEntry[];
  standard?: string;
  stageModel?: string;
}

export interface MethodOverviewBundle {
  stageViews: CaStageView[];
  glossary?: { term: string; termKo?: string; def: string }[];
  purpose?: string;
  source?: string;
  flow?: string;
  domain?: string;
  beginnerIntro?: string;
  phases?: { no: number; name: string; nameEn?: string; what?: string; why?: string }[];
  mechanism?: string;
  rwosVersion?: string;
  stageCount?: number;
}

export interface V61TableBlock {
  title?: string;
  headers: string[];
  rows: string[][];
  caption?: string;
  defaultCollapsed?: boolean;
}

export interface V61AiPlanField {
  item: string;
  guide: string;
  researcherFill?: string;
}

export interface V61AiPlan {
  title: string;
  intro?: string[];
  fields: V61AiPlanField[];
}

export interface V61WorkedExample {
  topic?: string;
  steps: string[];
  summaryTable?: V61TableBlock | null;
  workSheet?: V61TableBlock | null;
  workSheetNotes?: string[];
  summaryExplain?: string[];
  summaryHowTo?: string;
  aiPlan?: V61AiPlan | null;
}

export interface V61Task {
  no: number;
  name: string;
  type?: string;
  description?: string;
  input?: string;
  output?: string;
  automation?: string;
  workedExample?: V61WorkedExample;
}

export interface SampleDeliverable {
  label: string;
  table?: V61TableBlock | null;
  prose?: string[];
}

export interface SampleProcessBinding {
  processNo?: number | null;
  processIdHint?: string;
  processName?: string;
  boundProcessId?: string;
  scaleNote?: string;
  formatNote?: string;
  exampleNote?: string;
  interstitialDeliverables?: SampleDeliverable[];
}

export interface SamplePackSection {
  id: string;
  title: string;
  kind: string;
  boundProcessNo?: number | null;
  accordionDefault?: "collapsed" | "expanded";
  tables?: V61TableBlock[];
  prose?: string[];
  figureSpec?: Record<string, unknown>;
  chartSpec?: Record<string, unknown>;
}

export interface MethodSamplePack {
  title: string;
  practiceRows?: number | null;
  guide?: string | null;
  sections: SamplePackSection[];
  processBindings: SampleProcessBinding[];
}

export interface V61Process {
  id: string;
  no: number;
  name: string;
  nameEn?: string;
  purpose?: string;
  input?: string;
  output?: string;
  position?: string;
  automation?: string;
  what?: string;
  why?: string;
  tasks: V61Task[];
  interstitialDeliverables?: SampleDeliverable[];
}

export interface V61Stage {
  id: string;
  no: number;
  name: string;
  nameEn?: string;
  summary?: string;
  purpose?: string;
  input?: string;
  output?: string;
  automation?: string;
  beginnerTip?: string;
  what?: string;
  why?: string;
  terms?: string;
  tasks: V61Task[];
  processes: V61Process[];
}

export interface V61Bundle {
  catalogId: string;
  slug: string;
  name_ko: string;
  nameShortKo?: string;
  nameShortEn?: string;
  macro: string;
  family: string;
  kind?: string;
  mechanism?: string;
  purpose?: string;
  beginnerIntro?: string;
  architecture?: { what?: string; why?: string; terms?: string };
  phases: { no: number; name: string; nameEn?: string; what?: string; why?: string }[];
  stages: V61Stage[];
  glossary: { term: string; termKo?: string; def: string }[];
  practiceRows?: number;
  variant?: number | null;
  variantTotal?: number;
}

export interface PerfIndexEntry {
  perfSlug: string;
  legacyPerf?: "ca" | "gt" | "q" | null;
}

let _catalog: MethodCatalog | null = null;
let _catalogP: Promise<MethodCatalog | null> | null = null;
let _perfIndex: Record<string, PerfIndexEntry> | null = null;
let _perfIndexP: Promise<Record<string, PerfIndexEntry> | null> | null = null;

export function loadMethodCatalog(): Promise<MethodCatalog | null> {
  if (_catalog) return Promise.resolve(_catalog);
  if (_catalogP) return _catalogP;
  _catalogP = fetch("method-catalog.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((d: MethodCatalog | null) => {
      _catalog = d;
      return d;
    })
    .catch(() => null);
  return _catalogP;
}

export function loadPerfIndex(): Promise<Record<string, PerfIndexEntry> | null> {
  if (_perfIndex) return Promise.resolve(_perfIndex);
  if (_perfIndexP) return _perfIndexP;
  _perfIndexP = fetch("perf-index.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((d: Record<string, PerfIndexEntry> | null) => {
      _perfIndex = d;
      return d;
    })
    .catch(() => null);
  return _perfIndexP;
}

export function catalogEntryByMethodId(cat: MethodCatalog | null, methodId: string): MethodCatalogEntry | undefined {
  return cat?.methods.find((m) => m.methodId === methodId);
}

export function resolvePerfKey(
  methodId: string,
  idx: Record<string, PerfIndexEntry> | null
): { legacy?: "ca" | "gt" | "q"; slug?: string } | null {
  const e = idx?.[methodId];
  if (!e) return null;
  if (e.legacyPerf) return { legacy: e.legacyPerf };
  if (e.perfSlug) return { slug: e.perfSlug };
  return null;
}

const _overviewCache: Record<string, MethodOverviewBundle | null> = {};
const _overviewPromise: Record<string, Promise<MethodOverviewBundle | null>> = {};

export function loadMethodOverview(slug: string): Promise<MethodOverviewBundle | null> {
  if (_overviewCache[slug] !== undefined) return Promise.resolve(_overviewCache[slug]);
  const pending = _overviewPromise[slug];
  if (pending) return pending;
  const p = fetch(`methods/${encodeURIComponent(slug)}/overview.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d: MethodOverviewBundle | null) => {
      if (d && !Array.isArray(d.stageViews)) d.stageViews = [];
      if (d && d.glossary && !Array.isArray(d.glossary)) d.glossary = [];
      _overviewCache[slug] = d;
      return d;
    })
    .catch(() => {
      _overviewCache[slug] = null;
      return null;
    });
  _overviewPromise[slug] = p;
  return p;
}

const _v61Cache: Record<string, V61Bundle | null> = {};
const _v61Promise: Record<string, Promise<V61Bundle | null>> = {};

export function loadV61Bundle(slug: string): Promise<V61Bundle | null> {
  if (_v61Cache[slug] !== undefined) return Promise.resolve(_v61Cache[slug]);
  const pending = _v61Promise[slug];
  if (pending) return pending;
  const p = fetch(`methods/${encodeURIComponent(slug)}/v61.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d: V61Bundle | null) => {
      if (d) {
        if (!Array.isArray(d.stages)) d.stages = [];
        if (!Array.isArray(d.phases)) d.phases = [];
        if (!Array.isArray(d.glossary)) d.glossary = [];
      }
      _v61Cache[slug] = d;
      return d;
    })
    .catch(() => {
      _v61Cache[slug] = null;
      return null;
    });
  _v61Promise[slug] = p;
  return p;
}

const _samplesCache: Record<string, MethodSamplePack | null> = {};
const _samplesPromise: Record<string, Promise<MethodSamplePack | null>> = {};

export function loadMethodSamples(slug: string): Promise<MethodSamplePack | null> {
  if (_samplesCache[slug] !== undefined) return Promise.resolve(_samplesCache[slug]);
  const pending = _samplesPromise[slug];
  if (pending) return pending;
  const p = fetch(`methods/${encodeURIComponent(slug)}/samples.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d: MethodSamplePack | null) => {
      if (d) {
        if (!Array.isArray(d.sections)) d.sections = [];
        if (!Array.isArray(d.processBindings)) d.processBindings = [];
      }
      _samplesCache[slug] = d;
      return d;
    })
    .catch(() => {
      _samplesCache[slug] = null;
      return null;
    });
  _samplesPromise[slug] = p;
  return p;
}

const _perfSlugCache: Record<string, GtStage[] | null> = {};
const _perfSlugPromise: Record<string, Promise<GtStage[] | null>> = {};

export function loadPerfRegistryBySlug(slug: string): Promise<GtStage[] | null> {
  if (_perfSlugCache[slug] !== undefined) return Promise.resolve(_perfSlugCache[slug]);
  const pending = _perfSlugPromise[slug];
  if (pending) return pending;
  const p = fetch(`methods/${encodeURIComponent(slug)}/perf-registry.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d: unknown) => {
      const stages = Array.isArray(d) ? (d as GtStage[]) : null;
      _perfSlugCache[slug] = stages;
      return stages;
    })
    .catch(() => {
      _perfSlugCache[slug] = null;
      return null;
    });
  _perfSlugPromise[slug] = p;
  return p;
}
