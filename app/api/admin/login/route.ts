import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  makeAdminSessionToken,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

/* all-36: 관리자 로그인 — RDOS 방식 이식.
   Clerk 로그인 여부와 무관하게 ADMIN_USERNAME/ADMIN_PASSWORD 자격만으로
   서명된 httpOnly 세션 쿠키를 발급한다. 비밀번호/시크릿은 브라우저로
   전달되지 않는다(쿠키는 httpOnly). */
export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const username = body.username ?? "";
  const password = body.password ?? "";
  const adminUid = verifyAdminCredentials(username, password);
  if (!adminUid) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const token = makeAdminSessionToken(adminUid);
  if (!token) {
    // ADMIN_API_SECRET 미설정 → 쿠키 서명 불가
    return NextResponse.json({ error: "secret_not_configured" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return res;
}

/* 관리자 로그아웃 — 세션 쿠키 제거 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
