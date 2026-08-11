"use client";

import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

/**
 * 화면 제목 줄.
 *
 * 새 화면은 목적에서 출발하고, 이름·코드로 찾던 예전 화면은 그대로 남겨 두었다.
 * 그 통로를 화면마다 다른 문구로 두면 같은 것을 매번 다시 배워야 하므로 "Expert 모드" 하나로 통일한다.
 */
export default function PageHead({
  title,
  children,
  expert,
  right,
}: {
  title: string;
  /** 제목 아래 한 문단 */
  children?: ReactNode;
  /** 같은 일을 전문가 방식으로 하는 기존 화면 */
  expert?: { label: string; onOpen: () => void };
  /** 제목 줄 오른쪽 끝에 붙는 화면 전환기 */
  right?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h1 className="ty-title">{title}</h1>
          {expert ? (
            <>
              <button
                type="button"
                className="btn btn-sm"
                onClick={expert.onOpen}
                title={expert.label}
                aria-label={`Expert 모드 — ${expert.label}`}
              >
                <SlidersHorizontal size={14} aria-hidden="true" /> Expert 모드
              </button>
              <span className="ty-label text-ink-3">{expert.label}</span>
            </>
          ) : null}
        </div>
        {children ? <div className="ty-body mt-1.5 text-ink-2 prose-w">{children}</div> : null}
      </div>
      {right}
    </header>
  );
}
