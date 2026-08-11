import { readFileSync } from "fs";
import { runStats47 } from "../lib/stats-47-engine";
import { runBasicStats } from "../lib/basic-stats-engine";

const cur = JSON.parse(readFileSync("./public/basic-stats-curriculum.json", "utf8"));
const m47 = cur.modules.find((x: { id: string }) => x.id === "C-02");
const mold = cur.modules.find((x: { id: string }) => x.id === "ttest");

console.log("=== C-02 기본 데모 CSV ===");
console.log(m47.sampleCsv);
console.log("");

const r47 = runStats47("C-02", m47.sampleCsv);
console.log("--- C-02 (stats-47) ---");
console.log("summary:", r47.summary);
console.log("stats:", JSON.stringify(r47.stats, null, 2));
console.log("verify:", r47.verify?.grade, "|", r47.verify?.summary);
const t2 = r47.verify?.checks.find((c) => c.id === "cons.t2_F");
if (t2) console.log("t²=F check:", t2.ok, t2.detail || "");
console.log("");
console.log(r47.interpretation.split("\n").slice(0, 6).join("\n"));

if (mold) {
  console.log("\n=== 기존 ttest 모듈 데모 ===");
  console.log(mold.sampleCsv);
  console.log("");
  const r = runBasicStats("ttest", mold.sampleCsv);
  console.log("summary:", r.summary);
  console.log("stats:", JSON.stringify(r.stats, null, 2));
  console.log((r.interpretation || "").slice(0, 600));
}
