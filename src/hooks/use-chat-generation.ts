import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import type { ChatEntry } from "@/components/chat/chat-transcript";
import type { Activity } from "@/components/chat/activity";
import {
  USAGE_MARKER,
  defaultChatOptions,
  resolveChatOptions,
  type ChatOptions,
  type ChatUsage,
} from "@/lib/chat-options";

const OPTIONS_KEY = "webrag-chat-options";

type Options = {
  selected: string;
  activeCollectionName?: string;
  currentSessionId: string;
  setCurrentSessionId: Dispatch<SetStateAction<string>>;
  busyAction: string;
  setBusyAction: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  reportError: (message: string) => void;
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
  reportError,
  refreshSessions,
}: Options) {
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatEntry[]>([]);
  const [chatLogs, setChatLogs] = useState<Activity[]>([]);
  const [chatOptions, setChatOptions] =
    useState<ChatOptions>(defaultChatOptions);
  const optionsLoaded = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(OPTIONS_KEY);
      if (saved)
        setChatOptions({ ...defaultChatOptions, ...JSON.parse(saved) });
    } catch {}
    optionsLoaded.current = true;
  }, []);

  useEffect(() => {
    if (optionsLoaded.current)
      window.localStorage.setItem(OPTIONS_KEY, JSON.stringify(chatOptions));
  }, [chatOptions]);

  useEffect(() => {
    const area = chatScrollRef.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [chatMessages, busyAction]);

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
    setChatLogs([]);
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
          options: resolveChatOptions(chatOptions),
        }),
      });
      if (!response.ok) {
        const error = (await response.json()).error || "Chat failed";
        addChatLog(error, "error");
        setChatMessages((messages) =>
          messages.filter((item) => item.id !== id),
        );
        reportError(error);
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

      const tokenHeader = response.headers.get("X-Rag-Tokens");
      if (tokenHeader) {
        try {
          const usage = JSON.parse(tokenHeader) as ChatUsage;
          setChatMessages((messages) =>
            messages.map((item) => (item.id === id ? { ...item, usage } : item)),
          );
        } catch {}
      }

      addChatLog("Streaming response…");
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let raw = "";
      const show = () => {
        const cut = raw.indexOf(USAGE_MARKER);
        const answer = cut === -1 ? raw : raw.slice(0, cut);
        setChatMessages((messages) =>
          messages.map((item) => (item.id === id ? { ...item, answer } : item)),
        );
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        show();
      }
      raw += decoder.decode();
      show();
      const marker = raw.indexOf(USAGE_MARKER);
      if (marker !== -1) {
        try {
          const final = JSON.parse(raw.slice(marker + 1)) as ChatUsage;
          setChatMessages((messages) =>
            messages.map((item) =>
              item.id === id ? { ...item, usage: final } : item,
            ),
          );
          addChatLog(
            `Tokens: ${final.retrieval} embedding + ${final.prompt} prompt + ${final.completion ?? 0} answer${final.estimated ? " (estimated)" : ""}.`,
          );
        } catch {}
      }
      addChatLog("Response completed.", "success");
    } catch (error) {
      if (controller.signal.aborted)
        addChatLog("Generation interrupted.", "warning");
      else {
        const text = error instanceof Error ? error.message : "Chat request failed.";
        addChatLog(text, "error");
        reportError(text);
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
    clearChatLogs: () => setChatLogs([]),
    chatOptions,
    setChatOptions,
    chatScrollRef,
    addChatLog,
    interruptChat,
    ask,
  };
}
