import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStatsAuth } from "@/lib/stats-auth";
import { enqueueStatsJob } from "@/lib/stats-jobs";
import { assertWithinHardLimits } from "@/lib/stats-runtime";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  code: z.string().min(1).max(64),
  payload: z.record(z.unknown()),
  n: z.number().int().nonnegative().optional(),
  p: z.number().int().nonnegative().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireStatsAuth(req);
  if (auth instanceof Response) return auth;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid body", detail: String(e) }, { status: 400 });
  }

  const n = body.n ?? (Array.isArray(body.payload.x) ? (body.payload.x as unknown[]).length : 0);
  const p = body.p ?? 3;
  try {
    assertWithinHardLimits(n || 1, p || 1);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 413 });
  }

  const job = await enqueueStatsJob(auth.userId, body.code, {
    payload: body.payload,
    n,
    p,
  });

  return NextResponse.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    code: job.code,
    exec: "server-async",
  });
}
