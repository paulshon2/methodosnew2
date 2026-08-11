"use client";

/**
 * 원형 진행 링 — 브랜드 그라디언트 허용 5곳 중 하나.
 * SVG `<stop>`은 PNG로 내보낼 때 CSS 변수를 풀어 주지 않으므로 여기서만 색을 직접 쓴다.
 */
export default function Ring({
  value,
  size = 64,
  label,
  caption,
}: {
  /** 0–100 */
  value: number;
  size?: number;
  label?: string;
  caption?: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <figure className="flex items-center gap-3">
      <svg width={size} height={size} role="img" aria-label={`${label || "진행률"} ${v}%`}>
        <title>{`${label || "진행률"} ${v}%`}</title>
        <defs>
          <linearGradient id={`ring-g-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4d7cff" />
            <stop offset="55%" stopColor="#7b5cff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border-tertiary)" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#ring-g-${size})`}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${(c * v) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-text-primary)"
          fontSize={size / 4}
          fontWeight={800}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {v}
        </text>
      </svg>
      {(label || caption) && (
        <figcaption>
          {label ? <div className="ty-small font-bold">{label}</div> : null}
          {caption ? <div className="ty-label text-ink-3">{caption}</div> : null}
        </figcaption>
      )}
    </figure>
  );
}
