"use client";
import { useEffect, useState } from "react";
import type { DocumentRow } from "@/components/documents/document-list";
import { useDocumentActions } from "@/hooks/use-document-actions";
import { useCollectionActions } from "@/hooks/use-collection-actions";
import { useChatController } from "@/hooks/use-chat-controller";
import { useSettingsController } from "@/hooks/use-settings-controller";
import { AppFrame, type AppView } from "@/components/layout/app-frame";
import { AppViewContent } from "@/components/layout/app-view-content";
import { usePathname, useRouter } from "next/navigation";
import { useAppDialog } from "@/hooks/use-app-dialog";

type Collection = { id: string; name: string; documents: number };
type Doc = DocumentRow;
type View = AppView;

const PAGE_SIZE = 10;

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const view: View =
    pathname === "/"
      ? "Dashboard"
      : pathname === "/collections"
        ? "Collections"
        : pathname.startsWith("/collections/")
          ? "Collection"
          : pathname === "/documents/new"
            ? "Documents"
            : pathname === "/chat"
              ? "Chat"
              : "Settings";
  const [menuOpen, setMenuOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selected, setSelected] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [allDocs, setAllDocs] = useState<Doc[]>([]);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const appDialog = useAppDialog();
  const {
    title,
    setTitle,
    content,
    setContent,
    uploadFile,
    saveText,
    removeDocument,
  } = useDocumentActions({
    selected,
    loadDocuments: loadDocs,
    setBusyAction,
    setMessage,
    confirm: appDialog.confirm,
  });
  const { name, setName, createCollection, manageCollection } =
    useCollectionActions({
      collections,
      selected,
      setSelected,
      reload: load,
      setBusyAction,
      setMessage,
      confirm: appDialog.confirm,
      prompt: appDialog.prompt,
    });
  const { settingsDraft, setSettingsDraft, saveSettings } =
    useSettingsController({ setBusyAction, setMessage });
  const activeCollection = collections.find((c) => c.id === selected);
  const {
    question,
    setQuestion,
    chatMessages,
    setChatMessages,
    chatSessions,
    currentSessionId,
    setCurrentSessionId,
    chatLogs,
    chatConsoleOpen,
    setChatConsoleOpen,
    chatScrollRef,
    chatLogRef,
    startNewChat,
    openChatSession,
    deleteChatSession,
    addChatLog,
    interruptChat,
    ask,
  } = useChatController({
    view,
    selected,
    setSelected,
    activeCollectionName: activeCollection?.name,
    busyAction,
    setBusyAction,
    setMessage,
    confirm: appDialog.confirm,
  });

  const pageCount = Math.max(1, Math.ceil(docs.length / PAGE_SIZE));

  async function load() {
    const result = (await fetch("/api/collections").then((r) =>
      r.json(),
    )) as Collection[];
    setCollections(result);
    if (result[0]) setSelected((current) => current || result[0].id);
  }
  async function loadDocs() {
    const [scoped, all] = await Promise.all([
      selected
        ? fetch(`/api/documents?collectionId=${selected}`)
            .then((r) => r.json())
            .catch(() => [])
        : Promise.resolve([]),
      fetch("/api/documents")
        .then((r) => r.json())
        .catch(() => []),
    ]);
    setDocs(scoped);
    setAllDocs(all);
    setPage(1);
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    void loadDocs();
  }, [selected]);
  useEffect(() => {
    const match = pathname.match(/^\/collections\/([^/]+)\/?$/);
    if (match) setSelected(decodeURIComponent(match[1]));
  }, [pathname]);

  function openView(next: View, collectionId = selected) {
    setMenuOpen(false);
    setMessage("");
    const routes: Record<View, string> = {
      Dashboard: "/",
      Collections: "/collections",
      Collection: collectionId
        ? `/collections/${encodeURIComponent(collectionId)}`
        : "/collections",
      Documents: "/documents/new",
      Chat: "/chat",
      Settings: "/settings",
    };
    router.push(routes[next]);
  }

  return (
    <AppFrame
      view={view}
      menuOpen={menuOpen}
      message={message}
      dialogElement={appDialog.dialogElement}
      onMenuOpenChange={setMenuOpen}
      onNavigate={(nextView) => openView(nextView)}
    >
      <AppViewContent
        view={view}
        collections={collections}
        docs={docs}
        allDocs={allDocs}
        selected={selected}
        setSelected={setSelected}
        page={page}
        setPage={setPage}
        pageCount={pageCount}
        busyAction={busyAction}
        openView={openView}
        removeDocument={removeDocument}
        name={name}
        setName={setName}
        createCollection={createCollection}
        manageCollection={manageCollection}
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
        uploadFile={uploadFile}
        saveText={saveText}
        activeCollectionName={activeCollection?.name}
        question={question}
        setQuestion={setQuestion}
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
        chatLogs={chatLogs}
        chatConsoleOpen={chatConsoleOpen}
        setChatConsoleOpen={setChatConsoleOpen}
        chatScrollRef={chatScrollRef}
        chatLogRef={chatLogRef}
        startNewChat={startNewChat}
        openChatSession={openChatSession}
        deleteChatSession={deleteChatSession}
        ask={ask}
        interruptChat={interruptChat}
        settingsDraft={settingsDraft}
        setSettingsDraft={setSettingsDraft}
        saveSettings={saveSettings}
      />
    </AppFrame>
  );
}
