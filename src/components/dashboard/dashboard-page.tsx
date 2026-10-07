import {
  DocumentList,
  type DocumentRow,
} from "@/components/documents/document-list";
import { useI18n } from "@/i18n/provider";

type Collection = { id: string; name: string; documents: number };
type Props = {
  collections: Collection[];
  documents: DocumentRow[];
  selected: string;
  page: number;
  pageSize: number;
  pageCount: number;
  busyAction: string;
  onOpenDocuments: () => void;
  onOpenCollections: () => void;
  onOpenCollection: (id: string) => void;
  onPageChange: (page: number) => void;
  onRemoveDocument: (doc: DocumentRow) => void;
};

export function DashboardPage({
  collections,
  documents,
  selected,
  page,
  pageSize,
  pageCount,
  busyAction,
  onOpenDocuments,
  onOpenCollections,
  onOpenCollection,
  onPageChange,
  onRemoveDocument,
}: Props) {
  const { t } = useI18n();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("Overview")}</div>
          <h1>{t("Dashboard")}</h1>
          <p>{t("Your knowledge base at a glance.")}</p>
        </div>
        <button
          className="button button-primary"
          onClick={() => onOpenDocuments()}
        >
          ＋ Add document
        </button>
      </div>
      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-icon violet">▤</span>
          <div>
            <p>{t("Collections")}</p>
            <strong>{collections.length}</strong>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon blue">▧</span>
          <div>
            <p>{t("Documents")}</p>
            <strong>{documents.length}</strong>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon green">✳</span>
          <div>
            <p>{t("Indexed")}</p>
            <strong>
              {documents.filter((d) => d.status === "READY").length}
            </strong>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-icon orange">◉</span>
          <div>
            <p>{t("Active model")}</p>
            <strong className="model-name">{t("Environment config")}</strong>
          </div>
        </article>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{t("Recent documents")}</h2>
              <p>{t("Latest files across all collections")}</p>
            </div>
            <button className="text-button" onClick={() => onOpenDocuments()}>
              View all →
            </button>
          </div>
          <DocumentList
            showCollection
            documents={documents}
            page={page}
            pageSize={pageSize}
            pageCount={pageCount}
            busyAction={busyAction}
            onPageChange={onPageChange}
            onRemove={onRemoveDocument}
          />
        </section>
        <section className="panel collection-panel">
          <div className="panel-heading">
            <div>
              <h2>{t("Collections")}</h2>
              <p>{t("Your knowledge spaces")}</p>
            </div>
            <button className="text-button" onClick={() => onOpenCollections()}>
              View all →
            </button>
          </div>
          {collections.length ? (
            collections.slice(0, 5).map((c) => (
              <button
                className="collection-row"
                key={c.id}
                onClick={() => {
                  onOpenCollection(c.id);
                }}
              >
                <span className="collection-symbol">▤</span>
                <span className="collection-name">
                  {c.name}
                  <small>
                    {c.documents} {t("documents")}
                  </small>
                </span>
                <span className="chevron">›</span>
              </button>
            ))
          ) : (
            <p className="muted">{t("Create a collection to get started.")}</p>
          )}
          <button
            className="button button-light full-button"
            onClick={() => onOpenCollections()}
          >
            ＋ New collection
          </button>
        </section>
      </div>
    </>
  );
}
