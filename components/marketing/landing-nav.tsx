"use client";
import Link from "next/link";
import { LiveClock } from "./live-clock";
import { BrandLogo } from "./brand-logo";

const LINKS = [
  { href: "#hero", label: "소개" },
  { href: "#track", label: "연구자 플랜" },
  { href: "#features", label: "기능" },
  { href: "#menus", label: "메뉴" },
  { href: "#architecture", label: "아키텍처" },
  { href: "#howto", label: "사용법" },
  { href: "#pricing", label: "요금" },
  { href: "#docs", label: "문서" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#dbeafe] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-3 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandLogo variant="nav" />
        </Link>
        <nav className="ml-4 hidden flex-1 items-center gap-4 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-[12.5px] text-[#64748b] transition-colors hover:text-[#2563eb]">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <LiveClock />
          <Link href="/login" className="text-[12.5px] text-[#334155] hover:text-[#2563eb]">
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#2563eb] px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#1d4ed8]"
          >
            회원가입
          </Link>
        </div>
      </div>
    </header>
  );
}
