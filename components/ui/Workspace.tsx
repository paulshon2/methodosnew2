"use client";

import { useState, type ReactNode } from "react";
import { PanelLeft, PanelRight, X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * 3-Pane 골격 — 다섯 화면 전부 동일하게 쓴다.
 * 왼쪽=재료 · 가운데=작업물 · 오른쪽=선택한 것의 속성.
 * 900px 이하에서는 좌·우가 오버레이 시트로 바뀌고 중앙만 남는다.
 */
export default function Workspace({
  topbar,
  rail,
  railTitle = "재료",
  main,
  inspector,
  inspectorTitle = "속성",
  statusbar,
}: {
  topbar?: ReactNode;
  rail?: ReactNode;
  railTitle?: string;
  main: ReactNode;
  inspector?: ReactNode;
  inspectorTitle?: string;
  statusbar?: ReactNode;
}) {
  const [railOpen, setRailOpen] = useState(false);
  const [inspOpen, setInspOpen] = useState(false);

  const layout = rail && inspector ? "ws" : rail ? "ws ws--noinspector" : inspector ? "ws ws--norail" : "ws ws--only";

  return (
    <div className="flex min-w-0 flex-col">
      {topbar ? <div className="mb-3">{topbar}</div> : null}

      {(rail || inspector) && (
        <div className="ws-mobile-only mb-3 gap-2">
          {rail && (
            <button type="button" className="btn btn-sm" onClick={() => setRailOpen(true)}>
              <PanelLeft size={15} aria-hidden="true" /> {railTitle}
            </button>
          )}
          {inspector && (
            <button type="button" className="btn btn-sm ml-2" onClick={() => setInspOpen(true)}>
              <PanelRight size={15} aria-hidden="true" /> {inspectorTitle}
            </button>
          )}
        </div>
      )}

      <div className={layout}>
        {rail && (
          <div className={cn("ws-pane ws-pane--rail ws-sticky", railOpen && "is-open")}>
            <MobileClose label={railTitle} onClose={() => setRailOpen(false)} />
            {rail}
          </div>
        )}
        <main id="main" className="ws-pane min-w-0">
          {main}
        </main>
        {inspector && (
          <div className={cn("ws-pane ws-pane--inspector ws-sticky", inspOpen && "is-open")}>
            <MobileClose label={inspectorTitle} onClose={() => setInspOpen(false)} />
            {inspector}
          </div>
        )}
      </div>

      {statusbar ? <div className="ws-statusbar">{statusbar}</div> : null}
    </div>
  );
}

function MobileClose({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <div className="ws-mobile-only sticky top-0 z-10 mb-2 w-full items-center justify-between px-4 py-3" style={{ background: "var(--color-background-primary)" }}>
      <strong className="ty-subhead">{label}</strong>
      <button type="button" className="btn btn-sm" onClick={onClose} aria-label="닫기">
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
