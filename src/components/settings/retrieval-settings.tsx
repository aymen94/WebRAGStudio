import type { Dispatch, SetStateAction } from "react";
import type { SettingsDraft } from "./settings-draft";
import { useI18n } from "@/i18n/provider";

type Props = {
  settingsDraft: SettingsDraft;
  setSettingsDraft: Dispatch<SetStateAction<SettingsDraft>>;
};

export function RetrievalSettings({ settingsDraft, setSettingsDraft }: Props) {
  const { t } = useI18n();
  return (
    <section className="panel settings-editor">
      <div className="settings-section-heading">
        <div>
          <h2>{t("Retrieval")}</h2>
          <p>{t("Chunking and search behavior")}</p>
        </div>
        <span
          className={`status ${settingsDraft.ragSaved ? "status-ready" : "status-pending"}`}
        >
          {settingsDraft.ragSaved ? t("DATABASE") : t("DEFAULTS")}
        </span>
      </div>
      <div className="settings-fields">
        <label>
          <span>{t("Chunk size (words)")}</span>
          <input
            type="number"
            min={100}
            max={10000}
            value={settingsDraft.chunkSize}
            onChange={(e) =>
              setSettingsDraft({
                ...settingsDraft,
                chunkSize: Number(e.target.value),
              })
            }
            required
          />
        </label>
        <label>
          <span>{t("Chunk overlap (words)")}</span>
          <input
            type="number"
            min={0}
            max={2000}
            value={settingsDraft.chunkOverlap}
            onChange={(e) =>
              setSettingsDraft({
                ...settingsDraft,
                chunkOverlap: Number(e.target.value),
              })
            }
            required
          />
        </label>
        <label>
          <span>{t("Top results")}</span>
          <input
            type="number"
            min={1}
            max={20}
            value={settingsDraft.topK}
            onChange={(e) =>
              setSettingsDraft({
                ...settingsDraft,
                topK: Number(e.target.value),
              })
            }
            required
          />
        </label>
        <label>
          <span>{t("Similarity threshold (0–1)")}</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={settingsDraft.similarityThreshold}
            onChange={(e) =>
              setSettingsDraft({
                ...settingsDraft,
                similarityThreshold: Number(e.target.value),
              })
            }
            required
          />
        </label>
      </div>
    </section>
  );
}
