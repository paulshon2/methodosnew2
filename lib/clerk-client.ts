export function clerkConfiguredClient(): boolean {
  return !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "").trim();
}
