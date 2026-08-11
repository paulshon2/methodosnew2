"use client";
/** 방법론적 아키타입 — 개요 및 단계 */
import { useEffect, useState } from "react";
import { Gloss } from "./gloss";
import { loadArchetypeCatalog, type ArchetypeCatalog } from "@/lib/archetype-data";

export default function ArchetypeOverview({ nav }: { nav: (r: string) => void }) {
  const [doc, setDoc] = useState<ArchetypeCatalog | null>(null);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<number | null>(1);

  useEffect(() => {
    loadArchetypeCatalog().then(setDoc).catch(() => setDoc(null));
  }, []);

  if (!doc) return <div className="text-[14px] text-ink-3 p-6">개요 및 단계를 불러오는 중…</div>;

  const ql = q.trim().toLowerCase();
  const list = doc.archetypes.filter((a) => {
    if (!ql) return true;
    return (a.name + a.name_ko + a.name_en + a.methodNames.join(" ") + a.deliverable).toLowerCase().includes(ql);
  });

  return (
    <div className="text-[14px]">
      <button type="button" className="btn btn-sm mb-2.5" onClick={() => nav("archetype")}>← 방법론적 아키타입</button>
      <h1 className="text-[22px] font-semibold">개요 및 단계(Overview & Stages)</h1>
      <p className="mt-1.5 text-[14px] text-ink-2 leading-relaxed max-w-[760px]">
        같은 연구 과정(수집→전처리→코딩→통계→결과→산출)을 쓰는 연구방법을
        방법론적 아키타입(Methodological Archetype)으로 묶었습니다. 유형을 펼쳐 단계 뼈대를 확인하세요.
      </p>
      <input
        className="inp mt-3 mb-3.5"
        placeholder="아키타입·연구방법 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="space-y-3">
        {list.map((a) => {
          const open = openId === a.id;
          return (
            <div key={a.id} className="card">
              <button type="button" className="w-full text-left" onClick={() => setOpenId(open ? null : a.id)}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] text-ink-3 mb-0.5">유형 {a.id} / 31</div>
                    <div className="text-[15px] font-semibold"><Gloss text={a.name} /></div>
                    <div className="text-[12.5px] text-ink-2 mt-1">
                      연구방법 {a.methodCount}개 · 절차적 단계 {a.stageCount} · 태스크 {a.taskCount}
                    </div>
                  </div>
                  <span className="pill">{open ? "접기" : "단계 보기"}</span>
                </div>
              </button>
              {open && (
                <div className="mt-3 pt-3" style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                  <p className="text-[13px] text-ink-2 mb-2">
                    최종 산출물(Final Deliverable): <Gloss text={a.deliverable || "—"} />
                  </p>
                  <div className="text-[12.5px] text-ink-3 mb-2">소속 연구방법 예: {a.methodNames.join(" · ")}{a.methodTotal > a.methodNames.length ? " …" : ""}</div>
                  <ol className="space-y-2">
                    {a.processSummary.map((p, i) => (
                      <li key={p.id} className="rounded-md px-3 py-2" style={{ background: "var(--color-background-secondary)" }}>
                        <div className="text-[13px] font-semibold">{i + 1}. <Gloss text={p.label} /></div>
                        <div className="text-[12.5px] text-ink-2 mt-1 leading-relaxed"><Gloss text={p.procedure} /></div>
                      </li>
                    ))}
                  </ol>
                  <button type="button" className="btn btn-primary btn-sm mt-3" onClick={() => nav(`archetype/project/${a.id}`)}>
                    이 유형으로 프로젝트 시작
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {list.length === 0 && <p className="text-ink-3">검색 결과 없음.</p>}
    </div>
  );
}
