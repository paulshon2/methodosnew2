"use client";
/** 방법론적 아키타입 — 선택 유형의 절차적 단계 목록 */
import { useEffect, useState } from "react";
import { Gloss } from "./gloss";
import { loadArchetypeBundle, type ArchetypeBundle } from "@/lib/archetype-data";

export default function ArchetypeDetail({ id, nav }: { id: number; nav: (r: string) => void }) {
  const [bundle, setBundle] = useState<ArchetypeBundle | null>(null);

  useEffect(() => {
    loadArchetypeBundle(id).then(setBundle).catch(() => setBundle(null));
  }, [id]);

  if (!bundle) return <div className="text-[14px] text-ink-3 p-6">아키타입을 불러오는 중…</div>;

  return (
    <div className="text-[14px]">
      <button type="button" className="btn btn-sm mb-2.5" onClick={() => nav("archetype/projects")}>← 31개 유형 목록</button>
      <h1 className="text-[22px] font-semibold"><Gloss text={bundle.name} /></h1>
      <p className="text-[14px] text-ink-2 mb-3"><Gloss text={bundle.overview} /></p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        {[
          ["유형 번호", `${bundle.id}/31`],
          ["연구방법", bundle.methodCount],
          ["절차적 단계", bundle.stats.stageCount],
          ["절차적 태스크", bundle.stats.taskCount],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-md px-3 py-2.5" style={{ background: "var(--color-background-secondary)" }}>
            <div className="text-[11px] text-ink-3">{l}</div>
            <div className="text-[15px] font-semibold mt-0.5">{v}</div>
          </div>
        ))}
      </div>

      <div className="card mb-4">
        <h3 className="text-[15px] font-semibold mb-2">소속 연구방법(Research Methods)</h3>
        <div className="flex flex-wrap gap-1.5">
          {bundle.methods.map((m, i) => (
            <span key={i} className="pill"><Gloss text={m.label || m.name} /></span>
          ))}
        </div>
      </div>

      <h2 className="text-[17px] font-semibold mb-2">절차적 단계(Procedural Stage)</h2>
      <p className="text-[13px] text-ink-2 mb-3">단계를 선택하면 하위 절차적 태스크(Procedural Task)로 이동합니다.</p>
      <div className="space-y-2.5">
        {bundle.stages.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            className="card w-full text-left hover:-translate-y-0.5 transition-transform"
            onClick={() => nav(`archetype/project/${bundle.id}/stage/${encodeURIComponent(s.id)}`)}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[11px] text-ink-3 mb-0.5">{idx + 1}단계 · <Gloss text={s.processLabel} /></div>
                <div className="text-[14px] font-semibold leading-snug"><Gloss text={s.name} /></div>
                <div className="text-[12.5px] text-ink-2 mt-1.5">절차적 태스크 {s.tasks.length}개</div>
              </div>
              <span className="pill">{s.tasks.length} tasks</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
