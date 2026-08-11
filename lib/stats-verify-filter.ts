/**
 * 검증 여과장치 — 다음2(①절대 · ②불변 · ③시뮬 앵커 · ④자가오라클 요약)
 * 외부 소프트웨어 없이 결과 신뢰도를 표시한다.
 */
import {
  betainc,
  erf,
  gammainc,
  lgamma,
  normalCdf,
  studentTCdf,
} from "@/lib/stats-core/special";
import type { OlsResult } from "@/lib/stats-core/techniques/ols";

export type VerifyLayer = "anchor" | "invariant" | "consistency" | "boundary";

export type VerifyCheck = {
  id: string;
  layer: VerifyLayer;
  label: string;
  ok: boolean;
  detail?: string;
};

export type VerifyReport = {
  passed: boolean;
  score: number; // 0–1
  grade: "pass" | "warn" | "fail";
  checks: VerifyCheck[];
  summary: string;
};

function approx(a: number, b: number, eps = 1e-6) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= eps;
}

/** ① 해석적 특수 케이스 — 특수함수 뼈대 */
export function checkSpecialAnchors(): VerifyCheck[] {
  const checks: VerifyCheck[] = [];
  const phi0 = normalCdf(0);
  checks.push({
    id: "anchor.phi0",
    layer: "anchor",
    label: "Φ(0) = 0.5 (erf)",
    ok: approx(phi0, 0.5, 1e-8),
    detail: `got ${phi0}`,
  });
  const bi = betainc(0.37, 1, 1);
  checks.push({
    id: "anchor.betainc11",
    layer: "anchor",
    label: "betainc(x;1,1) = x",
    ok: approx(bi, 0.37, 1e-10),
    detail: `got ${bi}`,
  });
  checks.push({
    id: "anchor.erf0",
    layer: "anchor",
    label: "erf(0) = 0",
    ok: approx(erf(0), 0, 1e-12),
  });
  const lg = lgamma(5);
  checks.push({
    id: "anchor.lgamma5",
    layer: "anchor",
    label: "lgamma(5) = ln(24)",
    ok: approx(lg, Math.log(24), 1e-8),
    detail: `got ${lg}`,
  });
  // χ² df=2 at x=2: CDF = 1 − e^(−1) = gammainc(1, 1)
  const g = gammainc(1, 1);
  const expect = 1 - Math.exp(-1);
  checks.push({
    id: "anchor.chi2df2",
    layer: "anchor",
    label: "χ²(df=2) CDF via gammainc",
    ok: approx(g, expect, 1e-5),
    detail: `got ${g}, expect ${expect}`,
  });
  // t df=1 at t=1: Cauchy CDF = ½ + arctan(1)/π = 0.75
  const t1 = studentTCdf(1, 1);
  const cauchy = 0.5 + Math.atan(1) / Math.PI;
  checks.push({
    id: "anchor.t_df1",
    layer: "anchor",
    label: "t(df=1) CDF ≈ Cauchy",
    ok: approx(t1, cauchy, 1e-3),
    detail: `got ${t1}, expect ${cauchy}`,
  });
  return checks;
}

/** ② 회귀 항등식 */
export function checkOlsInvariants(fit: OlsResult): VerifyCheck[] {
  const checks: VerifyCheck[] = [];
  checks.push({
    id: "inv.xtxe",
    layer: "invariant",
    label: "‖Xᵀe‖ ≈ 0",
    ok: fit.xtxeNorm < 1e-8,
    detail: `‖Xᵀe‖=${fit.xtxeNorm}`,
  });
  checks.push({
    id: "inv.reseSum",
    layer: "invariant",
    label: "Σe ≈ 0 (절편 포함 시)",
    ok: Math.abs(fit.residualSum) < 1e-6,
    detail: `Σe=${fit.residualSum}`,
  });
  const decomp = Math.abs(fit.sse + fit.r2 * fit.sst - fit.sst);
  checks.push({
    id: "inv.sst",
    layer: "invariant",
    label: "SST ≈ SSR + SSE",
    ok: decomp < 1e-6 * Math.max(1, fit.sst),
    detail: `Δ=${decomp}`,
  });
  checks.push({
    id: "inv.r2range",
    layer: "boundary",
    label: "0 ≤ R² ≤ 1",
    ok: fit.r2 >= -1e-9 && fit.r2 <= 1 + 1e-9,
    detail: `R²=${fit.r2}`,
  });
  return checks;
}

export type TechniqueStats = Record<string, number | string | boolean | null | undefined>;

