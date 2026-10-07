# Contributing to WebRAGStudio

Thanks for helping maintain WebRAGStudio. This guide is for contributors and maintainers preparing a change or release.

## Project boundaries

- Keep the MVP as one Next.js App Router application with TypeScript and server-side route handlers.
- Keep SQLite access and provider credentials on the server. Never return or log API keys.
- Keep ingestion synchronous unless a concrete need justifies a background worker.
- Preserve the end-to-end path: parse input, chunk text, embed chunks, persist them, retrieve relevant chunks, and stream an answer with the retrieved sources.
- Prefer a small, direct change over introducing a new abstraction or dependency.
- Do not claim a provider, format, migration, or feature is supported until the implementation works.

## Local setup

1. Install Node.js 22.5 or newer and pnpm.
2. Run `pnpm install`.
3. Copy `.env.example` to `.env.local` if you want to configure the app through environment variables.
4. Run `pnpm dev` and open <http://localhost:3000>.

The app creates `data/rag-studio.sqlite` and `data/settings.key` as needed. Keep local databases, keys, uploaded files, and environment files out of commits.

## Where things live

- `src/app`: pages and Next.js Route Handlers.
- `src/components`: page and feature UI.
- `src/hooks`: client-side controllers for page actions.
- `src/lib/db.ts`: SQLite connection and schema initialization.
- `src/lib/rag.ts`: chunking, embeddings, ingestion, and cosine retrieval.
- `src/lib/providers.ts` and `src/lib/settings/`: model connections, configuration, and secret handling.
- `src/i18n`: UI translations.

The schema is initialized in code; `pnpm db:push` is currently a compatibility stub. When changing schema, account for existing local databases and add a safe initialization migration in `src/lib/db.ts`.

## Change workflow

1. Read this guide and `AGENTS.md` before changing the architecture.
2. Make a focused change and update affected translations where user-facing text is added or changed.
3. Update the README or this guide if setup, supported behavior, data handling, or operations change.
4. Review generated files and secrets before committing. Keep `pnpm-lock.yaml` in sync when dependencies change; do not add a second lockfile.
5. Run the checks relevant to the change:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

   `pnpm test` currently has no project test cases. For changes to ingestion or chat, use the manual checks below as well.

## Manual smoke check

With a working chat and embedding provider configured:

1. Create a collection, rename it, open it, then delete a disposable collection.
2. Add a text document and a small TXT or Markdown file; confirm both finish as `READY` and appear in the collection.
3. Ask a question answered by the document. Confirm the answer streams and the source title shown is one of the retrieved documents.
4. Ask a question unrelated to the indexed content and check that the assistant acknowledges missing context.
5. Reload the app and confirm collection, document, and chat history persistence.
6. Delete the disposable documents and collection.

For PDF/DOCX parser changes, include sample documents in local manual verification; do not commit private or copyrighted source material.

## Pull requests

Describe the behavior changed, the reason, and how you verified it. Include screenshots only when they clarify a UI change. Call out provider-specific requirements or local data migration implications. Do not include secrets, real user documents, database files, or generated build output.

## Release checklist

- [ ] README and `.env.example` match the shipped behavior.
- [ ] No `.env*` secrets, database files, encryption keys, uploads, `node_modules`, or `.next` output are staged.
- [ ] Only the intended package manager lockfile is present and current.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` complete successfully (note that the test script currently contains no tests).
- [ ] Manual RAG smoke check passes with a configured provider.
- [ ] Breaking data/configuration changes and backup implications are documented.
- [ ] GitHub repository has a license, contribution guide, and a release description that does not promise planned features as implemented.
