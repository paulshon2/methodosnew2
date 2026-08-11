import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * auth() 는 clerkMiddleware() 실행 후에만 동작 (관리자 API 등).
 * Vercel(키 있음): default export = clerkMiddleware 결과 → Clerk 감지 OK
 * 로컬(키 없음): 패스스루 (clerkMiddleware 호출 시 Missing publishableKey 방지)
 *
 * all-36: RDOS 구조 이식 — 관리자 API/화면은 Clerk 로그인 여부와 무관하게
 * 자체 관리자 세션(mth_admin 쿠키) 또는 x-admin-secret 으로도 통과할 수
 * 있어야 한다. 미들웨어(Edge 런타임)는 Node "crypto"를 쓸 수 없으므로
 * 여기서는 존재 여부만 보고 통과시키고, 실제 서명/만료 검증은 각 API
 * 라우트(lib/require-admin.ts, Node 런타임)에서 수행한다 — 이중 방어.
 */

const ADMIN_COOKIE = "mth_admin";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/pending-approval(.*)",
  "/api/webhooks(.*)",
]);

const hasClerkKey = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "").trim();

function hasLocalAdminSignal(req: NextRequest): boolean {
  const secretHeader = req.headers.get("x-admin-secret");
  const secretQuery = req.nextUrl.searchParams.get("secret");
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  return !!(secretHeader || secretQuery || cookie);
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  if (isPublicRoute(req)) return;

  if (path.startsWith("/api/admin")) {
    // 로컬 관리자 세션/시크릿이 있으면 Clerk 로그인 여부와 무관하게 통과.
    if (hasLocalAdminSignal(req)) return;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return;
  }

  if (
    path.startsWith("/api/permissions") ||
    path.startsWith("/api/profile") ||
    path.startsWith("/api/stats")
  ) {
    if (hasLocalAdminSignal(req)) return;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return;
  }

  if (path.startsWith("/app")) {
    if (hasLocalAdminSignal(req)) return;
    const { userId } = await auth();
    if (!userId) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect_url", path);
      return NextResponse.redirect(url);
    }
  }
});

function localPassthrough(_req: NextRequest, _event: NextFetchEvent) {
  return NextResponse.next();
}

export default hasClerkKey ? clerkHandler : localPassthrough;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
