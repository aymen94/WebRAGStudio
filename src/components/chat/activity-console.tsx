import { useI18n } from "@/i18n/provider";

export type Activity = {
  id: number;
  time: string;
  text: string;
  level: "info" | "success" | "error" | "warning";
};

type Props = {
  entries: Activity[];
  running: boolean;
  outputRef: React.RefObject<HTMLDivElement | null>;
};

export function ActivityConsole({ entries, running, outputRef }: Props) {
  const { t } = useI18n();
  return (
    <section
      className="panel chat-console-card"
      aria-label={t("LLM activity console")}
    >
      <div className="chat-console">
        <div className="chat-console-heading">
          <strong>{t("LLM activity")}</strong>
          <span>{running ? t("RUNNING") : t("READY")}</span>
        </div>
        <div
          className="chat-console-output"
          ref={outputRef}
          role="log"
          aria-live="polite"
        >
          {entries.length ? (
            entries.map((entry) => (
              <div
                className={`chat-log-line chat-log-${entry.level}`}
                key={entry.id}
              >
                <time>{entry.time}</time>
                <span>{entry.text}</span>
              </div>
            ))
          ) : (
            <div className="chat-log-line">
              <time>--:--:--</time>
              <span>
                {t(
                  "Submit a question to see retrieval and generation activity.",
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
