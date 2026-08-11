"use client";
/** 방법론적 아키타입 — 용어 */
import { useEffect, useMemo, useState } from "react";
import { Gloss } from "./gloss";
import { loadArchetypeGlossary, type ArchetypeGlossaryDoc } from "@/lib/archetype-data";

export default function ArchetypeGlossary({ nav }: { nav: (r: string) => void }) {
  const [doc, setDoc] = useState<ArchetypeGlossaryDoc | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    loadArchetypeGlossary().then(setDoc).catch(() => setDoc(null));
  }, []);

  const filtered = useMemo(() => {
    if (!doc) return [];
    const ql = q.trim().toLowerCase();
    if (!ql) return doc.terms;
    return doc.terms.filter((t) =>
      (t.term + (t.term_ko || "") + (t.term_en || "") + t.definition).toLowerCase().includes(ql)
    );
  }, [doc, q]);

  if (!doc) return <div className="text-[14px] text-ink-3 p-6">용어를 불러오는 중…</div>;

  return (
    <div className="text-[14px]">
      <button type="button" className="btn btn-sm mb-2.5" onClick={() => nav("archetype")}>← 방법론적 아키타입</button>
      <h1 className="text-[22px] font-semibold"><Gloss text={doc.title} /></h1>
      <p className="mt-1.5 text-[14px] text-ink-2 leading-relaxed max-w-[760px]"><Gloss text={doc.intro} /></p>
      <input className="inp mt-3 mb-3.5" placeholder="용어 검색 (한글/English)" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="text-[12.5px] text-ink-3 mb-2">{filtered.length}개 용어</div>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {filtered.map((t, i) => (
          <div key={`${t.term}-${i}`} className="rounded-md px-3 py-2.5" style={{ background: "var(--color-background-secondary)" }}>
            <div className="text-[13.5px] font-semibold" style={{ color: "var(--brand-ink)" }}>
              <Gloss text={t.term} />
            </div>
            <p className="text-[13px] text-ink-2 mt-1 leading-relaxed"><Gloss text={t.definition} /></p>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-ink-3">검색 결과 없음.</p>}
    </div>
  );
}
