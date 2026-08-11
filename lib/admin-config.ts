/* 슈퍼관리자 — 내장 기본 + SUPER_ADMIN_EMAILS 병합 */

const BUILT_IN_SUPER_ADMINS_B64: string[] = ["c2FyYW5ncmVkNzc3QGdtYWlsLmNvbQ=="]; // sarangred777@gmail.com

function decode(b64: string): string {
  try {
    if (typeof atob === "function") return atob(b64);
    return Buffer.from(b64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function fromEnv(v?: string | null): string[] {
  return (v || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const SUPER_ADMIN_EMAILS: string[] = Array.from(
  new Set([
    ...BUILT_IN_SUPER_ADMINS_B64.map((b) => decode(b).trim().toLowerCase()).filter(Boolean),
    ...fromEnv(process.env.SUPER_ADMIN_EMAILS),
    ...fromEnv(process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS),
  ])
);

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function clerkConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "").trim();
}
