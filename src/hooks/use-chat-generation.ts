import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import type { ChatEntry } from "@/components/chat/chat-transcript";
import type { Activity } from "@/components/chat/activity-console";

type Options = {
  selected: string;
  activeCollectionName?: string;
  currentSessionId: string;
  setCurrentSessionId: Dispatch<SetStateAction<string>>;
  busyAction: string;
  setBusyAction: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  refreshSessions: () => Promise<void>;
};

export function useChatGeneration({
  selected,
  activeCollectionName,
  currentSessionId,
  setCurrentSessionId,
  busyAction,
  setBusyAction,
  setMessage,
  refreshSessions,
}: Options) {
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatEntry[]>([]);
  const [chatLogs, setChatLogs] = useState<Activity[]>([]);
  const [chatConsoleOpen, setChatConsoleOpen] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const chatAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const area = chatScrollRef.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [chatMessages, busyAction]);

  useEffect(() => {
    const area = chatLogRef.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [chatLogs]);

  function addChatLog(text: string, level: Activity["level"] = "info") {
    setChatLogs((logs) => [
      ...logs.slice(-99),
      {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        text,
        level,
      },
    ]);
  }

  function interruptChat() {
    if (!chatAbortRef.current) return;
    addChatLog("Interrupt requested by user.", "warning");
    chatAbortRef.current.abort();
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedQuestion = question.trim();
    if (!submittedQuestion || !selected || busyAction) return;

    const id = `pending-${crypto.randomUUID()}`;
    setChatMessages((messages) => [
      ...messages,
      { id, question: submittedQuestion, answer: "", sources: [] },
    ]);
    const controller = new AbortController();
    chatAbortRef.current = controller;
    setQuestion("");
    setBusyAction("chat");
    setMessage("Retrieving context…");
    addChatLog(
      `Question submitted to collection ${activeCollectionName || selected}.`,
    );

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: submittedQuestion,
          collectionId: selected,
          sessionId: currentSessionId || undefined,
        }),
      });
      if (!response.ok) {
        const error = (await response.json()).error || "Chat failed";
        addChatLog(error, "error");
        setChatMessages((messages) =>
          messages.filter((item) => item.id !== id),
        );
        setMessage(error);
        return;
      }

      const sessionId = response.headers.get("X-Rag-Session");
      const messageId = response.headers.get("X-Rag-Message");
      const provider = response.headers.get("X-Rag-Provider");
      const model = response.headers.get("X-Rag-Model");
      if (provider || model)
        addChatLog(
          `Provider: ${provider || "unknown"} · model: ${model ? decodeURIComponent(model) : "unknown"}.`,
        );
      if (sessionId) setCurrentSessionId(sessionId);
      if (messageId) addChatLog(`Response stored as ${messageId.slice(0, 8)}.`);
      void refreshSessions();
      setMessage("");

      const sourceHeader = response.headers.get("X-Rag-Sources");
      if (sourceHeader) {
        const sources = JSON.parse(decodeURIComponent(sourceHeader)) as {
          title: string;
        }[];
        setChatMessages((messages) =>
          messages.map((item) =>
            item.id === id ? { ...item, sources } : item,
          ),
        );
        addChatLog(
          `Retrieved ${sources.length} source chunk${sources.length === 1 ? "" : "s"}.`,
        );
      }

      addChatLog("Streaming response…");
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        if (text)
          setChatMessages((messages) =>
            messages.map((item) =>
              item.id === id ? { ...item, answer: item.answer + text } : item,
            ),
          );
      }
      const finalText = decoder.decode();
      if (finalText)
        setChatMessages((messages) =>
          messages.map((item) =>
            item.id === id
              ? { ...item, answer: item.answer + finalText }
              : item,
          ),
        );
      addChatLog("Response completed.", "success");
    } catch (error) {
      if (controller.signal.aborted)
        addChatLog("Generation interrupted.", "warning");
      else {
        addChatLog(
          error instanceof Error ? error.message : "Chat request failed.",
          "error",
        );
        setMessage("Chat failed. Please try again.");
      }
      setChatMessages((messages) =>
        messages.filter((item) => item.id !== id || !!item.answer),
      );
    } finally {
      chatAbortRef.current = null;
      setBusyAction("");
      void refreshSessions();
    }
  }

  return {
    question,
    setQuestion,
    chatMessages,
    setChatMessages,
    chatLogs,
    chatConsoleOpen,
    setChatConsoleOpen,
    chatScrollRef,
    chatLogRef,
    addChatLog,
    interruptChat,
    ask,
  };
}
