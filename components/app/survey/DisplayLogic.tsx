"use client";

import type { Question, Survey } from "@/lib/survey-types";

/** 우 · 표시 조건. 앞선 선택형 문항의 답에 따라 이 문항을 보일지 정한다. */
export default function DisplayLogic({
  survey,
  q,
  onChange,
}: {
  survey: Survey;
  q: Question | null;
  onChange: (next: Question) => void;
}) {
  if (!q) return <p className="ty-small text-ink-3">문항을 고르면 표시 조건을 걸 수 있습니다.</p>;

  const index = survey.questions.findIndex((x) => x.id === q.id);
  const sources = survey.questions
    .slice(0, Math.max(0, index))
    .filter((x) => (x.type === "single" || x.type === "multi") && (x.options ?? []).some(Boolean));
  const source = sources.find((x) => x.id === q.cond?.q) ?? null;

  if (sources.length === 0) {
    return (
      <p className="ty-small text-ink-2 prose-w">
        조건을 걸려면 이 문항보다 앞에 보기가 있는 선택형 문항이 있어야 합니다. 조건은 앞의 답을 보고 판단하기 때문입니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="ty-label mb-1 block font-bold" htmlFor="dl-q">
          기준 문항
        </label>
        <select
          id="dl-q"
          className="inp"
          value={q.cond?.q || ""}
          onChange={(e) => onChange({ ...q, cond: e.target.value ? { q: e.target.value, v: "" } : null })}
        >
          <option value="">항상 표시</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {survey.questions.indexOf(s) + 1}. {s.text || "(빈 문항)"}
            </option>
          ))}
        </select>
      </div>

      {source && (
        <div>
          <label className="ty-label mb-1 block font-bold" htmlFor="dl-v">
            이 보기를 골랐을 때만 표시
          </label>
          <select
            id="dl-v"
            className="inp"
            value={q.cond?.v || ""}
            onChange={(e) => onChange({ ...q, cond: { q: source.id, v: e.target.value } })}
          >
            <option value="">보기를 고르세요</option>
            {(source.options ?? []).filter(Boolean).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="ty-small text-ink-2 prose-w">
        조건이 걸린 문항은 응답자 화면에서 조건이 맞을 때만 나타납니다. 조건을 많이 걸수록 응답자마다 받은 문항이 달라지므로, 분석할 때 결측이 늘어납니다.
      </p>
    </div>
  );
}
