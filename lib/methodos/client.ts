/** 화면에서 쓰는 호출기 — 무거운 계산이 화면을 얼리지 않게 웹 워커에서 돌린다(워커가 없으면 그 자리에서 계산). */
import type { MResult } from "./types";
import { runMethodos } from "./run";

export interface MethodosRun { result: MResult; ms: number }
let seq = 0;

export function runInWorker(code: string, csv: string, slots: Record<string, string[]>, options: Record<string, any>, timeoutMs = 120000): { promise: Promise<MethodosRun>; cancel: () => void } {
  let cancel = () => {};
  const promise = new Promise<MethodosRun>((resolve, reject) => {
    if (typeof Worker === "undefined") {
      try { const t0 = Date.now(); resolve({ result: runMethodos(code, csv, slots, options), ms: Date.now() - t0 }); } catch (e) { reject(e); }
      return;
    }
    let w: Worker;
    try { w = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }); } catch {
      try { const t0 = Date.now(); resolve({ result: runMethodos(code, csv, slots, options), ms: Date.now() - t0 }); } catch (e) { reject(e); }
      return;
    }
    const id = ++seq;
    const timer = setTimeout(() => { w.terminate(); reject(new Error("계산이 너무 오래 걸려 중단했습니다. 사례나 변수를 줄여 보세요.")); }, timeoutMs);
    cancel = () => { clearTimeout(timer); w.terminate(); reject(new Error("계산을 취소했습니다.")); };
    w.onmessage = (ev) => { clearTimeout(timer); w.terminate(); if (ev.data.ok) resolve({ result: ev.data.result, ms: ev.data.ms }); else reject(new Error(ev.data.error)); };
    w.onerror = (ev) => { clearTimeout(timer); w.terminate(); reject(new Error(ev.message || "계산 중 오류가 났습니다.")); };
    w.postMessage({ id, code, csv, slots, options });
  });
  return { promise, cancel: () => cancel() };
}
