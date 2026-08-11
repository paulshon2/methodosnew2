"use client";

import Note from "@/components/ui/Note";
import type { GoalResult } from "@/lib/stats-goal";
import { ChartBlock, DescriptiveBlock, KeyNumberBlock, TableBlock, WhyBlock } from "./Sections";

/** 같은 사람의 전후 비교 — 개인별 변화량이 주인공이다. */
export default function Paired({ r }: { r: GoalResult }) {
  return (
    <div className="space-y-3">
      <WhyBlock r={r} />
      <KeyNumberBlock r={r} />
      <DescriptiveBlock r={r} />
      <TableBlock r={r} />
      <ChartBlock r={r} />
      <Note level="info" title="전후 차이가 곧 처치 효과는 아닙니다">
        비교 집단 없이 전후만 보면, 시간이 흘러서 생긴 변화(성숙·회귀 효과)와 처치의 효과를 구분할 수 없습니다. 인과를 주장하려면 대조군이 필요합니다.
      </Note>
    </div>
  );
}
