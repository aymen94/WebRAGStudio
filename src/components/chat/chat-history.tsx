import { useI18n } from "@/i18n/provider";

export type ChatSessionSummary = {
  id: string;
  collection_id: string;
  title: string;
  updated_at: string;
  collection_name: string;
  message_count: number;
};

type Props = {
  sessions: ChatSessionSummary[];
  currentSessionId: string;
  busyAction: string;
  onStart: () => void;
  onOpen: (session: ChatSessionSummary) => void;
  onDelete: (session: ChatSessionSummary) => void;
};

export function ChatHistory({
  sessions,
  currentSessionId,
  busyAction,
  onStart,
  onOpen,
  onDelete,
}: Props) {
  const { t } = useI18n();
  return (
    <aside className="panel chat-history">
      <div className="chat-history-heading">
        <h2>{t("History")}</h2>
        <button
          className="button button-light"
          type="button"
          onClick={onStart}
          disabled={!!busyAction}
        >
          ＋ New chat
        </button>
      </div>
      <div className="chat-history-list">
        {sessions.length ? (
          sessions.map((session) => (
            <div
              className={`chat-history-item ${session.id === currentSessionId ? "chat-history-active" : ""}`}
              key={session.id}
            >
              <button
                type="button"
                className="chat-history-open"
                onClick={() => onOpen(session)}
                disabled={!!busyAction}
              >
                <strong>{session.title}</strong>
                <small>
                  {session.collection_name} · {session.message_count} messages
                </small>
                <small>{new Date(session.updated_at).toLocaleString()}</small>
              </button>
              <button
                type="button"
                className="chat-history-delete"
                aria-label={`Delete chat ${session.title}`}
                title="Delete chat"
                disabled={!!busyAction}
                onClick={() => onDelete(session)}
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <p className="chat-history-empty">
            {t("Your conversations will appear here.")}
          </p>
        )}
      </div>
    </aside>
  );
}
