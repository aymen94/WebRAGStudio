import type { Dispatch, SetStateAction } from "react";
import type { SettingsDraft } from "./settings-draft";
import { useI18n } from "@/i18n/provider";

type Props = {
  settingsDraft: SettingsDraft;
  setSettingsDraft: Dispatch<SetStateAction<SettingsDraft>>;
};

export function ModelSettings({ settingsDraft, setSettingsDraft }: Props) {
  const { t } = useI18n();
  return (
    <section className="panel settings-editor">
      <div className="settings-section-heading">
        <div>
          <h2>{t("Models")}</h2>
          <p>
            {t(
              "Chat and embeddings need different model types, even when they use the same provider.",
            )}
          </p>
        </div>
      </div>
      <div className="settings-fields">
        <label>
          <span>{t("Chat model")}</span>
          <input
            value={settingsDraft.llmModel}
            onChange={(e) =>
              setSettingsDraft({
                ...settingsDraft,
                llmModel: e.target.value,
              })
            }
            required
          />
        </label>
        <label>
          <span>{t("Embedding model")}</span>
          <input
            value={settingsDraft.embeddingModel}
            onChange={(e) =>
              setSettingsDraft({
                ...settingsDraft,
                embeddingModel: e.target.value,
              })
            }
            required
          />
        </label>
      </div>
    </section>
  );
}
