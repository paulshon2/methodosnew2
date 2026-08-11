import { NextRequest, NextResponse } from "next/server";
import { requireStatsAuth } from "@/lib/stats-auth";
import { getStatsJob } from "@/lib/stats-jobs";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireStatsAuth(req);
  if (auth instanceof Response) return auth;

  const { id } = await ctx.params;
  const job = await getStatsJob(id, auth.userId);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    id: job.id,
    code: job.code,
    status: job.status,
    progress: job.progress,
    result: job.status === "done" ? job.result : undefined,
    error: job.error,
    exec: "server-async",
  });
}
