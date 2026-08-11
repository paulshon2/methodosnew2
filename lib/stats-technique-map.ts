/**
 * Map basic-stats / ss-stats UI ids → Excel technique codes (for runtime gate).
 */
export function mapBasicStatsModuleToCode(moduleId: string): string {
  if (/^[A-J]-\d{2}$/i.test(moduleId)) return moduleId.toUpperCase();
  const id = moduleId.toLowerCase();
  if (id === "freq") return "A-01";
  if (id === "ttest") return "C-02";
  if (id === "anova") return "C-04";
  if (id === "reliability" || id === "validity") return "B-01";
  if (id === "efa") return "B-03";
  if (id.startsWith("reg")) return "E-02";
  if (id === "assoc") return "D-01";
  if (id === "cluster") return "G-01";
  if (id.includes("mediat")) return "E-06";
  return "A-02";
}

export function mapSsTechToCode(phaseId: string, techName: string): string {
  const t = `${phaseId} ${techName}`.toLowerCase();
  if (/매개|mediat/.test(t)) return "E-06";
  if (/회귀|regress/.test(t)) return "E-02";
  if (/요인|pca|efa|주성분/.test(t)) return "B-03";
  if (/t검정|t-test|독립/.test(t)) return "C-02";
  if (/anova|분산/.test(t)) return "C-04";
  if (/상관|corr/.test(t)) return "D-01";
  if (/신뢰|cronbach|α/.test(t)) return "B-01";
  if (/군집|cluster|k-means/.test(t)) return "G-01";
  return "A-02";
}

/** Techniques currently runnable on /api/stats/compute via stats-core. */
export const SERVER_READY_CODES = new Set(["E-01", "E-02", "E-06", "B-03", "special.selftest"]);
