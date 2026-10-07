"use client";

import { useI18n, type Locale } from "@/i18n/provider";

const languages = [
  { locale: "en", label: "English" },
  { locale: "it", label: "Italiano" },
  { locale: "de", label: "Deutsch" },
  { locale: "fr", label: "Français" },
  { locale: "ar", label: "العربية" },
  { locale: "zh", label: "中文" },
] as const;

export function LanguagePicker() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="language-picker">
      <span className="sr-only">{t("Language")}</span>
      <select
        aria-label={t("Language")}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {languages.map((language) => (
          <option key={language.locale} value={language.locale}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
