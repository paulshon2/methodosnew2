import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/require-admin";
import { isSuperAdminEmail } from "@/lib/admin-config";
import { readProfileFromMeta } from "@/lib/profile-store";

/**
 * all-34: Clerk publicMetadata(membershipTier/approvalStatus)를 guaranteed 최신값으로
 * 신뢰하고, Supabase profiles 테이블은 role/created_at 등 부가 정보 + 폴백용으로만 쓴다.
 * 이전에는 Supabase 값만 신뢰해서, Supabase 쓰기가 실패한 뒤에도(Clerk는 갱신됐지만)
 * 계속 옛날 등급/승인상태가 관리자 목록에 표시되는 문제가 있었다.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (gate.ok === false) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const supabase = getServiceSupabase();

  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const list = await client.users.getUserList({ limit: 100 });

    const members = [];
    for (const u of list.data) {
      const email =
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ||
        u.emailAddresses[0]?.emailAddress ||
        "";
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || email;
      const superAdmin = isSuperAdminEmail(email);

      let plan = "free";
      let role = "student";
      let approval_status: "pending" | "approved" | "rejected" = "pending";
      let created_at = u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString();

      if (supabase) {
        try {
          const row = {
            id: u.id,
            email,
            name,
            image_url: u.imageUrl || null,
            plan: superAdmin ? "university" : "free",
            role: superAdmin ? "admin" : "student",
            approval_status: superAdmin ? "approved" : "pending",
            is_special_member: superAdmin,
            updated_at: new Date().toISOString(),
          };
          const { data: existing, error: selErr } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
          if (selErr) {
            console.error("[admin/members] supabase select failed, falling back to clerk meta", selErr);
          } else if (!existing) {
            const { error: insErr } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
            if (insErr) console.error("[admin/members] supabase initial upsert failed", insErr);
            plan = row.plan;
            role = row.role;
            approval_status = row.approval_status as any;
          } else {
            plan = existing.plan || plan;
            role = existing.role || role;
            approval_status = (existing.approval_status as any) || approval_status;
            created_at = existing.created_at || created_at;
            if (superAdmin && (existing.role !== "admin" || existing.approval_status !== "approved")) {
              const { error: updErr } = await supabase
                .from("profiles")
                .update({ role: "admin", approval_status: "approved", plan: "university", is_special_member: true })
                .eq("id", u.id);
              if (updErr) console.error("[admin/members] supabase super-admin sync failed", updErr);
              role = "admin";
              approval_status = "approved";
              plan = "university";
            }
          }
        } catch (e) {
          console.error("[admin/members] supabase profile lookup threw, falling back to clerk meta", e);
        }
      }

      // Clerk publicMetadata는 승인/퇴출/등급변경 API가 항상(guaranteed) 반영하는 곳이므로,
      // 값이 있으면 Supabase 결과보다 최신으로 신뢰한다. (Supabase 쓰기가 실패했더라도
      // 관리자 목록에는 실제로 처리된 최신 상태가 보이도록)
      if (!superAdmin) {
        const metaProfile = readProfileFromMeta(u.publicMetadata);
        if (metaProfile.plan) plan = metaProfile.plan;
        if (metaProfile.approvalStatus) approval_status = metaProfile.approvalStatus;
      }

      if (!supabase) {
        role = superAdmin ? "admin" : "student";
        if (superAdmin) {
          approval_status = "approved";
          plan = "university";
        }
      }

      // 최종 방어선: 위의 어떤 분기(Supabase 있음/없음, 기존 행 유무, 메타 폴백)를 거쳤든
      // 상관없이, 슈퍼관리자 이메일이면 무조건 admin/approved/university로 강제한다.
      // (Supabase 쓰기 실패 등 어떤 이유로도 슈퍼관리자 본인 계정이 "대기" 상태로
      // 잘못 표시되는 일이 없도록 하는 마지막 안전장치)
      if (superAdmin) {
        role = "admin";
        approval_status = "approved";
        plan = "university";
      }

      members.push({
        id: u.id,
        email,
        name,
        plan,
        role,
        approval_status,
        created_at,
      });
    }

    members.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return NextResponse.json({ members, mode: supabase ? "cloud" : "clerk-only" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "list failed" }, { status: 500 });
  }
}
