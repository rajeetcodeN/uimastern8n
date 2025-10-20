# NOSTA AI – Beginner Guide (LEARN.md)

This guide explains the entire project as if you’re new to React/TypeScript and the stack used here. By the end, you’ll understand how to run it, where to change settings, and how the main features work.

---

## 1) What this app does

- A chat UI where users can ask questions.
- It fetches document metadata from Supabase and shows a right-side document viewer.
- When you send a message, the app can call an n8n webhook that returns an AI-generated response.
- All configuration can be done via `.env` or the Settings modal.

Keywords you’ll see:
- “RAG” = Retrieval-Augmented Generation (use documents to improve AI answers).
- “Supabase” = a hosted Postgres database + APIs.
- “n8n” = workflow automation tool. We post messages to an n8n webhook URL and read its JSON reply.

---

## 2) Tech stack at a glance

- React 18 + TypeScript (UI)
- Vite (dev server and build tool)
- Tailwind CSS + Radix UI (styling and components)
- Supabase JS SDK (database access)
- Simple `fetch` to call your n8n webhook

---

## 3) Project layout

```
./
├─ index.html                 # Page shell, title/meta tags
├─ env.example                # Template for .env configuration
├─ .gitignore                 # Keeps secrets and build output out of Git
├─ src/
│  ├─ main.tsx               # App bootstrap (React root)
│  ├─ App.tsx                # Top-level routing/layout
│  ├─ pages/
│  │  ├─ RagChat.tsx         # Main chat page and layout
│  │  ├─ DataSourceManagement.tsx
│  │  └─ Index.tsx           # Home/landing
│  ├─ components/            # Reusable UI pieces (chat UI, sidebar, viewer, settings)
│  │  ├─ ChatInterface.tsx
│  │  ├─ ChatSidebar.tsx
│  │  ├─ DocumentViewer.tsx
│  │  └─ SettingsModal.tsx
│  ├─ contexts/              # React Context (chat/session state)
│  │  └─ ChatContext.tsx
│  ├─ lib/                   # Integrations and utils
│  │  ├─ supabase.ts         # Supabase client + queries (table reads)
│  │  ├─ webhook.ts          # n8n webhook POST helper
│  │  ├─ session.ts          # Session ID & activity management
│  │  └─ utils.ts            # General helpers
│  └─ components/ui/         # Design system primitives
├─ HELP.md                   # How to change URLs/keys quickly
├─ LEARN.md                  # This file
├─ README.md                 # Features and quick start
└─ supabase-setup.sql        # Example schema (original table structure)
```

---

## 4) Configuration and environment variables

Environment variables live in a file named `.env` at the project root. We never commit `.env` to GitHub. Start by copying:

```bash
cp env.example .env
```

Then fill in values. Important variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_TABLE_NAME=dbtai_kb
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/endpoint
```

Notes:
- All Vite-exposed environment variables must start with `VITE_`.
- `VITE_SUPABASE_TABLE_NAME` lets you change the table without editing code.

---

## 5) Running the app locally

Prerequisites: Node 18+ and npm.

```bash
npm install
npm run dev
```

Vite prints a Local URL like `http://localhost:8081/`. Open it in your browser.

Common PowerShell tip on Windows: just run `npm run dev` (no need to pipe output with `| cat`).

---

## 6) How data flows (big picture)

1) You open the app → `src/pages/RagChat.tsx` renders the 3-column layout.
2) The left sidebar (`ChatSidebar.tsx`) lists conversations and provides a Settings button.
3) The middle chat panel (`ChatInterface.tsx`) lets you send a message.
4) When you send, we call `sendToWebhook()` in `src/lib/webhook.ts`, which POSTs `{ chatInput, sessionId, timestamp }` to the `VITE_N8N_WEBHOOK_URL`.
5) n8n replies with JSON. We extract a message string and show it in the chat.
6) On the right, `DocumentViewer.tsx` shows details of the selected document. The list of documents comes from Supabase via functions in `src/lib/supabase.ts`.

