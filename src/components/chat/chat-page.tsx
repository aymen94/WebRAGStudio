import type { Dispatch, SetStateAction, SubmitEventHandler } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import {
  ChatHistory,
  type ChatSessionSummary,
} from "@/components/chat/chat-history";
import {
  ChatTranscript,
  type ChatEntry,
} from "@/components/chat/chat-transcript";
import {
  ActivityConsole,
  type Activity,
} from "@/components/chat/activity-console";
import {
  SelectPicker,
  type PickerOption,
} from "@/components/shared/select-picker";
import { useI18n } from "@/i18n/provider";

type Collection = { id: string; name: string; documents: number };
type Props = {
  collections: Collection[];
  selected: string;
  setSelected: (id: string) => void;
  setCurrentSessionId: Dispatch<SetStateAction<string>>;
  setChatMessages: Dispatch<SetStateAction<ChatEntry[]>>;
  activeCollectionName?: string;
  sessions: ChatSessionSummary[];
  currentSessionId: string;
  busyAction: string;
  onStartNewChat: () => void;
  onOpenSession: (session: ChatSessionSummary) => void;
  onDeleteSession: (session: ChatSessionSummary) => void;
  chatMessages: ChatEntry[];
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  question: string;
  setQuestion: Dispatch<SetStateAction<string>>;
  onAsk: SubmitEventHandler<HTMLFormElement>;
  chatConsoleOpen: boolean;
  setChatConsoleOpen: Dispatch<SetStateAction<boolean>>;
  onInterrupt: () => void;
  chatLogs: Activity[];
  chatLogRef: React.RefObject<HTMLDivElement | null>;
};

export function ChatPage({
  collections,
  selected,
  setSelected,
  setCurrentSessionId,
  setChatMessages,
  activeCollectionName,
  sessions: chatSessions,
  currentSessionId,
  busyAction,
  onStartNewChat: startNewChat,
  onOpenSession: openChatSession,
  onDeleteSession: deleteChatSession,
  chatMessages,
  chatScrollRef,
  question,
  setQuestion,
  onAsk: ask,
  chatConsoleOpen,
  setChatConsoleOpen,
  onInterrupt: interruptChat,
  chatLogs,
  chatLogRef,
}: Props) {
  const { t } = useI18n();
  const collectionOptions = [
    { value: "", label: t("Select collection") },
    ...collections.map((collection) => ({
      value: collection.id,
      label: collection.name,
    })),
  ] satisfies readonly PickerOption<string>[];
  const activeCollection = collections.find(
    (collection) => collection.id === selected,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("Retrieval assistant")}</div>
          <h1>{t("Chat")}</h1>
          <p>{t("Ask questions grounded in your indexed documents.")}</p>
        </div>
        <SelectPicker
          className="collection-picker"
          accessibilityLabel={t("Collection")}
          label={t("Collection")}
          options={collectionOptions}
          value={selected}
          onChange={(id) => {
            setSelected(id);
            setCurrentSessionId("");
            setChatMessages([]);
          }}
        />
      </div>
      <div className="chat-layout">
        <ChatHistory
          sessions={chatSessions}
          currentSessionId={currentSessionId}
          busyAction={busyAction}
          onStart={() => void startNewChat()}
          onOpen={(session) => void openChatSession(session)}
          onDelete={(session) => void deleteChatSession(session)}
        />
        <section className="panel chat-panel">
          <ChatTranscript
            messages={chatMessages}
            activeCollectionName={activeCollection?.name}
            generating={busyAction === "chat"}
            scrollRef={chatScrollRef}
          />
          <ChatComposer
            question={question}
            setQuestion={setQuestion}
            busyAction={busyAction}
            selected={selected}
            chatConsoleOpen={chatConsoleOpen}
            setChatConsoleOpen={setChatConsoleOpen}
            onAsk={ask}
            onInterrupt={interruptChat}
          />
        </section>
      </div>
      {chatConsoleOpen && (
        <ActivityConsole
          entries={chatLogs}
          running={busyAction === "chat"}
          outputRef={chatLogRef}
        />
      )}
    </>
  );
}
