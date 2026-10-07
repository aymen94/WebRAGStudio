"use client";

import {
  SelectPicker,
  type PickerOption,
} from "@/components/shared/select-picker";
import { useI18n, type Locale } from "@/i18n/provider";

const languages = [
  { locale: "en", label: "English" },
  { locale: "it", label: "Italiano" },
  { locale: "de", label: "Deutsch" },
  { locale: "fr", label: "Français" },
  { locale: "ar", label: "العربية" },
  { locale: "zh", label: "中文" },
] as const;
const languageOptions = languages.map(({ locale, label }) => ({
  value: locale,
  label,
})) satisfies readonly PickerOption<Locale>[];

export function LanguagePicker() {
  const { locale, setLocale, t } = useI18n();

  return (
    <SelectPicker
      className="language-picker"
      accessibilityLabel={t("Language")}
      options={languageOptions}
      value={locale}
      onChange={setLocale}
      icon={
        <svg
          className="select-picker-icon"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        </svg>
      }
    />
  );
}
