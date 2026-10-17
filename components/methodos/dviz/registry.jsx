/* 기법 코드 → 시각화 설계. 정해진 설계가 없거나 실패하면 효과크기·신뢰구간 일반 카드로 대신한다. */
import B1 from "./build1.jsx";
import B2 from "./build2.jsx";
import B3 from "./build3.jsx";
import { asmCard, card, ciForest, effCard, tile, t3 } from "./bh.jsx";

const REG = { ...B1, ...B2, ...B3 };

function generic(R) {
  const charts = [effCard(R), ciForest(R)].filter(Boolean);
  return { tiles: [], charts };
}

export function designFor(R) {
  if (!R || !R.tables) return null;
  let out = null;
  try { const f = REG[R.analysis_code]; out = f ? f(R) : null; } catch (e) { console.error("dviz", R.analysis_code, e); out = null; }
  if (!out || !out.charts || !out.charts.length) out = generic(R);
  const keys = new Set(out.charts.map((c) => c.key));
  if (!keys.has("asm") && !keys.has("eff")) { const e = (R.effect_sizes || []).length ? effCard(R) : null; if (e && !out.charts.some((c) => c.key === "eff")) out.charts.push(e); }
  if (!keys.has("asm")) { const a = asmCard(R); if (a) out.charts.push(a); }
  return out;
}
