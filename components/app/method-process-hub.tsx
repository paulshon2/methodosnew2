"use client";
/** 연구방법별 프로세스 — 허브(단계별 상세요약 · 공통절차) */
import { ListTree, Layers, BookOpen, ArrowRight } from "lucide-react";
import { Gloss } from "./gloss";
import { useMethodProcessGuide } from "@/lib/method-process-guide";

const CARDS = [
  {
    id: "process/stages",
    title: "연구방법 단계별 상세요약",
    icon: ListTree,
    blurb: "표준 연구방법(L1) 145개마다 연구초점→보고까지 6단계 ‘지금 할 일’을 확인합니다.",
    beginner: "가상 학습에서 고른 표준 방법 이름을 검색해, 실행 전에 단계만 먼저 읽으세요.",
    example: "예: ①연구초점 → ②윤리·설계 → ③수집 → ④전처리 → ⑤분석·해석 → ⑥보고·성찰",
    accent: "var(--fam-qual)",
    soft: "rgba(31,78,121,0.08)",
  },
  {
    id: "process/common",
    title: "연구방법의 공통절차",
    icon: Layers,
    blurb: "방법론적 아키타입 31개가 공유하는 수집→가공→분석→해석→결과완성 뼈대를 익힙니다.",
    beginner: "방법 이름이 어려워도, 같은 아키타입이면 ‘지금은 수집 단계’를 구분할 수 있습니다.",
    example: "예: 설문 아키타입 = 문항·표본 수집 → 정제 → 분포·교차 → 해석 → 조사보고서",
    accent: "var(--fam-stats)",
    soft: "rgba(138,75,8,0.08)",
  },
] as const;

export default function MethodProcessHub({ nav }: { nav: (r: string) => void }) {
  const { doc, err } = useMethodProcessGuide();

  if (err) {
    return <div className="text-[14px] text-ink-3 p-6">프로세스 안내 데이터를 불러오지 못했습니다.</div>;
  }
  if (!doc) {
    return <div className="text-[14px] text-ink-3 p-6">연구방법별 프로세스를 불러오는 중…</div>;
  }

  return (
    <div className="text-[14px]">
      <h1 className="text-[22px] font-semibold">연구방법별 프로세스</h1>
      <p className="mt-1.5 text-[14px] text-ink-2 leading-relaxed max-w-[720px]">
        <Gloss text={doc.intro} />
      </p>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          ["표준 방법(L1)", doc.stats.methodCount],
          ["단계 행", doc.stats.stageRowCount],
          ["아키타입", doc.stats.familyCount],
          ["출처", "L1·Archetype"],
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
        <button type="button" className="btn btn-sm mt-3" onClick={() => nav("methods")}>
          <BookOpen size={14} className="inline mr-1" aria-hidden="true" />방법 라이브러리 →
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-3.5 mb-5">
        {CARDS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => nav(c.id)}
            className="card text-left transition-transform hover:-translate-y-0.5"
            style={{ borderTop: `3px solid ${c.accent}`, padding: "16px 16px 14px" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md" style={{ background: c.soft, color: c.accent }}>
                <c.icon size={18} />
              </span>
              <span className="text-[15px] font-semibold leading-snug" style={{ color: c.accent }}>{c.title}</span>
            </div>
            <p className="text-[13px] text-ink-2 leading-relaxed mb-2">{c.blurb}</p>
            <div className="rounded-md p-2.5 text-[12.5px] leading-relaxed mb-2" style={{ background: "var(--color-background-secondary)" }}>
              💡 {c.beginner}
            </div>
            <p className="text-[12px] text-ink-3 leading-relaxed mb-3">{c.example}</p>
            <span className="inline-flex items-center gap-1 text-[13px] font-medium" style={{ color: c.accent }}>
              열기 <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>

      <GlossaryBlock items={doc.glossary} />
    </div>
  );
}

export function GlossaryBlock({ items }: { items: { term: string; def: string }[] }) {
  return (
    <div className="card">
      <h3 className="text-[15px] font-semibold mb-1.5">용어 주석 (이 메뉴에서 자주 씀)</h3>
      <p className="text-[12.5px] text-ink-3 mb-3">어려운 말은 아래에 모아 두었습니다. 왼쪽 「용어 주석」에서도 같은 항목을 볼 수 있습니다.</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {items.map((g) => (
          <div key={g.term} className="rounded-md px-3 py-2" style={{ background: "var(--color-background-secondary)" }}>
            <div className="text-[13px] font-semibold">{g.term}</div>
            <div className="text-[12.5px] text-ink-2 mt-0.5 leading-relaxed">{g.def}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
