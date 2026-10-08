import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import type { SettingsDraft } from "@/components/settings/settings-draft";

type Options = {
  setBusyAction: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  reportError: (message: string) => void;
};

const defaults: SettingsDraft = {
  provider: "openai",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  llmModel: "gpt-4o-mini",
  embeddingModel: "text-embedding-3-small",
  chunkSize: 700,
  chunkOverlap: 100,
  topK: 4,
  similarityThreshold: 0,
  apiKeyConfigured: false,
  sharedSaved: false,
  ragSaved: false,
  clearApiKey: false,
};

export function useSettingsController({ setBusyAction, setMessage, reportError }: Options) {
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>(defaults);

  useEffect(() => {
    void fetch("/api/settings")
      .then((response) => response.json())
      .then((data) =>
        setSettingsDraft((current) => ({
          ...current,
          ...data,
          apiKey: "",
          clearApiKey: false,
        })),
      )
      .catch(() => reportError("Could not load settings."));
  }, [reportError]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("save-settings");
    setMessage("Saving settings…");
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsDraft),
      });
      const data = await response.json();
      if (!response.ok) {
        reportError(data.error || "Could not save settings.");
        return;
      }
      setSettingsDraft((current) => ({
        ...current,
        ...data,
        apiKey: "",
        clearApiKey: false,
      }));
      setMessage("Settings saved to the local database.");
    } catch {
      reportError("Could not save settings. Please try again.");
    } finally {
      setBusyAction("");
    }
  }

  return { settingsDraft, setSettingsDraft, saveSettings };
}
