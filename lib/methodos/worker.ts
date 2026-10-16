/// <reference lib="webworker" />
import { runMethodos } from "./run";

self.onmessage = (ev: MessageEvent<{ id: number; code: string; csv: string; slots: Record<string, string[]>; options: Record<string, any> }>) => {
  const { id, code, csv, slots, options } = ev.data;
  try {
    const t0 = performance.now();
    const result = runMethodos(code, csv, slots, options);
    (self as unknown as Worker).postMessage({ id, ok: true, result, ms: performance.now() - t0 });
  } catch (e: any) {
    (self as unknown as Worker).postMessage({ id, ok: false, error: String(e?.message ?? e) });
  }
};
