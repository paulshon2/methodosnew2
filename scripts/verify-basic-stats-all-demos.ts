/**
 * 기본통계 메뉴 · 모듈 sampleCsv + 테스트용 데모(12종) 일괄 실행·검사
 * npx --yes tsx scripts/verify-basic-stats-all-demos.ts
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { runBasicStats } from "../lib/basic-stats-engine";
import { isStats47Code } from "../lib/stats-47-engine";

type Row = {
  id: string;
  demoId: string;
  group: string;
  name: string;
  ok: boolean;
  hasSummary: boolean;
  hasInterp: boolean;
  hasStats: boolean;
  verifyGrade?: string;
  verifyPass?: boolean;
  p?: number | string;
  keyStats?: string;
  error?: string;
  severity: "pass" | "warn" | "fail";
};

const cur = JSON.parse(
  readFileSync(join(__dirname, "../public/basic-stats-curriculum.json"), "utf-8"),
);
const demosMap = JSON.parse(
  readFileSync(join(__dirname, "../lib/basic-stats-demos.generated.json"), "utf-8"),
) as Record<string, { id: string; title: string; csv: string }[]>;

const rows: Row[] = [];
let pass = 0;
let warn = 0;
let fail = 0;

function judge(
  moduleId: string,
  r: ReturnType<typeof runBasicStats>,
  row: Row,
): void {
  row.hasSummary = !!(r.summary && r.summary.length > 2 && !/데이터 없음/.test(r.summary));
  row.hasInterp = !!(r.interpretation && r.interpretation.length > 10);
  row.hasStats = !!(r.stats && Object.keys(r.stats).length > 0);
  const st = r.stats || {};
  const pRaw = st.p ?? st.pValue ?? st.pvalue;
  const p =
    typeof pRaw === "number" && pRaw >= 0 && pRaw <= 1
      ? pRaw
      : typeof pRaw === "string" && Number.isFinite(parseFloat(pRaw)) && parseFloat(pRaw) <= 1
        ? parseFloat(pRaw)
        : undefined;
  if (p !== undefined) row.p = p;
  const keys = Object.entries(st)
    .filter(([k]) => !/^verify|_/.test(k))
    .slice(0, 6)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  row.keyStats = keys.slice(0, 120);

  if (r.verify) {
    row.verifyGrade = r.verify.grade;
    row.verifyPass = r.verify.passed || r.verify.grade !== "fail";
  }

  const educational = /규칙기반 교육용|mode.: .rule-based|입력 데이터 형식을 확인/.test(
    (r.summary || "") + (r.interpretation || "") + JSON.stringify(r.stats || {}),
  );
  const badP = typeof p === "number" && Number.isFinite(p) && (p < 0 || p > 1);
  const anchorFail =
    r.verify?.grade === "fail" &&
    !!r.verify.checks?.some((c) => c.layer === "anchor" && !c.ok);

  if (!row.hasSummary || !row.hasInterp || badP || anchorFail) {
    row.severity = "fail";
    row.error =
      row.error ||
      (!row.hasSummary
        ? "summary 없음"
        : badP
          ? `p 범위 오류 ${p}`
          : anchorFail
            ? "앵커 실패"
            : "interpretation 부족");
    fail++;
  } else if (educational || r.verify?.grade === "warn" || (!row.hasStats && isStats47Code(moduleId))) {
    row.severity = "warn";
    row.ok = true;
    warn++;
  } else {
    row.severity = "pass";
    row.ok = true;
    pass++;
  }
}

type Mod = { id: string; name: string; group: string; sampleCsv?: string };

for (const m of cur.modules as Mod[]) {
  const demos = demosMap[m.id] || [];
  const jobs: { demoId: string; csv: string }[] =
    demos.length > 0
      ? demos.map((d) => ({ demoId: d.id, csv: d.csv }))
      : [{ demoId: "sampleCsv", csv: m.sampleCsv || "" }];

  for (const job of jobs) {
    const row: Row = {
      id: m.id,
      demoId: job.demoId,
      group: m.group,
      name: m.name,
      ok: false,
      hasSummary: false,
      hasInterp: false,
      hasStats: false,
      severity: "fail",
    };
    const csv = (job.csv || "").trim();
    if (!csv || csv.split(/\n/).length < 2) {
      row.error = "csv 없음/부족";
      row.severity = "fail";
      fail++;
      rows.push(row);
      continue;
    }
    try {
      const r = runBasicStats(m.id, csv);
      judge(m.id, r, row);
    } catch (e) {
      row.error = e instanceof Error ? e.message : String(e);
      row.severity = "fail";
      fail++;
    }
    rows.push(row);
  }
}

const modules = (cur.modules as Mod[]).length;
const out = {
  modules,
  totalRuns: rows.length,
  pass,
  warn,
  fail,
  demosPerModule: modules ? Math.round(rows.length / modules) : 0,
  code47: new Set(rows.filter((r) => isStats47Code(r.id)).map((r) => r.id)).size,
  legacy: new Set(rows.filter((r) => !isStats47Code(r.id)).map((r) => r.id)).size,
  rows,
};

const reportPath = join(__dirname, "../scripts/_basic_stats_demo_report.json");
writeFileSync(reportPath, JSON.stringify(out, null, 2), "utf-8");

console.log("=== 기본통계 메뉴 · 12종 데모 일괄 검사 ===");
console.log(`모듈 ${modules} · 실행 ${out.totalRuns} (모듈당 ≈${out.demosPerModule})`);
console.log(`47코드 모듈 ${out.code47} · SEM/기타 ${out.legacy}`);
console.log(`PASS ${pass} · WARN ${warn} · FAIL ${fail}`);
console.log("");

const fails = rows.filter((r) => r.severity === "fail");
if (fails.length) {
  console.log("--- FAIL ---");
  for (const r of fails.slice(0, 40)) {
    console.log(`✗ ${r.id}/${r.demoId} [${r.group}] ${r.error || ""} | ${r.keyStats || ""}`);
  }
  if (fails.length > 40) console.log(`... +${fails.length - 40} more`);
  console.log("");
}

console.log("report:", reportPath);
if (fail > 0) process.exit(1);
console.log("ALL DEMO RUNS PRODUCED USABLE RESULTS (fail=0)");
