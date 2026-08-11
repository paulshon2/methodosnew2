import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import type { NextRequest } from "next/server";

/* ════════════════════════════════════════════════════════════
   all-36: 독립 관리자 인증 (RDOS 이식)
   ──────────────────────────────────────────────────────────────
   배경: 기존 requireAdmin()은 Clerk 로그인 + 슈퍼관리자 이메일 일치를
   "반드시" 요구했다. Clerk Middleware 미설정 / ENV 누락 / 로그인 세션
   문제 중 하나만 있어도 관리자 페이지 전체가 401/403으로 막혔다
   (RDOS 대비 구조 분석 결과).

   해결: RDOS(admin-auth.ts)와 동일한 방식으로, Clerk 유무와 무관하게
   동작하는 자체 관리자 세션(Cookie + HMAC)을 1차 인증 경로로 추가한다.
   - ADMIN_USERNAME / ADMIN_PASSWORD: 관리자 로그인 자격
   - ADMIN_API_SECRET: 세션 서명 및 서버-투-서버 x-admin-secret 헤더 검증
   Clerk 슈퍼관리자 판정은 require-admin.ts에서 폴백(2차)으로 유지한다.
─────────────────────────────────────────────────────────────── */

export const ADMIN_COOKIE = "mth_admin";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8; // 8시간

/** 서명·검증에 쓰는 시크릿(서버 전용, 단일 출처) */
function signingSecret(): string {
  return process.env.ADMIN_API_SECRET || "";
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function hmac(secret: string, data: string): string {
  return b64url(createHmac("sha256", secret).update(data).digest());
}
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

/**
 * 관리자 세션 토큰 발급.
 *  형식: base64url(JSON{uid,exp,nonce}).HMAC(secret, payload)
 * 시크릿 미설정 시 null.
 */
export function makeAdminSessionToken(uid: string, ttlSec: number = ADMIN_SESSION_MAX_AGE): string | null {
  const s = signingSecret();
  if (!s) return null;
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = b64url(Buffer.from(JSON.stringify({ uid, exp, nonce: b64url(randomBytes(9)) })));
  return `${payload}.${hmac(s, payload)}`;
}

/** 토큰 검증 → 유효하면 { uid }, 아니면 null. */
export function verifyAdminSessionToken(token: string | undefined | null): { uid: string } | null {
  const s = signingSecret();
  if (!s || !token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, hmac(s, payload))) return null;
  try {
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
    if (typeof json.exp !== "number" || json.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof json.uid !== "string" || !json.uid) return null;
    return { uid: json.uid };
  } catch {
    return null;
  }
}

/**
 * 요청이 관리자 권한을 가졌는지 검증 (Clerk 불필요, 동기).
 *  1) 서버-투-서버: x-admin-secret 헤더(또는 ?secret=)가 ADMIN_API_SECRET 과 일치
 *  2) 브라우저: 서명·만료가 유효한 관리자 세션 쿠키
 */
export function isAdminRequest(req: NextRequest): boolean {
  const envSecret = process.env.ADMIN_API_SECRET;
  const provided =
    req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-admin-secret");
  if (envSecret && provided && safeEqual(provided, envSecret)) return true;

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token) !== null;
}

/** 관리자 세션 쿠키에서 uid 추출 (유효하지 않으면 null) */
export function adminRequestUid(req: NextRequest): string | null {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token)?.uid ?? null;
}

/**
 * 관리자 로그인 자격 검증.
 * 자격은 환경변수에서만 읽는다(ADMIN_USERNAME / ADMIN_PASSWORD).
 * 미설정 시 운영·개발 모두 로그인 불가 (하드코딩 폴백 없음).
 * 성공 시 발급에 쓸 uid(=username)를 반환, 실패 시 null.
 */
export function verifyAdminCredentials(username: string, password: string): string | null {
  const USER = process.env.ADMIN_USERNAME || "";
  const PASS = process.env.ADMIN_PASSWORD || "";
  if (!USER || !PASS) return null; // 미설정 → 거부
  return safeEqual(username, USER) && safeEqual(password, PASS) ? USER : null;
}
