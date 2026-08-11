/**
 * 전체 메뉴 분석·결과 스냅샷 — .mos / 자동저장 / methodos.v1 에 포함
 * 기본통계·설문·시각화·추천·연구방법작성 등 컴포넌트 useState 결과를 워크스페이스에 영속화
 */
import type { VizSpec } from "@/lib/viz-spec";
import type { Survey } from "@/lib/survey-types";

export type BasicStatsSession = {
  moduleId: string;
  moduleName?: string;
  csv: string;
  choices: Record<string, string>;
  result?: unknown;
  aiNote?: string;
  demoId?: string;
  updatedAt: number;
};

export type SurveySession = {
  plan?: unknown;
  items?: unknown;
  results?: unknown;
  /** 설문 만들기 화면의 설문지 — 읽을 때 zod로 다시 검증한다. */
  paper?: Survey;
  updatedAt: number;
};

export type VizSession = {
  chartId?: string;
  title?: string;
  data?: unknown;
  /** 그래프 만들기(구 viz-plot)의 자유 형식 사양. 새 화면은 vizSpec을 쓴다. */
  spec?: unknown;
  /** 새 시각화 화면의 사양 — 읽을 때 zod로 다시 검증한다. */
  vizSpec?: VizSpec;
  csv?: string;
  note?: string;
  /** Plotly PNG — 연구방법작성 삽입용 */
  snapshotPng?: string;
  proseHtml?: string;
  updatedAt: number;
};

export type RecommendSession = {
  rows?: unknown;
  finalAi?: string;
  intake?: unknown;
  checklist?: unknown;
  updatedAt: number;
};

export type MethodWritingBlock = {
  id: string;
  type: "text" | "heading" | "image" | "table" | "quote" | "artifact";
  level?: 1 | 2 | 3;
  html?: string;
  src?: string;
  caption?: string;
  table?: { cols: string[]; rows: (string | number)[][] };
  artifactRef?: { menu: string; key: string; title: string };
};

export type MethodWritingDoc = {
  title: string;
  subtitle: string;
  html: string;
  blocks: MethodWritingBlock[];
  updatedAt: number;
};

export type MenuArtifacts = {
  basicStats: Record<string, BasicStatsSession>;
  survey?: SurveySession;
  viz: Record<string, VizSession>;
  recommend?: RecommendSession;
  methodWriting?: MethodWritingDoc;
  /** 기타 메뉴 산출물(확장용) */
  misc: Record<string, { title: string; summary: string; payload?: unknown; updatedAt: number }>;
};

export function emptyMenuArtifacts(): MenuArtifacts {
  return {
    basicStats: {},
    viz: {},
    misc: {},
    methodWriting: {
      title: "연구방법 (Methodology)",
      subtitle: "",
      html: "",
      blocks: [],
      updatedAt: Date.now(),
    },
  };
}

export type LinkedArtifact = {
  id: string;
  menu: "basic-stats" | "survey" | "viz" | "coding" | "recommend" | "methods" | "misc";
  title: string;
  summary: string;
  updatedAt: number;
  payload?: unknown;
};