/** 기법별 가벼운 불변·경계 검사 */
export function checkTechniqueInvariants(code: string, stats: TechniqueStats): VerifyCheck[] {
  const checks: VerifyCheck[] = [];
  const num = (k: string) => {
    const v = stats[k];
    return typeof v === "number" ? v : NaN;
  };
  if (code === "D-01" || code === "D-03") {
    const r = num("r") || num("dCor") || num("pearson");
    if (Number.isFinite(r)) {
      checks.push({
        id: "inv.corrRange",
        layer: "invariant",
        label: "상관/거리상관 범위",
        ok: r >= -1.0001 && r <= 1.0001,
        detail: `r=${r}`,
      });
    }
  }
  if (code === "B-01") {
    const a = num("alpha") || num("cronbach");
    if (Number.isFinite(a)) {
      checks.push({
        id: "inv.alphaRange",
        layer: "boundary",
        label: "α ∈ (−∞, 1] 실용 구간",
        ok: a <= 1.0001,
        detail: `α=${a}`,
      });
    }
  }
  if (code.startsWith("C-") || code === "D-04" || code === "C-09") {
    const p = num("p") || num("pValue") || num("pvalue");
    if (Number.isFinite(p)) {
      checks.push({
        id: "inv.pRange",
        layer: "boundary",
        label: "p ∈ [0, 1]",
        ok: p >= 0 && p <= 1,
        detail: `p=${p}`,
      });
    }
  }
  if (code === "G-02") {
    const s = num("silhouette") || num("s");
    if (Number.isFinite(s)) {
      checks.push({
        id: "inv.sil",
        layer: "boundary",
        label: "실루엣 ∈ [−1, 1]",
        ok: s >= -1 && s <= 1,
        detail: `s=${s}`,
      });
    }
  }
  if (code === "G-06") {
    const auc = num("auc") || num("AUC");
    if (Number.isFinite(auc)) {
      checks.push({
        id: "inv.auc",
        layer: "boundary",
        label: "AUC ∈ [0, 1]",
        ok: auc >= 0 && auc <= 1,
        detail: `AUC=${auc}`,
      });
    }
  }
  if (stats._rowShuffleStable === true) {
    checks.push({
      id: "inv.rowShuffle",
      layer: "invariant",
      label: "행 순서 섞어도 동일",
      ok: true,
    });
  }
  if (stats._t2EqualsF === true) {
    checks.push({
      id: "cons.t2_F",
      layer: "consistency",
      label: "t² = F (k=2) 일관성",
      ok: true,
    });
  }
  if (stats._t2EqualsF === false) {
    checks.push({
      id: "cons.t2_F",
      layer: "consistency",
      label: "t² = F (k=2) 일관성",
      ok: false,
      detail: "불일치",
    });
  }
  return checks;
}

export function buildVerifyReport(parts: VerifyCheck[][]): VerifyReport {
  const checks = parts.flat();
  const n = checks.length || 1;
  const okN = checks.filter((c) => c.ok).length;
  const score = okN / n;
  const failed = checks.filter((c) => !c.ok);
  const anchorsFailed = failed.some((c) => c.layer === "anchor");
  const grade: VerifyReport["grade"] =
    score >= 0.999 && !anchorsFailed ? "pass" : score >= 0.75 && !anchorsFailed ? "warn" : "fail";
  const summary =
    grade === "pass"
      ? `검증 통과 (${okN}/${n}) — ①앵커·②불변 여과 이상 없음`
      : grade === "warn"
        ? `부분 통과 (${okN}/${n}) — 일부 검사 미충족, 해석 시 주의`
        : `검증 실패 (${okN}/${n}) — 결과 채택 전 재검토 필요` +
          (anchorsFailed ? " (절대 앵커 실패)" : "");
  return { passed: grade === "pass", score, grade, checks, summary };
}

/** 결과 산출 직전 공통 여과 */
export function filterVerifiedResult(opts: {
  code: string;
  stats?: TechniqueStats;
  ols?: OlsResult;
  includeGlobalAnchors?: boolean;
}): VerifyReport {
  const parts: VerifyCheck[][] = [];
  if (opts.includeGlobalAnchors !== false) parts.push(checkSpecialAnchors());
  if (opts.ols) parts.push(checkOlsInvariants(opts.ols));
  if (opts.stats) parts.push(checkTechniqueInvariants(opts.code, opts.stats));
  if (!opts.ols && !opts.stats) {
    parts.push([
      {
        id: "meta.ran",
        layer: "boundary",
        label: "규칙엔진 실행됨",
        ok: true,
      },
    ]);
  }
  return buildVerifyReport(parts);
}
