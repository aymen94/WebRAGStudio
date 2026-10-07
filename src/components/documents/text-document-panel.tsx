import type { Dispatch, SetStateAction, SubmitEventHandler } from "react";
import { ActionButton } from "@/components/shared/action-button";
import { useI18n } from "@/i18n/provider";

type Props = {
  busyAction: string;
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
  onSaveText: SubmitEventHandler<HTMLFormElement>;
};

export function TextDocumentPanel({
  busyAction,
  title,
  setTitle,
  content,
  setContent,
  onSaveText,
}: Props) {
  const { t } = useI18n();
  return (
    <section className="panel action-card">
      <span className="action-icon">＋</span>
      <h2>{t("Create text document")}</h2>
      <p>{t("Write or paste content directly into your collection.")}</p>
      <form onSubmit={onSaveText}>
        <input
          aria-label={t("Document title")}
          placeholder={t("Document title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={!!busyAction}
        />
        <textarea
          aria-label={t("Document content")}
          placeholder={t("Write or paste document content…")}
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          disabled={!!busyAction}
        />
        <ActionButton
          className="button button-primary action-submit"
          busyAction={busyAction}
          action="save-text"
        >
          {t("Save & index")}
        </ActionButton>
      </form>
    </section>
  );
}
