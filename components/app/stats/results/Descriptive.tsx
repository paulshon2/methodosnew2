"use client";

import Note from "@/components/ui/Note";
import type { GoalResult } from "@/lib/stats-goal";
import { ChartBlock, DescriptiveBlock, KeyNumberBlock, TableBlock, WhyBlock } from "./Sections";

/** 한 변수 요약 — 다음 분석으로 가기 전에 분포부터 본다. */
export default function Descriptive({ r }: { r: GoalResult }) {
  return (
    <div className="space-y-3">
      <WhyBlock r={r} />
      <KeyNumberBlock r={r} />
      <DescriptiveBlock r={r} />
      <TableBlock r={r} />
      <ChartBlock r={r} />
      <Note level="info" title="평균과 중위수가 많이 다르다면">
        분포가 한쪽으로 치우쳤다는 뜻입니다. 이때는 평균보다 중위수가 &lsquo;보통 사람&rsquo;을 더 잘 대표합니다. 논문에는 둘을 함께 적고, 히스토그램을 근거로 제시하세요.
      </Note>
    </div>
  );
}
