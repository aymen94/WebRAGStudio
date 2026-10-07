import {
  DocumentList,
  type DocumentRow,
} from "@/components/documents/document-list";
import { useI18n } from "@/i18n/provider";

type Props = {
  collectionName?: string;
  documents: DocumentRow[];
  page: number;
  pageSize: number;
  pageCount: number;
  busyAction: string;
  onAddDocuments: () => void;
  onAllCollections: () => void;
  onPageChange: (page: number) => void;
  onRemoveDocument: (doc: DocumentRow) => void;
};

export function CollectionDetail({
  collectionName,
  documents,
  page,
  pageSize,
  pageCount,
  busyAction,
  onAddDocuments,
  onAllCollections,
  onPageChange,
  onRemoveDocument,
}: Props) {
  const { t } = useI18n();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("Collection")}</div>
          <h1>{collectionName || t("Collection")}</h1>
          <p>
            Browse, download, export, or remove files in this knowledge base.
          </p>
        </div>
        <button className="button button-primary" onClick={onAddDocuments}>
          ＋ Add documents
        </button>
      </div>
      <button className="back-link" onClick={onAllCollections}>
        ← All collections
      </button>
      <section className="panel document-list-panel collection-files-panel">
        <div className="panel-heading">
          <div>
            <h2>{t("Files")}</h2>
            <p>
              {documents.length} {documents.length === 1 ? "file" : "files"} in
              this collection
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
  );
}
