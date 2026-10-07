import type { Dispatch, SetStateAction, SubmitEventHandler } from "react";
import { ActionButton } from "@/components/shared/action-button";
import { FilePicker } from "@/components/documents/file-picker";
import { useI18n } from "@/i18n/provider";

type Props = {
  busyAction: string;
  onUpload: SubmitEventHandler<HTMLFormElement>;
};

export function UploadPanel({ busyAction, onUpload }: Props) {
  const { t } = useI18n();
  return (
    <section className="panel action-card">
      <span className="action-icon">↑</span>
      <h2>{t("Upload files")}</h2>
      <p>{t("PDF, DOCX, TXT, Markdown, CSV or JSON · up to 10 MB each")}</p>
      <form onSubmit={onUpload}>
        <FilePicker disabled={!!busyAction} />
        <ActionButton
          className="button button-primary action-submit"
          busyAction={busyAction}
          action="upload"
        >
          {t("Upload & index")}
        </ActionButton>
      </form>
    </section>
  );
}
