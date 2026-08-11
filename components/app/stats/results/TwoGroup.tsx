"use client";

import Note from "@/components/ui/Note";
import type { GoalResult } from "@/lib/stats-goal";
import { ChartBlock, DescriptiveBlock, KeyNumberBlock, TableBlock, WhyBlock } from "./Sections";

/** 두 집단 평균 비교 — 등분산이 깨지면 Welch로 갈아탄 사실을 맨 위에서 알린다. */
export default function TwoGroup({ r }: { r: GoalResult }) {
  return (
    <div className="space-y-3">
      <WhyBlock r={r} />
      <KeyNumberBlock r={r} />
      <DescriptiveBlock r={r} />
      <TableBlock r={r} />
      <ChartBlock r={r} />
      <Note level="info" title="p값이 작다고 차이가 큰 것은 아닙니다">
        표본이 크면 아주 작은 차이도 유의해집니다. 그래서 Cohen&rsquo;s d를 함께 봅니다. d가 0.20 아래면 통계적으로 유의해도 실질적 의미는 작을 수 있습니다.
      </Note>
    </div>
  );
}
