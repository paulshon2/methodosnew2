"use client";

import { useCallback, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import type { Issue } from "@/lib/survey-quality";
import type { Question, Survey } from "@/lib/survey-types";
import QuestionBlock from "./QuestionBlock";

/** 중앙 · 설문지 그 자체. 편집이든 응답자 화면이든 같은 레이아웃을 쓴다. */
export default function SurveyPaper({
  survey,
  preview,
  selected,
  issues,
  onChange,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  survey: Survey;
  preview: boolean;
  selected: string | null;
  issues: Issue[];
  onChange: (next: Survey) => void;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[] | Record<string, string>>>({});

  const patch = useCallback(
    (next: Question) => onChange({ ...survey, questions: survey.questions.map((q) => (q.id === next.id ? next : q)) }),
    [survey, onChange],
  );

  /** 표시 조건이 걸린 문항은, 조건이 충족될 때만 응답자에게 보인다. */
  const hiddenNow = (q: Question): boolean => {
    if (!q.cond) return false;
    const v = answers[q.cond.q];
    if (Array.isArray(v)) return !v.includes(q.cond.v);
    return v !== q.cond.v;
  };

  return (
    <div className="space-y-3">
      <header className="card">
        {preview ? (
          <>
            <h2 className="ty-title">{survey.title || "제목 없는 설문"}</h2>
            {survey.desc ? <p className="ty-body mt-1 text-ink-2 prose-w">{survey.desc}</p> : null}
          </>
        ) : (
          <>
            <label className="ty-label mb-1 block font-bold" htmlFor="survey-title">
              설문 제목
            </label>
            <input
              id="survey-title"
              className="inp"
              value={survey.title}
              placeholder="응답자가 가장 먼저 읽는 문장입니다"
              onChange={(e) => onChange({ ...survey, title: e.target.value })}
            />
            <label className="ty-label mb-1 mt-2 block font-bold" htmlFor="survey-desc">
              안내문
            </label>
            <textarea
              id="survey-desc"
              className="inp"
              rows={3}
              value={survey.desc}
              placeholder="목적·소요시간·익명성·연락처를 적으세요. 이 네 가지가 응답률을 가장 크게 좌우합니다."
              onChange={(e) => onChange({ ...survey, desc: e.target.value })}
            />
          </>
        )}
      </header>

      {survey.questions.length === 0 ? (
        <EmptyState title="아직 문항이 없습니다">
          왼쪽 유형 목록에서 하나를 누르면 이 자리에 문항이 추가됩니다. 응답자가 보게 될 화면을 그대로 편집하게 됩니다.
        </EmptyState>
      ) : (
        survey.questions.map((q, i) => (
          <QuestionBlock
            key={q.id}
            q={q}
            index={i}
            preview={preview}
            selected={selected === q.id}
            issues={issues.filter((x) => x.q === q.id)}
            hidden={hiddenNow(q)}
            value={answers[q.id]}
            onValue={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
            onChange={patch}
            onSelect={() => onSelect(q.id)}
            onDuplicate={() => onDuplicate(q.id)}
            onDelete={() => onDelete(q.id)}
          />
        ))
      )}

      {preview && survey.questions.length > 0 && (
        <div className="card">
          <button type="button" className="btn btn-primary" disabled>
            제출하기
          </button>
          <p className="ty-label mt-2 text-ink-3">
            지금은 응답자 화면을 확인하는 중이라 제출은 동작하지 않습니다. 답을 입력해 보면 표시 조건이 실제로 어떻게 작동하는지 확인할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
