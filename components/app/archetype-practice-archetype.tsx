"use client";
/** 프로젝트 실습 — 아키타입 내 연구방법 목록 */
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Gloss } from "./gloss";
import { loadPracticeIndex, type PracticeIndex } from "@/lib/archetype-data";

export default function ArchetypePracticeArchetype({
  archetypeId,
  nav,
}: {
  archetypeId: number;
  nav: (r: string) => void;
}) {
  const [doc, setDoc] = useState<PracticeIndex | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    loadPracticeIndex()
      .then(setDoc)
      .catch(() => setErr(true));
  }, []);

  if (err) return <div className="text-[14px] text-ink-3 p-6">목록을 불러오지 못했습니다.</div>;
  if (!doc) return <div className="text-[14px] text-ink-3 p-6">불러오는 중…</div>;

  const arch = doc.archetypes.find((a) => a.id === archetypeId);
  if (!arch) return <div className="text-[14px] text-ink-3 p-6">아키타입을 찾을 수 없습니다.</div>;

  return (
    <div className="text-[14px]">
      <button type="button" className="btn btn-sm mb-2.5" onClick={() => nav("archetype/practice")}>
        ← 프로젝트 실습
      </button>
      <h1 className="text-[20px] font-semibold">
        <Gloss text={arch.name_ko || arch.name || `아키타입 ${arch.id}`} />
      </h1>
      <p className="mt-1 text-[13px] text-ink-2">연구방법을 선택한 뒤 주제 5개 실습으로 들어갑니다.</p>

      <div className="mt-4 space-y-2">
        {arch.methods.map((m) => (
          <button
            key={m.no}
            type="button"
            className="card w-full text-left flex items-center justify-between gap-3"
            onClick={() => nav(`archetype/practice/${archetypeId}/method/${m.no}`)}
          >
            <div>
              <div className="text-[12px] text-ink-3">방법 no.{m.no}</div>
              <div className="text-[14.5px] font-semibold mt-0.5">
                <Gloss text={m.label || m.name} />
              </div>
              <div className="text-[12px] text-ink-2 mt-0.5">주제 {m.topicCount}개</div>
            </div>
            <span className="inline-flex items-center gap-1 text-[13px] font-medium" style={{ color: "var(--brand-ink)" }}>
              주제 선택 <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
