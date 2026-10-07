"use client";

import { useEffect, useState } from "react";
import { themes, type ThemeId } from "@/lib/themes";
import { useI18n } from "@/i18n/provider";

const defaultTheme: ThemeId = "violet";

export function ThemePicker() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<ThemeId>(defaultTheme);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("webrag-theme") as ThemeId | null;
    const selected = themes.some((option) => option.id === saved)
      ? saved!
      : defaultTheme;
    setTheme(selected);
    document.documentElement.dataset.theme = selected;
  }, []);

  function chooseTheme(next: ThemeId) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("webrag-theme", next);
    setOpen(false);
  }

  const current = themes.find((option) => option.id === theme) || themes[0];
  const themeColumns = [
    themes.filter((option) => !option.id.startsWith("dark-")),
    themes.filter((option) => option.id.startsWith("dark-")),
  ];

  return (
    <div className="theme-picker">
      {open && (
        <>
          <button
            className="theme-dismiss"
            aria-label={t("Close theme picker")}
            onClick={() => setOpen(false)}
          />
          <div
            className="theme-popover"
            role="dialog"
            aria-label={t("Choose theme")}
          >
            <strong>{t("Choose theme")}</strong>
            <div
              className="theme-options"
              role="radiogroup"
              aria-label={t("Theme colors")}
            >
              {themeColumns.map((column, index) => (
                <div className="theme-option-column" key={index}>
                  {column.map((option) => (
                    <button
                      type="button"
                      role="radio"
                      aria-label={option.name}
                      aria-checked={theme === option.id}
                      className={`theme-option ${theme === option.id ? "theme-option-active" : ""}`}
                      key={option.id}
                      onClick={() => chooseTheme(option.id)}
                    >
                      <span
                        className="theme-swatch"
                        style={{
                          background: `linear-gradient(90deg, ${option.primary} 0 33.33%, ${option.secondary} 33.33% 66.66%, ${option.tertiary} 66.66% 100%)`,
                        }}
                      />
                      <span
                        className={`theme-mode-indicator ${option.id.startsWith("dark-") ? "theme-mode-dark" : "theme-mode-light"}`}
                        aria-hidden="true"
                      />
                      {theme === option.id && (
                        <span className="theme-check" aria-hidden="true">
                          <svg viewBox="0 0 16 16">
                            <path d="m3 8 3.2 3.2L13 4.5" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <button
        className="local-badge theme-trigger"
        type="button"
        aria-label={`Choose theme. Current theme: ${current.name}`}
        title={`Theme: ${current.name}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span
          className="theme-current-swatch"
          style={{
            background: `linear-gradient(90deg, ${current.primary} 0 33.33%, ${current.secondary} 33.33% 66.66%, ${current.tertiary} 66.66% 100%)`,
          }}
        />
      </button>
    </div>
  );
}
