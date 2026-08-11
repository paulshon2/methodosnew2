"use client";
import { useState } from "react";
import { CHART_CATALOG } from "@/lib/charts";
import { Gloss } from "./gloss";
import VizStandard from "./viz-standard";

// 시각화 — ① 카탈로그 / ② 연구방법별 표준(v2 React)
export default function VizView({
  nav,
  allowedCharts,
}: {
  nav: (r: string) => void;
  allowedCharts?: Set<string> | null;
}) {
  const catalog = CHART_CATALOG.map((c) => ({
    ...c,
    charts: c.charts.filter((ch) => !allowedCharts || allowedCharts.has(ch.id)),
  })).filter((c) => c.charts.length > 0);
  const total = catalog.reduce((a, c) => a + c.charts.length, 0);
  const [mode, setMode] = useState<"catalog" | "standard">("catalog");

  return (
    <div className="text-[14px]">
      <div className="mb-4">
        <h1 className="text-[22px] font-semibold">📊 데이터 시각화</h1>
        <p className="mt-1 text-[14px] text-ink-2">그래프 유형 카탈로그(자체 SVG) 또는 연구방법별 표준 시각화 파이프라인 중 선택하세요.</p>
      </div>

      <div className="inline-flex rounded-md p-0.5 gap-0.5 mb-4" style={{ background: "var(--color-background-secondary)" }}>
        <button
          type="button"
          onClick={() => setMode("catalog")}
          className="rounded px-4 py-2 text-[14px]"
          style={
            mode === "catalog"
              ? { background: "var(--color-background-primary)", color: "var(--brand-ink)", fontWeight: 600, boxShadow: "var(--shadow)" }
              : { color: "var(--color-text-secondary)" }
          }
        >
          그래프 유형 카탈로그
        </button>
        <button
          type="button"
          onClick={() => setMode("standard")}
          className="rounded px-4 py-2 text-[14px]"
          style={
            mode === "standard"
              ? { background: "var(--color-background-primary)", color: "var(--brand-ink)", fontWeight: 600, boxShadow: "var(--shadow)" }
              : { color: "var(--color-text-secondary)" }
          }
        >
          연구방법별 추천 그래프
        </button>
      </div>

      {mode === "standard" ? (
        <VizStandard nav={nav} allowedCharts={allowedCharts} />
      ) : (
        <>
          <p className="text-[14px] text-ink-2 mb-4">
            통계 용어를 몰라도 괜찮아요. 아래 {total}가지 그래프 중 하나를 고르면, <strong>왜·어떻게</strong>를 예시와 함께 안내합니다.
          </p>
          {catalog.map((c) => (
            <div key={c.key} className="mb-5">
              <div className="text-[12px] uppercase tracking-wide text-ink-3 mb-1 pl-2" style={{ borderLeft: "2.5px solid var(--brand)" }}>
                {c.catKo} · {c.charts.length}
              </div>
              <p className="text-[13px] text-ink-3 mb-2.5 pl-2">{c.intro}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {c.charts.map((ch) => (
                  <div
                    key={ch.id}
                    className="card cursor-pointer hover:-translate-y-0.5 transition-transform"
                    onClick={() => nav("viztype/" + ch.id)}
                  >
                    <div className="text-[15px] font-semibold mb-1">
                      <Gloss text={ch.name} />
                    </div>
                    <Gloss className="text-[13px] text-ink-2 min-h-[34px] block" text={ch.desc} />
                    <div className="mt-2 text-[12px]" style={{ color: "var(--brand-ink)" }}>
                      👉 언제? <Gloss text={ch.useWhen} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {catalog.length === 0 && <p className="text-ink-3">현재 등급에서 사용 가능한 그래프가 없습니다.</p>}
        </>
      )}
    </div>
  );
}
