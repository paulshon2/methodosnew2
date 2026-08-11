"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/** APA 7판 문장 + 복사. 클립보드가 막히면 Range 선택으로 폴백한다. */
export default function ApaSentence({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "selected">("idle");
  const box = useRef<HTMLParagraphElement | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      const node = box.current;
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setState("selected");
    }
    window.setTimeout(() => setState("idle"), 2600);
  };

  return (
    <section className="card">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="ty-subhead min-w-0 flex-1">논문에 그대로 옮길 문장 (APA 7판)</h3>
        <button type="button" className="btn btn-sm" onClick={copy}>
          {state === "copied" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {state === "copied" ? "복사했습니다" : state === "selected" ? "선택했습니다 · Ctrl+C" : "문장 복사"}
        </button>
      </div>
      <p ref={box} className="ty-body prose-w" style={{ fontFamily: "var(--font-myeongjo)", lineHeight: 1.8 }}>
        {text}
      </p>
      <p className="ty-label mt-2 text-ink-3" aria-live="polite">
        {state === "selected"
          ? "브라우저가 복사를 막아 문장을 선택해 두었습니다. Ctrl+C를 누르세요."
          : "소수점 앞 0은 APA 규칙에 따라 생략했고, p가 .001보다 작으면 p < .001로 적었습니다."}
      </p>
    </section>
  );
}
