/**
 * In-process + Supabase-backed stats job runner (next start friendly).
 * When Supabase is unavailable, falls back to an in-memory Map (dev/local).
 */
import { getServiceSupabase } from "@/lib/supabase";
import { runStatsTechnique, statsErrorMessage } from "@/lib/stats-core";

export type StatsJobRow = {
  id: string;
  user_id: string;
  code: string;
  status: "queued" | "running" | "done" | "error";
  progress: number;
  request: Record<string, unknown>;
  result: unknown | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
};

const memory = new Map<string, StatsJobRow>();

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function enqueueStatsJob(
  userId: string,
  code: string,
  request: Record<string, unknown>,
): Promise<StatsJobRow> {
  const now = new Date().toISOString();
  const row: StatsJobRow = {
    id: uuid(),
    user_id: userId,
    code,
    status: "queued",
    progress: 0,
    request,
    result: null,
    error: null,
    created_at: now,
    updated_at: now,
    finished_at: null,
  };

  const sb = getServiceSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("stats_jobs")
      .insert({
        id: row.id,
        user_id: row.user_id,
        code: row.code,
        status: row.status,
        progress: 0,
        request: row.request,
      })
      .select("*")
      .single();
    if (error) {
      // Table missing → memory fallback
      memory.set(row.id, row);
    } else {
      Object.assign(row, data);
      memory.set(row.id, row);
    }
  } else {
    memory.set(row.id, row);
  }

  // Fire-and-forget (single-instance next start)
  setTimeout(() => {
    void runJob(row.id);
  }, 0);

  return row;
}

export async function getStatsJob(id: string, userId: string): Promise<StatsJobRow | null> {
  const mem = memory.get(id);
  if (mem && mem.user_id === userId) return mem;

  const sb = getServiceSupabase();
  if (!sb) return mem && mem.user_id === userId ? mem : null;

  const { data, error } = await sb.from("stats_jobs").select("*").eq("id", id).maybeSingle();
  if (error || !data) return mem && mem.user_id === userId ? mem : null;
  if (data.user_id !== userId && userId !== "local-admin") return null;
  memory.set(id, data as StatsJobRow);
  return data as StatsJobRow;
}

async function patchJob(id: string, patch: Partial<StatsJobRow>) {
  const cur = memory.get(id);
  const next = { ...(cur || { id } as StatsJobRow), ...patch, updated_at: new Date().toISOString() } as StatsJobRow;
  memory.set(id, next);
  const sb = getServiceSupabase();
  if (sb) {
    await sb.from("stats_jobs").update(patch).eq("id", id);
  }
}

async function runJob(id: string) {
  const job = memory.get(id) || (await getStatsJob(id, "local-admin"));
  if (!job || job.status === "done" || job.status === "running") return;

  await patchJob(id, { status: "running", progress: 0 });
  try {
    const payload = (job.request?.payload as Record<string, unknown>) || job.request || {};
    const code = job.code;
    const out = runStatsTechnique(code, payload, (p) => {
      void patchJob(id, { progress: p });
    });
    if (!out.ok) {
      await patchJob(id, {
        status: "error",
        error: statsErrorMessage(out),
        progress: 1,
        finished_at: new Date().toISOString(),
      });
      return;
    }
    await patchJob(id, {
      status: "done",
      result: out,
      progress: 1,
      finished_at: new Date().toISOString(),
      error: null,
    });
  } catch (e) {
    await patchJob(id, {
      status: "error",
      error: e instanceof Error ? e.message : String(e),
      progress: 1,
      finished_at: new Date().toISOString(),
    });
  }
}
