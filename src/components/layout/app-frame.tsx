import type { ReactNode } from "react";
import layoutStyles from "@/app/layout.module.css";
import sharedStyles from "@/app/shared.module.css";
import dashboardStyles from "@/app/dashboard.module.css";
import collectionsStyles from "@/app/collections.module.css";
import documentsStyles from "@/app/documents.module.css";
import chatStyles from "@/app/chat.module.css";
import settingsStyles from "@/app/settings.module.css";
import { MenuIcon } from "./menu-icon";
import { ThemePicker } from "./theme-picker";
import { LanguagePicker } from "./language-picker";
import { useI18n } from "@/i18n/provider";

export type AppView =
  | "Dashboard"
  | "Collections"
  | "Collection"
  | "Documents"
  | "Chat"
  | "Settings";

const menu: AppView[] = ["Dashboard", "Collections", "Documents", "Chat"];

type Props = {
  view: AppView;
  menuOpen: boolean;
  message: string;
  children: ReactNode;
  dialogElement?: ReactNode;
  onMenuOpenChange: (open: boolean) => void;
  onNavigate: (view: AppView) => void;
};

export function AppFrame({
  view,
  menuOpen,
  message,
  children,
  dialogElement,
  onMenuOpenChange,
  onNavigate,
}: Props) {
  const { t } = useI18n();
  return (
    <div
      className={`app-shell min-h-screen ${layoutStyles.scope} ${sharedStyles.scope} ${dashboardStyles.scope} ${collectionsStyles.scope} ${documentsStyles.scope} ${chatStyles.scope} ${settingsStyles.scope}`}
    >
      {menuOpen && (
        <button
          className="scrim"
          aria-label={t("Close menu")}
          onClick={() => onMenuOpenChange(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <a
          className="brand"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("Dashboard");
          }}
        >
          <span className="brand-mark">R</span>
          <span>WebRAGStudio</span>
        </a>
        <div className="nav-label">{t("Web RAG Studio")}</div>
        <nav className="side-nav" aria-label={t("Main menu")}>
          {menu.map((item) => (
            <button
              key={item}
              className={`nav-item ${view === item ? "nav-active" : ""}`}
              onClick={() => onNavigate(item)}
            >
              <span className="nav-icon">
                <MenuIcon name={item} />
              </span>
              {t(item)}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={`local-badge settings-shortcut ${view === "Settings" ? "settings-shortcut-active" : ""}`}
            type="button"
            aria-current={view === "Settings" ? "page" : undefined}
            aria-label={t("Settings")}
            title={t("Settings")}
            onClick={() => onNavigate("Settings")}
          >
            <MenuIcon name="Settings" />
          </button>
          <ThemePicker />
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <button
            className="menu-toggle"
            aria-label={t("Toggle menu")}
            onClick={() => onMenuOpenChange(!menuOpen)}
          >
            <MenuIcon name="menu" />
          </button>
          <div className="breadcrumb">
            {t("Web RAG Studio")} <span>/</span> <strong>{t(view)}</strong>
          </div>
          <div className="topbar-right">
            <LanguagePicker />
          </div>
        </header>
        <main className="content">
          {children}
          {message && (
            <div className="toast" role="status">
              {message}
            </div>
          )}
        </main>
      </div>
      {dialogElement}
    </div>
  );
}
