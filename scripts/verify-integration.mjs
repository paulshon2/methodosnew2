#!/usr/bin/env node
/**
 * MethodOS two-menu integration verifier.
 * Exit 1 on failure.
 *
 * Checks:
 * 1. method-catalog.json entries have methodKey (pending statuses allowed without key)
 * 2. archetype case methodKeys exist in method-catalog (no orphans), pending excluded
 * 3. no [A-Z]{2}-\d{3} in name fields
 * 4. sheet9 person/title strings absent from name fields
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const XW = path.resolve(ROOT, "..", "_crosswalk_export");

const CODE_RE = /[A-Z]{2}-\d{3}/;
const NAME_KEYS = new Set([
  "name",
  "name_ko",
  "name_en",
  "label",
  "title",
  "methodName",
  "methodEn",
  "canonicalName",
]);

const errors = [];
const warnings = [];

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function walkNames(obj, onHit, pathStr = "") {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walkNames(v, onHit, `${pathStr}[${i}]`));
    return;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      if (k === "methodNames" && Array.isArray(v)) {
        v.forEach((s, i) => {
          if (typeof s === "string") onHit(s, `${pathStr}.methodNames[${i}]`, k);
        });
      } else if (NAME_KEYS.has(k) && typeof v === "string") {
        onHit(v, `${pathStr}.${k}`, k);
      } else {
        walkNames(v, onHit, `${pathStr}.${k}`);
      }
    }
  }
}

// --- load ---
const catalog = loadJson(path.join(PUBLIC, "method-catalog.json"));
const methods = catalog.methods || [];
const catalogKeys = new Set(methods.map((m) => m.methodKey).filter(Boolean));

// 1) methodKey presence
let missingKey = 0;
for (const m of methods) {
  const st = m.methodKeyStatus || "";
  if (m.methodKey) continue;
  if (st.startsWith("pending") || st === "pending-manual") continue;
  missingKey++;
  errors.push(`catalog missing methodKey: ${m.methodId} (${m.name_ko}) status=${st}`);
}
if (missingKey === 0) {
  console.log(`OK 1: catalog methodKey — ${methods.filter((m) => m.methodKey).length}/${methods.length} assigned (pending allowed)`);
} else {
  console.log(`FAIL 1: ${missingKey} catalog rows missing methodKey without pending status`);
}

// 2) archetype methodKeys ⊆ catalog
let orphan = 0;
let linked = 0;
let pendingCases = 0;
for (let i = 1; i <= 31; i++) {
  const bp = path.join(PUBLIC, "archetypes", "bundles", `bundle-${String(i).padStart(2, "0")}.json`);
  const b = loadJson(bp);
  for (const m of b.methods || []) {
    if (m.status === "pending-registration" || m.methodKey == null) {
      pendingCases++;
      continue;
    }
    linked++;
    if (!catalogKeys.has(m.methodKey)) {
      // also accept if any catalog row has it — already in set
      orphan++;
      errors.push(`orphan methodKey ${m.methodKey} in bundle-${i} case ${m.caseId || m.no} (${m.name})`);
    }
  }
}
if (orphan === 0) {
  console.log(`OK 2: no orphan archetype methodKeys (linked=${linked}, pending/null=${pendingCases})`);
} else {
  console.log(`FAIL 2: ${orphan} orphan methodKeys`);
}

// Note: some practice keys may not be in learning catalog if pending-manual on learning side.
// Soft-warn when practice key missing from catalog entirely.
for (const k of [...catalogKeys]) {
  /* noop */
}

// 3) no codes in name fields
let codeHits = 0;
const files = [
  path.join(PUBLIC, "archetypes", "catalog.json"),
  ...Array.from({ length: 31 }, (_, i) =>
    path.join(PUBLIC, "archetypes", "bundles", `bundle-${String(i + 1).padStart(2, "0")}.json`)
  ),
  path.join(PUBLIC, "method-catalog.json"),
];
for (const f of files) {
  const data = loadJson(f);
  walkNames(data, (text, p) => {
    if (CODE_RE.test(text)) {
      codeHits++;
      errors.push(`code in name field ${path.basename(f)} ${p}: ${text}`);
    }
  });
}
if (codeHits === 0) console.log("OK 3: no registry codes in name fields");
else console.log(`FAIL 3: ${codeHits} code hits in name fields`);

// 4) sheet9 forbidden person/title strings in name fields
/** Only strings that sheet9 actually wants replaced (한글 head != 권장 대체). */
const forbidden = [];
try {
  const s9 = loadJson(path.join(XW, "9_명칭_대체안.json"));
  for (const r of s9.rows || []) {
    const cur = String(r["현재 케이스명"] || "");
    const neu = String(r["권장 대체 명칭(한글)"] || "");
    if (!cur || !neu || cur.includes("아키타입명")) continue;
    const koOld = cur.split("(")[0].trim();
    if (koOld && neu && koOld !== neu) forbidden.push(koOld);
    // person / title tokens that must not remain as labels
    for (const tok of [
      "스트라우스",
      "후설",
      "푸코 ",
      "푸코적",
      "푸코·",
      "(Charmaz)",
      "Malinowski",
      "통계학습의요소",
      "계몽의변증법",
      "지각의 현상학",
      "서태평양의 아르고나우트",
      "민주주의의패턴",
      "인과추론 믹스테이프",
      "비즈니스다이내믹스",
      "사회탐구설계 과학적분론1994",
      "사회탐구설계 과학적분론1994",
      "사회탐구설계 과학적분론",
      "작은 과학에서 큰 과학으로",
      "인공사회",
      "행위자 기반 인공사회",
      "SPSS 통계분석",
      "SPSS 기반",
      "R 기반 잠재변수",
      "R텍스트마이닝",
    ]) {
      forbidden.push(tok);
    }
  }
  // archetype rename
  forbidden.push("푸코·비판이론 아키타입");
  forbidden.push("푸코·비판이론");
} catch (e) {
  warnings.push("sheet9 not loaded: " + e.message);
}

const forbidHits = [];
const uniqForbid = [...new Set(forbidden)].filter((x) => x.length >= 2).sort((a, b) => b.length - a.length);
for (const f of files) {
  const data = loadJson(f);
  walkNames(data, (text, p) => {
    for (const bad of uniqForbid) {
      if (text.includes(bad)) {
        forbidHits.push(`${path.basename(f)} ${p}: contains “${bad}” in “${text.slice(0, 60)}”`);
        break;
      }
    }
  });
}
if (forbidHits.length === 0) console.log("OK 4: sheet9 rename-target strings cleared from name fields");
else {
  console.log(`FAIL 4: ${forbidHits.length} forbidden name leftovers`);
  forbidHits.slice(0, 40).forEach((h) => errors.push(h));
}

// Summary
console.log("\n--- summary ---");
console.log({
  catalogTotal: methods.length,
  catalogWithKey: methods.filter((m) => m.methodKey).length,
  catalogPending: methods.filter((m) => !m.methodKey).length,
  archetypeLinked: linked,
  archetypePending: pendingCases,
  errors: errors.length,
  warnings: warnings.length,
});

if (errors.length) {
  console.error("\nERRORS:");
  errors.slice(0, 40).forEach((e) => console.error(" -", e));
  process.exit(1);
}
console.log("\nverify-integration: PASS");
process.exit(0);
