"use client";

import { memo, useEffect, useState } from "react";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import { QTYPE_BY_ID, seconds, type Question } from "@/lib/survey-types";
import type { Issue } from "@/lib/survey-quality";
import DateInput from "./widgets/DateInput";
import Matrix from "./widgets/Matrix";
import Multi from "./widgets/Multi";
import NumberInput from "./widgets/NumberInput";
import Para from "./widgets/Para";
import Scale from "./widgets/Scale";
import Single from "./widgets/Single";
import Text from "./widgets/Text";
import type { WidgetProps } from "./widgets/types";

const WIDGET: Record<Question["type"], (p: WidgetProps) => React.ReactNode> = {
  single: Single,
  multi: Multi,
  scale: Scale,
  matrix: Matrix,
  text: Text,
  para: Para,
  number: NumberInput,
  date: DateInput,
};

/**
 * 문항 한 개 — 응답자가 볼 화면 그대로다.
 * 글자는 로컬 상태로 받고 부모에는 늦게 반영해, 입력 중 커서가 튀지 않게 한다.
 */
function QuestionBlock({
  q,
  index,
  preview,
  selected,
  issues,
  hidden,
  value,
  onValue,
  onChange,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  q: Question;
  index: number;
  preview: boolean;
  selected: boolean;
  issues: Issue[];
  /** 표시 조건 때문에 응답자에게는 보이지 않는 문항 */
  hidden: boolean;
  value?: WidgetProps["value"];
  onValue?: WidgetProps["onValue"];
  onChange: (next: Question) => void;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(q.text);
  const [help, setHelp] = useState(q.help);

  useEffect(() => setText(q.text), [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setHelp(q.help), [q.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (text === q.text) return;
    const t = setTimeout(() => onChange({ ...q, text }), 200);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (help === q.help) return;
    const t = setTimeout(() => onChange({ ...q, help }), 200);
    return () => clearTimeout(t);
  }, [help]); // eslint-disable-line react-hooks/exhaustive-deps

  const Widget = WIDGET[q.type];
  const risky = issues.some((i) => i.level === "risk");

  if (preview && hidden) return null;

  return (
    <article
      id={`q-${q.id}`}
      onFocusCapture={onSelect}
      onClick={onSelect}
      className="rounded-2xl p-4"
      style={{
        border: `1px solid ${selected && !preview ? "var(--brand)" : risky ? "var(--danger)" : "var(--color-border-tertiary)"}`,
        background: "var(--color-background-secondary)",
        scrollMarginTop: 96,
      }}
    >
      <div className="mb-2 flex items-start gap-2">
        {!preview && <GripVertical size={16} aria-hidden="true" className="mt-1 shrink-0 text-ink-3" />}
        <span className="ty-label num mt-1 shrink-0 font-bold text-ink-3">{index + 1}</span>
        <div className="min-w-0 flex-1">
          {preview ? (
            <h3 className="ty-subhead">
              {q.text || <span className="text-ink-3">(질문이 비어 있습니다)</span>}
              {q.required && <span style={{ color: "var(--danger)" }}> *</span>}
            </h3>
          ) : (
            <input
              className="inp"
              value={text}
              placeholder="여기에 질문을 적으세요"
              aria-label={`${index + 1}번 질문 문장`}
              onChange={(e) => setText(e.target.value)}
            />
          )}
        </div>
        {!preview && (
          <div className="flex shrink-0 gap-1">
            <Badge tone="neutral" mark={false}>
              {QTYPE_BY_ID[q.type].label}
            </Badge>
            <button type="button" className="btn btn-sm" aria-label="문항 복제" onClick={onDuplicate}>
              <Copy size={14} aria-hidden="true" />
            </button>
            <button type="button" className="btn btn-sm" aria-label="문항 삭제" onClick={onDelete}>
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {preview ? (
        q.help ? <p className="ty-small mb-2 text-ink-3">{q.help}</p> : null
      ) : (
        <input
          className="inp mb-2"
          value={help}
          placeholder="도움말 (선택) — 응답자가 헷갈릴 만한 점을 미리 적어 두세요"
          aria-label={`${index + 1}번 도움말`}
          onChange={(e) => setHelp(e.target.value)}
        />
      )}

      <Widget q={q} preview={preview} value={value} onValue={onValue} onPatch={(patch) => onChange({ ...q, ...patch })} />

      {!preview && (
        <p className="ty-label mt-2 text-ink-3">
          예상 {Math.round(seconds(q))}초 · {QTYPE_BY_ID[q.type].scale}
          {q.cond ? ` · 조건부 표시` : ""}
          {hidden ? " · 지금 응답자 화면에서는 숨겨집니다" : ""}
        </p>
      )}

      {!preview &&
        issues.map((i) => (
          <Note key={i.title} level={i.level === "info" ? "info" : i.level} className="mt-2" title={i.title}>
            {i.detail}
          </Note>
        ))}
    </article>
  );
}

export default memo(QuestionBlock);
