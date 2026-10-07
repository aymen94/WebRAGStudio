import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import type { DocumentRow } from "@/components/documents/document-list";

type Options = {
  selected: string;
  loadDocuments: () => Promise<void>;
  setBusyAction: Dispatch<SetStateAction<string>>;
  setMessage: Dispatch<SetStateAction<string>>;
  confirm: (message: string, title?: string) => Promise<boolean>;
};

export function useDocumentActions({
  selected,
  loadDocuments,
  setBusyAction,
  setMessage,
  confirm,
}: Options) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function uploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const files = Array.from(
      (form.elements.namedItem("file") as HTMLInputElement).files ?? [],
    );
    if (!files.length || !selected) return;

    setBusyAction("upload");
    let indexed = 0;
    const failures: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        setMessage(`Uploading and indexing ${index + 1}/${files.length}: ${file.name}…`);
        const payload = new FormData();
        payload.set("file", file);
        payload.set("collectionId", selected);
        try {
          const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: payload,
          });
          const data = await response.json();
          if (response.ok) indexed += 1;
          else failures.push(`${file.name}: ${data.error || "Upload failed"}`);
        } catch {
          failures.push(`${file.name}: Upload failed`);
        }
      }
      if (indexed) {
        form.reset();
        await loadDocuments();
      }
      setMessage(
        failures.length
          ? `Indexed ${indexed}/${files.length} files. ${failures.join("; ")}`
          : `Indexed ${indexed} ${indexed === 1 ? "file" : "files"}.`,
      );
    } finally {
      setBusyAction("");
    }
  }

  async function saveText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("save-text");
    setMessage("Indexing document…");
    try {
      const response = await fetch("/api/documents/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, collectionId: selected }),
      });
      const data = await response.json();
      setMessage(
        response.ok
          ? `Indexed ${data.chunks} chunks.`
          : data.error || "Indexing failed",
      );
      if (response.ok) {
        setTitle("");
        setContent("");
        await loadDocuments();
      }
    } catch {
      setMessage("Indexing failed. Please try again.");
    } finally {
      setBusyAction("");
    }
  }

  async function removeDocument(document: DocumentRow) {
    if (!(await confirm(`Remove ${document.title} and its indexed vectors?`, "Remove document?")))
      return;
    setBusyAction(`remove-document-${document.id}`);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await loadDocuments();
        setMessage("Document and vectors removed.");
      } else {
        setMessage(
          (await response.json()).error || "Could not remove document",
        );
      }
    } catch {
      setMessage("Could not remove document");
    } finally {
      setBusyAction("");
    }
  }

  return {
    title,
    setTitle,
    content,
    setContent,
    uploadFile,
    saveText,
    removeDocument,
  };
}
