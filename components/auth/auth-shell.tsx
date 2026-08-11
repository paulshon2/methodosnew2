"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/marketing/brand-logo";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#eff6ff] via-[#f8fafc] to-white px-4 py-10 text-[#0f172a]">
      <Link href="/" className="mb-6">
        <BrandLogo variant="nav" />
      </Link>
      <h1 className="mb-4 text-xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
