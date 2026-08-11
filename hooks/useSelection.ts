"use client";

import { useCallback, useState } from "react";

export type PickMode = "single" | "range" | "toggle";

/** 클릭 single · Shift+클릭 range · Ctrl/Cmd+클릭 toggle */
export function modeFromEvent(e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }): PickMode {
  if (e.shiftKey) return "range";
  if (e.ctrlKey || e.metaKey) return "toggle";
  return "single";
}

export function useSelection(ids: string[]) {
  const [sel, setSel] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);

  const pick = useCallback(
    (id: string, mode: PickMode = "single") => {
      if (mode === "toggle") {
        setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
        setAnchor(id);
        return;
      }
      if (mode === "range" && anchor) {
        const a = ids.indexOf(anchor);
        const b = ids.indexOf(id);
        if (a >= 0 && b >= 0) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          setSel(ids.slice(lo, hi + 1));
          return;
        }
      }
      setSel([id]);
      setAnchor(id);
    },
    [ids, anchor]
  );

  const clear = useCallback(() => {
    setSel([]);
    setAnchor(null);
  }, []);

  return { sel, setSel, anchor, pick, clear };
}

export default useSelection;
