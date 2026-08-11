"use client";

import { QTYPES, type Question } from "@/lib/survey-types";

/** 우 · 문항 속성. 문구는 설문지에서 고치고, 여기서는 구조만 바꾼다. */
export default function QuestionProps({ q, onChange }: { q: Question | null; onChange: (next: Question) => void }) {
  if (!q) return <p className="ty-small text-ink-3">문항을 고르면 유형·필수 여부·척도 점수를 여기서 바꿀 수 있습니다.</p>;

  return (
    <div className="space-y-3">
      <div>
        <label className="ty-label mb-1 block font-bold" htmlFor="qp-type">
          문항 유형
        </label>
        <select
          id="qp-type"
          className="inp"
          value={q.type}
          onChange={(e) => onChange({ ...q, type: e.target.value as Question["type"] })}
        >
          {QTYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="ty-label mt-1 text-ink-3">{QTYPES.find((t) => t.id === q.type)?.scale}</p>
      </div>

      <label className="flex items-start gap-2">
        <input type="checkbox" className="mt-0.5" checked={q.required} onChange={(e) => onChange({ ...q, required: e.target.checked })} />
        <span>
          <span className="ty-label font-bold">필수 응답</span>
          <span className="ty-label block text-ink-3">답하기 곤란한 문항까지 필수로 두면 응답자가 설문을 그만둡니다.</span>
        </span>
      </label>

      {(q.type === "scale" || q.type === "matrix") && (
        <div>
          <label className="ty-label mb-1 block font-bold" htmlFor="qp-points">
            척도 점수
          </label>
          <select
            id="qp-points"
            className="inp"
            value={q.points ?? 5}
            onChange={(e) => onChange({ ...q, points: Number(e.target.value) as Question["points"] })}
          >
            {[4, 5, 6, 7].map((p) => (
              <option key={p} value={p}>
                {p}점
              </option>
            ))}
          </select>
          <p className="ty-label mt-1 text-ink-3">
            홀수 점수는 가운데(중립)를 허용하고, 짝수 점수는 어느 한쪽을 고르게 합니다. 설문 안에서는 하나로 통일하세요.
          </p>
        </div>
      )}
    </div>
  );
}
