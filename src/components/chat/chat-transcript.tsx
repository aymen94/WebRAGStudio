import { useI18n } from "@/i18n/provider";

export type ChatEntry = {
  id: string;
  question: string;
  answer: string;
  sources: { title: string }[];
};

type Props = {
  messages: ChatEntry[];
  activeCollectionName?: string;
  generating: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
};

export function ChatTranscript({
  messages,
  activeCollectionName,
  generating,
  scrollRef,
}: Props) {
  const { t } = useI18n();
  return (
    <div className="chat-messages" ref={scrollRef} aria-live="polite">
      {messages.length === 0 ? (
        <div className="chat-welcome">
          <h2>{t("What would you like to know?")}</h2>
          <p>
            {t(
              "Answers use relevant sources from your selected collection.",
            ).replace(
              t("your selected collection"),
              activeCollectionName || t("your selected collection"),
            )}
          </p>
        </div>
      ) : (
        messages.map((item, index) => (
          <div className="chat-exchange" key={item.id}>
            <div className="user-message">
              <div className="message-label">{t("You")}</div>
              <p>{item.question}</p>
            </div>
            <div className="answer-card">
              <div className="answer-label">WebRAGStudio</div>
              <p className="answer-text">
                {item.answer ||
                  (generating && index === messages.length - 1
                    ? "Thinking…"
                    : "")}
              </p>
              {item.sources.length > 0 && (
                <div className="source-list">
                  <strong>{t("Sources")}</strong>
                  {item.sources.map((source, i) => (
                    <span key={`${source.title}-${i}`} className="source-chip">
                      ▧ {source.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
