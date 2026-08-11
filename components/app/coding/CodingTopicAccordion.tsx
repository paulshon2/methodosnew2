"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CODING_TOPIC_PACKS, type CodingTopicPack } from "@/lib/coding-topic-packs";

/** 왼쪽 · 코딩 예제 주제 20종+ 아코디언 */
export default function CodingTopicAccordion({
  activeId,
  onPick,
}: {
  activeId: string;
  onPick: (pack: CodingTopicPack) => void;
}) {
  const [openDomain, setOpenDomain] = useState<string | null>(null);

  const byDomain = useMemo(() => {
    const m = new Map<string, CodingTopicPack[]>();
    for (const p of CODING_TOPIC_PACKS) {
      const list = m.get(p.domain) || [];
      list.push(p);
      m.set(p.domain, list);
    }
    return [...m.entries()];
  }, []);

  // 첫 렌더에서 활성 주제 도메인을 연다
  const active = CODING_TOPIC_PACKS.find((p) => p.id === activeId);
  const domainOpen = openDomain ?? active?.domain ?? byDomain[0]?.[0] ?? null;

  return (
    <div>
      <h3 className="ty-label mb-2 font-bold">코딩 예제 주제</h3>
      <p className="ty-small mb-2 text-ink-2">
        질적 연구의 다양한 형식·주제를 고르면 코드북과 분석자료(10건+)가 바뀝니다.
      </p>
      <ul className="space-y-1">
        {byDomain.map(([domain, packs]) => {
          const open = domainOpen === domain;
          return (
            <li key={domain} className="rounded-xl" style={{ border: "1px solid var(--color-border-tertiary)" }}>
              <button
                type="button"
                className="flex w-full items-center gap-1 px-2.5 py-2 text-left"
                aria-expanded={open}
                onClick={() => setOpenDomain(open ? null : domain)}
              >
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <span className="ty-label font-bold">{domain}</span>
                <span className="ty-label ml-auto text-ink-3">{packs.length}</span>
              </button>
              {open ? (
                <ul className="space-y-0.5 border-t px-1.5 pb-1.5 pt-1" style={{ borderColor: "var(--color-border-tertiary)" }}>
                  {packs.map((p) => {
                    const on = p.id === activeId;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="w-full rounded-lg px-2 py-1.5 text-left"
                          style={{
                            background: on ? "var(--brand-soft)" : "transparent",
                            border: on ? "1px solid var(--brand)" : "1px solid transparent",
                          }}
                          onClick={() => onPick(p)}
                        >
                          <span className="ty-label block font-semibold">{p.label}</span>
                          <span className="ty-label block text-ink-3 line-clamp-2">{p.researchQuestion}</span>
                          <span className="ty-label mt-0.5 block text-ink-3">
                            자료 <span className="num">{p.docs.length}</span>건 · 코드{" "}
                            <span className="num">{p.themes.reduce((n, t) => n + t.codes.length, 0)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
