import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f6f8] px-4 text-center text-[#1a1d26]">
      <h1 className="text-2xl font-bold">승인 대기 중</h1>
      <p className="mt-3 max-w-md text-[14px] text-[#6b7280]">
        관리자 승인 후 MethodOS 워크스페이스를 사용할 수 있습니다. 슈퍼관리자(
        sarangred777@gmail.com)는 자동 승인됩니다.
      </p>
      <Link href="/" className="mt-8 text-[13px] text-[#534ab7] hover:underline">
        랜딩으로 돌아가기
      </Link>
    </div>
  );
}
