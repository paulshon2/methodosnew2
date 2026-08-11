"use client";
/**
 * 설문 설계·문항 작성·흐름 단계 — 예제 연동 + AI(규칙) 일괄 작성.
 * 주제만 적어도 10~50문항을 만들 수 있고, 예제를 골라 테스트·수정할 수 있다.
 */

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { SURVEY_EXAMPLES, exampleById, materializeExample, type SurveyExample } from "@/lib/survey-examples";
import { QTYPES, type QType, type Question, type Survey } from "@/lib/survey-types";

const COUNT_OPTS = [10, 15, 20, 25, 30, 40, 50] as const;

function pickExamples(preferredTypes: QType[], count: number, topic: string): Question[] {
  const pools = preferredTypes.length
    ? preferredTypes.map((t) => SURVEY_EXAMPLES.filter((e) => e.type === t))
    : [SURVEY_EXAMPLES];
  const flat = pools.flat();
  const out: Question[] = [];
  for (let i = 0; i < count; i++) {
    const ex = flat[i % flat.length];
    const q = materializeExample(ex);
    if (topic.trim()) {
      q.text = q.text.includes(topic.trim())
        ? q.text
        : q.text.replace(/귀하|당신|이번|최근/, (m) => m).replace(/^/, "");
      // 주제에 맞게 문항 앞에 맥락을 붙이지 않고, 도움말에 주제만 남긴다.
      q.help = [q.help, `주제: ${topic.trim()}`].filter(Boolean).join(" · ");
      if (!q.text.includes(topic.trim()) && (q.type === "scale" || q.type === "para" || q.type === "text")) {
        q.text = `'${topic.trim()}' — ${q.text}`;
      }
    }
    out.push(q);
  }
  return out;
}

/** 표시 조건 샘플 — 첫 단일선택 문항의 첫 보기를 조건으로 후속 문항 일부에 연결. */
function attachSampleLogic(questions: Question[]): Question[] {
  const gate = questions.find((q) => q.type === "single" && (q.options?.length ?? 0) > 0);
  if (!gate?.options?.[0]) return questions;
  return questions.map((q, i) => {
    if (q.id === gate.id || i % 5 !== 0 || i === 0) return q;
    return { ...q, cond: { q: gate.id, v: gate.options![0] } };
  });
}

