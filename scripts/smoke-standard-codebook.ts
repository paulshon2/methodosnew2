/**
 * Smoke test for AI standard codebook pipeline (rule fallback path).
 * Run: npx tsx scripts/smoke-standard-codebook.ts
 */
import {
  runStandardAiCodebookPipeline,
  sacCategoryFreq,
  sacMetaCategories,
  sacTopThemes,
} from "../lib/ai-standard-codebook";

const sample = `
인터뷰어: 돌봄을 시작하게 된 계기가 무엇이었나요?
참여자A: 어머니가 갑자기 아프시면서 제가 돌봄을 맡게 됐어요. 처음엔 부담이 정말 컸어요.
참여자A: 병원 일정, 약 관리, 식사 준비까지 하루에 모든 시간이 돌봄으로 채워졌어요.
참여자B: 저도 비슷해요. 직장과 돌봄을 병행하면서 죄책감이 들기도 했고, 지원이 부족하다고 느꼈어요.
참여자B: 가족 안에서 역할이 불명확해서 갈등이 생겼고, 결국 대화로 역할을 나누게 됐어요.
참여자A: 그래도 어머니와 보내는 시간이 의미 있게 느껴질 때도 있어요. 관계의 깊이가 달라졌달까요.
참여자C: 지역 돌봄 서비스를 알게 되면서 숨통이 트였어요. 정보 접근성이 중요하다는 걸 깨달았습니다.
참여자C: 돌봄은 개인 책임이 아니라 사회 지원이 함께해야 한다는 생각이 커졌어요.
`;

async function main() {
  const result = await runStandardAiCodebookPipeline(
    {
      title: "돌봄 경험 스모크",
      question: "참여자들은 돌봄 부담을 어떻게 의미화하는가?",
      purpose: "돌봄 경험의 의미 구조 탐색",
      raw: sample,
      fileNames: ["smoke.txt"],
    },
    {}, // no AI key → rule fallback
    (e) => console.log(`  [${e.percent}%] ${e.phase}`)
  );

  const checks: [string, boolean][] = [
    ["segments", result.segments.length >= 5],
    ["analytics", !!result.analytics && result.analytics.frequency.length > 0],
    ["evidence", result.evidence.length > 0],
    ["inferences", result.inferences.length > 0],
    ["codebook", result.codebook.length > 0],
    ["categories", result.categories.length > 0],
    ["themes", result.themes.length > 0],
    ["interpretation", result.interpretation.includes("연구 프레임") || result.interpretation.includes("최종 해석")],
    ["catFreq", sacCategoryFreq(result).length > 0],
    ["meta", sacMetaCategories(result).length > 0],
    ["topThemes", sacTopThemes(result).length > 0],
  ];

  let fail = 0;
  for (const [name, ok] of checks) {
    console.log(`${ok ? "OK" : "FAIL"}  ${name}`);
    if (!ok) fail++;
  }
  console.log(`\ncodes=${result.codebook.length} evidence=${result.evidence.length} source=${result.source}`);
  console.log(result.interpretation.slice(0, 400));
  if (fail) process.exit(1);
  console.log("\nSMOKE PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
