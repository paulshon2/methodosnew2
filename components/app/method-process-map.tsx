"use client";
import type { CaStageView } from "@/lib/content-analysis-spec";
import { Gloss } from "./gloss";

export function MethodProcessMap({ views }: { views?: CaStageView[] | null }) {
  const list = Array.isArray(views) ? views : [];
  if (!list.length) return null;
  return (
    <div className="card mt-4">
      <h3 className="text-[16px] font-semibold mb-2">전체 {list.length}단계 한눈에 보기</h3>
      <p className="text-[13px] text-ink-2 mb-3">단계 이름(한글)으로 전체 흐름을 봅니다. 각 단계에 무엇을 넣고 무엇을 남기는지 확인한 뒤, 프로젝트에서 같은 이름 순서로 진행하세요.</p>
      <table className="tbl text-[13px]">
        <thead><tr><th>단계 이름</th><th>불러오기</th><th>내보내기</th></tr></thead>
        <tbody>
          {list.map((s, idx) => (
            <tr key={s?.registryStageId || `v-${idx}`}>
              <td><strong><Gloss text={(s?.title || "").replace(/^\d+단계\s*[·\-—]?\s*/, "").replace(/chapter\s*\d+|ch\.?\s*\d+/gi, "").replace(/\s*Creswell\s*연구설계\s*6e/gi, "").replace(/[ \t]{2,}/g, " ").trim()} /></strong></td>
              <td><Gloss text={(s?.inFunction || "").replace(/^넣는 것 · /, "")} /></td>
              <td><Gloss text={(s?.outFunction || "").replace(/^나오는 것 · /, "")} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MethodGlossaryPanel(_props: { items?: { term: string; termKo?: string; def: string }[] | null }) {
  // v58: glossary table panel removed from overview / process / project stages
  return null;
}
