"use client";
import { useState, useEffect } from "react";
import type { Registry } from "@/lib/types";
import { useStore } from "@/store/app-store";
import ExampleBlock from "./example-block";
import { Gloss } from "./gloss";
import { UERStagePanel } from "./uer-panel";
import { isContentAnalysis } from "@/lib/content-analysis-spec";
import { isStraussianGT, type PerfMethod } from "@/lib/grounded-theory-spec";
import { isQMethodology } from "@/lib/q-methodology-spec";
import PerfStageRunner from "./perf-stage-runner";
import V61Workbench from "./v61-workbench";
import SsStatsWorkbench from "./ss-stats-workbench";
import { SS_STATS_METHOD_ID } from "@/lib/ss-stats-guide";
import SurveyWritingWorkbench from "./survey-writing-workbench";
import { SURVEY_WRITING_METHOD_ID } from "@/lib/survey-writing-spec";
import { loadMethodCatalog } from "@/lib/method-catalog";
import { displayMethodById } from "@/lib/merged-method";
import { useAnnotation } from "./annotations";
import { mergeTerms, preferAcademic, termsFromText, pickCoreMatching, CORE_METHOD_TERMS } from "@/lib/page-glossary";
import { runStage } from "@/lib/engine";
import ResultSummary from "./result-summary";
import StageRail, { type RailStage } from "./stage-rail";

const MODE_LABEL: Record<string, string> = { rule: "규칙기반", ai: "AI 보조", hybrid: "둘 다" };

