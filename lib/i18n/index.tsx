"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { koOve } from "./locales/ko-ove";
import { enOve } from "./locales/en-ove";
import { zhOve } from "./locales/zh-ove";
import type { Locale, TranslationDict } from "./types";

const LOCALES: Record<Locale, TranslationDict> = {
  ko: koOve as TranslationDict,
  en: enOve as TranslationDict,
  zh: zhOve as TranslationDict,
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dict: TranslationDict;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getNested(dict: TranslationDict, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale: Locale = "ko";
  const dict = LOCALES[locale];
  const t = useCallback((key: string) => getNested(dict, key) ?? key, [dict]);
  const value = useMemo(
    () => ({ locale, setLocale: () => undefined, t, dict }),
    [dict, t],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation requires I18nProvider");
  return ctx;
}
