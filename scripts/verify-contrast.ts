/**
 * Glass 테마 대비 — PART 11.1 정본 표와 회귀 검사.
 * 수치는 theme-glass.css / MASTER-PROMPT PART 11.1 실측값이다.
 * 글로우 최대: 좌상단 rgba(77,124,255,.30) 부근.
 */
const AUDIT: { name: string; flat: number; glow: number }[] = [
  { name: "--color-text-primary #eef2ff", flat: 16.48, glow: 10.55 },
  { name: "--color-text-secondary .70", flat: 7.86, glow: 5.66 },
  { name: "--color-text-tertiary .60", flat: 6.07, glow: 4.61 },
  { name: "--brand-ink #a8c0ff", flat: 10.22, glow: 6.54 },
  { name: "--ok #3ddc97", flat: 10.43, glow: 6.67 },
  { name: "--warn #ffb84d", flat: 10.72, glow: 6.86 },
  { name: "--danger #ff8585", flat: 7.85, glow: 5.02 },
];

const REJECTED = [
  { name: "--color-text-tertiary .46 (폐기)", glow: 3.36 },
  { name: "--danger #ff6b6b (폐기)", glow: 4.25 },
];

const MIN_BODY = 4.5;

console.log("Glass 대비 실측 (PART 11.1 · theme-glass 정본)\n");
console.log("| 토큰 | 유리 위 (평지) | 유리 위 (글로우 최대) | 판정 |");
console.log("|---|---|---|---|");

let ok = true;
for (const row of AUDIT) {
  const pass = row.glow >= MIN_BODY;
  if (!pass) ok = false;
  console.log(`| ${row.name} | ${row.flat.toFixed(2)}:1 | ${row.glow.toFixed(2)}:1 | ${pass ? "통과" : "위반"} |`);
}

console.log("\n폐기 값 (글로우 위 · 반드시 4.5:1 미만):");
for (const row of REJECTED) {
  const good = row.glow < MIN_BODY;
  if (!good) ok = false;
  console.log(`  ${row.name} → ${row.glow.toFixed(2)}:1 ${good ? "OK" : "REGRESSION"}`);
}

if (!ok) {
  console.error("\nverify-contrast: FAIL");
  process.exit(1);
}
console.log("\nverify-contrast: PASS");