export default function ProjectStage({ reg, pid, nav }: { reg: Registry; pid: string; nav: (r: string) => void }) {
  const project = useStore((s) => s.projects[pid]);
  const stageRuns = useStore((s) => s.stageRuns);
  const updateProject = useStore((s) => s.updateProject);
  const recordRun = useStore((s) => s.recordRun);
  const settings = useStore((s) => s.settings);
  const { replace } = useAnnotation();
  const [cat, setCat] = useState<Awaited<ReturnType<typeof loadMethodCatalog>>>(null);
  useEffect(() => {
    loadMethodCatalog().then(setCat);
  }, []);

  const m = project ? displayMethodById(reg, cat, project.methodId) : undefined;

  const latestRun = (pj: string, sid: string) =>
    Object.values(stageRuns)
      .filter((r) => r.projectId === pj && r.stageId === sid)
      .sort((a, b) => b.createdAt - a.createdAt)[0] || null;

  const stageIdx = project && m ? Math.min(project.currentStage || 0, Math.max(0, m.stages.length - 1)) : 0;
  const stage = m?.stages[stageIdx];
  const [mode, setMode] = useState<string>(stage?.modes?.default || "hybrid");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!m || !stage) return;
    const handledElsewhere =
      isContentAnalysis(m.id) ||
      isStraussianGT(m.id) ||
      isQMethodology(m.id) ||
      !!m.f11 ||
      m.id === SS_STATS_METHOD_ID ||
      m.id === SURVEY_WRITING_METHOD_ID;
    if (handledElsewhere) return;
    const blob = [
      stage.name,
      stage.name_en,
      stage.goal,
      stage.explain?.easy,
      stage.explain?.expert,
      stage.example?.text,
      m.purpose,
      m.philosophy?.paradigm,
      ...(m.stages || []).map((s) => s.name),
    ]
      .filter(Boolean)
      .join(" ");
    replace(
      preferAcademic(
        mergeTerms(pickCoreMatching(blob), termsFromText(blob), CORE_METHOD_TERMS.filter((t) => blob.includes(t.term)))
      )
    );
  }, [m, stage, stageIdx, replace]);

  if (!project || !m) return <p>프로젝트를 찾을 수 없습니다.</p>;

  const isV61 = !!m.catalog?.rwos || cat?.stageModel === "RWOS-6" || (cat?.version || 0) >= 61;

  if (m.id === SS_STATS_METHOD_ID) {
    return <SsStatsWorkbench pid={pid} title={project.title} nav={nav} />;
  }

  if (m.id === SURVEY_WRITING_METHOD_ID) {
    return <SurveyWritingWorkbench pid={pid} title={project.title} nav={nav} />;
  }

  if (isV61 && m.perfSlug) {
    return (
      <V61Workbench
        pid={pid}
        perfSlug={m.perfSlug}
        label={m.name_ko || m.name}
        intro={m.purpose?.slice(0, 220)}
        nav={nav}
      />
    );
  }

  const legacyPerf: PerfMethod | null = isContentAnalysis(m.id)
    ? "ca"
    : isStraussianGT(m.id)
      ? "gt"
      : isQMethodology(m.id)
        ? "q"
        : m.legacyPerf || null;
  const useF11 = m.f11 && (legacyPerf || m.perfSlug);

  if (useF11) {
    return (
      <div className="text-[14px] leading-relaxed">
        <button className="btn btn-sm mb-2.5" onClick={() => nav("library")}>
          방법 라이브러리
        </button>
        <h1 className="text-[22px] font-semibold">{project.title}</h1>
        <p className="text-[14px] text-ink-2 mb-4">{m.name_ko || m.name} · 자동화 워크벤치</p>
        <PerfStageRunner
          pid={pid}
          method={legacyPerf}
          perfSlug={legacyPerf ? null : m.perfSlug}
          label={m.name_ko || m.name}
          intro={m.purpose?.slice(0, 200)}
        />
      </div>
    );
  }

  if (!stage) return <p>프로젝트를 찾을 수 없습니다.</p>;

  const goStage = (i: number) => {
    updateProject(pid, { currentStage: i });
    setMode(m.stages[i].modes?.default || "hybrid");
    setInputs({});
  };
  const last = latestRun(pid, stage.id);
  const val = (k: string) => (inputs[k] !== undefined ? inputs[k] : last?.inputs?.[k] || "");
  const exec = async () => {
    const inp: Record<string, string> = {};
    (stage.io.inputs || []).forEach((k) => (inp[k] = val(k)));
    setBusy(true);
    const res = await runStage(m, stage, mode, inp, settings);
    recordRun(pid, stage.id, res.mode, inp, res.outputs, res.validation);
    setBusy(false);
  };
  const run = last;

  return (
    <div className="text-[14px] leading-relaxed">
      <button className="btn btn-sm mb-2.5" onClick={() => nav("projects")}>
        프로젝트 목록
      </button>
      <h1 className="ty-title">{project.title}</h1>
      <p className="ty-small text-ink-2 mb-4">
        <Gloss text={m.name_ko || m.name} />
      </p>
      <div className="mb-4">
        <StageRail
          stages={m.stages.map((s, i): RailStage => ({
            id: s.id,
            label: s.name,
            status: i < stageIdx ? "done" : i === stageIdx ? "current" : "todo",
          }))}
          onSelect={(id) => {
            const i = m.stages.findIndex((s) => s.id === id);
            if (i >= 0) goStage(i);
          }}
        />
      </div>
      <div className="card">
        <h2 className="ty-section mb-2">
          <Gloss text={stage.name} />
        </h2>
        <p className="ty-small text-ink-2 mb-3">
          끝나면 생기는 것: 이 단계 산출물 · 필요한 것: 아래 입력 · 걸리는 시간: 단계마다 다름
        </p>
        <div className="flex gap-2 mb-3 flex-wrap">
          {(["rule", "ai", "hybrid"] as const)
            .filter((k) => stage.modes?.[k])
            .map((k) => (
              <button key={k} className={`btn btn-sm ${mode === k ? "btn-primary" : ""}`} onClick={() => setMode(k)}>
                {MODE_LABEL[k]}
              </button>
            ))}
        </div>
        <p className="ty-label text-ink-3 mb-2">
          {mode === "rule" ? "같은 입력 → 같은 결과(재현)" : mode === "ai" ? "초안 생성 후 연구자가 확인" : "규칙으로 뼈대, AI로 보완"}
        </p>
        {(stage.io.inputs || []).map((k) => (
          <div key={k} className="mb-2">
            <label className="fld">{k.replace(/_/g, " ")}</label>
            <p className="ty-label text-ink-3 mb-1">이 칸에 필요한 내용을 적어 주세요.</p>
            <textarea className="inp w-full min-h-[80px]" value={val(k)} onChange={(e) => setInputs({ ...inputs, [k]: e.target.value })} />
          </div>
        ))}
        <button className="btn btn-primary" disabled={busy} onClick={exec}>
          {busy ? "실행 중…" : "단계 실행"}
        </button>
        {run && <ResultSummary outputs={run.outputs} stageName={stage.name} />}
        <ExampleBlock stage={stage} />
        <UERStagePanel methodId={m.id} stageId={stage.id} />
      </div>
    </div>
  );
}
