"use client";

import Note from "@/components/ui/Note";
import type { GoalResult } from "@/lib/stats-goal";
import { ChartBlock, DescriptiveBlock, KeyNumberBlock, TableBlock, WhyBlock } from "./Sections";

/** 세 집단 이상 비교 — 유의해도 '어디가 다른지'는 사후검정이 말한다. */
export default function Anova({ r }: { r: GoalResult }) {
  return (
    <div className="space-y-3">
      <WhyBlock r={r} />
      <KeyNumberBlock r={r} />
      <DescriptiveBlock r={r} />
      <TableBlock r={r} />
      <ChartBlock r={r} />
      <Note level="info" title="분산분석이 유의하다는 말의 뜻">
        &lsquo;어딘가에 차이가 있다&rsquo;는 뜻일 뿐, 어느 집단끼리 다른지는 말해 주지 않습니다. 그래서 Bonferroni 보정 사후검정 표를 함께 보아야 합니다.
        보정을 하는 이유는, 비교를 여러 번 하면 우연히 유의해질 확률이 그만큼 커지기 때문입니다.
      </Note>
    </div>
  );
}
