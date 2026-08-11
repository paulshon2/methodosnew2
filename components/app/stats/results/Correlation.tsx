"use client";

import Note from "@/components/ui/Note";
import type { GoalResult } from "@/lib/stats-goal";
import { ChartBlock, DescriptiveBlock, KeyNumberBlock, TableBlock, WhyBlock } from "./Sections";

/** 두 변수의 관계 — 산점도를 보지 않고 r만 읽으면 안 된다. */
export default function Correlation({ r }: { r: GoalResult }) {
  return (
    <div className="space-y-3">
      <WhyBlock r={r} />
      <KeyNumberBlock r={r} />
      <ChartBlock r={r} />
      <DescriptiveBlock r={r} />
      <TableBlock r={r} />
      <Note level="warn" title="상관은 인과가 아닙니다">
        두 변수가 함께 움직인다고 해서 하나가 다른 하나를 일으킨 것은 아닙니다. 세 번째 변수가 둘을 동시에 움직였을 수도, 인과의 방향이 반대일 수도 있습니다.
      </Note>
    </div>
  );
}
