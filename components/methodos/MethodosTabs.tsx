"use client";
/** Expert 모드의 네 화면 — 통계방법 라이브러리 · 분석 실행 · 그래프 그리기 · 통계분석결과. */
import { useMethodosSession } from "@/lib/methodos/session";

export type MethodosTab = "library" | "run" | "charts" | "results";

const TABS: { id: MethodosTab; label: string }[] = [
  { id: "library", label: "통계방법 라이브러리" },
  { id: "run", label: "분석 실행" },
  { id: "charts", label: "그래프 그리기" },
  { id: "results", label: "통계분석결과" },
];

export default function MethodosTabs({ active, nav }: { active: MethodosTab; nav: (r: string) => void }) {
  const current = useMethodosSession((s) => s.current);
  const count = useMethodosSession((s) => s.history.length);
  const go = (id: MethodosTab) => {
    if (id === "library") nav("basic-stats/hub");
    else if (id === "run") nav(`basic-stats/${current?.code ?? "M01"}`);
    else if (id === "charts") nav("basic-stats/charts");
    else nav("basic-stats/results");
  };
  return (
    <div role="tablist" aria-label="Methodos 통계 화면" className="mb-4 flex flex-wrap items-center gap-1.5 border-b pb-2" style={{ borderColor: "var(--color-border-tertiary)" }}>
      <button type="button" className="btn btn-sm" onClick={() => nav("basic-stats")} title="목적으로 시작하기로 돌아갑니다">← 목적으로 시작</button>
      {TABS.map((t) => (
        <button key={t.id} role="tab" aria-selected={active === t.id} type="button" className={`btn btn-sm ${active === t.id ? "btn-primary" : ""}`} onClick={() => go(t.id)}>
          {t.label}
          {t.id === "results" && count > 0 ? <span className="ml-1 text-[10.5px] opacity-80">({count})</span> : null}
        </button>
      ))}
      {current ? <span className="ty-label ml-auto text-ink-3">최근 결과 · {current.code} {current.name}</span> : null}
    </div>
  );
}
