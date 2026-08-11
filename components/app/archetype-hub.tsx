"use client";
/** 방법론적 아키타입 (Methodological Archetype) — 허브 */
import { useEffect, useState } from "react";
import { Layers, BookOpen, FolderKanban, ArrowRight, Shapes, FlaskConical } from "lucide-react";
import { Gloss } from "./gloss";
import { loadArchetypeCatalog, type ArchetypeCatalog } from "@/lib/archetype-data";

const ICONS = {
  overview: BookOpen,
  glossary: Layers,
  projects: FolderKanban,
  practice: FlaskConical,
} as const;

const ACCENTS = {
  overview: { accent: "var(--fam-survey)", soft: "var(--ok-wash)" },
  glossary: { accent: "var(--fam-qual)", soft: "var(--appr-quant-soft)" },
  projects: { accent: "var(--fam-stats)", soft: "var(--warn-wash)" },
  practice: { accent: "var(--fam-mixed)", soft: "var(--appr-qual-soft)" },
} as const;

export default function ArchetypeHub({ nav }: { nav: (r: string) => void }) {
  const [doc, setDoc] = useState<ArchetypeCatalog | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    loadArchetypeCatalog()
      .then(setDoc)
      .catch(() => setErr(true));
  }, []);

  if (err) return <div className="text-[14px] text-ink-3 p-6">방법론적 아키타입 데이터를 불러오지 못했습니다.</div>;
  if (!doc) return <div className="text-[14px] text-ink-3 p-6">방법론적 아키타입을 불러오는 중…</div>;

  return (
    <div className="text-[14px]">
      <h1 className="text-[22px] font-semibold flex items-center gap-2">
        <Shapes size={22} style={{ color: "var(--brand)" }} />
        <Gloss text={doc.title} />
      </h1>
      <p className="mt-1.5 text-[14px] text-ink-2 leading-relaxed max-w-[760px]">
        <Gloss text={doc.intro} />
      </p>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          ["아키타입", doc.stats.archetypeCount],
          ["연구방법 묶음", doc.stats.methodCoverage],
          ["절차적 태스크", doc.stats.taskCount],
          ["용어", doc.stats.termCount],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-md px-3 py-2.5" style={{ background: "var(--color-background-secondary)" }}>
            <div className="text-[11px] text-ink-3">{l}</div>
            <div className="text-[16px] font-semibold mt-0.5">{v}</div>
          </div>
        ))}
      </div>

      <div className="card mt-4 mb-4">
        <h3 className="text-[15px] font-semibold mb-2">초보라면 이 순서로</h3>
        <ol className="list-decimal pl-5 text-[13.5px] leading-relaxed space-y-1">
          {doc.howTo.map((h, i) => (
            <li key={i}><Gloss text={h} /></li>
          ))}
        </ol>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-5">
        {doc.hubCards.map((c) => {
          const Icon = ICONS[c.id as keyof typeof ICONS] || BookOpen;
          const tone = ACCENTS[c.id as keyof typeof ACCENTS] || ACCENTS.overview;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => nav(`archetype/${c.id}`)}
              className="card text-left transition-transform hover:-translate-y-0.5"
              style={{ borderTop: `3px solid ${tone.accent}`, padding: "16px 16px 14px" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md" style={{ background: tone.soft, color: tone.accent }}>
                  <Icon size={18} />
                </span>
                <span className="text-[15px] font-semibold leading-snug" style={{ color: tone.accent }}>
                  <Gloss text={c.title} />
                </span>
              </div>
              <p className="text-[13px] text-ink-2 leading-relaxed mb-3"><Gloss text={c.blurb} /></p>
              <span className="inline-flex items-center gap-1 text-[13px] font-medium" style={{ color: tone.accent }}>
                열기 <ArrowRight size={14} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
