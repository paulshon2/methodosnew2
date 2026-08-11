/** 계열 배지 — 색 + 한 글자 (색 단독 금지) */
export const FAMILY_META: Record<string, { mark: string; color: string }> = {
  "조사·설문": { mark: "설", color: "var(--fam-survey)" },
  "질적·해석": { mark: "질", color: "var(--fam-qual)" },
  "양적·인과·실험": { mark: "인", color: "var(--fam-causal)" },
  "문헌·근거합성": { mark: "문", color: "var(--fam-lit)" },
  "양적·통계·모형": { mark: "통", color: "var(--fam-stats)" },
  "역사·비교": { mark: "역", color: "var(--fam-hist)" },
  "평가·정책": { mark: "평", color: "var(--fam-eval)" },
  "혼합·설계": { mark: "혼", color: "var(--fam-mixed)" },
  "텍스트·계산언어": { mark: "텍", color: "var(--fam-text)" },
};

export function familyMeta(macro?: string | null) {
  if (macro && FAMILY_META[macro]) return FAMILY_META[macro];
  return { mark: "방", color: "var(--brand)" };
}

export function FamilyBadge({
  macro,
  label,
}: {
  macro?: string | null;
  label?: string | null;
}) {
  const m = familyMeta(macro);
  const text = label || macro || "연구방법";
  return (
    <span className="fam-badge" style={{ background: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>
      <span className="fam-badge-mark" style={{ background: m.color }} aria-hidden="true">
        {m.mark}
      </span>
      <span>{text}</span>
    </span>
  );
}
