import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

type Collection = { id: string; name: string; documents: number };
type Options = {
  collections: Collection[];
  selected: string;
  setSelected: Dispatch<SetStateAction<string>>;
  reload: () => Promise<void>;
  setBusyAction: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  reportError: (message: string) => void;
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, initialValue: string) => Promise<string | null>;
};

export function useCollectionActions({
  collections,
  selected,
  setSelected,
  reload,
  setBusyAction,
  setMessage,
  reportError,
  confirm,
  prompt,
}: Options) {
  const [name, setName] = useState("");

  async function createCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("create-collection");
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        setName("");
        await reload();
        setMessage("Collection created.");
      } else {
        reportError("Could not create collection");
      }
    } catch {
      reportError("Could not create collection");
    } finally {
      setBusyAction("");
    }
  }

  async function manageCollection(action: "rename" | "delete", id = selected) {
    const current = collections.find((collection) => collection.id === id);
    if (!current) return;

    if (action === "rename") {
      const nextName = await prompt("Enter a new collection name.", current.name);
      if (!nextName?.trim()) return;
      setBusyAction(`rename-${id}`);
      try {
        const response = await fetch(`/api/collections/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nextName }),
        });
        if (!response.ok) reportError("Could not rename collection");
        else {
          await reload();
          setMessage("Collection renamed.");
        }
      } catch {
        reportError("Could not rename collection");
      } finally {
        setBusyAction("");
      }
    } else if (await confirm(`Delete ${current.name} and all its documents?`, "Delete collection?")) {
      setBusyAction(`delete-collection-${id}`);
      try {
        const response = await fetch(`/api/collections/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          if (id === selected) setSelected("");
          await reload();
          setMessage("Collection deleted.");
        } else {
          reportError("Could not delete collection");
        }
      } catch {
        reportError("Could not delete collection");
      } finally {
        setBusyAction("");
      }
    }
  }

  return { name, setName, createCollection, manageCollection };
}
