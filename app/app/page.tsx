"use client";
import dynamic from "next/dynamic";
import { AnnotationProvider } from "@/components/app/annotations";
import { useEffect } from "react";

const AppShell = dynamic(() => import("@/components/app/shell"), { ssr: false });

export default function AppPage() {
  useEffect(() => {
    // Clerk 연결 시 프로필 ensure (실패해도 로컬 모드 유지)
    fetch("/api/profile/ensure", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <AnnotationProvider>
      <AppShell />
    </AnnotationProvider>
  );
}
