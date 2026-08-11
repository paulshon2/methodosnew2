// 범용 Q-Sort 강제분포 생성기 — methodos-f18.
// 30~80개(권장)의 모든 Q표본을 자동 지원: 척도(5·7·9·11·13·15점) × 분포유형(표준/완만/중앙집중/평탄/사용자정의).
// generateDistribution(total, scalePoints, type)이 좌우대칭·합계 정확 일치 분포를 결정론적으로 생성한다.
// 사용자 정의는 칸별 매수를 직접 입력하면 총 진술문 수가 자동 계산된다(비대칭은 옵션 허용 시에만 통과).

export type DistType = "standard" | "gentle" | "centered" | "extreme" | "bipolar" | "flat" | "custom";
export const SCALE_POINTS = [5, 7, 9, 11, 13, 15] as const;
export const DIST_TYPES: { key: DistType; label: string; desc: string }[] = [
  { key: "standard", label: "표준 정규분포", desc: "가운데가 봉긋한 전형적 준정규(권장)" },
  { key: "gentle", label: "완만한 정규분포", desc: "가운데 쏠림이 덜한 완만한 종 모양" },
  { key: "centered", label: "중앙집중형", desc: "중립(0) 칸에 더 많이 몰리는 분포" },
  { key: "extreme", label: "극단 강조형", desc: "중앙을 크게 높이고 양끝을 얇게(뾰족한 봉우리)" },
  { key: "bipolar", label: "양극 강조형", desc: "양 극단(강한 동의·비동의)에 더 많이 배치(U자형)" },
  { key: "flat", label: "평탄형", desc: "모든 칸에 거의 균등 배치" },
  { key: "custom", label: "사용자 정의", desc: "칸별 매수를 직접 입력(합계 자동 계산)" },
];

export interface DistColumn { score: number; count: number; }
export interface DistResult { columns: DistColumn[]; total: number; symmetric: boolean; issues: string[]; }

// 종형(봉우리) 유형별 z(가파름): 클수록 중앙이 뾰족.
const Z: Record<string, number> = { standard: 1.9, gentle: 1.3, centered: 2.8, extreme: 3.8 };

// 칸별 상대 가중치(대칭). type에 따라 종형/균등/U자형(양극)을 생성.
function shapeWeights(cols: number, m: number, type: DistType): number[] {
  return Array.from({ length: cols }, (_, i) => {
    const t = (i - m) / (m || 1); // -1..+1
    if (type === "flat") return 1;
    if (type === "bipolar") return 0.55 + t * t * 1.6; // U자형: 중앙 최소, 양끝 최대
    const z = Z[type === "custom" ? "standard" : type] ?? 2.0;
    const x = t * z;
    return Math.exp(-0.5 * x * x);
  });
}

// 좌우대칭 + 합계 정확(largest-remainder를 대칭쌍 단위로 적용) + 칸당 최소 1매 보장
export function generateDistribution(total: number, scalePoints: number, type: DistType): DistResult {
  const issues: string[] = [];
  const cols = scalePoints;
  const m = (cols - 1) / 2;
  if (cols % 2 === 0 || cols < 5 || cols > 15) issues.push("척도는 5·7·9·11·13·15점(홀수)이어야 합니다.");
  if (total < cols) issues.push(`진술문 수(${total})가 칸 수(${cols})보다 적습니다.`);
  if (total < 10 || total > 120) issues.push("진술문 수는 10~120개 범위를 권장합니다(일반적으로 30~80개).");

  const weights = shapeWeights(cols, m, type);
  const W = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (total * w) / W);
  const counts = raw.map((r) => Math.max(1, Math.floor(r)));

  // 대칭 강제(가중치가 대칭이므로 floor도 대칭이지만 min-1 보정 대비 재확인)
  for (let i = 0; i < m; i++) { const v = Math.max(counts[i], counts[cols - 1 - i]); counts[i] = v; counts[cols - 1 - i] = v; }

  // 잔여분 배분: 소수부가 큰 위치부터, 쌍(+2)·중앙(+1) 단위로 — 항상 대칭 유지
  let R = total - counts.reduce((a, b) => a + b, 0);
  const order = Array.from({ length: m + 1 }, (_, d) => d) // d=0(중앙)..m(끝)
    .map((d) => ({ d, frac: raw[m - d] - Math.floor(raw[m - d]) }))
    .sort((a, b) => b.frac - a.frac);
  let guard = 200;
  while (R !== 0 && guard-- > 0) {
    let acted = false;
    for (const { d } of order) {
      if (R === 0) break;
      if (d === 0 && R >= 1) { counts[m] += 1; R -= 1; acted = true; }
      else if (d > 0 && R >= 2) { counts[m - d] += 1; counts[m + d] += 1; R -= 2; acted = true; }
      else if (d > 0 && R <= -2 && counts[m - d] > 1) { counts[m - d] -= 1; counts[m + d] -= 1; R += 2; acted = true; }
      else if (d === 0 && R <= -1 && counts[m] > 1) { counts[m] -= 1; R += 1; acted = true; }
    }
    if (!acted) { // 홀수 잔여 등 — 중앙에서 흡수
      if (R > 0) { counts[m] += R; R = 0; } else if (counts[m] + R >= 1) { counts[m] += R; R = 0; } else break;
    }
  }
  const sum = counts.reduce((a, b) => a + b, 0);
  if (sum !== total) issues.push(`합계 검증 실패: 생성 ${sum} ≠ 목표 ${total}`);
  const columns = counts.map((count, i) => ({ score: i - m, count }));
  return { columns, total: sum, symmetric: true, issues };
}

// 사용자 정의: "2-3-4-6-6-6-4-3-2" / "2,3,4,…" / 공백 구분 → 칸별 매수. 합계=총 진술문 수 자동 계산.
export function parseCustomDistribution(text: string, allowAsymmetric = false): DistResult {
  const issues: string[] = [];
  const nums = (text.match(/\d+/g) || []).map(Number).filter((n) => n >= 0);
  const cols = nums.length;
  if (cols < 5) issues.push("칸 수는 5개 이상이어야 합니다(예: 2-3-4-6-6-6-4-3-2).");
  if (cols % 2 === 0) issues.push("칸 수는 홀수여야 합니다(중앙 0점 칸 필요).");
  if (nums.some((n) => n === 0)) issues.push("0매 칸이 있습니다 — 모든 칸에 최소 1매를 배정하세요.");
  const m = (cols - 1) / 2;
  let symmetric = true;
  for (let i = 0; i < m; i++) if (nums[i] !== nums[cols - 1 - i]) symmetric = false;
  if (!symmetric && !allowAsymmetric) issues.push("좌우대칭이 아닙니다. '비대칭 허용'을 켜거나 대칭으로 수정하세요.");
  const total = nums.reduce((a, b) => a + b, 0);
  const columns = nums.map((count, i) => ({ score: i - m, count }));
  return { columns, total, symmetric, issues };
}

export const distSignature = (cols: DistColumn[]) => cols.map((c) => c.count).join("-");
export const scoreLabel = (s: number) => (s > 0 ? `+${s}` : String(s));
