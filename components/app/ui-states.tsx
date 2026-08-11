"use client";

export function LockedPanel({
  title,
  howToUnlock,
  availableNow,
  onGoAvailable,
  onHome,
}: {
  title: string;
  howToUnlock: string;
  availableNow: string;
  onGoAvailable?: () => void;
  onHome?: () => void;
}) {
  return (
    <div className="card max-w-[560px]">
      <h1 className="ty-title mb-2">잠긴 기능입니다</h1>
      <p className="ty-body text-ink-2 mb-3">
        <strong>{title}</strong>은(는) 현재 등급에서 사용할 수 없습니다.
      </p>
      <div className="rounded-[10px] p-3 mb-3" style={{ background: "var(--warn-wash)", color: "var(--warn)" }}>
        <div className="ty-label mb-1">어떻게 풀리나요</div>
        <p className="ty-small m-0">{howToUnlock}</p>
      </div>
      <div className="rounded-[10px] p-3 mb-4" style={{ background: "var(--ok-wash)", color: "var(--ok)" }}>
        <div className="ty-label mb-1">지금 쓸 수 있는 것</div>
        <p className="ty-small m-0">{availableNow}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {onGoAvailable ? (
          <button type="button" className="btn btn-primary" onClick={onGoAvailable}>
            쓸 수 있는 곳으로
          </button>
        ) : null}
        {onHome ? (
          <button type="button" className="btn" onClick={onHome}>
            홈으로
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function NotFoundPanel({
  route,
  onHome,
  onBack,
}: {
  route: string;
  onHome: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="card max-w-[520px]">
      <h1 className="ty-title mb-2">페이지를 찾지 못했습니다</h1>
      <p className="ty-body text-ink-2 mb-1">주소 <code className="ty-small">#/{route}</code> 에 해당하는 화면이 없습니다.</p>
      <p className="ty-small text-ink-3 mb-4">주소가 바뀌었을 수 있습니다. 홈에서 다시 찾아 보세요.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={onHome}>홈으로</button>
        {onBack ? <button type="button" className="btn" onClick={onBack}>이전으로</button> : null}
      </div>
    </div>
  );
}

export function ErrorRetry({
  message,
  onRetry,
  onHome,
}: {
  message: string;
  onRetry: () => void;
  onHome?: () => void;
}) {
  return (
    <div className="card">
      <h2 className="ty-subhead mb-2">불러오지 못했습니다</h2>
      <p className="ty-small text-ink-2 mb-1">{message}</p>
      <p className="ty-small text-ink-3 mb-3">작성 중인 내용은 브라우저에 남아 있을 수 있습니다.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={onRetry}>다시 시도</button>
        {onHome ? <button type="button" className="btn" onClick={onHome}>홈으로</button> : null}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="불러오는 중">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-4 w-full max-w-xl" />
      <div className="skeleton h-32 w-full" />
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
      </div>
    </div>
  );
}
