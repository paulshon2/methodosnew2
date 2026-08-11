/**
 * cohensKappa · splitSentences · progress 자체 검사.
 * 실행: npm run test:coding
 */
import { cohensKappa, kappaVerdict } from "../lib/coding-reliability";
import { buildDoc, codingCsv, progress, splitSentences, SAMPLE_CODER2, SAMPLE_DOCS, SAMPLE_ASSIGN, SAMPLE_THEMES, type Assign } from "../lib/coding-types";

let checks = 0;
function eq(actual: number, expected: number, tol: number, what: string) {
  checks += 1;
  if (!(Math.abs(actual - expected) <= tol)) {
    throw new Error(`${what}: ${actual} ≠ ${expected} (±${tol})`);
  }
}
function ok(cond: boolean, what: string) {
  checks += 1;
  if (!cond) throw new Error(what);
}

// ① 완전 일치면 κ = 1
{
  const a = ["c1", "c2", "c1", "c3"];
  const { kappa, po } = cohensKappa(a, a);
  eq(kappa, 1, 1e-12, "완전 일치 κ");
  eq(po, 1, 1e-12, "완전 일치 po");
}

// ② 손으로 계산한 값과 맞는가.
//    a = [x,x,y,y], b = [x,y,x,y] → po=.5, pe=.5, κ=0
{
  const { kappa, po, pe } = cohensKappa(["x", "x", "y", "y"], ["x", "y", "x", "y"]);
  eq(po, 0.5, 1e-12, "po");
  eq(pe, 0.5, 1e-12, "pe");
  eq(kappa, 0, 1e-12, "우연 수준 κ");
}

// ③ 교과서 예제: 2×2, a=[20 yes,30 no] 식 배치.
//    yes/yes 20, yes/no 5, no/yes 10, no/no 15 → po=.7, pe=.5, κ=.4
{
  const a = [...Array(20).fill("yes"), ...Array(5).fill("yes"), ...Array(10).fill("no"), ...Array(15).fill("no")];
  const b = [...Array(20).fill("yes"), ...Array(5).fill("no"), ...Array(10).fill("yes"), ...Array(15).fill("no")];
  const { kappa, po, pe } = cohensKappa(a, b);
  eq(po, 0.7, 1e-12, "2×2 po");
  eq(pe, 0.5, 1e-12, "2×2 pe");
  eq(kappa, 0.4, 1e-12, "2×2 κ");
}

// ④ 한 범주만 쓰면 정의할 수 없다 — 1로 보고 끝낸다.
{
  const { kappa, pe } = cohensKappa(["c1", "c1"], ["c1", "c1"]);
  eq(pe, 1, 1e-12, "단일 범주 pe");
  eq(kappa, 1, 1e-12, "단일 범주 κ");
}

// ⑤ 빈 입력에서 터지지 않는다.
{
  const r = cohensKappa([], []);
  eq(r.n, 0, 0, "빈 입력 n");
  ok(Number.isFinite(r.kappa), "빈 입력 κ가 유한값");
}

// ⑥ 판정 경계
ok(kappaVerdict(0.81).level === "ok", ".81 판정");
ok(kappaVerdict(0.61).level === "ok", ".61 판정");
ok(kappaVerdict(0.6).level === "warn", ".60 판정");
ok(kappaVerdict(0.4).level === "risk", ".40 판정");

// ⑦ 문장 분해
{
  const s = splitSentences("첫 문장이다. 둘째 문장인가? 셋째!  넷째 문장.");
  eq(s.length, 4, 0, "문장 개수");
  ok(s[1] === "둘째 문장인가?", "물음표 뒤에서 끊긴다");
  eq(splitSentences("   ").length, 0, 0, "공백만 있으면 문장이 없다");
}

// ⑧ 문장 id는 문서 안에서 유일하다
{
  const d = buildDoc("z", "제목", "메타", [["R", "가. 나."], ["P", "다. 라."]]);
  eq(d.segs.length, 4, 0, "분해된 문장 수");
  eq(new Set(d.segs.map((s) => s.id)).size, 4, 0, "문장 id 유일성");
  eq(d.turns[1].segIds.length, 2, 0, "발화별 문장 연결");
}

// ⑨ 진행률은 참여자 발화만 분모로 센다
{
  const empty: Assign = {};
  const p0 = progress(SAMPLE_DOCS, empty);
  const pAll = progress(SAMPLE_DOCS, SAMPLE_ASSIGN);
  const researcher = SAMPLE_DOCS.flatMap((d) => d.segs).filter((s) => s.who === "R").length;
  ok(researcher > 0, "연구자 발화가 존재한다");
  eq(p0.pct, 0, 0, "코딩 전 진행률");
  eq(p0.total, SAMPLE_DOCS.flatMap((d) => d.segs).length - researcher, 0, "분모에서 연구자 발화 제외");
  ok(pAll.coded > 0 && pAll.pct > 0, "시연 코딩이 진행률에 반영된다");
}

// ⑩ CSV는 BOM으로 시작하고 헤더를 갖는다
{
  const csv = codingCsv(SAMPLE_DOCS, SAMPLE_THEMES, SAMPLE_ASSIGN);
  ok(csv.startsWith("\uFEFF"), "CSV BOM");
  ok(csv.split("\n")[0] === '\uFEFF"자료","발화자","문장","코드"', "CSV 헤더");
  ok(csv.includes("명확한 목표"), "코드 이름이 값으로 들어간다");
}

// ⑪ 시연 자료는 여러 갈래로 갖춰져 있다 — 면담 전사본만으로는 코딩 연습이 되지 않는다
{
  ok(SAMPLE_DOCS.length >= 12, `자료 12건 이상 (현재 ${SAMPLE_DOCS.length})`);
  const kinds = new Set(SAMPLE_DOCS.map((d) => d.kind));
  ok(kinds.size >= 8, `자료 갈래 8종 이상 (현재 ${kinds.size})`);
  ok(SAMPLE_DOCS.every((d) => d.segs.some((s) => s.who === "P")), "모든 자료에 코딩 대상 문장이 있다");
  ok(new Set(SAMPLE_DOCS.map((d) => d.id)).size === SAMPLE_DOCS.length, "자료 id 유일성");
  const coded = new Set(SAMPLE_DOCS.filter((d) => d.segs.some((s) => (SAMPLE_ASSIGN[s.id] ?? []).length > 0)));
  ok(coded.size === SAMPLE_DOCS.length, "모든 자료에 1차 코딩이 들어가 있다");
}

// ⑫ 두 코더의 판단이 겹치는 문장에서 κ가 합의 가능한 범위에 있다
{
  const pairs = Object.entries(SAMPLE_CODER2).filter(([sid]) => (SAMPLE_ASSIGN[sid] ?? []).length > 0);
  const { kappa, n } = cohensKappa(pairs.map(([sid]) => SAMPLE_ASSIGN[sid][0]), pairs.map(([, c]) => c));
  ok(n >= 40, `κ 계산 대상 문장 40개 이상 (현재 ${n})`);
  ok(kappa > 0.5 && kappa < 1, `시연 κ가 논의할 만한 범위 (현재 ${kappa.toFixed(3)})`);
  console.log(`  · 시연 자료 ${SAMPLE_DOCS.length}건 · 코딩된 문장 ${Object.keys(SAMPLE_ASSIGN).length}개 · κ=${kappa.toFixed(3)} (n=${n})`);
}

console.log(`coding reliability selftest OK · ${checks} checks`);
