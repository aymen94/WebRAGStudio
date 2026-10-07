import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/provider";

type Props = { disabled?: boolean };

export function FilePicker({ disabled = false }: Props) {
  const { t } = useI18n();
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = inputRef.current?.form;
    const clearFileName = () => setFileName("");
    form?.addEventListener("reset", clearFileName);
    return () => form?.removeEventListener("reset", clearFileName);
  }, []);

  return (
    <label className={`file-picker ${disabled ? "file-picker-disabled" : ""}`}>
      <input
        ref={inputRef}
        className="file-picker-input"
        aria-label={t("Choose document files")}
        name="file"
        type="file"
        accept=".pdf,.docx,.txt,.md,.markdown,.csv,.json"
        multiple
        required
        disabled={disabled}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          setFileName(files.length > 1 ? `${files.length} files selected` : files[0]?.name || "");
        }}
      />
      <span className="file-picker-icon" aria-hidden="true">
        ↑
      </span>
      <span className="file-picker-copy">
        <strong>{t("Choose document files")}</strong>
        <small>{fileName || "PDF, DOCX, TXT, Markdown, CSV or JSON"}</small>
      </span>
      <span className="file-picker-action" aria-hidden="true">
        {t("Browse")}
      </span>
    </label>
  );
}
