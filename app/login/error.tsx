"use client";
import Link from "next/link";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#eff6ff] px-4 text-center text-[#0f172a]">
      <h1 className="text-lg font-bold">로그인 화면을 불러오지 못했습니다</h1>
      <p className="mt-2 max-w-md text-[13px] text-[#64748b]">
        {error?.message || "클라이언트 오류가 발생했습니다. 잠시 후 다시 시도하세요."}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white"
        >
          다시 시도
        </button>
        <Link href="/" className="rounded-full border border-[#bfdbfe] bg-white px-4 py-2 text-[13px]">
          홈으로
        </Link>
      </div>
    </div>
  );
}
