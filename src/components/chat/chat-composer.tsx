import type { Dispatch, SetStateAction, SubmitEventHandler } from "react";
import { ActionButton } from "@/components/shared/action-button";
import { ChatOptionsMenu } from "@/components/chat/chat-options-menu";
import type { ChatOptions } from "@/lib/chat-options";
import { useI18n } from "@/i18n/provider";

type Props = {
  question: string;
  setQuestion: Dispatch<SetStateAction<string>>;
  busyAction: string;
  selected: string;
  chatOptions: ChatOptions;
  setChatOptions: Dispatch<SetStateAction<ChatOptions>>;
  onAsk: SubmitEventHandler<HTMLFormElement>;
  onInterrupt: () => void;
};

export function ChatComposer({
  question,
  setQuestion,
  busyAction,
  selected,
  chatOptions,
  setChatOptions,
  onAsk,
  onInterrupt,
}: Props) {
  const { t } = useI18n();
  return (
    <form className="chat-form" onSubmit={onAsk}>
      <textarea
        aria-label={t("Your question")}
        placeholder={t("Ask a question about your documents…")}
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={!!busyAction}
      />
      <div>
        <span>
          {t("Only retrieved document context is sent to your model.")}
        </span>
        <div className="chat-form-actions">
          <ChatOptionsMenu
            options={chatOptions}
            setOptions={setChatOptions}
            disabled={!!busyAction}
          />
          {busyAction === "chat" && (
            <button
              className="button button-stop"
              type="button"
              onClick={onInterrupt}
            >
              ■ Stop
            </button>
          )}
          <ActionButton
            className="button button-primary"
            busyAction={busyAction}
            action="chat"
            disabled={!selected || !question.trim()}
          >
            {t("Send")}
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </ActionButton>
        </div>
      </div>
    </form>
  );
}
