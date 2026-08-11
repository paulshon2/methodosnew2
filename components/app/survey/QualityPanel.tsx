"use client";

import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import Ring from "@/components/ui/Ring";
import { canDeploy, qualityScore, scaleSummary, type Issue } from "@/lib/survey-quality";
import { formatDuration, totalSeconds, type Survey } from "@/lib/survey-types";

const LEVEL = {
  risk: { tone: "risk" as const, mark: "✕", word: "고쳐야 함" },
  warn: { tone: "warn" as const, mark: "!", word: "다시 볼 것" },
  info: { tone: "info" as const, mark: "·", word: "참고" },
};

/** 우 · 품질 점검. 항목을 누르면 해당 문항으로 이동한다. */
export default function QualityPanel({
  survey,
  issues,
  onGo,
}: {
  survey: Survey;
  issues: Issue[];
  onGo: (id: string) => void;
}) {
  const score = qualityScore(issues);
  const ok = canDeploy(issues);
  const sec = totalSeconds(survey);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Ring value={score} label={String(score)} caption="품질 점수" />
        <div className="min-w-0">
          <p className="ty-small text-ink-2">
            문항 <strong className="num">{survey.questions.length}</strong>개 · 예상 응답시간{" "}
            <strong className="num">{formatDuration(sec)}</strong>
          </p>
          <p className="ty-label mt-1 text-ink-3">
            점수는 고쳐야 할 항목 18점, 다시 볼 항목 7점, 참고 항목 2점씩 깎아 계산합니다.
          </p>
        </div>
      </div>

      {ok ? (
        <Note level="ok" title="배포할 수 있습니다" live>
          꼭 고쳐야 할 문제가 없습니다. 그래도 아래 &lsquo;다시 볼 것&rsquo; 항목은 응답의 질을 좌우합니다.
        </Note>
      ) : (
        <Note level="risk" title="아직 배포할 수 없습니다" live fix="아래 빨간 항목을 눌러 해당 문항으로 가서 고치세요.">
          고쳐야 할 문제가 {issues.filter((i) => i.level === "risk").length}건 있습니다. 이대로 배포하면 수집한 자료를 분석할 수 없습니다.
        </Note>
      )}

      {issues.length > 0 && (
        <ul className="space-y-2">
          {issues.map((i, k) => {
            const t = LEVEL[i.level];
            return (
              <li key={`${i.title}-${k}`}>
                <button
                  type="button"
                  disabled={!i.q}
                  onClick={() => i.q && onGo(i.q)}
                  className="w-full rounded-xl p-2.5 text-left disabled:cursor-default"
                  style={{ border: "1px solid var(--color-border-tertiary)" }}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="ty-label min-w-0 flex-1 font-bold">{i.title}</span>
                    <Badge tone={t.tone} mark={t.mark}>
                      {t.word}
                    </Badge>
                  </div>
                  <p className="ty-small text-ink-2">{i.detail}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {survey.questions.length > 0 && (
        <div className="rounded-xl p-2.5" style={{ border: "1px solid var(--color-border-tertiary)" }}>
          <h4 className="ty-label mb-1.5 font-bold">이 설문이 만들어 낼 자료</h4>
          <ul className="space-y-1">
            {scaleSummary(survey).map((s) => (
              <li key={s.type} className="ty-label text-ink-2">
                <strong>{s.type} {s.count}개</strong> — {s.scale}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
