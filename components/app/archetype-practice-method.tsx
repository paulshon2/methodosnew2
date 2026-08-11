"use client";
/** 프로젝트 실습 — 주제 5개 선택 + 표준 방법 학습 역링크 */
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { Gloss } from "./gloss";
import { loadPracticeMethod, type PracticeMethodDoc } from "@/lib/archetype-data";
import { loadMethodCatalog, type MethodCatalog } from "@/lib/method-catalog";

export default function ArchetypePracticeMethod({
  archetypeId,
  methodNo,
  nav,
}: {
  archetypeId: number;
  methodNo: number;
  nav: (r: string) => void;
}) {
  const [doc, setDoc] = useState<PracticeMethodDoc | null>(null);
  const [cat, setCat] = useState<MethodCatalog | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    loadPracticeMethod(archetypeId, methodNo)
      .then(setDoc)
      .catch(() => setErr(true));
    loadMethodCatalog().then(setCat);
  }, [archetypeId, methodNo]);

  const learningTarget = useMemo(() => {
    const mk = doc?.methodKey;
    if (!mk || !cat?.methods?.length) return null;
    const hits = cat.methods.filter((m) => m.methodKey === mk);
    if (!hits.length) return null;
    hits.sort((a, b) => (a.variant ?? 0) - (b.variant ?? 0));
    return hits[0];
  }, [doc?.methodKey, cat]);

  if (err) return <div className="text-[14px] text-ink-3 p-6">방법 샘플을 불러오지 못했습니다.</div>;
  if (!doc) return <div className="text-[14px] text-ink-3 p-6">불러오는 중…</div>;

  return (
    <div className="text-[14px]">
      <button
        type="button"
        className="btn btn-sm mb-2.5"
        onClick={() => nav(`archetype/practice/${archetypeId}`)}
      >
        ← 연구방법 목록
      </button>
      <h1 className="text-[20px] font-semibold">
        <Gloss text={`${doc.methodName}${doc.methodEn ? `(${doc.methodEn})` : ""}`} />
      </h1>
      <p className="mt-1 text-[13px] text-ink-2">정교화 샘플 주제 5개 중 하나를 선택하세요. 예제·그림이 태스크에 그대로 포함됩니다.</p>

      {learningTarget && (
        <div className="mt-3 mb-2">
          <button
            type="button"
            className="btn btn-sm inline-flex items-center gap-1.5"
            style={{ background: "var(--ok-wash)", color: "var(--fam-survey)" }}
            onClick={() => nav("method/" + encodeURIComponent(learningTarget.methodId))}
          >
            <BookOpen size={14} />
            표준 방법 학습하기
            <span className="text-[11px] opacity-80">
              · {learningTarget.canonicalName || learningTarget.name_ko}
              {doc.methodKey ? ` (${doc.methodKey})` : ""}
            </span>
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {doc.topics.map((t) => (
          <button
            key={t.index}
            type="button"
            className="card w-full text-left"
            onClick={() => nav(`archetype/practice/${archetypeId}/method/${methodNo}/topic/${t.index}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[12px] text-ink-3">주제{t.index}</div>
                <div className="text-[14.5px] font-semibold mt-0.5">
                  <Gloss text={t.title} />
                </div>
                <div className="text-[12.5px] text-ink-2 mt-1">
                  {[t.mode, t.focus].filter(Boolean).join(" · ")}
                </div>
                {t.hypothesis && (
                  <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed">
                    명제: <Gloss text={t.hypothesis} />
                  </p>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-[13px] font-medium shrink-0" style={{ color: "var(--brand-ink)" }}>
                실습 <ArrowRight size={14} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
