"use client";

import Note from "@/components/ui/Note";
import DataTable from "@/components/ui/DataTable";
import { VALIDITY_BLOCKS } from "@/lib/method-map-catalog";
import type { Section } from "@/lib/method-system-normalize";
import SectionTables from "./SectionTables";

/** 판정 기준 수치 — 이 숫자가 없으면 "타당도를 확인했다"는 말은 검증할 수 없다. */
const CUTOFFS: { name: string; rule: string; meaning: string }[] = [
  { name: "Cronbach's α", rule: "≥ .70", meaning: "내적 일관성 — 같은 개념을 재는 문항들이 함께 움직이는가" },
  { name: "Cohen's κ", rule: "≥ .70", meaning: "평정자 간 일치 — 두 코더가 같은 판단을 하는가" },
  { name: "ICC", rule: "≥ .75", meaning: "검사–재검사 · 평정자 간 급내상관" },
  { name: "CFI · TLI", rule: "≥ .95", meaning: "구조방정식 모형 적합도 (증분 적합)" },
  { name: "RMSEA", rule: "≤ .06", meaning: "구조방정식 모형 적합도 (근사 오차)" },
  { name: "SRMR", rule: "≤ .08", meaning: "구조방정식 잔차 크기" },
  { name: "AVE", rule: "≥ .50", meaning: "수렴 타당도 — 문항이 구인 분산을 절반 이상 설명" },
  { name: "√AVE", rule: "> 구인 간 상관", meaning: "판별 타당도 (Fornell–Larcker)" },
];

const COLOR: Record<string, string> = { quant: "var(--appr-quant)", qual: "var(--appr-qual)", common: "var(--color-text-secondary)" };

/** ⑤ 타당도·신뢰도 */
export default function ValidityView({ sections }: { sections: Section[] }) {
  return (
    <div>
      <div className="mb-4">
        <Note level="info" title="타당도와 신뢰도는 다른 질문에 답합니다">
          타당도는 <strong>재려던 것을 쟀는가</strong>를, 신뢰도는 <strong>같은 조건에서 같은 값이 나오는가</strong>를 묻습니다. 신뢰도가 높아도 타당도가 낮을 수 있습니다.
        </Note>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {VALIDITY_BLOCKS.map((b) => (
          <section key={b.title} className="card" style={{ borderTop: `3px solid ${COLOR[b.approach]}` }}>
            <h3 className="ty-subhead">{b.title}</h3>
            <dl className="mt-2">
              {b.items.map((it) => (
                <div key={it.name} className="py-2" style={{ borderTop: "1px solid var(--color-border-tertiary)" }}>
                  <dt className="ty-small font-bold">{it.name}</dt>
                  <dd className="ty-small mt-0.5 text-ink-2">{it.what}</dd>
                  <dd className="ty-label mt-1 text-ink-3">{it.how}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <h3 className="ty-section mb-2 mt-6">판정 기준 수치</h3>
      <p className="ty-small mb-3 text-ink-2 prose-w">
        수치에는 판정 기준을 함께 봅니다. <span className="num">κ = 0.89</span> 만으로는 좋은지 알 수 없고, 옆에 <span className="num">≥ .81 거의 완전 일치</span>가 있어야 판단할 수 있습니다.
      </p>
      <div className="card">
        <DataTable columns={["지표", "허용 기준", "무엇을 말하는가"]} rows={CUTOFFS.map((c) => [c.name, c.rule, c.meaning])} />
      </div>

      <h3 className="ty-section mb-2 mt-6">원본 표</h3>
      <SectionTables sections={sections} />
    </div>
  );
}
