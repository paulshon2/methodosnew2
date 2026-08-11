"use client";
/** 프로젝트 실습(Project Practice) — 아키타입 목록 */
import { useEffect, useState } from "react";
import { ArrowRight, FlaskConical } from "lucide-react";
import { Gloss } from "./gloss";
import { loadPracticeIndex, type PracticeIndex } from "@/lib/archetype-data";

export default function ArchetypePractice({ nav }: { nav: (r: string) => void }) {
  const [doc, setDoc] = useState<PracticeIndex | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    loadPracticeIndex()
      .then(setDoc)
      .catch(() => setErr(true));
  }, []);

  if (err) return <div className="text-[14px] text-ink-3 p-6">프로젝트 실습 데이터를 불러오지 못했습니다.</div>;
  if (!doc) return <div className="text-[14px] text-ink-3 p-6">프로젝트 실습을 불러오는 중…</div>;

  return (
    <div className="text-[14px]">
      <button type="button" className="btn btn-sm mb-2.5" onClick={() => nav("archetype")}>
        ← 방법론적 아키타입
      </button>
      <h1 className="text-[22px] font-semibold flex items-center gap-2">
        <FlaskConical size={22} style={{ color: "var(--brand)" }} />
        <Gloss text={doc.title} />
      </h1>
      <p className="mt-1.5 text-[14px] text-ink-2 leading-relaxed max-w-[760px]">
        <Gloss text={doc.intro} />
      </p>
      <p className="mt-2 text-[12.5px] text-ink-3">
        아키타입 → 연구방법 → 주제 → 태스크 순으로 진행하세요.
      </p>

      <div className="mt-4 space-y-2.5">
        {doc.archetypes.map((a) => (
          <button
            key={a.id}
            type="button"
            className="card w-full text-left flex items-center justify-between gap-3 hover:-translate-y-0.5 transition-transform"
            onClick={() => nav(`archetype/practice/${a.id}`)}
          >
            <div>
              <div className="text-[12px] text-ink-3">아키타입 {a.id}</div>
              <div className="text-[15px] font-semibold mt-0.5">
                <Gloss text={a.name_ko || a.name || `아키타입 ${a.id}`} />
              </div>
              <div className="text-[12.5px] text-ink-2 mt-1">
                연구방법 {a.methods.length}개 · 주제 실습 {a.methods.reduce((s, m) => s + (m.topicCount || 0), 0)}세트
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[13px] font-medium shrink-0" style={{ color: "var(--brand-ink)" }}>
              열기 <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
