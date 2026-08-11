"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Note from "@/components/ui/Note";
import type { AssumptionItem } from "@/lib/stats-goal";

const TONE = {
  ok: { tone: "ok" as const, mark: "✓", word: "통과" },
  warn: { tone: "warn" as const, mark: "!", word: "주의" },
  risk: { tone: "risk" as const, mark: "✕", word: "위반" },
  na: { tone: "neutral" as const, mark: "·", word: "확인 필요" },
};

/** 우측 패널 — 가정을 지켰는지, 어겼다면 무엇으로 갈아탈지 지목한다. */
export default function AssumptionPanel({ items }: { items: AssumptionItem[] }) {
  const [openP, setOpenP] = useState(false);
  const risky = items.filter((i) => i.status === "risk");

  return (
    <div className="space-y-3">
      {risky.length > 0 && (
        <Note level="risk" title="이 결과를 그대로 보고하기 전에" fix={risky.map((r) => r.fix).filter(Boolean).join(" ")}>
          가정 {risky.length}개가 지켜지지 않았습니다. 아래 항목을 확인하세요.
        </Note>
      )}

      <ul className="space-y-2.5">
        {items.map((it) => {
          const t = TONE[it.status];
          return (
            <li key={it.id} className="rounded-xl p-2.5" style={{ border: "1px solid var(--color-border-tertiary)" }}>
              <div className="mb-1 flex items-center gap-2">
                <span className="ty-label min-w-0 flex-1 font-bold">{it.label}</span>
                <Badge tone={t.tone} mark={t.mark}>
                  {t.word}
                </Badge>
              </div>
              <p className="ty-small text-ink-2">{it.detail}</p>
              {it.fix ? <p className="ty-small mt-1 text-ink-2" style={{ color: "var(--brand-ink)" }}>{it.fix}</p> : null}
            </li>
          );
        })}
      </ul>

      <div className="rounded-xl p-2.5" style={{ border: "1px solid var(--color-border-tertiary)" }}>
        <button type="button" className="ty-label w-full text-left font-bold" aria-expanded={openP} onClick={() => setOpenP((v) => !v)}>
          {openP ? "▾" : "▸"} p값은 무엇을 말해 주나요?
        </button>
        {openP && (
          <p className="ty-small anim-panel mt-2 text-ink-2 prose-w">
            p값은 &lsquo;차이가 실제로 없다고 가정했을 때 지금 관찰한 정도의 차이가 나올 확률&rsquo;입니다.
            p &lt; .05는 &lsquo;가설이 참일 확률이 95%&rsquo;라는 뜻이 아닙니다.
            p &gt; .05는 &lsquo;차이가 없다&rsquo;가 아니라 &lsquo;차이가 있다고 말할 근거가 부족하다&rsquo;는 뜻입니다.
          </p>
        )}
      </div>
    </div>
  );
}
