/**
 * Smoke test for basic-stats engine (node / tsx not required — plain JS via ts-node skip).
 * Run: npx tsx scripts/verify-basic-stats.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { runBasicStats } from "../lib/basic-stats-engine";

const cur = JSON.parse(
  readFileSync(join(__dirname, "../public/basic-stats-curriculum.json"), "utf8")
);

let ok = 0;
let fail = 0;
for (const m of cur.modules) {
  try {
    const r = runBasicStats(m.id, m.sampleCsv, {});
    if (!r.summary) throw new Error("no summary");
    console.log("OK", m.id, "→", r.summary.slice(0, 60));
    ok++;
  } catch (e: any) {
    console.error("FAIL", m.id, e?.message || e);
    fail++;
  }
}
console.log(`\n${ok} ok / ${fail} fail / ${cur.modules.length} modules`);
if (fail) process.exit(1);
