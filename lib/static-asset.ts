/** Next static export / Electron localhost — 루트 기준 절대 경로 */
export function staticAsset(path: string): string {
  const p = path.replace(/^\//, "");
  if (typeof window === "undefined") return "/" + p;
  const base = document.querySelector("base")?.getAttribute("href") || "/";
  const root = base.endsWith("/") ? base : base + "/";
  return root + p;
}
