/**
 * 설문 품질 점검 11종 단위 테스트.
 * Run: npx --yes tsx scripts/verify-survey-quality.ts
 */
import { auditSurvey, canDeploy, qualityScore } from "../lib/survey-quality";
import { newQuestion, totalSeconds, type Question, type Survey } from "../lib/survey-types";

let checks = 0;
function assert(cond: boolean, msg: string) {
  checks++;
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function survey(questions: Question[]): Survey {
  return { title: "테스트", desc: "", questions };
}
function q(patch: Partial<Question>): Question {
  return { ...newQuestion(patch.type ?? "text"), text: "정상 문항입니다", ...patch };
}
function has(s: Survey, fragment: string): boolean {
  return auditSurvey(s).some((i) => i.title.includes(fragment) || i.detail.includes(fragment));
}

// ① 빈 문항
assert(has(survey([q({ text: "" })]), "비어 있습니다"), "빈 문항 감지");

// ② 이중 질문
assert(has(survey([q({ text: "이 수업의 내용과 진행 방식에 만족하십니까" })]), "두 가지를"), "이중 질문 감지");

// ③ 유도 표현
assert(has(survey([q({ text: "이 훌륭한 프로그램을 추천하시겠습니까" })]), "권하는 표현"), "유도 표현 감지");

// ④ 문장 길이
assert(has(survey([q({ text: "가".repeat(61) })]), "깁니다"), "60자 초과 감지");
assert(!has(survey([q({ text: "가".repeat(59) })]), "깁니다"), "60자 이하는 통과");

// ⑤ 전문 용어
assert(has(survey([q({ text: "이 구인에 대해 어떻게 생각하십니까" })]), "연구자용 용어"), "전문 용어 감지");

// ⑥ 보기 부족
assert(has(survey([q({ type: "single", options: ["하나"] })]), "보기가 1개뿐입니다"), "보기 부족 감지");

// ⑦ 보기 과다
assert(
  has(survey([q({ type: "single", options: ["1", "2", "3", "4", "5", "6", "7", "8"] })]), "보기가 8개입니다"),
  "보기 과다 감지",
);

// ⑧ 보기 중복
assert(has(survey([q({ type: "single", options: ["가", "가", "나"] })]), "같은 보기가"), "보기 중복 감지");

// ⑨ 척도 혼재
assert(
  has(survey([q({ type: "scale", points: 5 }), q({ type: "scale", points: 7 })]), "섞여 있습니다"),
  "척도 혼재 감지",
);

// ⑩ 필수 과다
const many = Array.from({ length: 10 }, () => q({ required: true }));
assert(has(survey(many), "필수입니다"), "필수 과다 감지");

// ⑪ 응답시간 초과
const long = Array.from({ length: 20 }, () => q({ type: "para" }));
assert(totalSeconds(survey(long)) > 900, "장문 20문항은 900초 초과");
assert(has(survey(long), "예상 응답시간"), "응답시간 경고 감지");

// 점수·배포 잠금
const clean = survey([q({ type: "single", options: ["예", "아니오"] }), q({ type: "scale" })]);
assert(auditSurvey(clean).length === 0, `정상 설문에 지적이 없어야 함: ${JSON.stringify(auditSurvey(clean))}`);
assert(qualityScore(auditSurvey(clean)) === 100, "정상 설문은 100점");
assert(canDeploy(auditSurvey(clean)), "정상 설문은 배포 가능");

const broken = survey([q({ text: "" })]);
assert(!canDeploy(auditSurvey(broken)), "risk가 있으면 배포 잠금");
assert(qualityScore(auditSurvey(broken)) === 82, `risk 1개 = 82점, 실제 ${qualityScore(auditSurvey(broken))}`);

console.log(`survey quality selftest OK · ${checks} checks`);
