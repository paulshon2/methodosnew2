// 레지스트리 타입 (build_registry.py 산출물)
export interface FieldHint { name: string; label: string; meaning: string; example: string; }
export interface ExampleTable { title: string; columns: string[]; rows: string[][]; }
export interface ExampleFigure { type: string; inputs: string[]; outputs: string[]; step: string; }
export interface StageExample { text: string; table: ExampleTable; figure: ExampleFigure; }
export interface StageExplain {
  expert: string; easy: string; kid: string; why: string;
  action_now: string; next_preview: string; ai_can_do: string[]; common_mistakes: string[];
}
export interface ComparisonRow { feature: string; rule: string; ai: string; hybrid: string; }
export interface StageModes {
  default: string;
  rule: { desc: string; raw: any };
  ai: { desc: string; raw: any };
  hybrid: { desc: string; raw: any };
}
export interface Stage {
  id: string; order: number; name: string; name_en?: string | null; goal: string;
  io: { inputs: string[]; outputs: string[]; artifacts: string[] };
  fields: FieldHint[];
  example: StageExample;
  explain: StageExplain;
  modes: StageModes;
  comparison: ComparisonRow[];
  validators: string[]; quality: string[]; decisions: string[]; idempotent: boolean;
}
export interface Method {
  id: string; name: string; name_ko?: string | null; family: string;
  source: { author: string; title: string; year: string | number };
  purpose: string;
  philosophy: { paradigm: string; epistemology: string; ontology: string };
  default_mode: string; folder: string; stage_count: number;
  stages: Stage[];
  recommendation: { fit: Record<string, number>; flags: Record<string, any> };
}
export interface Goal { id: string; label: string; coverage: number; }
export interface Registry {
  version: string; families: string[]; goals: Goal[]; method_count: number;
  principles: Record<string, string>; methods: Method[];
}

// 도메인
export interface Project {
  id: string; methodId: string; methodName: string; title: string;
  status: string; createdAt: number; currentStage: number;
}
export interface StageRun {
  id: string; projectId: string; stageId: string; mode: string; idempotencyKey: string;
  inputs: Record<string, any>; outputs: Record<string, any>; validation: any; version: number; createdAt: number;
}
export interface Settings {
  theme?: string; provider?: string; model?: string; baseUrl?: string;
  aiTier?: string; keys?: Record<string, string>;
}
