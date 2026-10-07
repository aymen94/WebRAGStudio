import type { Dispatch, SetStateAction } from "react";
import type { SettingsDraft } from "./settings-draft";
import { useI18n } from "@/i18n/provider";

type Props = {
  settingsDraft: SettingsDraft;
  setSettingsDraft: Dispatch<SetStateAction<SettingsDraft>>;
};

export function ProviderSettings({ settingsDraft, setSettingsDraft }: Props) {
  const { t } = useI18n();
  return (
    <section className="panel settings-editor">
      <div className="settings-section-heading">
        <div>
          <h2>{t("Provider connection")}</h2>
          <p>
            {t(
              "Shared by chat and embedding requests. Database values override environment configuration.",
            )}
          </p>
        </div>
        <span
          className={`status ${settingsDraft.sharedSaved ? "status-ready" : "status-pending"}`}
        >
          {settingsDraft.sharedSaved ? t("DATABASE") : t("ENVIRONMENT")}
        </span>
      </div>
      <div className="settings-fields">
        <label>
          <span>{t("Provider")}</span>
          <select
            value={settingsDraft.provider}
            onChange={(e) =>
              setSettingsDraft({
                ...settingsDraft,
                provider: e.target.value,
              })
            }
          >
            <option value="openai">OpenAI</option>
            <option value="ollama">Ollama</option>
            <option value="openai-compatible">OpenAI-compatible</option>
          </select>
        </label>
        <label>
          <span>{t("Base URL")}</span>
          <input
            type="url"
            value={settingsDraft.baseUrl}
            onChange={(e) =>
              setSettingsDraft({
                ...settingsDraft,
                baseUrl: e.target.value,
              })
            }
            required
          />
        </label>
        <label className="settings-wide">
          <span>{t("API key")}</span>
          <input
            type="password"
            autoComplete="new-password"
            value={settingsDraft.apiKey}
            placeholder={
              settingsDraft.apiKeyConfigured
                ? "Saved securely — enter a new key to replace"
                : "Optional for local models"
            }
            onChange={(e) =>
              setSettingsDraft({
                ...settingsDraft,
                apiKey: e.target.value,
                clearApiKey: false,
              })
            }
          />
          <small>
            {t(
              "Encrypted in the local database and never sent back to the browser.",
            )}
          </small>
        </label>
        {settingsDraft.apiKeyConfigured && (
          <label className="settings-check">
            <input
              type="checkbox"
              checked={settingsDraft.clearApiKey}
              onChange={(e) =>
                setSettingsDraft({
                  ...settingsDraft,
                  clearApiKey: e.target.checked,
                  apiKey: "",
                })
              }
            />{" "}
            {t("Clear saved key")}
          </label>
        )}
      </div>
    </section>
  );
}
