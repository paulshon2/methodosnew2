"use client";

import Note from "@/components/ui/Note";
import type { GoalResult } from "@/lib/stats-goal";
import { ChartBlock, KeyNumberBlock, TableBlock, WhyBlock } from "./Sections";

/** 두 범주의 관련성 — 관측빈도와 기대빈도의 거리를 본다. */
export default function ChiSquare({ r }: { r: GoalResult }) {
  return (
    <div className="space-y-3">
      <WhyBlock r={r} />
      <KeyNumberBlock r={r} />
      <TableBlock r={r} />
      <ChartBlock r={r} />
      <Note level="info" title="기대빈도가 왜 중요한가요">
        카이제곱은 &lsquo;두 변수가 무관할 때 나올 법한 빈도&rsquo;와 실제 빈도의 거리를 잽니다. 어떤 칸의 기대빈도가 너무 작으면 그 거리가 과장되어, 없는 관련성이 있는 것처럼 보일 수 있습니다.
      </Note>
    </div>
  );
}
