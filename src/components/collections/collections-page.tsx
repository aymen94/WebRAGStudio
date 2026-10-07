import type { Dispatch, SetStateAction, SubmitEventHandler } from "react";
import { ActionButton } from "@/components/shared/action-button";
import { useI18n } from "@/i18n/provider";

type Collection = { id: string; name: string; documents: number };
type Props = {
  collections: Collection[];
  selected: string;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  busyAction: string;
  onCreate: SubmitEventHandler<HTMLFormElement>;
  onOpen: (id: string) => void;
  onManage: (action: "rename" | "delete", id: string) => void;
};

export function CollectionsPage({
  collections,
  selected,
  name,
  setName,
  busyAction,
  onCreate,
  onOpen,
  onManage,
}: Props) {
  const { t } = useI18n();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("Web RAG Studio")}</div>
          <h1>{t("Collections")}</h1>
          <p>{t("Organize documents into searchable knowledge spaces.")}</p>
        </div>
      </div>
      <section className="panel create-panel">
        <form className="inline-form" onSubmit={onCreate}>
          <label>
            <span>{t("New collection")}</span>
            <input
              placeholder={t("e.g. Product documentation")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
            />
          </label>
          <ActionButton
            className="button button-primary"
            busyAction={busyAction}
            action="create-collection"
          >
            {t("Create collection")}
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 10v6" />
              <path d="M9 13h6" />
              <path d="M3 19V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
            </svg>
          </ActionButton>
        </form>
      </section>
      <div className="collection-grid">
        {collections.map((c) => {
          const renaming = busyAction === `rename-${c.id}`,
            deleting = busyAction === `delete-collection-${c.id}`;
          return (
            <article
              className={`collection-card ${selected === c.id ? "collection-selected" : ""}`}
              key={c.id}
            >
              <button
                className="collection-card-main"
                disabled={!!busyAction}
                onClick={() => onOpen(c.id)}
              >
                <span className="collection-symbol large">▤</span>
                <strong>{c.name}</strong>
                <span>
                  {c.documents} {t("documents")}
                </span>
              </button>
              <div className="collection-card-actions">
                <button
                  className="text-button"
                  disabled={!!busyAction}
                  onClick={() => onOpen(c.id)}
                >
                  Open collection →
                </button>
                <div>
                  <button
                    className="icon-button"
                    disabled={!!busyAction}
                    aria-label={`${t("Rename collection")} ${c.name}`}
                    aria-busy={renaming}
                    onClick={() => onManage("rename", c.id)}
                  >
                    {renaming ? <span className="button-spinner" /> : "✎"}
                  </button>
                  <button
                    className="icon-button danger"
                    disabled={!!busyAction}
                    aria-label={`${t("Delete collection")} ${c.name}`}
                    aria-busy={deleting}
                    onClick={() => onManage("delete", c.id)}
                  >
                    {deleting ? <span className="button-spinner" /> : "×"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {collections.length === 0 && (
          <div className="empty wide">
            <h3>{t("No collections yet")}</h3>
            <p>{t("Create your first collection above.")}</p>
          </div>
        )}
      </div>
    </>
  );
}
