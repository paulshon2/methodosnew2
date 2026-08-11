/**
 * Optional external pull-worker for stats_jobs (multi-instance / Vercel).
 * Same stats-core as the in-process runner in lib/stats-jobs.ts.
 *
 * Usage (VM with SUPABASE_SERVICE_ROLE_KEY):
 *   npx --yes tsx scripts/stats-worker.ts
 *
 * For single-instance `next start`, jobs already run via setTimeout in enqueueStatsJob —
 * this script is only needed when the API process cannot keep long CPU work.
 */
import { createClient } from "@supabase/supabase-js";
import { runStatsTechnique, statsErrorMessage } from "../lib/stats-core";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function main() {
  if (!url || !service) {
    console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const sb = createClient(url, service, { auth: { persistSession: false } });
  console.log("stats-worker polling queued jobs…");

  for (;;) {
    const { data: jobs, error } = await sb
      .from("stats_jobs")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1);
    if (error) {
      console.error(error.message);
      await sleep(2000);
      continue;
    }
    const job = jobs?.[0];
    if (!job) {
      await sleep(1500);
      continue;
    }
    await sb.from("stats_jobs").update({ status: "running", progress: 0 }).eq("id", job.id);
    try {
      const payload = (job.request?.payload as Record<string, unknown>) || job.request || {};
      const out = runStatsTechnique(job.code, payload, (p) => {
        void sb.from("stats_jobs").update({ progress: p }).eq("id", job.id);
      });
      if (!out.ok) {
        await sb
          .from("stats_jobs")
          .update({
            status: "error",
            error: statsErrorMessage(out),
            progress: 1,
            finished_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      } else {
        await sb
          .from("stats_jobs")
          .update({
            status: "done",
            result: out,
            progress: 1,
            finished_at: new Date().toISOString(),
            error: null,
          })
          .eq("id", job.id);
      }
    } catch (e) {
      await sb
        .from("stats_jobs")
        .update({
          status: "error",
          error: e instanceof Error ? e.message : String(e),
          progress: 1,
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

void main();
