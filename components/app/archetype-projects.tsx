"use client";
/** 방법론적 아키타입 — 31형 프로세스 유형 선택 */
import { useEffect, useState } from "react";
import { Gloss } from "./gloss";
import { loadArchetypeCatalog, type ArchetypeCatalog } from "@/lib/archetype-data";

export default function ArchetypeProjects({ nav }: { nav: (r: string) => void }) {
  const [doc, setDoc] = useState<ArchetypeCatalog | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    loadArchetypeCatalog().then(setDoc).catch(() => setDoc(null));
  }, []);

  if (!doc) return <div className="text-[14px] text-ink-3 p-6">프로젝트를 불러오는 중…</div>;

  const ql = q.trim().toLowerCase();
  const list = doc.archetypes.filter((a) => {
    if (!ql) return true;
    return (a.name + a.name_ko + a.methodNames.join(" ")).toLowerCase().includes(ql);
  });

  return (
    <div className="text-[14px]">
      <button type="button" className="btn btn-sm mb-2.5" onClick={() => nav("archetype")}>← 방법론적 아키타입</button>
      <h1 className="text-[22px] font-semibold">프로젝트 예비학습 — 31개 프로세스 유형</h1>
      <p className="mt-1.5 text-[14px] text-ink-2 leading-relaxed max-w-[760px]">
        연구방법을 31개 프로세스 유형으로 분류한 방법론적 아키타입(Methodological Archetype) 중 하나를 선택하세요.
        선택한 유형의 절차적 단계(Procedural Stage)와 절차적 태스크(Procedural Task)를 AI 기반으로 실습합니다.
      </p>
      <input className="inp mt-3 mb-3.5" placeholder="유형·연구방법 검색" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {list.map((a) => (
          <button
            key={a.id}
            type="button"
            className="card text-left cursor-pointer hover:-translate-y-0.5 transition-transform"
            onClick={() => nav(`archetype/project/${a.id}`)}
          >
            <span className="inline-block rounded-full px-2 py-0.5 text-[10.5px]" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
              유형 {a.id}/31
            </span>
            <div className="text-sm font-semibold mt-2 mb-1"><Gloss text={a.name} /></div>
            <p className="text-[11.5px] text-ink-2 min-h-[40px]">
              연구방법 {a.methodCount}개 · 단계 {a.stageCount} · 태스크 {a.taskCount}
            </p>
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              <span className="pill">{a.stageCount}단계</span>
              <span className="pill" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>AI 실습</span>
            </div>
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="text-ink-3">검색 결과 없음.</p>}
    </div>
  );
}
