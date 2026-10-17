"use client";
/** 통계분석결과 — 지금까지 돌린 결과 기록과 결과표·그림. 기록은 이 브라우저에만 남는다. */
import { useEffect } from "react";
import MethodosTabs from "@/components/methodos/MethodosTabs";
import DesignedViz from "@/components/methodos/DesignedViz";
import MethodosResult from "./MethodosResult";
import { hydrateMethodosHistory, useMethodosSession } from "@/lib/methodos/session";

export default function MethodosResults({ nav }: { nav: (r: string) => void }) {
  const { current, history, open, remove, clearHistory } = useMethodosSession();
  useEffect(() => { hydrateMethodosHistory(); }, []);
  return (
    <div>
      <MethodosTabs active="results" nav={nav} />
      <h1 className="ty-title">통계분석결과</h1>
      <p className="ty-body mt-1.5 mb-4 text-ink-2 prose-w">분석 실행·라이브러리 예제로 돌린 결과가 최근 {30}건까지 이 브라우저에 남습니다. 서버에는 저장되지 않으며, 브라우저 데이터를 지우면 사라집니다.</p>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="card self-start">
          <div className="mb-2 flex items-center gap-2">
            <b className="text-[13px]">결과 기록</b>
            {history.length > 0 ? <button type="button" className="btn btn-sm ml-auto" onClick={() => { if (confirm("결과 기록을 모두 지울까요?")) clearHistory(); }}>모두 지우기</button> : null}
          </div>
          {history.length === 0 ? <p className="ty-small text-ink-3">아직 없습니다.</p> : (
            <ul className="space-y-1">
              {history.map((h) => (
                <li key={h.id} className="flex items-stretch gap-1">
                  <button type="button" aria-current={current?.id === h.id} className="min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-left text-[12.5px]" style={{ borderColor: current?.id === h.id ? "var(--brand)" : "var(--color-border-tertiary)", background: current?.id === h.id ? "var(--brand-soft)" : "transparent" }} onClick={() => open(h.id)}>
                    <div className="truncate font-medium">{h.name}</div>
                    <div className="truncate text-[10.5px] text-ink-3">{h.code} · {h.source} · {h.at.slice(5, 16).replace("T", " ")}</div>
                  </button>
                  <button type="button" className="btn btn-sm" aria-label="이 기록 지우기" onClick={() => remove(h.id)}>×</button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="btn btn-primary mt-3 w-full" onClick={() => nav("basic-stats/M01")}>분석 실행으로</button>
        </aside>
        <article className="min-w-0">
          {!current ? <div className="card"><p className="ty-small text-ink-2">왼쪽에서 결과를 고르거나 분석을 새로 실행하세요.</p></div> : (
            <div className="card">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
                <span>{current.code}</span><span>· 자료 {current.source}</span><span>· {current.at.slice(0, 19).replace("T", " ")}</span>
                <button type="button" className="btn btn-sm ml-auto" onClick={() => nav("basic-stats/charts")}>그래프 그리기로</button>
                <button type="button" className="btn btn-sm" onClick={() => nav(`basic-stats/${current.code}`)}>다시 분석</button>
              </div>
              <MethodosResult res={current.result} ms={current.ms} fileBase={current.source.replace(/\.[^.]+$/, "") || current.code} />
              <DesignedViz result={current.result} slots={current.slots} />
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
