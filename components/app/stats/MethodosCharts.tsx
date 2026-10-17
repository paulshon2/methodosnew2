"use client";
/** 그래프 그리기 — 최근 분석 결과를 이 분석에 맞춰 설계한 그림으로 본다. */
import { useEffect } from "react";
import MethodosTabs from "@/components/methodos/MethodosTabs";
import DesignedViz from "@/components/methodos/DesignedViz";
import { hydrateMethodosHistory, useMethodosSession } from "@/lib/methodos/session";

export default function MethodosCharts({ nav }: { nav: (r: string) => void }) {
  const { current, history, open } = useMethodosSession();
  useEffect(() => { hydrateMethodosHistory(); }, []);
  return (
    <div>
      <MethodosTabs active="charts" nav={nav} />
      <h1 className="ty-title">그래프 그리기</h1>
      <p className="ty-body mt-1.5 mb-4 text-ink-2 prose-w">최근 분석 결과를 한눈에 읽도록 이 분석에 맞춰 설계한 그림으로 보여 줍니다. 그림의 값은 모두 결과표에서 가져오며, 그림마다 「읽는 법」과 「표로 보기」, PNG·SVG 저장이 있습니다.</p>
      {!current ? (
        <div className="card">
          <p className="ty-small text-ink-2">아직 분석 결과가 없습니다. 분석을 먼저 실행하세요.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn btn-primary" onClick={() => nav("basic-stats/M01")}>분석 실행으로</button>
            <button type="button" className="btn" onClick={() => nav("basic-stats/hub")}>통계방법 라이브러리로</button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: "var(--brand-soft)" }}>{current.code}</span>
            <b className="text-[14px]">{current.name}</b>
            <span className="ty-label text-ink-3">{current.source}</span>
            {history.length > 1 ? (
              <select className="inp ml-auto" style={{ maxWidth: 320 }} value={current.id} onChange={(e) => open(e.target.value)} aria-label="다른 결과 고르기">
                {history.map((h) => <option key={h.id} value={h.id}>{h.code} {h.name} · {h.at.slice(5, 16).replace("T", " ")}</option>)}
              </select>
            ) : null}
          </div>
          <DesignedViz result={current.result} slots={current.slots} />
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn btn-sm" onClick={() => nav("basic-stats/results")}>통계분석결과(표)로</button>
            <button type="button" className="btn btn-sm" onClick={() => nav(`basic-stats/${current.code}`)}>이 기법으로 다시 분석</button>
          </div>
        </div>
      )}
    </div>
  );
}
