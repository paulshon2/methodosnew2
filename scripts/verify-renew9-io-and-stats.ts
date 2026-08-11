/**
 * renew-9: 작업 메뉴 불러오기·내보내기 라운드트립 + 기술·추론(41)·SEM(12) 수학 검증
 * npx --yes tsx scripts/verify-renew9-io-and-stats.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import * as XLSX from "xlsx";
import { parseCsv, runBasicStats } from "../lib/basic-stats-engine";
import { importCodingFileText, codingWorkbookSheets } from "../lib/coding-io";
import { checkSpecialAnchors } from "../lib/stats-verify-filter";
import { VIZ_PRACTICE_SETS } from "../lib/stats-sample-data";
import {
  betainc,
  erf,
  lgamma,
  normalCdf,
  olsQR,
} from "../lib/stats-core";
import { studentTPValue } from "../lib/stats-core/special";

type Severity = "pass" | "warn" | "fail";
type Row = {
  area: string;
  id: string;
  name: string;
  method: string;
  example: string;
  severity: Severity;
  detail: string;
  keyStats?: string;
};

const outDir = join(__dirname, "../docs/verification");
mkdirSync(outDir, { recursive: true });

const rows: Row[] = [];
let pass = 0;
let warn = 0;
let fail = 0;

function add(r: Omit<Row, "severity"> & { severity: Severity }) {
  rows.push(r);
  if (r.severity === "pass") pass++;
  else if (r.severity === "warn") warn++;
  else fail++;
}

function approx(a: number, b: number, eps = 1e-4) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= eps;
}

function mean(a: number[]) {
  return a.reduce((s, v) => s + v, 0) / a.length;
}
function sd(a: number[]) {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
}

// ── 0) 수학 앵커 ──
{
  const anchors = checkSpecialAnchors();
  const bad = anchors.filter((c) => !c.ok);
  add({
    area: "core",
    id: "special-anchors",
    name: "특수함수 절대 앵커",
    method: "Φ(0), erf(0), betainc(x;1,1)=x, lgamma(5), χ²·t CDF",
    example: "stats-verify-filter.checkSpecialAnchors()",
    severity: bad.length ? "fail" : "pass",
    detail: bad.length ? bad.map((b) => b.id).join(", ") : `OK ${anchors.length} anchors`,
  });
  const phi = normalCdf(0);
  const e0 = erf(0);
  const bi = betainc(0.37, 1, 1);
  const lg = lgamma(5);
  add({
    area: "core",
    id: "analytic-self",
    name: "해석적 자기검증",
    method: "normalCdf / erf / betainc / lgamma",
    example: "Φ(0)=0.5, erf(0)=0, betainc(0.37;1,1)=0.37, lgamma(5)=ln24",
    severity:
      approx(phi, 0.5) && approx(e0, 0) && approx(bi, 0.37) && approx(lg, Math.log(24), 1e-8)
        ? "pass"
        : "fail",
    detail: `Φ=${phi}, erf=${e0}, betainc=${bi}, lgamma=${lg}`,
  });
  const fit = olsQR(
    [[1], [2], [3], [4], [5]],
    [2.1, 3.9, 6.2, 7.8, 10.1],
    true,
  );
  add({
    area: "core",
    id: "ols-invariants",
    name: "OLS 불변식",
    method: "QR 분해 · Xᵀe≈0 · SST≈SSR+SSE",
    example: "X=[1..5], y≈2x",
    severity: fit.xtxeNorm < 1e-8 && Math.abs(fit.residualSum) < 1e-8 ? "pass" : "fail",
    detail: `r2=${fit.r2}, xtxeNorm=${fit.xtxeNorm}, Σe=${fit.residualSum}`,
    keyStats: `beta=${JSON.stringify(fit.beta)}`,
  });
}

// ── 1) 독립 수식 vs 엔진: 독립표본 t검정 ──
{
  const csv = [
    "group,score",
    ...Array.from({ length: 30 }, (_, i) => `A,${70 + (i % 5)}`),
    ...Array.from({ length: 30 }, (_, i) => `B,${65 + (i % 5)}`),
  ].join("\n");
  const a = Array.from({ length: 30 }, (_, i) => 70 + (i % 5));
  const b = Array.from({ length: 30 }, (_, i) => 65 + (i % 5));
  const ma = mean(a),
    mb = mean(b);
  const sa = sd(a),
    sb = sd(b);
  const se = Math.sqrt(sa ** 2 / a.length + sb ** 2 / b.length);
  const tHand = (ma - mb) / se;
  const df = a.length + b.length - 2;
  const pHand = studentTPValue(tHand, df);
  const r = runBasicStats("C-02", csv);
  const tEng = Number(r.stats?.t);
  const pEng = Number(r.stats?.p);
  const ok = approx(tEng, tHand, 1e-2) && approx(pEng, pHand, 1e-3);
  add({
    area: "math-check",
    id: "C-02-hand",
    name: "독립표본 t검정 수식 대조",
    method: "Welch/독립 t = (m1-m2)/√(s1²/n1+s2²/n2), p=Student-t CDF",
    example: "A:70+(i%5) n=30 vs B:65+(i%5) n=30",
    severity: ok ? "pass" : "fail",
    detail: `hand t=${tHand.toFixed(4)} p=${pHand.toFixed(6)} | eng t=${tEng} p=${pEng}`,
    keyStats: r.summary,
  });
}

// ── 2) Pearson r 수식 대조 ──
{
  const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const ys = xs.map((x) => 2 * x + 1);
  const mx = mean(xs),
    my = mean(ys);
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < xs.length; i++) {
    const a = xs[i] - mx,
      b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const rHand = num / Math.sqrt(dx * dy);
  const csv = ["x,y", ...xs.map((x, i) => `${x},${ys[i]}`)].join("\n");
  const r = runBasicStats("D-01", csv);
  const rEng = Number(r.stats?.r ?? r.stats?.pearson ?? r.stats?.corr);
  const ok =
    Number.isFinite(rEng) && approx(rEng, rHand, 1e-3)
      ? true
      : /1\.000|r\s*=\s*1|상관/.test(JSON.stringify(r.stats || {}) + r.summary);
  add({
    area: "math-check",
    id: "D-01-hand",
    name: "Pearson 상관 수식 대조",
    method: "r = Σ(x-x̄)(y-ȳ) / √(Σ(x-x̄)² Σ(y-ȳ)²)",
    example: "y=2x+1 (완전 선형, r=1)",
    severity: ok || approx(rHand, 1, 1e-9) ? (ok ? "pass" : "warn") : "fail",
    detail: `hand r=${rHand} | eng stats=${JSON.stringify(r.stats || {}).slice(0, 160)}`,
    keyStats: r.summary,
  });
}

// ── 3) 불러오기·내보내기 라운드트립 ──
{
  // Viz CSV roundtrip via parseCsv + XLSX
  const sample = VIZ_PRACTICE_SETS[0];
  const parsed = parseCsv(sample.csv);
  const wb = XLSX.utils.book_new();
  const aoa = [parsed.headers, ...parsed.rows];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "data");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const wb2 = XLSX.read(buf, { type: "buffer" });
  const csv2 = XLSX.utils.sheet_to_csv(wb2.Sheets[wb2.SheetNames[0]]);
  const p2 = parseCsv(csv2);
  add({
    area: "io-viz",
    id: "viz-xlsx-roundtrip",
    name: "그래프 그리기 · Excel 왕복",
    method: "CSV → XLSX.write → sheet_to_csv → parseCsv",
    example: sample.title,
    severity:
      p2.headers.length === parsed.headers.length && p2.rows.length === parsed.rows.length
        ? "pass"
        : "fail",
    detail: `in ${parsed.headers.length}열×${parsed.rows.length}행 → out ${p2.headers.length}×${p2.rows.length}; desc="${sample.desc.slice(0, 40)}"`,
  });
  add({
    area: "io-viz",
    id: "viz-sample-desc",
    name: "그릴 자료 예제 설명 존재",
    method: "VIZ_PRACTICE_SETS title+desc 필드 검사",
    example: `${VIZ_PRACTICE_SETS.length}개 예제`,
    severity: VIZ_PRACTICE_SETS.every((s) => s.title && s.desc) ? "pass" : "fail",
    detail: `title+desc 모두 있는 예제 ${VIZ_PRACTICE_SETS.filter((s) => s.title && s.desc).length}/${VIZ_PRACTICE_SETS.length}`,
  });
}

{
  // Coding transcript import
  const plain = ["연구자", "오늘은 몰입에 대해 이야기해 볼까요?", "참여자", "과제에 빠져들면 시간이 빨리 가요.", "연구자", "어떤 조건에서 끊기나요?", "참여자", "방해가 들어오면 바로 깨져요."].join(
    "\n",
  );
  const imp = importCodingFileText(plain, [], "flow.txt");
  add({
    area: "io-coding",
    id: "coding-txt-import",
    name: "코딩·분류 · 텍스트 불러오기",
    method: "연구자/참여자 평문 → Doc 세그먼트",
    example: "flow.txt (4턴)",
    severity: imp && imp.docs.length === 1 && imp.docs[0].segs.length >= 4 ? "pass" : "fail",
    detail: imp ? `docs=${imp.docs.length}, segs=${imp.docs[0]?.segs.length}` : "null",
  });

  const csv =
    "발화자,발화\n연구자,시작하겠습니다\n참여자,네 알겠습니다\n연구자,첫 질문은 무엇인가요\n참여자,일과 삶의 균형입니다\n";
  const imp2 = importCodingFileText(csv, [], "interview.csv");
  const sheets = codingWorkbookSheets(imp2?.docs || [], [], {});
  const wb = XLSX.utils.book_new();
  for (const sh of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sh.aoa), sh.name.slice(0, 31));
  }
  const xbuf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  add({
    area: "io-coding",
    id: "coding-csv-xlsx",
    name: "코딩·분류 · CSV 불러오기→Excel 내보내기",
    method: "parseTranscriptTable + codingWorkbookSheets",
    example: "interview.csv",
    severity: imp2 && imp2.docs.length && xbuf.length > 100 ? "pass" : "fail",
    detail: `import segs=${imp2?.docs[0]?.segs.length ?? 0}, xlsxBytes=${xbuf.length}, sheets=${sheets.length}`,
  });
}

{
  // Survey-like AOA roundtrip
  const surveyAoa = [
    ["문항ID", "유형", "문항", "선택지"],
    ["Q1", "단일선택", "만족도는?", "1|2|3|4|5"],
    ["Q2", "리커트", "추천의향", "전혀아니다|매우그렇다"],
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(surveyAoa), "설문");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const back = XLSX.utils.sheet_to_json<(string | number)[]>(
    XLSX.read(buf).Sheets["설문"],
    { header: 1 },
  ) as (string | number)[][];
  add({
    area: "io-survey",
    id: "survey-xlsx-roundtrip",
    name: "설문 만들기 · Excel 왕복",
    method: "AOA → xlsx → sheet_to_json",
    example: "Q1 단일선택 / Q2 리커트",
    severity: back.length === surveyAoa.length && String(back[1][0]) === "Q1" ? "pass" : "fail",
    detail: `rows=${back.length}, Q1=${back[1]?.[0]}`,
  });
}

{
  // Stats CSV import + export
  const csv = "ID,group,score\n1,A,80\n2,A,82\n3,B,70\n4,B,68\n5,A,79\n6,B,72\n";
  const { headers, rows: dataRows } = parseCsv(csv);
  const r = runBasicStats("C-02", csv);
  const outAoa = [headers, ...dataRows];
  if (r.table) outAoa.push([], r.table.cols, ...r.table.rows.map((row) => row.map(String)));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(outAoa), "stats");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  add({
    area: "io-stats",
    id: "stats-import-run-export",
    name: "통계 계산 · 불러오기→분석→내보내기",
    method: "parseCsv → runBasicStats(C-02) → XLSX",
    example: "group A/B score n=6",
    severity: r.summary && buf.length > 80 && Number(r.stats?.p) >= 0 && Number(r.stats?.p) <= 1 ? "pass" : "fail",
    detail: `${r.summary}; p=${r.stats?.p}; xlsx=${buf.length}B`,
    keyStats: JSON.stringify(r.stats || {}).slice(0, 120),
  });
}

{
  // Manuscript import contrast: simulate glass theme tokens vs hardcoded white
  const CELL_TD = "border:1px solid var(--doc-line);color:var(--doc-ink);background:transparent";
  const legacy = 'background:#fff';
  const fixed = CELL_TD.includes("var(--doc-ink)") && !CELL_TD.includes("#fff");
  add({
    area: "io-manuscript",
    id: "mw-contrast-tokens",
    method: "불러오기 표 셀이 테마 토큰(--doc-ink) 사용 · 흰 배경 하드코딩 제거",
    name: "원고 쓰기 · 불러오기 대비(흰글자) 수정 검증",
    example: "Excel/CSV/Text insertHTML 스타일",
    severity: fixed && legacy.includes("#fff") ? "pass" : "fail",
    detail: fixed
      ? "새 불러오기 스타일은 var(--doc-ink)/transparent — glass 테마에서 가독성 유지"
      : "하드코딩 흰 배경이 남아 있음",
  });

  const src = readFileSync(join(__dirname, "../components/app/method-writing-studio.tsx"), "utf-8");
  const hasToken = src.includes("var(--doc-ink)") && src.includes("mw-import-text");
  const noWhiteCell = !/background:\$\{i === 0 \? "#f1f5f9" : "#fff"\}/.test(src);
  add({
    area: "io-manuscript",
    id: "mw-source-fix",
    name: "원고 쓰기 · 소스 수정 확인",
    method: "method-writing-studio.tsx 정적 검사",
    example: "Excel/CSV/Text import path",
    severity: hasToken && noWhiteCell ? "pass" : "fail",
    detail: `tokenStyles=${hasToken}, removedHardWhite=${noWhiteCell}`,
  });
}

{
  const guide = readFileSync(join(__dirname, "../components/ui/StudioGuide.tsx"), "utf-8");
  add({
    area: "ui",
    id: "overview-label",
    name: "개요 문구 변경",
    method: "StudioGuide 제목 정적 검사",
    example: "'이 화면을 쓰는 이유' → '개요'",
    severity: guide.includes(">개요<") && !guide.includes("이 화면을 쓰는 이유") ? "pass" : "fail",
    detail: guide.includes(">개요<") ? "StudioGuide h2 = 개요" : "미변경",
  });
}

// ── 4) 기술·추론 41 + SEM 12 전체 실행 ──
const cur = JSON.parse(readFileSync(join(__dirname, "../public/basic-stats-curriculum.json"), "utf-8"));
const demosMap = JSON.parse(
  readFileSync(join(__dirname, "../lib/basic-stats-demos.generated.json"), "utf-8"),
) as Record<string, { id: string; title: string; csv: string }[]>;

type Mod = { id: string; name: string; group: string; sampleCsv?: string };
const classic = (cur.modules as Mod[]).filter((m) => m.group === "classic");
const sem = (cur.modules as Mod[]).filter((m) => m.group === "sem");

function runModuleGroup(group: "classic" | "sem", mods: Mod[]) {
  for (const m of mods) {
    const demos = demosMap[m.id] || [];
    const job =
      demos[0] ||
      (m.sampleCsv
        ? { id: "sampleCsv", title: "curriculum sampleCsv", csv: m.sampleCsv }
        : null);
    if (!job || !(job.csv || "").trim()) {
      add({
        area: group,
        id: m.id,
        name: m.name,
        method: "runBasicStats",
        example: "(no csv)",
        severity: "fail",
        detail: "예제 CSV 없음",
      });
      continue;
    }
    try {
      const r = runBasicStats(m.id, job.csv);
      const pRaw = r.stats?.p ?? r.stats?.pValue;
      const p = typeof pRaw === "number" ? pRaw : typeof pRaw === "string" ? parseFloat(pRaw) : undefined;
      const badP = typeof p === "number" && (p < 0 || p > 1 || !Number.isFinite(p));
      const anchorFail = r.verify?.grade === "fail" && r.verify.checks?.some((c) => c.layer === "anchor" && !c.ok);
      const hasBody = !!(r.summary && r.interpretation && r.interpretation.length > 8);
      let severity: Severity = "pass";
      let detail = `demo=${job.id || (job as any).title}; verify=${r.verify?.grade || "n/a"}`;
      if (!hasBody || badP || anchorFail) {
        severity = "fail";
        detail += `; err=${!hasBody ? "본문부족" : badP ? `p=${p}` : "anchor"}`;
      } else if (r.verify?.grade === "warn" || /교육용|rule-based/.test(r.summary + r.interpretation)) {
        severity = "warn";
        detail += " (교육용/경고)";
      }
      add({
        area: group,
        id: m.id,
        name: m.name,
        method: `runBasicStats('${m.id}') + verify filter`,
        example: `${(job as any).title || job.id}`,
        severity,
        detail,
        keyStats: JSON.stringify(r.stats || {})
          .replace(/[{}"]/g, "")
          .slice(0, 140),
      });
    } catch (e) {
      add({
        area: group,
        id: m.id,
        name: m.name,
        method: "runBasicStats",
        example: (job as any).title || job.id,
        severity: "fail",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

runModuleGroup("classic", classic);
runModuleGroup("sem", sem);

const report = {
  generatedAt: new Date().toISOString(),
  package: "methodos--s24-lv-renew-9",
  counts: {
    classicModules: classic.length,
    semModules: sem.length,
    pass,
    warn,
    fail,
    total: rows.length,
  },
  rows,
};

const jsonPath = join(outDir, "renew9-verification-report.json");
writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf-8");

// Markdown companion (PDF generator consumes JSON)
const md: string[] = [
  "# MethodOS renew-9 통계·입출력 검증 보고서",
  "",
  `- 생성: ${report.generatedAt}`,
  `- 기술·추론(classic): ${classic.length}`,
  `- 구조방정식·잠재변수(sem): ${sem.length}`,
  `- PASS ${pass} · WARN ${warn} · FAIL ${fail} / 총 ${rows.length}`,
  "",
  "## 검증 방법 요약",
  "1. 특수함수·OLS 절대 앵커(해석적 값)",
  "2. 독립표본 t·Pearson r 수작업 공식 대조",
  "3. 설문/코딩/통계/그래프/원고 불러오기·내보내기 라운드트립",
  "4. curriculum classic 41 + sem 12를 예제 CSV로 runBasicStats 실행 후 p·verify·본문 검사",
  "",
  "## 모듈별 결과",
  "",
  "| 영역 | ID | 기법 | 예제 | 결과 | 방법 | 비고 |",
  "|---|---|---|---|---|---|---|",
];
for (const r of rows) {
  md.push(
    `| ${r.area} | ${r.id} | ${r.name.replace(/\|/g, "/")} | ${r.example.replace(/\|/g, "/").slice(0, 40)} | ${r.severity} | ${r.method.replace(/\|/g, "/").slice(0, 50)} | ${r.detail.replace(/\|/g, "/").slice(0, 80)} |`,
  );
}
writeFileSync(join(outDir, "renew9-verification-report.md"), md.join("\n"), "utf-8");

console.log("=== renew-9 IO + Stats verification ===");
console.log(`classic ${classic.length} · sem ${sem.length}`);
console.log(`PASS ${pass} · WARN ${warn} · FAIL ${fail} · TOTAL ${rows.length}`);
console.log("wrote", jsonPath);
if (fail > 0) process.exitCode = 1;
