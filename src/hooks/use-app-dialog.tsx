"use client";

import { useState } from "react";

type DialogState = {
  title: string;
  message: string;
  input?: string;
  confirmLabel: string;
  resolve: (value: string | null) => void;
};

export function useAppDialog() {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  function ask(title: string, message: string, options: { input?: string; confirmLabel?: string } = {}) {
    return new Promise<string | null>((resolve) => {
      setDialog({ title, message, input: options.input, confirmLabel: options.confirmLabel ?? "Continue", resolve });
    });
  }

  function close(value: string | null) {
    setDialog((current) => {
      current?.resolve(value);
      return null;
    });
  }

  const dialogElement = dialog ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) close(null); }}>
      <form className="w-full max-w-md rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="app-dialog-title" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); close(dialog.input === undefined ? "yes" : String(data.get("value") ?? "")); }}>
        <h2 id="app-dialog-title" className="m-0 text-lg font-semibold text-[var(--app-text)]">{dialog.title}</h2>
        <p className="my-3 text-sm text-[var(--app-muted)]">{dialog.message}</p>
        {dialog.input !== undefined && <input autoFocus name="value" defaultValue={dialog.input} className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-input)] px-3 py-2 text-[var(--app-text)] outline-none focus:border-[var(--theme-accent)]" />}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm text-[var(--app-text)] hover:bg-[var(--theme-accent-wash)]" onClick={() => close(null)}>Cancel</button>
          <button type="submit" className="rounded-lg bg-[var(--theme-accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90">{dialog.confirmLabel}</button>
        </div>
      </form>
    </div>
  ) : null;

  return {
    dialogElement,
    confirm: async (message: string, title = "Please confirm") => (await ask(title, message, { confirmLabel: "Delete" })) !== null,
    prompt: (message: string, initialValue: string) => ask("Rename collection", message, { input: initialValue, confirmLabel: "Save" }),
  };
}
