"use client";

import EmptyState from "@/components/ui/EmptyState";
import type { Assign, Code, Doc } from "@/lib/coding-types";

/** 우 · 인용문. 자료를 넘나들며 같은 코드가 붙은 문장을 모은다. */
export default function QuotesPanel({
  code,
  docs,
  assign,
  codeMap,
  onGo,
}: {
  code: Code | null;
  docs: Doc[];
  assign: Assign;
  codeMap: Record<string, Code>;
  onGo: (segId: string) => void;
}) {
  if (!code) {
    return (
      <EmptyState title="코드를 선택하세요">
        왼쪽 코드북에서 코드를 누르면, 그 코드가 붙은 모든 인용문이 자료를 넘나들며 여기에 모입니다. 코드 하나가 실제로 무엇을 가리키는지는 이 목록을 봐야 알 수 있습니다.
      </EmptyState>
    );
  }

  const segIndex = new Map(docs.flatMap((d) => d.segs.map((s) => [s.id, { seg: s, doc: d }] as const)));
  const hits = Object.entries(assign)
    .filter(([, cs]) => cs.includes(code.id))
    .map(([segId]) => segIndex.get(segId))
    .filter(Boolean) as { seg: Doc["segs"][number]; doc: Doc }[];

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3.5 w-3.5 shrink-0 rounded-sm" style={{ background: code.color }} aria-hidden="true" />
        <strong className="ty-subhead">{code.name}</strong>
      </div>
      <p className="ty-label mb-3 text-ink-3">
        인용문 <span className="num">{hits.length}</span>개 · 자료{" "}
        <span className="num">{new Set(hits.map((h) => h.doc.id)).size}</span>건에서 출현
      </p>

      {hits.length === 0 ? (
        <p className="ty-small text-ink-3">아직 이 코드로 코딩된 문장이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {hits.map(({ seg, doc }) => (
            <li key={seg.id}>
              <button type="button" onClick={() => onGo(seg.id)} className="w-full text-left">
                <div className="ty-label mb-1 font-bold text-ink-3">
                  {doc.title.split(" · ")[0]} · {seg.who === "R" ? "연구자" : "참여자"}
                </div>
                <p className="ty-small pl-3" style={{ borderLeft: `2px solid ${code.color}`, lineHeight: 1.75 }}>
                  {seg.text}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {(assign[seg.id] ?? [])
                    .filter((c) => c !== code.id)
                    .map((c) => (
                      <span
                        key={c}
                        className="ty-label rounded-full px-1.5 py-0.5"
                        style={{ background: `${codeMap[c]?.color}22`, color: codeMap[c]?.color }}
                      >
                        {codeMap[c]?.name}
                      </span>
                    ))}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