export default function SurveyAiAssist({
  survey,
  mode,
  onApply,
  onAppendExample,
}: {
  survey: Survey;
  mode: "design" | "write" | "logic";
  onApply: (next: Survey) => void;
  onAppendExample: (ex: SurveyExample) => void;
}) {
  const [topic, setTopic] = useState(survey.title || "");
  const [count, setCount] = useState<number>(20);
  const [types, setTypes] = useState<QType[]>(["single", "scale", "matrix", "para", "number"]);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const byType = useMemo(() => {
    const m: Record<string, SurveyExample[]> = {};
    for (const t of QTYPES) m[t.id] = SURVEY_EXAMPLES.filter((e) => e.type === t.id);
    return m;
  }, []);

  const toggleType = (t: QType) =>
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const togglePick = (id: string) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const runAi = (withLogic: boolean) => {
    setBusy(true);
    setMsg("");
    try {
      const t = topic.trim() || "연구 주제";
      let questions =
        picked.length > 0
          ? picked.map((id) => materializeExample(exampleById(id)!)).filter(Boolean)
          : pickExamples(types.length ? types : QTYPES.map((q) => q.id), count, t);

      // 선택만 있고 개수가 모자라면 예제 풀에서 채운다.
      if (picked.length > 0 && questions.length < count) {
        const fill = pickExamples(types, count - questions.length, t);
        questions = [...questions, ...fill];
      }
      questions = questions.slice(0, count);
      if (withLogic) questions = attachSampleLogic(questions);

      onApply({
        title: survey.title || `${t} 설문`,
        desc:
          survey.desc ||
          `본 설문은 '${t}'에 관한 의견을 묻습니다. 소요 ${Math.max(5, Math.round(count * 0.4))}분 내외 · 익명 · 문의는 연구자에게.`,
        questions,
      });
      setMsg(
        withLogic
          ? `AI로 ${questions.length}문항을 만들고 표시 조건 샘플을 연결했습니다. 문항·조건을 직접 수정하세요.`
          : `AI로 ${questions.length}문항을 작성했습니다. 미리보기에서 테스트한 뒤 문구를 고치세요.`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="anim-panel card mb-3">
      <h2 className="ty-section mb-1 flex items-center gap-2">
        <Sparkles size={16} aria-hidden="true" />
        {mode === "design" ? "설계 기입 · 예제·AI 연동" : mode === "write" ? "문항 AI 작성 · 예제 선택" : "흐름·로직 · 예제 기반 조건 테스트"}
      </h2>
      <p className="ty-small mb-3 text-ink-2 prose-w">
        왼쪽 문항추가의 8유형×10예제와 연동됩니다. 예제를 고르거나 주제만 넣고 문항 수(10–50)를 정해 AI로 초안을 만들 수 있습니다.
        생성된 문항은 바로 수정·미리보기할 수 있습니다.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="ty-label mb-1 block font-bold" htmlFor="ai-topic">
            연구·설문 주제 (간략히)
          </label>
          <input
            id="ai-topic"
            className="inp"
            value={topic}
            placeholder="예: 원격수업 만족도, 조직몰입, 수면과 집중"
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <div>
          <label className="ty-label mb-1 block font-bold" htmlFor="ai-count">
            AI 작성 문항 수
          </label>
          <select id="ai-count" className="inp" value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {COUNT_OPTS.map((n) => (
              <option key={n} value={n}>
                {n}문항
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <div className="ty-label mb-1 font-bold">포함할 유형</div>
        <div className="flex flex-wrap gap-1.5">
          {QTYPES.map((t) => {
            const on = types.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                className="btn btn-sm"
                aria-pressed={on}
                onClick={() => toggleType(t.id)}
                style={{
                  borderColor: on ? "var(--brand)" : undefined,
                  background: on ? "var(--brand-soft)" : undefined,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <details className="mt-3 rounded-xl p-2" style={{ border: "1px solid var(--color-border-tertiary)" }}>
        <summary className="ty-label cursor-pointer font-bold">예제에서 골라 연동 ({picked.length}개 선택)</summary>
        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
          {QTYPES.map((t) => (
            <div key={t.id}>
              <div className="ty-label mb-1 text-ink-3">{t.label}</div>
              <div className="flex flex-wrap gap-1">
                {(byType[t.id] || []).map((ex) => {
                  const on = picked.includes(ex.id);
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      className="btn btn-sm"
                      aria-pressed={on}
                      title={ex.question.text}
                      onClick={() => togglePick(ex.id)}
                      onDoubleClick={() => onAppendExample(ex)}
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderColor: on ? "var(--brand)" : undefined,
                        background: on ? "var(--brand-soft)" : undefined,
                      }}
                    >
                      {ex.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="ty-label mt-2 text-ink-3">더블클릭하면 설문에 바로 한 문항 추가 · 클릭은 AI 작성용 선택</p>
      </details>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => runAi(mode === "logic")}>
          <Sparkles size={15} aria-hidden="true" />{" "}
          {mode === "logic" ? "AI로 문항+표시조건 초안" : "AI로 설문 문항 작성"}
        </button>
        <button
          type="button"
          className="btn"
          disabled={!picked.length}
          onClick={() => {
            picked.forEach((id) => {
              const ex = exampleById(id);
              if (ex) onAppendExample(ex);
            });
            setMsg(`선택한 예제 ${picked.length}개를 설문에 추가했습니다. 미리보기에서 테스트하세요.`);
          }}
        >
          선택 예제만 추가·테스트
        </button>
      </div>
      {msg ? <p className="ty-small mt-2 text-ink-2">{msg}</p> : null}
    </section>
  );
}
