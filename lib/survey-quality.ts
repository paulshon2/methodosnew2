/**
 * 설문 품질 자동 점검 — 순수 함수.
 *
 * 문구는 언제나 두 문장이다: 무엇이 잘못됐는가, 어떻게 고치는가.
 * 진단만 하고 처방이 없으면 사용자는 같은 실수를 반복한다.
 */
import { QTYPE_BY_ID, totalSeconds, type Question, type Survey } from "./survey-types";

/** 이중 질문 — 한 문항에서 두 가지를 동시에 묻는 형태. */
const DOUBLE = /(.+)(와|과|및|그리고)(.+)(습니까|십니까|나요|가요)/;
/** 유도 표현 — 특정 답을 은근히 권하는 낱말. */
const LEAD = /(당연히|훌륭한|뛰어난|좋은|우수한|않으십니까|바람직한)/;
/** 응답자에게 낯선 전문 용어. */
const JARGON = /(구인|조작적 정의|공변량|타당도|신뢰도 계수|요인부하)/;

export type Issue = {
  /** 문제가 된 문항 id. 설문 전체에 대한 지적이면 null. */
  q: string | null;
  level: "risk" | "warn" | "info";
  title: string;
  detail: string;
};

const label = (s: Survey, id: string) => {
  const i = s.questions.findIndex((q) => q.id === id);
  return i >= 0 ? `${i + 1}번 문항` : "문항";
};

export function auditSurvey(s: Survey): Issue[] {
  const out: Issue[] = [];
  const push = (q: string | null, level: Issue["level"], title: string, detail: string) => out.push({ q, level, title, detail });

  s.questions.forEach((q) => {
    const n = label(s, q.id);
    const text = q.text.trim();

    // ① 문항 비어 있음
    if (!text) {
      push(q.id, "risk", `${n}이 비어 있습니다`, "질문 문장이 없으면 응답자는 무엇에 답해야 할지 알 수 없습니다. 묻고 싶은 것을 한 문장으로 적으세요.");
    }

    // ② 이중 질문
    if (text && DOUBLE.test(text)) {
      push(q.id, "risk", `${n}에서 두 가지를 한꺼번에 묻고 있습니다`, "응답자가 어느 쪽에 답했는지 알 수 없어 결과를 해석할 수 없습니다. 두 문항으로 나누세요.");
    }

    // ③ 유도 표현
    if (text && LEAD.test(text)) {
      push(q.id, "warn", `${n}에 특정 답을 권하는 표현이 있습니다`, "‘좋은’, ‘당연히’ 같은 낱말은 동의 쪽으로 응답을 밀어냅니다. 가치 판단이 담기지 않은 중립적인 말로 바꾸세요.");
    }

    // ④ 문장 길이
    if (text.length > 60) {
      push(q.id, "warn", `${n}이 ${text.length}자로 깁니다`, "긴 문장은 끝까지 읽히지 않아 응답 오류를 만듭니다. 60자 안으로 줄이고, 설명이 필요하면 도움말 칸에 옮기세요.");
    }

    // ⑤ 전문 용어
    if (text && JARGON.test(text)) {
      push(q.id, "info", `${n}에 연구자용 용어가 있습니다`, "‘구인’, ‘조작적 정의’ 같은 말은 응답자에게 낯섭니다. 응답자가 쓰는 일상어로 바꾸세요.");
    }

    // ⑥⑦⑧ 보기 검사
    if (q.type === "single" || q.type === "multi") {
      const opts = (q.options ?? []).map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        push(q.id, "risk", `${n}의 보기가 ${opts.length}개뿐입니다`, "고를 것이 없으면 문항이 성립하지 않습니다. 서로 겹치지 않는 보기를 최소 두 개 이상 쓰세요.");
      }
      if (opts.length > 7) {
        push(q.id, "info", `${n}의 보기가 ${opts.length}개입니다`, "보기가 많으면 앞쪽 보기가 더 많이 선택되는 순서 효과가 생깁니다. 범주를 묶거나 보기 순서를 무작위로 돌리세요.");
      }
      if (new Set(opts).size !== opts.length) {
        push(q.id, "risk", `${n}에 같은 보기가 두 번 있습니다`, "같은 보기가 겹치면 응답이 어느 쪽으로 갈지 알 수 없습니다. 중복된 보기를 지우세요.");
      }
    }

    if (q.type === "matrix") {
      const rows = (q.rows ?? []).map((r) => r.trim()).filter(Boolean);
      if (rows.length < 2) {
        push(q.id, "risk", `${n}의 항목이 ${rows.length}개뿐입니다`, "행렬 문항은 같은 척도로 여러 항목을 물을 때 씁니다. 항목이 하나라면 리커트 척도 문항으로 바꾸세요.");
      }
    }
  });

  // ⑨ 척도 점수 혼재
  const points = [...new Set(s.questions.filter((q) => q.points).map((q) => q.points))];
  if (points.length > 1) {
    push(null, "warn", `척도 점수가 ${points.join("점 · ")}점으로 섞여 있습니다`, "점수 폭이 다르면 문항을 묶어 평균을 내거나 신뢰도를 계산할 수 없습니다. 하나로 통일하세요.");
  }

  // ⑩ 필수 문항 과다
  const req = s.questions.filter((q) => q.required).length;
  if (s.questions.length > 5 && req > s.questions.length * 0.9) {
    push(null, "info", `${s.questions.length}개 중 ${req}개가 필수입니다`, "모두 필수로 두면 답하기 곤란한 문항에서 응답자가 설문을 그만둡니다. 민감하거나 해당 없는 문항은 선택으로 바꾸세요.");
  }

  // ⑪ 예상 응답시간
  const sec = totalSeconds(s);
  if (sec > 900) {
    push(null, "warn", `예상 응답시간이 ${Math.round(sec / 60)}분입니다`, "15분을 넘으면 뒤로 갈수록 성의 없는 응답이 늘어납니다. 문항을 줄이거나 설문을 나누세요.");
  }

  return out;
}

export function qualityScore(issues: Issue[]): number {
  const risk = issues.filter((i) => i.level === "risk").length;
  const warn = issues.filter((i) => i.level === "warn").length;
  const info = issues.filter((i) => i.level === "info").length;
  return Math.max(0, 100 - risk * 18 - warn * 7 - info * 2);
}

/** risk가 하나라도 있으면 배포할 수 없다. */
export function canDeploy(issues: Issue[]): boolean {
  return !issues.some((i) => i.level === "risk");
}

/** 문항 하나에 붙는 경고 — 문제 문항 바로 아래에 보여 준다. */
export function issuesFor(issues: Issue[], q: Question): Issue[] {
  return issues.filter((i) => i.q === q.id);
}

/** 어떤 자료가 만들어지는지 요약 — 설계 단계에서 미리 보여 준다. */
export function scaleSummary(s: Survey): { type: string; count: number; scale: string }[] {
  const map = new Map<string, number>();
  s.questions.forEach((q) => map.set(q.type, (map.get(q.type) ?? 0) + 1));
  return [...map.entries()].map(([t, count]) => ({
    type: QTYPE_BY_ID[t as Question["type"]].label,
    count,
    scale: QTYPE_BY_ID[t as Question["type"]].scale,
  }));
}
