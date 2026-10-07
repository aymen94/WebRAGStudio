import type { Dispatch, SetStateAction, SubmitEventHandler } from "react";
import type { SettingsDraft } from "./settings-draft";
import { ActionButton } from "@/components/shared/action-button";
import { ProviderSettings } from "./provider-settings";
import { ModelSettings } from "./model-settings";
import { RetrievalSettings } from "./retrieval-settings";
import { useI18n } from "@/i18n/provider";

type Props = {
  settingsDraft: SettingsDraft;
  setSettingsDraft: Dispatch<SetStateAction<SettingsDraft>>;
  busyAction: string;
  onSave: SubmitEventHandler<HTMLFormElement>;
};

export function SettingsPage({
  settingsDraft,
  setSettingsDraft,
  busyAction,
  onSave,
}: Props) {
  const { t } = useI18n();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("Configuration")}</div>
          <h1>{t("Settings")}</h1>
          <p>
            {t(
              "One provider connection is shared by chat and embeddings. Each task uses its own model.",
            )}
          </p>
        </div>
      </div>
      <form className="settings-form" onSubmit={onSave}>
        <ProviderSettings
          settingsDraft={settingsDraft}
          setSettingsDraft={setSettingsDraft}
        />
        <ModelSettings
          settingsDraft={settingsDraft}
          setSettingsDraft={setSettingsDraft}
        />
        <RetrievalSettings
          settingsDraft={settingsDraft}
          setSettingsDraft={setSettingsDraft}
        />
        <div className="settings-save-row">
          <span>{t("API keys are never included in settings responses.")}</span>
          <ActionButton
            className="button button-primary"
            busyAction={busyAction}
            action="save-settings"
          >
            {t("Save settings")}
          </ActionButton>
        </div>
      </form>
    </>
  );
}
