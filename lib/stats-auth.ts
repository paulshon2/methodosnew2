/**
 * Auth for /api/stats/* — Clerk user or local-admin signal (mirrors profile APIs).
 */
import { NextRequest } from "next/server";
import { clerkConfigured } from "@/lib/admin-config";

const ADMIN_COOKIE = "mth_admin";

export type StatsAuth = {
  userId: string;
  mode: "clerk" | "local-admin" | "local";
};

export async function requireStatsAuth(req: NextRequest): Promise<StatsAuth | Response> {
  const secretHeader = req.headers.get("x-admin-secret");
  const secretQuery = req.nextUrl.searchParams.get("secret");
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  const adminSecret = (process.env.ADMIN_API_SECRET || "").trim();
  const localAdmin =
    !!(cookie) ||
    !!(adminSecret && (secretHeader === adminSecret || secretQuery === adminSecret));

  if (!clerkConfigured()) {
    if (localAdmin) return { userId: "local-admin", mode: "local-admin" };
    return { userId: "local-user", mode: "local" };
  }

  if (localAdmin) return { userId: "local-admin", mode: "local-admin" };

  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    return { userId, mode: "clerk" };
  } catch {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
}
