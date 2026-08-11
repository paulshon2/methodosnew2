"use client";
import { useEffect, useMemo } from "react";
import { plainHTML, detectTerms } from "@/lib/gloss";
import { useAnnotation } from "./annotations";

const NOISE = new Set(["data", "corpus", "text", "texts", "code", "codes", "unit", "units", "note", "notes", "id", "api", "ai", "csv", "pdf", "html", "json", "url", "vs", "via", "per"]);

// 영어·전문용어는 ?마크 대신 왼쪽 ‘용어 주석’ 패널에 등록하고, 본문은 깔끔한 평문으로.
export function Gloss({ text, className }: { text?: string | null; className?: string }) {
  const { register } = useAnnotation();
  const terms = useMemo(() => detectTerms(text || "").filter((t) => !NOISE.has(t.term.toLowerCase())), [text]);
  useEffect(() => { if (terms.length) register(terms); }, [terms, register]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: plainHTML(text || "") }} />;
}
