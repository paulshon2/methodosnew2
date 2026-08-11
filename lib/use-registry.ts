"use client";
import { useEffect, useState } from "react";
import type { Registry, Method } from "@/lib/types";

let cache: Registry | null = null;

export function useRegistry() {
  const [reg, setReg] = useState<Registry | null>(cache);
  useEffect(() => {
    if (cache) return;
    fetch("registry.json").then((r) => r.json()).then((d: Registry) => { cache = d; setReg(d); }).catch(() => {});
  }, []);
  return reg;
}
export const methodById = (reg: Registry | null, id: string): Method | undefined =>
  reg?.methods.find((m) => m.id === id);
