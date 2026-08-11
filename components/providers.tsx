"use client";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkConfiguredClient } from "@/lib/clerk-client";
import { I18nProvider } from "@/lib/i18n";

/**
 * ClerkProvider — ESM import 필수.
 * require()는 Vercel 클라이언트에서 Application error 를 유발할 수 있음.
 * afterSignInUrl/afterSignUpUrl 은 Clerk v6에서 제거 → fallbackRedirectUrl 사용.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const pk = (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "").trim();
  const inner = <I18nProvider>{children}</I18nProvider>;
  if (!clerkConfiguredClient() || !pk) return inner;

  return (
    <ClerkProvider
      publishableKey={pk}
      signInUrl="/login"
      signUpUrl="/signup"
      signInFallbackRedirectUrl="/app"
      signUpFallbackRedirectUrl="/app"
      signInForceRedirectUrl="/app"
      signUpForceRedirectUrl="/app"
      appearance={{
        variables: {
          colorPrimary: "#2563eb",
          colorBackground: "#ffffff",
          colorText: "#0f172a",
          borderRadius: "12px",
        },
      }}
    >
      {inner}
    </ClerkProvider>
  );
}
