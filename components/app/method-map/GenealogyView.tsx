"use client";

import Genealogy from "@/components/charts/Genealogy";
import type { Method } from "@/lib/method-map-catalog";
import type { Section } from "@/lib/method-system-normalize";
import SectionTables from "./SectionTables";

/** ① 계보 · 역사 — 표가 아니라 시간 축 위의 그림으로 본다. */
export default function GenealogyView({
  methods,
  selected,
  dimmed,
  onSelect,
  sections,
}: {
  methods: Method[];
  selected: string | null;
  dimmed: Set<string>;
  onSelect: (id: string) => void;
  sections: Section[];
}) {
  return (
    <div>
      <div className="card">
        <Genealogy methods={methods} selected={selected} dimmed={dimmed} onSelect={onSelect} />
      </div>
      <h3 className="ty-section mb-2 mt-6">철학적 뿌리에서 구체적 방법까지</h3>
      <p className="ty-small mb-3 text-ink-2 prose-w">
        위 그림은 방법 사이의 계승 관계를, 아래 표는 그 뒤에 있는 인식론과 대표 학자를 보여 줍니다. 방법을 고르는 일은 결국 어떤 인식론을 받아들이는가의 문제입니다.
      </p>
      <SectionTables sections={sections} />
    </div>
  );
}
