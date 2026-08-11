"use client";

import Note from "@/components/ui/Note";
import { CHART_BY_ID, type Advice, type VizSpec } from "@/lib/viz-spec";

/** 우 · 읽기 도움. 왜 이 그림이 좋은지/나쁜지와 무엇으로 바꿔야 하는지를 함께 말한다. */
export default function AdvicePanel({ spec, advice }: { spec: VizSpec; advice: Advice[] }) {
  const meta = CHART_BY_ID[spec.chart];
  return (
    <div className="space-y-3">
      <Note level="info" title={`${meta.label} — 왜 이 그림인가`}>
        {meta.why}
      </Note>

      {advice.length === 0 ? (
        <p className="ty-small text-ink-3">지금 설정에서 특별히 지적할 점은 없습니다.</p>
      ) : (
        advice.map((a) => (
          <Note key={a.id} level={a.level === "ok" ? "ok" : a.level} title={a.title} fix={a.fix} live>
            {a.message}
          </Note>
        ))
      )}

      <div className="rounded-xl p-2.5" style={{ border: "1px solid var(--color-border-tertiary)" }}>
        <h4 className="ty-label mb-1 font-bold">이 그림을 읽는 법</h4>
        <p className="ty-small text-ink-2 prose-w">{meta.howToRead}</p>
      </div>
    </div>
  );
}
