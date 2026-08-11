"use client";
/** 방법론적 아키타입 — 절차적 단계 페이지 */
import { useEffect, useState } from "react";
import { Gloss } from "./gloss";
import { findStage, loadArchetypeBundle, type ArchetypeBundle, type ArchetypeStage } from "@/lib/archetype-data";

export default function ArchetypeStageView({
  archetypeId,
  stageId,
  nav,
}: {
  archetypeId: number;
  stageId: string;
  nav: (r: string) => void;
}) {
  const [bundle, setBundle] = useState<ArchetypeBundle | null>(null);
  const [stage, setStage] = useState<ArchetypeStage | null>(null);

  useEffect(() => {
    loadArchetypeBundle(archetypeId)
      .then((b) => {
        setBundle(b);
        setStage(findStage(b, stageId) || null);
      })
      .catch(() => {
        setBundle(null);
        setStage(null);
      });
  }, [archetypeId, stageId]);

  if (!bundle || !stage) {
    return <div className="text-[14px] text-ink-3 p-6">절차적 단계를 불러오는 중…</div>;
  }

  return (
    <div className="text-[14px]">
      <button type="button" className="btn btn-sm mb-2.5" onClick={() => nav(`archetype/project/${bundle.id}`)}>
        ← {bundle.name_ko}
      </button>
      <div className="text-[11px] text-ink-3 mb-1"><Gloss text={stage.processLabel} /></div>
      <h1 className="text-[20px] font-semibold leading-snug"><Gloss text={stage.name} /></h1>
      <p className="text-[13px] text-ink-2 mt-2 mb-4">
        상위 절차적 단계(Procedural Stage) 아래에서 절차적 태스크(Procedural Task)를 순서대로 실습하세요.
      </p>

      {stage.procedure && (
        <div className="card mb-3">
          <h3 className="text-[14px] font-semibold mb-1.5">과정 요약(Process Summary)</h3>
          <p className="text-[13px] leading-relaxed"><Gloss text={stage.procedure} /></p>
        </div>
      )}
      {stage.easy && (
        <div className="rounded-md px-3 py-2.5 mb-4 text-[13px] leading-relaxed" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
          <Gloss text={stage.easy} />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {stage.prevStageId && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => nav(`archetype/project/${bundle.id}/stage/${encodeURIComponent(stage.prevStageId!)}`)}
          >
            ← 이전 절차적 단계
          </button>
        )}
        {stage.nextStageId && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => nav(`archetype/project/${bundle.id}/stage/${encodeURIComponent(stage.nextStageId!)}`)}
          >
            다음 절차적 단계 →
          </button>
        )}
      </div>

      <h2 className="text-[16px] font-semibold mb-2">절차적 태스크(Procedural Task)</h2>
      <div className="space-y-2">
        {stage.tasks.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className="card w-full text-left hover:-translate-y-0.5 transition-transform"
            onClick={() => nav(`archetype/project/${bundle.id}/task/${encodeURIComponent(t.id)}`)}
          >
            <div className="text-[11px] text-ink-3 mb-0.5">태스크 {i + 1}</div>
            <div className="text-[14px] font-semibold"><Gloss text={t.task} /></div>
            <div className="text-[12px] text-ink-2 mt-1">
              ①왜 · ②어떻게 · ③프로토콜 · ④예시 {(t.exampleGallery?.length || t.samples.length)}개 · ⑤원본 · AI 변환기
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
