import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSuperAdminEmail, clerkConfigured } from "@/lib/admin-config";

export async function POST() {
  try {
    if (!clerkConfigured()) {
      return NextResponse.json({ ok: true, mode: "local", userId: "local-user" });
    }

    const { auth, clerkClient } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ ok: true, mode: "local-cloud-auth", userId });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      "";
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || email;
    const superAdmin = isSuperAdminEmail(email);

    const row = {
      id: userId,
      email,
      name,
      image_url: user.imageUrl || null,
      plan: superAdmin ? "university" : "free",
      role: superAdmin ? "admin" : "student",
      approval_status: superAdmin ? "approved" : "pending",
      is_special_member: superAdmin,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase.from("profiles").select("id,approval_status,role").eq("id", userId).maybeSingle();
    if (existing) {
      const patch: Record<string, unknown> = {
        email: row.email,
        name: row.name,
        image_url: row.image_url,
        updated_at: row.updated_at,
      };
      if (superAdmin) {
        patch.role = "admin";
        patch.approval_status = "approved";
        patch.plan = "university";
        patch.is_special_member = true;
      }
      await supabase.from("profiles").update(patch).eq("id", userId);
    } else {
      await supabase.from("profiles").upsert(row, { onConflict: "id" });
    }

    if (superAdmin) {
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role: "admin", approvalStatus: "approved" },
      });
    }

    return NextResponse.json({ ok: true, userId, email, superAdmin });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "ensure failed" }, { status: 500 });
  }
}
