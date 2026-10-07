import type { Dispatch, SetStateAction, SubmitEventHandler } from "react";
import { UploadPanel } from "@/components/documents/upload-panel";
import { TextDocumentPanel } from "@/components/documents/text-document-panel";
import {
  DocumentList,
  type DocumentRow,
} from "@/components/documents/document-list";
import { useI18n } from "@/i18n/provider";

type Collection = { id: string; name: string; documents: number };
type Props = {
  collections: Collection[];
  selected: string;
  setSelected: (id: string) => void;
  onOpenCollections: () => void;
  busyAction: string;
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
  onUpload: SubmitEventHandler<HTMLFormElement>;
  onSaveText: SubmitEventHandler<HTMLFormElement>;
  activeCollectionName?: string;
  documents: DocumentRow[];
  allDocuments: DocumentRow[];
  page: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onRemoveDocument: (doc: DocumentRow) => void;
};

export function DocumentsPage({
  collections,
  selected,
  setSelected,
  onOpenCollections,
  busyAction,
  title,
  setTitle,
  content,
  setContent,
  onUpload,
  onSaveText,
  activeCollectionName,
  documents,
  allDocuments,
  page,
  pageSize,
  pageCount,
  onPageChange,
  onRemoveDocument,
}: Props) {
  const { t } = useI18n();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("Knowledge base")}</div>
          <h1>{t("Documents")}</h1>
          <p>
            {t("Upload files or write text to index into your collection.")}
          </p>
        </div>
        <label className="collection-picker">
          <span>{t("Collection")}</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">{t("All collections")}</option>
            {collections.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!selected ? (
        <section className="panel document-list-panel">
          <div className="panel-heading">
            <div>
              <h2>{t("All collections")}</h2>
              <p>
                {allDocuments.length}{" "}
                {allDocuments.length === 1 ? t("document") : t("documents")} ·{" "}
                {t("Select a collection to add documents.")}
              </p>
            </div>
            <button
              className="button button-light"
              onClick={() => onOpenCollections()}
            >
              {t("Go to collections")}
            </button>
          </div>
          <DocumentList
            showCollection
            documents={allDocuments}
            page={page}
            pageSize={pageSize}
            pageCount={pageCount}
            busyAction={busyAction}
            onPageChange={onPageChange}
            onRemove={onRemoveDocument}
          />
        </section>
      ) : (
        <>
          <div className="document-actions">
            <UploadPanel busyAction={busyAction} onUpload={onUpload} />
            <TextDocumentPanel
              busyAction={busyAction}
              title={title}
              setTitle={setTitle}
              content={content}
              setContent={setContent}
              onSaveText={onSaveText}
            />
          </div>
          <section className="panel document-list-panel">
            <div className="panel-heading">
              <div>
                <h2>{activeCollectionName || t("Documents")}</h2>
                <p>
                  {documents.length}{" "}
                  {documents.length === 1 ? t("document") : t("documents")}
                </p>
              </div>
            </div>
            <DocumentList
              documents={documents}
              page={page}
              pageSize={pageSize}
              pageCount={pageCount}
              busyAction={busyAction}
              onPageChange={onPageChange}
              onRemove={onRemoveDocument}
            />
          </section>
        </>
      )}
    </>
  );
}
