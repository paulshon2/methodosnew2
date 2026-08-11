/**
 * 목적 기반 6종이 연습 자료 전부에서 NaN·Infinity·undefined 없이 끝나는지 확인한다.
 * Run: npx --yes tsx scripts/verify-stats-goal.ts
 */
import { parseCsv } from "../lib/basic-stats-engine";
import { SAMPLE_SETS } from "../lib/stats-sample-data";
import { GOALS, buildDataset, goalFeasible, runGoal, slotCandidates, type GoalId } from "../lib/stats-goal";

const BAD = /NaN|Infinity|undefined|null/;

let ran = 0;
let skipped = 0;

function check(where: string, s: string) {
  if (BAD.test(s)) throw new Error(`${where}: 화면에 나가면 안 되는 값 — ${s}`);
}

for (const sample of SAMPLE_SETS) {
  const { headers, rows } = parseCsv(sample.csv);
  const ds = buildDataset(headers, rows);
  if (!ds.variables.length) throw new Error(`${sample.id}: 변수 인식 실패`);

  for (const goal of GOALS) {
    const fit = goalFeasible(ds, goal.id);
    if (!fit.ok) {
      skipped++;
      check(`${sample.id}/${goal.id}/reason`, fit.reason);
      continue;
    }
    // 각 슬롯의 첫 후보를 고른다 — 사용자가 실제로 할 수 있는 최소 조작.
    const chosen: Record<string, string> = {};
    let ok = true;
    for (const slot of goal.slots) {
      const cands = slotCandidates(ds, goal.id as GoalId, slot.key, chosen);
      if (!cands.length) {
        ok = false;
        break;
      }
      chosen[slot.key] = cands[0].name;
    }
    if (!ok) {
      skipped++;
      continue;
    }

    const r = runGoal(ds, goal.id as GoalId, chosen);
    if (!r) throw new Error(`${sample.id}/${goal.id}: 결과 없음`);
    ran++;

    check(`${sample.id}/${goal.id}/why`, r.why);
    check(`${sample.id}/${goal.id}/apa`, r.apa);
    r.keyNumbers.forEach((k) => check(`${sample.id}/${goal.id}/key:${k.label}`, k.value));
    r.effects.forEach((e) => {
      if (!Number.isFinite(e.value)) throw new Error(`${sample.id}/${goal.id}: 효과크기 ${e.label}가 유한하지 않음`);
      check(`${sample.id}/${goal.id}/effect:${e.label}`, e.reading);
    });
    r.tables.forEach((t) =>
      t.table.rows.forEach((row) =>
        row.forEach((cell) => check(`${sample.id}/${goal.id}/table:${t.title}`, String(cell))),
      ),
    );
    if (r.descriptives) {
      r.descriptives.rows.forEach((row) =>
        row.forEach((cell) => check(`${sample.id}/${goal.id}/desc`, String(cell))),
      );
    }
    r.assumptions.forEach((a) => {
      check(`${sample.id}/${goal.id}/assume:${a.label}`, a.detail);
      if (a.fix) check(`${sample.id}/${goal.id}/fix:${a.label}`, a.fix);
    });
    if (!r.charts.length && goal.id !== "chi") {
      throw new Error(`${sample.id}/${goal.id}: 그림이 없음`);
    }
    console.log(`  ${sample.id.padEnd(12)} ${goal.id.padEnd(9)} → ${r.chosenTest}`);
  }
}

if (ran < 6) throw new Error(`실행된 분석이 ${ran}건뿐입니다. 6종이 모두 한 번 이상 돌아야 합니다.`);
console.log(`stats goal verify OK · 실행 ${ran}건 · 조건 미달로 건너뜀 ${skipped}건`);
