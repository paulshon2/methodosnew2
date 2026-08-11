import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStatsAuth } from "@/lib/stats-auth";
import { runStatsTechnique } from "@/lib/stats-core";
import { assertWithinHardLimits, chooseStatsExecMode } from "@/lib/stats-runtime";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  code: z.string().min(1).max(64),
  payload: z.record(z.unknown()),
  n: z.number().int().nonnegative().optional(),
  p: z.number().int().nonnegative().optional(),
  bootstrapB: z.number().int().nonnegative().optional(),
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

  const n = body.n ?? estimateN(body.payload);
  const p = body.p ?? estimateP(body.payload);
  try {
    assertWithinHardLimits(n, p);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 413 });
  }

  const mode = chooseStatsExecMode({
    techniqueCode: body.code,
    n,
    p,
    bootstrapB: body.bootstrapB ?? Number(body.payload.B ?? 0),
  });
  if (mode === "server-async") {
    return NextResponse.json(
      {
        error: "use_async_job",
        message: "This job should use POST /api/stats/jobs (bootstrap / long-running).",
        mode,
      },
      { status: 409 },
    );
  }

  const started = Date.now();
  const result = runStatsTechnique(body.code, body.payload);
  return NextResponse.json({
    ...result,
    exec: "server-sync",
    userId: auth.userId,
    ms: Date.now() - started,
  });
}

function estimateN(payload: Record<string, unknown>): number {
  if (Array.isArray(payload.y)) return payload.y.length;
  if (Array.isArray(payload.x)) return payload.x.length;
  if (Array.isArray(payload.X)) return payload.X.length;
  if (Array.isArray(payload.rows)) return payload.rows.length;
  return 0;
}

function estimateP(payload: Record<string, unknown>): number {
  if (Array.isArray(payload.X) && Array.isArray(payload.X[0])) return (payload.X[0] as unknown[]).length;
  if (Array.isArray(payload.xCols)) return payload.xCols.length;
  return 1;
}
