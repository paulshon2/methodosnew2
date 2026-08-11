import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSuperAdminEmail } from "@/lib/admin-config";

/** Clerk 웹훅 — svix 미설치 시 CLERK_WEBHOOK_SECRET 헤더 간이 검증 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook secret missing" }, { status: 500 });

  const payload = await req.text();
  const svixId = req.headers.get("svix-id");
  const bearer = req.headers.get("authorization");

  // 간이: Authorization Bearer 또는 svix-id 존재 시 수락 (프로덕션에서는 svix 패키지 권장)
  if (!svixId && bearer !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized webhook" }, { status: 401 });
  }

  let evt: { type?: string; data?: any };
  try {
    evt = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ ok: true, skipped: "no supabase" });

  const type = evt.type || "";
  const u = evt.data || {};

  if (type === "user.created" || type === "user.updated") {
    const email =
      u.email_addresses?.find((e: any) => e.id === u.primary_email_address_id)?.email_address ||
      u.email_addresses?.[0]?.email_address ||
      "";
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || email;
    const superAdmin = isSuperAdminEmail(email);
    const row: Record<string, unknown> = {
      id: u.id,
      email,
      name,
      image_url: u.image_url || null,
      plan: superAdmin ? "university" : "free",
      role: superAdmin ? "admin" : "student",
      is_special_member: superAdmin,
      updated_at: new Date().toISOString(),
    };
    if (type === "user.created" || superAdmin) {
      row.approval_status = superAdmin ? "approved" : "pending";
    }
    await supabase.from("profiles").upsert(row, { onConflict: "id" });
  }

  if (type === "user.deleted" && u.id) {
    await supabase.from("profiles").delete().eq("id", u.id);
  }

  return NextResponse.json({ ok: true });
}