---

## 7) Supabase integration

Code: `src/lib/supabase.ts`

- Client is initialized from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The table name comes from `VITE_SUPABASE_TABLE_NAME` (defaults existed before; now configurable).
- Main reads:
  - `fetchDocuments()` → `.select('*').order('last_modified_date', { ascending: false })`
  - `searchDocumentsByContent(text)` → matches `title/content/summary`
  - `searchDocumentsByExactMatch(text)` → tries exact-ish match on title then falls back to content search

Table Requirements (for the provided UI):
- Columns used: `id`, `title`, `url`, `last_modified_date`, `size`, `type`, `content`, `summary`.
- Your actual table is `dbtai_kb`. Make sure column names are compatible. If they differ, adjust the queries or the UI accordingly.

`supabase-setup.sql` shows an example schema used originally (named `n8n_metadata`). Use it as a reference if you need to align columns.

---

## 8) n8n webhook integration

Code: `src/lib/webhook.ts`

- Sends POST to your `VITE_N8N_WEBHOOK_URL` with JSON payload:
  ```json
  {
    "chatInput": "Hello",
    "sessionId": "uuid",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
  ```
- We expect a JSON response. The helper tries multiple fields (`response`, `message`, `content`, `text`, etc.).
- If your n8n returns a different structure, adapt `actualResponse` extraction.

Tip: You can change the webhook URL quickly from the Settings modal in the app.

---

## 9) UI pieces you’ll touch most

- `SettingsModal.tsx`: update the n8n URL at runtime.
- `ChatSidebar.tsx`: app title (“NOSTA AI”), conversations list, and Load Documents button.
- `DocumentViewer.tsx`: iframe/preview of document URL + metadata panel.
- `RagChat.tsx`: the main page scaffold and header title (also “NOSTA MASTER AI AGENT”).

---

## 10) Troubleshooting

- Webhook shows no response → verify `VITE_N8N_WEBHOOK_URL` or use the Settings modal. Test the endpoint directly in your browser or Postman.
- No documents show → check `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and that your `dbtai_kb` table exists with expected columns/data.
- Google Drive previews say “You need access” → either make the Drive file public (Anyone with the link) or store a public URL (e.g., Supabase Storage) or use Drive preview links like `https://drive.google.com/file/d/FILE_ID/preview`.
- Changes in `.env` don’t appear → stop and restart `npm run dev`.

---

## 11) Deploying

Any static host that supports Vite builds will work (Vercel, Netlify, etc.).

1) Set project environment variables in the host dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_TABLE_NAME`
   - `VITE_N8N_WEBHOOK_URL`
2) Build locally to test:
   ```bash
   npm run build
   npm run preview
   ```
3) Deploy your `dist/` (or connect repo to your host and let it build).

---

## 12) GitHub hygiene

- `.gitignore` excludes `node_modules`, `dist`, and `.env`.
- Commit `env.example` with placeholder values (never real keys).
- Good first commit message: `chore: initialize NOSTA AI with env and docs`.

Initialize repo (optional):
```bash
git init
git add .
git commit -m "chore: initial commit"
```

---

## 13) Common tasks cheat sheet

- Install deps: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Preview production build: `npm run preview`
- Lint: `npm run lint`

---

## 14) Where to change names/branding

- Page title/OG/Twitter cards: `index.html`
- Sidebar header and main page header: `src/components/ChatSidebar.tsx` and `src/pages/RagChat.tsx`
- Docs: `README.md`, `HELP.md`, and this `LEARN.md`

---

## 15) Next steps & ideas

- Add authentication (Supabase Auth) to secure the app.
- Write data (conversations) to Supabase instead of only reading documents.
- Use embeddings + vector search for higher quality answers.
- Add file upload to push new docs to Supabase Storage and index them.

You’re set! If something is unclear, search inside `src/` for the file names above and read the code where those behaviors live.
