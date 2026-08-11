/**
 * Smoke: pipeline insight (v56) — Computational Analytics · Evidence · quotes
 * Run: npx tsx scripts/smoke-pipeline-insight.ts
 */
import {
  emptyProject,
  buildPipelineInsight,
  buildPipelineRuleInterpretation,
  type CodingProject,
} from "../lib/cmq-engine";
import {
  runStandardAiCodebookPipeline,
  pickQuotes,
} from "../lib/ai-standard-codebook";

const sample = `
Attendees discussed the exhibition and the body of work. The exhibition was playful.
When we think about the body and typography, attendees said the exhibition mattered.
Anyway, even when I accepted that topic, I had some difficult parts as a writer.
But if what I convey as art is felt by the audience, communication becomes clear.
Next, in the play created by the playground designer, we tried to reflect in the exhibition
the movement of the letters and the playfulness of typography.
So, when we think about the body carefully, whether it was created with Olympics in mind,
the meaning of exhibition and attendees' experience becomes deeper.
There is one reason why it happened naturally, and another reason that is more realistic.
If I had planned it linearly, like the body is like this, I would not have been satisfied.
`;

async function main() {
  const base = emptyProject();
  const proj: CodingProject = {
    ...base,
    title: "2017-iv-smoke",
    question: "전시와 신체의 의미는 무엇인가?",
    purpose: "스모크 테스트",
    raw: sample,
    segments: sample.split(/(?<=[.!?])\s+/).filter((t) => t.trim().length > 12).map((text, i) => ({
      id: `seg${i + 1}`, unit: "sentence", text: text.trim(),
    })),
    codebook: [
      { code: "exhibition", definition: "", example: "exhibition", methodId: "descriptive", cmq: "First", count: 5 },
      { code: "body", definition: "", example: "body", methodId: "descriptive", cmq: "First", count: 4 },
      { code: "attendees", definition: "", example: "attendees", methodId: "descriptive", cmq: "First", count: 3 },
    ],
    categories: [{ id: "cat1", label: "주제:exhibition", codes: ["exhibition", "body"] }],
    patterns: [{ id: "p1", statement: "전시와 신체가 함께 나타난다", supportingCodes: ["exhibition", "body"] }],
    themes: [{ id: "t1", sentence: "전시와 신체 경험이 핵심이다", categories: ["주제:exhibition"] }],
  };

  const insight = buildPipelineInsight(proj);
  const report = buildPipelineRuleInterpretation({ ...proj, pipelineInsight: insight });

  const checks: [string, boolean][] = [
    ["analytics", !!insight.analytics && insight.analytics.frequency.length > 0],
    ["no-stopword-the", !insight.analytics!.frequency.some((f) => f.term === "the")],
    ["no-stopword-and", !insight.analytics!.frequency.some((f) => f.term === "and")],
    ["evidence", insight.evidence.length > 0],
    ["quotes", insight.evidence.every((e) => (e.representativeQuotes?.length || 0) + (e.relatedSentences?.length || 0) > 0)],
    ["codebook", insight.codebook.length > 0],
    ["evidenceByTerm", Object.keys(insight.evidenceByTerm).length > 0],
    ["clusters", (insight.analytics?.clusters.length || 0) > 0],
    ["cooccur", (insight.analytics?.cooccurrence.length || 0) > 0],
    ["report-frame", report.includes("연구 프레임")],
    ["report-evidence", report.includes("Evidence")],
    ["pickQuotes", pickQuotes(proj.segments.map((s) => s.text), "exhibition", 2).length > 0],
  ];

  let fail = 0;
  for (const [name, ok] of checks) {
    console.log(`${ok ? "OK" : "FAIL"}  ${name}`);
    if (!ok) fail++;
  }
  console.log(`\nterms=${insight.analytics?.frequency.slice(0, 8).map((f) => f.term).join(", ")}`);
  console.log(`evidence=${insight.evidence.length} codebook=${insight.codebook.length}`);
  console.log(report.slice(0, 350));

  // also ensure step-5 still works
  const sac = await runStandardAiCodebookPipeline(
    { title: "sac", question: "q", purpose: "p", raw: sample, fileNames: [] },
    {},
    () => {}
  );
  const sacOk = !!sac.analytics && sac.evidence.length > 0 && sac.interpretation.length > 40;
  console.log(`${sacOk ? "OK" : "FAIL"}  standard-codebook-pipeline`);
  if (!sacOk) fail++;

  if (fail) process.exit(1);
  console.log("\nSMOKE PASS (pipeline insight v56)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