/** 연구방법작성 아코디언용 — 저장된 모든 메뉴 산출물 목록 */
export function collectLinkedArtifacts(opts: {
  menuArtifacts?: MenuArtifacts | null;
  cmqProject?: any;
  caPipelines?: Record<string, Record<string, any>>;
  stageRuns?: Record<string, any>;
  projects?: Record<string, any>;
}): LinkedArtifact[] {
  const out: LinkedArtifact[] = [];
  const ma = opts.menuArtifacts || emptyMenuArtifacts();

  Object.values(ma.basicStats || {}).forEach((s) => {
    const r: any = s.result;
    out.push({
      id: `bs:${s.moduleId}`,
      menu: "basic-stats",
      title: s.moduleName || s.moduleId,
      summary: r?.summary || (s.csv ? `데이터 ${s.csv.split("\n").length - 1}행` : "세션 저장됨"),
      updatedAt: s.updatedAt,
      payload: s,
    });
  });

  if (ma.survey) {
    out.push({
      id: "survey:main",
      menu: "survey",
      title: "설문조사 스튜디오",
      summary: ma.survey.items
        ? `문항 ${(ma.survey.items as any[])?.length || 0}개`
        : "설문 세션",
      updatedAt: ma.survey.updatedAt,
      payload: ma.survey,
    });
  }

  Object.entries(ma.viz || {}).forEach(([k, v]) => {
    const note = v.note || "";
    out.push({
      id: `viz:${k}`,
      menu: "viz",
      title: v.title || k,
      summary: note.slice(0, 200) || "시각화 그래프 · 축·자료 요약 포함",
      updatedAt: v.updatedAt,
      payload: v,
    });
  });

  if (ma.recommend) {
    out.push({
      id: "recommend:main",
      menu: "recommend",
      title: "연구방법 추천 결과",
      summary: (ma.recommend.finalAi || "").slice(0, 120) || "추천 세션",
      updatedAt: ma.recommend.updatedAt,
      payload: ma.recommend,
    });
  }

  const cmq = opts.cmqProject;
  if (cmq && (cmq.title || cmq.segments?.length || cmq.codebook?.length)) {
    out.push({
      id: "coding:cmq",
      menu: "coding",
      title: cmq.title || "코딩 스튜디오",
      summary: `세그먼트 ${cmq.segments?.length || 0} · 코드 ${cmq.codebook?.length || 0} · 테마 ${cmq.themes?.length || 0}`,
      updatedAt: Date.now(),
      payload: {
        title: cmq.title,
        executionMode: cmq.executionMode,
        segments: cmq.segments?.length,
        codebook: cmq.codebook?.slice?.(0, 30),
        themes: cmq.themes,
        theory: cmq.theory,
        interpretation: cmq.interpretation,
      },
    });
  }

  Object.entries(opts.caPipelines || {}).forEach(([pid, pipe]) => {
    const proj = opts.projects?.[pid];
    Object.entries(pipe || {}).forEach(([stage, val]) => {
      if (val == null) return;
      out.push({
        id: `ca:${pid}:${stage}`,
        menu: "methods",
        title: `${proj?.title || pid} · ${stage}`,
        summary: typeof val === "string" ? val.slice(0, 100) : "파이프라인 산출물",
        updatedAt: Date.now(),
        payload: val,
      });
    });
  });

  Object.values(opts.stageRuns || {}).forEach((run: any) => {
    out.push({
      id: `run:${run.id}`,
      menu: "methods",
      title: `단계실행 · ${run.stageId}`,
      summary: `mode=${run.mode} v${run.version}`,
      updatedAt: run.createdAt || Date.now(),
      payload: { inputs: run.inputs, outputs: run.outputs, validation: run.validation },
    });
  });

  Object.entries(ma.misc || {}).forEach(([k, v]) => {
    out.push({
      id: `misc:${k}`,
      menu: "misc",
      title: v.title,
      summary: v.summary,
      updatedAt: v.updatedAt,
      payload: v.payload,
    });
  });

  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith("methodos-practice-ws-")) continue;
        const m = key.match(/^methodos-practice-ws-(\d+)-(\d+)-(\d+)$/);
        if (!m) continue;
        const [, aid, mno, tidx] = m;
        const ws = JSON.parse(localStorage.getItem(key) || "{}") as Record<
          string,
          { taskId: string; output: string; updatedAt: number; values?: Record<string, string> }
        >;
        Object.values(ws).forEach((snap) => {
          if (!snap?.output?.trim()) return;
          out.push({
            id: `practice:${aid}:${mno}:${tidx}:${snap.taskId}`,
            menu: "methods",
            title: `프로젝트 실습 · 아키타입 ${aid} · 방법 ${mno} · 주제 ${tidx}`,
            summary: snap.output.slice(0, 160),
            updatedAt: snap.updatedAt || Date.now(),
            payload: { ...snap, archetypeId: +aid, methodNo: +mno, topicIndex: +tidx },
          });
        });
      }
    } catch {
      /* ignore localStorage parse errors */
    }
  }

  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}
