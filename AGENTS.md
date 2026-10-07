# WebRAGStudio maintenance instructions

This file guides future coding agents and maintainers. Keep it aligned with the implementation. The current application is an MVP; treat checked-in code as the source of truth when an older product plan conflicts with shipped behavior.

## Product and architecture

- WebRAGStudio is a self-hosted, single-user RAG application built with Next.js App Router, React, and TypeScript.
- Use Next.js Route Handlers for server APIs and keep provider credentials, SQLite access, parsing, indexing, and retrieval on the server.
- Persistence currently uses Node's built-in `node:sqlite` through `src/lib/db.ts`. Schema creation and small compatibility migrations live there. `pnpm db:push` is only a placeholder command.
- `src/lib/rag.ts` owns word-based chunking, embedding calls, synchronous ingestion, and cosine-similarity retrieval. Text and uploaded files must share this pipeline.
- `src/lib/providers.ts` uses the Vercel AI SDK OpenAI-compatible provider for chat and embeddings. Supported connections are OpenAI, Ollama, and compatible servers; do not claim native Anthropic, Azure, or Bedrock support unless adapters are implemented.
- Settings are stored locally. Provider keys are encrypted with the local key in `data/settings.key` or `SETTINGS_ENCRYPTION_KEY`. Never expose or log secrets.
- Keep the MVP small. No authentication, multi-tenancy, background infrastructure, or unnecessary framework layers.

## Working rules

- Before editing application code, read the relevant guide from `node_modules/next/dist/docs/` for this installed Next.js version. APIs and conventions may differ from prior Next.js versions.
- Inspect the existing route, component, and helper before adding a new one. Validate API inputs and return clear user-safe errors without stack traces or secrets.
- Treat uploaded files as untrusted input. Retain the current size limit and extension allowlist unless deliberately changed; sanitize displayed filenames and never execute uploaded content.
- When changing user-facing text, update all supported translations in `src/i18n/messages/` where practical.
- Keep README, `.env.example`, and `CONTRIBUTING.md` accurate whenever setup, supported formats/providers, storage, security, or operations change.
- Maintain the existing pnpm setup and `pnpm-lock.yaml`. Do not introduce a second lockfile.
- Do not add dependencies or abstractions without a concrete need.

## Project map

- `src/app`: pages and Route Handlers.
- `src/components`: UI components grouped by feature.
- `src/hooks`: client-side controllers.
- `src/lib/db.ts`: SQLite schema and database connection.
- `src/lib/rag.ts`: chunking, ingestion, embeddings, and retrieval.
- `src/lib/providers.ts`, `src/lib/settings/`: model configuration and secret management.
- `src/i18n`: translations.
- `data/`: runtime database and encryption key; must stay untracked.

## Development and release checks

Use Node.js 22.5 or newer and pnpm. Typical commands:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The test script uses Node's built-in test runner, but the repository currently has no automated test cases. Do not report test coverage based only on an empty successful run. For ingestion or chat changes, verify with a configured provider: create a collection, index text and a supported file, ask a question, confirm streaming and a retrieved source, reload to check persistence, then remove disposable data.

Before release, review `CONTRIBUTING.md`'s release checklist and ensure no environment files, API keys, databases, encryption keys, uploads, or generated output are staged. Document local database migration and backup implications for schema or secret handling changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
