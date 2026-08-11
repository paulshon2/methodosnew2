"use client";

import Note from "@/components/ui/Note";
import { GOAL_BY_ID, slotCandidates, type Dataset, type GoalId } from "@/lib/stats-goal";

/** 2단계 — 목록에는 이 분석에 쓸 수 있는 변수만 나온다. */
export default function VariableSlots({
  ds,
  goal,
  chosen,
  onChange,
}: {
  ds: Dataset;
  goal: GoalId;
  chosen: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const spec = GOAL_BY_ID[goal];

  return (
    <div>
      <p className="ty-body mb-3 text-ink-2 prose-w">
        목록에는 이 분석에 쓸 수 있는 변수만 나옵니다. 원하는 변수가 보이지 않는다면 그 변수의 유형(숫자·범주)이나 값 종류 수가 조건에 맞지 않는 것입니다.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {spec.slots.map((slot) => {
          const cands = slotCandidates(ds, goal, slot.key, chosen);
          const id = `slot-${goal}-${slot.key}`;
          return (
            <div key={slot.key}>
              <label htmlFor={id} className="ty-label mb-1 block font-bold">
                {slot.label}
              </label>
              <select
                id={id}
                className="inp"
                value={chosen[slot.key] || ""}
                onChange={(e) => onChange({ ...chosen, [slot.key]: e.target.value })}
                aria-describedby={`${id}-hint`}
              >
                <option value="">선택하세요</option>
                {cands.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} · {v.type === "num" ? `숫자 n=${v.numbers.length}` : `범주 ${v.levels.length}종`}
                  </option>
                ))}
              </select>
              <p id={`${id}-hint`} className="ty-label mt-1 text-ink-3">
                {slot.hint}
                {cands.length === 0 ? " — 조건에 맞는 변수가 없습니다." : ` · 후보 ${cands.length}개`}
              </p>
            </div>
          );
        })}
      </div>

      {spec.slots.some((s) => !chosen[s.key]) && (
        <Note level="info" className="mt-3" title="아직 변수를 다 고르지 않았습니다">
          위 칸을 모두 채우면 계산이 자동으로 시작됩니다. 이 분석에서 쓰일 검정은 {spec.testName}입니다.
        </Note>
      )}
    </div>
  );
}
