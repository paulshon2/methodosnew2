"use client";
/**
 * AiProgressBar — AI 기반 실행상태를 퍼센트와 함께 시각화
 *
 * 사용법:
 *   const [prog, setProg] = useState<ProgressEvent | null>(null);
 *   await runFullPipeline(proj, settings, (e) => setProg(e));
 *   ...
 *   <AiProgressBar progress={prog} label="전체 파이프라인" />
 *
 * 특징:
 *  · 표준 프로토콜 · AI 실행상태를 사용자가 인식할 수있게 퍼센트+라벨 표시
 *  · 부드러운 애니메이션, 완료 시 자동 페이드아웃(옵션)
 *  · 세로/가로 컴팩트 두 스타일
 */
import { useEffect, useState } from "react";
import type { ProgressEvent } from "@/lib/coding-standards";

export function AiProgressBar({
  progress,
  label,
  compact = false,
  hideOnDone = false,
}: {
  progress: ProgressEvent | null;
  label?: string;
  compact?: boolean;
  hideOnDone?: boolean;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (progress) {
      setShown(true);
      if (hideOnDone && progress.percent >= 100) {
        const t = setTimeout(() => setShown(false), 1500);
        return () => clearTimeout(t);
      }
    }
  }, [progress, hideOnDone]);

  if (!shown || !progress) return null;
  const pct = Math.max(0, Math.min(100, Math.round(progress.percent || 0)));
  const done = pct >= 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[11.5px]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--color-background-secondary)]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: done ? "var(--ok)" : "var(--g-grad)",
            }}
          />
        </div>
        <span className="text-ink-2 w-9 text-right tabular-nums">{pct}%</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-3 mb-2"
      style={{ borderColor: "var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || "AI 실행 상태"}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: done ? "var(--ok)" : "var(--brand)" }} />
          <span className="text-[12px] font-semibold text-ink-2">
            {label ? `${label} — ` : ""}{progress.phase}
          </span>
        </div>
        <span className="text-[12px] tabular-nums font-semibold text-ink-2">{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden bg-white/60 dark:bg-black/20">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${pct}%`,
            background: done
              ? "var(--ok)"
              : "var(--g-grad)",
            backgroundSize: "200% 100%",
            animation: done ? undefined : "shimmer 2s linear infinite",
          }}
        />
      </div>
      {progress.note && (
        <div className="mt-1.5 text-[11px] text-ink-3">{progress.note}</div>
      )}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

export default AiProgressBar;
