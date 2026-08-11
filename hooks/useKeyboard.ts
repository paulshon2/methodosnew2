"use client";

import { useEffect, useRef } from "react";

export type KeyMap = Record<string, (e: KeyboardEvent) => void>;

function isTyping(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/**
 * 단축키 바인딩.
 * 키 이름은 `KeyboardEvent.key` 그대로 쓰고, 조합키는 `ctrl+z` `alt+ArrowUp` 형태로 쓴다.
 * 입력 중일 때는 조합키가 아닌 단일 문자 단축키를 무시한다 — 글자를 못 치면 안 되니까.
 */
export function useKeyboard(map: KeyMap, enabled = true) {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const combo = [e.ctrlKey || e.metaKey ? "ctrl" : "", e.altKey ? "alt" : "", e.shiftKey ? "shift" : "", e.key]
        .filter(Boolean)
        .join("+");
      const handler = ref.current[combo] || ref.current[e.key];
      if (!handler) return;
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey;
      if (isTyping(e.target) && !hasModifier && e.key !== "Escape") return;
      handler(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

export default useKeyboard;
