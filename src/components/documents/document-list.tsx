import { useState, type ReactNode } from "react";
import { useI18n } from "@/i18n/provider";

export type DocumentRow = {
  id: string;
  title: string;
  status: string;
  error: string | null;
  created_at: string;
  collection_id?: string;
  collection_name?: string | null;
};

type Props = {
  documents: DocumentRow[];
  showCollection?: boolean;
  page: number;
  pageSize: number;
  pageCount: number;
  busyAction: string;
  onPageChange: (page: number) => void;
  onRemove: (document: DocumentRow) => void;
};

function ActionIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="action-icon-svg"
      aria-hidden="true"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function DocumentList({
  documents: allDocuments,
  showCollection = false,
  page,
  pageSize,
  busyAction,
  onPageChange,
  onRemove,
}: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const documents = needle
    ? allDocuments.filter(
        (doc) =>
          doc.title.toLowerCase().includes(needle) ||
          (showCollection &&
            (doc.collection_name ?? "").toLowerCase().includes(needle)),
      )
    : allDocuments;
  const pageCount = Math.max(1, Math.ceil(documents.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageDocuments = documents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  if (!allDocuments.length)
    return (
      <div className="empty">
        <span className="empty-icon">▧</span>
        <h3>{t("No documents yet")}</h3>
        <p>
          {t(
            "Upload a file or create a text document to start building your knowledge base.",
          )}
        </p>
      </div>
    );

  return (
    <>
      <div className="doc-search">
        <svg
          aria-hidden="true"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          aria-label={t("Search documents")}
          placeholder={t("Search documents")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onPageChange(1);
          }}
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("Document")}</th>
              {showCollection && <th>{t("Collection")}</th>}
              <th>{t("Status")}</th>
              <th>{t("Added")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {!pageDocuments.length && (
              <tr>
                <td colSpan={showCollection ? 5 : 4}>{t("No matching documents")}</td>
              </tr>
            )}
            {pageDocuments.map((doc) => {
              const removing = busyAction === `remove-document-${doc.id}`;
              return (
                <tr key={doc.id}>
                  <td>
                    <strong>{doc.title}</strong>
                    {doc.error && (
                      <small className="error-text">{doc.error}</small>
                    )}
                  </td>
                  {showCollection && <td>{doc.collection_name || "—"}</td>}
                  <td>
                    <span
                      className={`status status-${doc.status.toLowerCase()}`}
                    >
                      {t(doc.status[0] + doc.status.slice(1).toLowerCase())}
                    </span>
                  </td>
                  <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="doc-actions">
                      <a
                        className="table-action"
                        href={`/api/documents/${doc.id}`}
                        download
                        title={t("Download original file")}
                      >
                        <ActionIcon>
                          <path d="M12 3v12" />
                          <path d="m7 10 5 5 5-5" />
                          <path d="M5 21h14" />
                        </ActionIcon>
                        {t("Download")}
                      </a>
                      <a
                        className="table-action"
                        href={`/api/documents/${doc.id}/export`}
                        download
                        title={t("Export chunks and embedding vectors as JSON")}
                      >
                        <ActionIcon>
                          <ellipse cx="12" cy="5" rx="8" ry="3" />
                          <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
                          <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
                        </ActionIcon>
                        {t("Vectors")}
                      </a>
                      <button
                        className="table-action delete-action"
                        disabled={!!busyAction}
                        onClick={() => onRemove(doc)}
                        title={t("Remove document and vectors")}
                        aria-busy={removing}
                      >
                        {removing ? (
                          <span className="button-spinner" aria-hidden="true" />
                        ) : (
                          <ActionIcon>
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="m6 6 1 14h10l1-14" />
                            <path d="M10 11v5M14 11v5" />
                          </ActionIcon>
                        )}
                        {removing ? "…" : t("Remove")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>
          Showing {documents.length ? (currentPage - 1) * pageSize + 1 : 0}–
          {Math.min(currentPage * pageSize, documents.length)} of{" "}
          {documents.length}
        </span>
        <div>
          <button
            className="button button-light"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            {t("Previous")}
          </button>
          <span className="page-number">
            {t("Page")} {currentPage} {t("of")} {pageCount}
          </span>
          <button
            className="button button-light"
            disabled={currentPage >= pageCount}
            onClick={() => onPageChange(currentPage + 1)}
          >
            {t("Next")}
          </button>
        </div>
      </div>
    </>
  );
}
