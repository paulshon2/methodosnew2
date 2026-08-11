"use client";
/** 방법론적 아키타입 — 절차적 태스크 (①~⑤ + 기입란 + AI 변환기) */
import { useEffect, useMemo, useState } from "react";
import { Gloss } from "./gloss";
import {
  findTask,
  loadArchetypeBundle,
  type ArchetypeBundle,
  type ArchetypeStage,
  type ArchetypeTask,
} from "@/lib/archetype-data";
import ArchetypeTaskAi from "./archetype-task-ai";

export default function ArchetypeTaskView({
  archetypeId,
  taskId,
  nav,
}: {
  archetypeId: number;
  taskId: string;
  nav: (r: string) => void;
}) {
  const [bundle, setBundle] = useState<ArchetypeBundle | null>(null);
  const [stage, setStage] = useState<ArchetypeStage | null>(null);
  const [task, setTask] = useState<ArchetypeTask | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadArchetypeBundle(archetypeId)
      .then((b) => {
        setBundle(b);
        const hit = findTask(b, taskId);
        setStage(hit?.stage || null);
        setTask(hit?.task || null);
        const fields = hit?.task.formFields || [];
        const init: Record<string, string> = {};
        fields.forEach((f) => (init[f.key] = ""));
        setValues(init);
      })
      .catch(() => {
        setBundle(null);
        setStage(null);
        setTask(null);
      });
  }, [archetypeId, taskId]);

  const gallery = useMemo(() => task?.exampleGallery || [], [task]);
  const formFields = useMemo(() => task?.formFields || [], [task]);

  if (!bundle || !stage || !task) {
    return <div className="text-[14px] text-ink-3 p-6">절차적 태스크를 불러오는 중…</div>;
  }

  const sections = [
    { n: "①", title: "왜 하는지(Why)", body: task.why },
    { n: "②", title: "어떻게 하는지(How)", body: task.how },
    { n: "③", title: "표준 프로토콜(준비)(Standard Protocol)", body: task.protocol },
  ];

  return (
    <div className="text-[14px]">
      <button
        type="button"
        className="btn btn-sm mb-2.5"
        onClick={() => nav(`archetype/project/${bundle.id}/stage/${encodeURIComponent(stage.id)}`)}
      >
        ← 절차적 단계
      </button>

      <div
        className="rounded-md px-3 py-2.5 mb-3 text-[13px] leading-relaxed"
        style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}
      >
        <div className="text-[11px] opacity-80 mb-0.5">상위 · 절차적 단계(Procedural Stage)</div>
        <Gloss text={task.stageLabel || stage.name} />
      </div>

      <h1 className="text-[20px] font-semibold leading-snug mb-1">
        <Gloss text={task.task} />
      </h1>
      <p className="text-[12.5px] text-ink-3 mb-4">
        <Gloss text={task.processLabel} /> · 방법론적 아키타입(Methodological Archetype) · AI 변환기
      </p>

      <div className="space-y-3 mb-5">
        {sections.map((s) => (
          <div key={s.n} className="card">
            <h3 className="text-[14px] font-semibold mb-1.5">
              {s.n} {s.title}
            </h3>
            <p className="text-[13.5px] leading-relaxed"><Gloss text={s.body} /></p>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <ArchetypeTaskAi
          archetypeId={bundle.id}
          taskId={task.id}
          processKey={stage.processKey}
          linkPrevTaskId={task.prevTaskId ?? task.linkPrevStageTaskId ?? null}
          taskName={task.task}
          stageLabel={task.stageLabel || stage.name}
          formFields={formFields}
          values={values}
          setValues={setValues}
          gallery={gallery}
          excelSample={task.excelSample}
          ai={task.aiTransform}
          taskKind={task.taskKind}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {task.prevTaskId && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => nav(`archetype/project/${bundle.id}/task/${encodeURIComponent(task.prevTaskId!)}`)}
          >
            ← 이전 태스크
          </button>
        )}
        {task.nextTaskId && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => nav(`archetype/project/${bundle.id}/task/${encodeURIComponent(task.nextTaskId!)}`)}
          >
            다음 태스크 →
          </button>
        )}
        {!task.nextTaskId && stage.nextStageId && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => nav(`archetype/project/${bundle.id}/stage/${encodeURIComponent(stage.nextStageId!)}`)}
          >
            다음 절차적 단계 →
          </button>
        )}
      </div>

      {task.sampleExplain && (
        <div className="card mb-4">
          <h3 className="text-[14px] font-semibold mb-1.5">예시 샘플 해설(Sample Explanation)</h3>
          <p className="text-[13px] leading-relaxed"><Gloss text={task.sampleExplain} /></p>
        </div>
      )}
    </div>
  );
}
