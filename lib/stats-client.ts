/**
 * Client-side runner: gate → browser | POST /api/stats/compute | jobs+poll.
 */
import {
  chooseStatsExecMode,
  estimateCsvShape,
  type StatsExecMode,
  type StatsRuntimeInput,
} from "@/lib/stats-runtime";
import { runStatsTechnique, type StatsComputeResponse } from "@/lib/stats-core";

export type RunViaRuntimeOptions = StatsRuntimeInput & {
  payload: Record<string, unknown>;
  /** Poll interval for async jobs (ms) */
  pollMs?: number;
  onProgress?: (p: number, mode: StatsExecMode) => void;
  signal?: AbortSignal;
};

export type RunViaRuntimeResult = StatsComputeResponse & {
  exec: StatsExecMode;
  jobId?: string;
  ms?: number;
};

async function pollJob(
  id: string,
  pollMs: number,
  onProgress?: (p: number, mode: StatsExecMode) => void,
  signal?: AbortSignal,
): Promise<RunViaRuntimeResult> {
  for (;;) {
    if (signal?.aborted) throw new Error("aborted");
    const res = await fetch(`/api/stats/jobs/${id}`, { signal });
    if (!res.ok) throw new Error(`job poll ${res.status}`);
    const j = await res.json();
    onProgress?.(Number(j.progress || 0), "server-async");
    if (j.status === "done") {
      const result = j.result as StatsComputeResponse;
      return { ...result, exec: "server-async", jobId: id };
    }
    if (j.status === "error") {
      return { code: j.code, ok: false, error: j.error || "job error", exec: "server-async", jobId: id };
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}

export async function runViaStatsRuntime(opts: RunViaRuntimeOptions): Promise<RunViaRuntimeResult> {
  const mode = chooseStatsExecMode(opts);
  const started = Date.now();
  opts.onProgress?.(0, mode);

  if (mode === "browser") {
    const out = runStatsTechnique(opts.techniqueCode, opts.payload, (p) =>
      opts.onProgress?.(p, "browser"),
    );
    return { ...out, exec: "browser", ms: Date.now() - started };
  }

  if (mode === "server-sync") {
    const res = await fetch("/api/stats/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: opts.techniqueCode,
        payload: opts.payload,
        n: opts.n,
        p: opts.p,
        bootstrapB: opts.bootstrapB,
      }),
      signal: opts.signal,
    });
    if (res.status === 409) {
      // Server redirected us to async path
      const enq = await fetch("/api/stats/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: opts.techniqueCode,
          payload: opts.payload,
          n: opts.n,
          p: opts.p,
        }),
        signal: opts.signal,
      });
      if (!enq.ok) {
        const err = await enq.text();
        return {
          code: opts.techniqueCode,
          ok: false,
          error: err || `enqueue ${enq.status}`,
          exec: "server-async",
          ms: Date.now() - started,
        };
      }
      const { id } = await enq.json();
      const polled = await pollJob(id, opts.pollMs ?? 400, opts.onProgress, opts.signal);
      return { ...polled, ms: Date.now() - started };
    }
    if (!res.ok) {
      const err = await res.text();
      return {
        code: opts.techniqueCode,
        ok: false,
        error: err || `compute ${res.status}`,
        exec: "server-sync",
        ms: Date.now() - started,
      };
    }
    const j = await res.json();
    return { ...j, exec: "server-sync", ms: Date.now() - started };
  }

  // server-async
  const enq = await fetch("/api/stats/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: opts.techniqueCode,
      payload: opts.payload,
      n: opts.n,
      p: opts.p,
    }),
    signal: opts.signal,
  });
  if (!enq.ok) {
    const err = await enq.text();
    return {
      code: opts.techniqueCode,
      ok: false,
      error: err || `enqueue ${enq.status}`,
      exec: "server-async",
      ms: Date.now() - started,
    };
  }
  const { id } = await enq.json();
  const polled = await pollJob(id, opts.pollMs ?? 400, opts.onProgress, opts.signal);
  return { ...polled, ms: Date.now() - started };
}

export { estimateCsvShape, chooseStatsExecMode };
