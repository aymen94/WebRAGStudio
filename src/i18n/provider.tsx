"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "./messages/en";
import it from "./messages/it";
import de from "./messages/de";
import fr from "./messages/fr";
import ar from "./messages/ar";
import zh from "./messages/zh";

export const locales = ["en", "it", "de", "fr", "ar", "zh"] as const;
export type Locale = (typeof locales)[number];
const catalogs: Record<Locale, Record<string, string>> = {
  en,
  it,
  de,
  fr,
  ar,
  zh,
};
type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("webrag-language");
    if (locales.includes(saved as Locale)) setLocaleState(saved as Locale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("webrag-language", locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (key) => catalogs[locale][key] ?? en[key as keyof typeof en] ?? key,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
