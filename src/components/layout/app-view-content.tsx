import type {
  Dispatch,
  SubmitEventHandler,
  RefObject,
  SetStateAction,
} from "react";
import type { DocumentRow } from "@/components/documents/document-list";
import type { ChatEntry } from "@/components/chat/chat-transcript";
import type { ChatSessionSummary } from "@/components/chat/chat-history";
import type { Activity } from "@/components/chat/activity-console";
import type { SettingsDraft } from "@/components/settings/settings-draft";
import type { AppView } from "./app-frame";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { CollectionsPage } from "@/components/collections/collections-page";
import { CollectionDetail } from "@/components/collections/collection-detail";
import { DocumentsPage } from "@/components/documents/documents-page";
import { ChatPage } from "@/components/chat/chat-page";
import { SettingsPage } from "@/components/settings/settings-page";

type Collection = { id: string; name: string; documents: number };
type Props = {
  view: AppView;
  collections: Collection[];
  docs: DocumentRow[];
  allDocs: DocumentRow[];
  selected: string;
  setSelected: Dispatch<SetStateAction<string>>;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  pageCount: number;
  busyAction: string;
  openView: (view: AppView, collectionId?: string) => void;
  removeDocument: (document: DocumentRow) => Promise<void>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  createCollection: SubmitEventHandler<HTMLFormElement>;
  manageCollection: (action: "rename" | "delete", id: string) => Promise<void>;
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
  uploadFile: SubmitEventHandler<HTMLFormElement>;
  saveText: SubmitEventHandler<HTMLFormElement>;
  activeCollectionName?: string;
  question: string;
  setQuestion: Dispatch<SetStateAction<string>>;
  chatMessages: ChatEntry[];
  setChatMessages: Dispatch<SetStateAction<ChatEntry[]>>;
  chatSessions: ChatSessionSummary[];
  currentSessionId: string;
  setCurrentSessionId: Dispatch<SetStateAction<string>>;
  chatLogs: Activity[];
  chatConsoleOpen: boolean;
  setChatConsoleOpen: Dispatch<SetStateAction<boolean>>;
  chatScrollRef: RefObject<HTMLDivElement | null>;
  chatLogRef: RefObject<HTMLDivElement | null>;
  startNewChat: () => Promise<void>;
  openChatSession: (session: ChatSessionSummary) => Promise<void>;
  deleteChatSession: (session: ChatSessionSummary) => Promise<void>;
  ask: SubmitEventHandler<HTMLFormElement>;
  interruptChat: () => void;
  settingsDraft: SettingsDraft;
  setSettingsDraft: Dispatch<SetStateAction<SettingsDraft>>;
  saveSettings: SubmitEventHandler<HTMLFormElement>;
};

const PAGE_SIZE = 10;
const DASHBOARD_PAGE_SIZE = 5;

export function AppViewContent(props: Props) {
  const {
    view,
    collections,
    docs,
    allDocs,
    selected,
    setSelected,
    page,
    setPage,
    pageCount,
    busyAction,
    openView,
    removeDocument,
    name,
    setName,
    createCollection,
    manageCollection,
    title,
    setTitle,
    content,
    setContent,
    uploadFile,
    saveText,
    activeCollectionName,
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
    ask,
    interruptChat,
    settingsDraft,
    setSettingsDraft,
    saveSettings,
  } = props;

  return (
    <>
      {view === "Dashboard" && (
        <DashboardPage
          collections={collections}
          documents={allDocs}
          selected={selected}
          page={page}
          pageSize={DASHBOARD_PAGE_SIZE}
          pageCount={Math.max(1, Math.ceil(allDocs.length / DASHBOARD_PAGE_SIZE))}
          busyAction={busyAction}
          onOpenDocuments={() => openView("Documents")}
          onOpenCollections={() => openView("Collections")}
          onOpenCollection={(id) => {
            setSelected(id);
            openView("Collection", id);
          }}
          onPageChange={setPage}
          onRemoveDocument={(doc) => void removeDocument(doc)}
        />
      )}
      {view === "Collections" && (
        <CollectionsPage
          collections={collections}
          selected={selected}
          name={name}
          setName={setName}
          busyAction={busyAction}
          onCreate={createCollection}
          onOpen={(id) => openView("Collection", id)}
          onManage={(action, id) => void manageCollection(action, id)}
        />
      )}
      {view === "Collection" && (
        <CollectionDetail
          collectionName={activeCollectionName}
          documents={docs}
          page={page}
          pageSize={PAGE_SIZE}
          pageCount={pageCount}
          busyAction={busyAction}
          onAddDocuments={() => openView("Documents")}
          onAllCollections={() => openView("Collections")}
          onPageChange={setPage}
          onRemoveDocument={(doc) => void removeDocument(doc)}
        />
      )}
      {view === "Documents" && (
        <DocumentsPage
          collections={collections}
          selected={selected}
          setSelected={setSelected}
          onOpenCollections={() => openView("Collections")}
          busyAction={busyAction}
          title={title}
          setTitle={setTitle}
          content={content}
          setContent={setContent}
          onUpload={uploadFile}
          onSaveText={saveText}
          activeCollectionName={activeCollectionName}
          documents={docs}
          allDocuments={allDocs}
          page={page}
          pageSize={PAGE_SIZE}
          pageCount={pageCount}
          onPageChange={setPage}
          onRemoveDocument={(doc) => void removeDocument(doc)}
        />
      )}
      {view === "Chat" && (
        <ChatPage
          collections={collections}
          selected={selected}
          setSelected={setSelected}
          setCurrentSessionId={setCurrentSessionId}
          setChatMessages={setChatMessages}
          activeCollectionName={activeCollectionName}
          sessions={chatSessions}
          currentSessionId={currentSessionId}
          busyAction={busyAction}
          onStartNewChat={() => void startNewChat()}
          onOpenSession={(session) => void openChatSession(session)}
          onDeleteSession={(session) => void deleteChatSession(session)}
          chatMessages={chatMessages}
          chatScrollRef={chatScrollRef}
          question={question}
          setQuestion={setQuestion}
          onAsk={ask}
          chatConsoleOpen={chatConsoleOpen}
          setChatConsoleOpen={setChatConsoleOpen}
          onInterrupt={interruptChat}
          chatLogs={chatLogs}
          chatLogRef={chatLogRef}
        />
      )}
      {view === "Settings" && (
        <SettingsPage
          settingsDraft={settingsDraft}
          setSettingsDraft={setSettingsDraft}
          busyAction={busyAction}
          onSave={saveSettings}
        />
      )}
    </>
  );
}
