/**
 * Smoke: 47 techniques run + verify filter anchors
 * npx --yes tsx scripts/verify-stats47.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { runStats47, isStats47Code } from "../lib/stats-47-engine";
import { checkSpecialAnchors } from "../lib/stats-verify-filter";

const cur = JSON.parse(
  readFileSync(join(__dirname, "../public/basic-stats-curriculum.json"), "utf-8"),
);
const mods = cur.modules.filter((m: { id: string }) => isStats47Code(m.id));
console.log("curriculum 47 modules:", mods.length);

const anchors = checkSpecialAnchors();
const aFail = anchors.filter((c) => !c.ok);
if (aFail.length) {
  console.error("ANCHOR FAIL", aFail);
  process.exit(1);
}
console.log("special anchors OK", anchors.length);

let fail = 0;
for (const m of mods) {
  const r = runStats47(m.id, m.sampleCsv || "ID,X\n1,1\n2,2");
  if (!r.summary) {
    console.error("no summary", m.id);
    fail++;
  }
  if (!r.verify) {
    console.error("no verify", m.id);
    fail++;
  } else if (r.verify.grade === "fail" && r.verify.checks.some((c) => c.layer === "anchor" && !c.ok)) {
    console.error("verify anchor fail", m.id, r.verify.summary);
    fail++;
  }
}
console.log("ran", mods.length, "fail", fail);
if (fail) process.exit(1);
console.log("verify-stats47 OK");
