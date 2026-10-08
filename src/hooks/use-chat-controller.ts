import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ChatSessionSummary } from "@/components/chat/chat-history";
import { useChatGeneration } from "@/hooks/use-chat-generation";

type View =
  | "Dashboard"
  | "Collections"
  | "Collection"
  | "Documents"
  | "Chat"
  | "Settings";
type Options = {
  view: View;
  selected: string;
  setSelected: Dispatch<SetStateAction<string>>;
  activeCollectionName?: string;
  busyAction: string;
  setBusyAction: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  reportError: (message: string) => void;
  confirm: (message: string, title?: string) => Promise<boolean>;
};

export function useChatController({
  view,
  selected,
  setSelected,
  activeCollectionName,
  busyAction,
  setBusyAction,
  setMessage,
  reportError,
  confirm,
}: Options) {
  const [chatSessions, setChatSessions] = useState<ChatSessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const chat = useChatGeneration({
    selected,
    activeCollectionName,
    currentSessionId,
    setCurrentSessionId,
    busyAction,
    setBusyAction,
    setMessage,
    reportError,
    refreshSessions: loadChatSessions,
  });

  useEffect(() => {
    if (view === "Chat") void loadChatSessions();
  }, [view]);

  async function loadChatSessions() {
    try {
      setChatSessions(
        await fetch("/api/chat/sessions").then((response) => response.json()),
      );
    } catch {
      reportError("Could not load chat history.");
    }
  }

  async function startNewChat() {
    if (!selected || busyAction) {
      if (!selected) setMessage("Select a collection to start a chat.");
      return;
    }
    // The session is created by the server with the first question.
    setCurrentSessionId("");
    chat.setChatMessages([]);
    chat.clearChatLogs();
    chat.setQuestion("");
    setMessage("");
  }

  async function openChatSession(session: ChatSessionSummary) {
    if (busyAction) return;
    setBusyAction(`open-chat-${session.id}`);
    try {
      const response = await fetch(`/api/chat/sessions/${session.id}`);
      const data = await response.json();
      if (!response.ok) {
        reportError(data.error || "Could not open chat.");
        return;
      }
      setCurrentSessionId(session.id);
      setSelected(data.collection_id);
      chat.setChatMessages(data.messages);
      chat.clearChatLogs();
      chat.setQuestion("");
      setMessage("");
    } catch {
      reportError("Could not open chat.");
    } finally {
      setBusyAction("");
    }
  }

  async function deleteChatSession(session: ChatSessionSummary) {
    if (!(await confirm(`Delete chat “${session.title}”?`, "Delete chat?"))) return;
    setBusyAction(`delete-chat-${session.id}`);
    try {
      const response = await fetch(`/api/chat/sessions/${session.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        reportError((await response.json()).error || "Could not delete chat.");
        return;
      }
      setChatSessions((items) =>
        items.filter((item) => item.id !== session.id),
      );
      if (currentSessionId === session.id) {
        setCurrentSessionId("");
        chat.setChatMessages([]);
        chat.clearChatLogs();
        chat.setQuestion("");
      }
      setMessage("Chat deleted.");
    } catch {
      reportError("Could not delete chat.");
    } finally {
      setBusyAction("");
    }
  }

  return {
    ...chat,
    chatSessions,
    currentSessionId,
    setCurrentSessionId,
    startNewChat,
    openChatSession,
    deleteChatSession,
  };
}
