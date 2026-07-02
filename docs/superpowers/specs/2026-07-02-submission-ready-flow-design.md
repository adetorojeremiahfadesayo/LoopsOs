# Submission-Ready Flow Design

## Goal

Make LoopOS feel ready for hackathon judging by turning the existing MVP into a guided, end-to-end memory workflow: connect to Cognee when available, edit governed docs, export loop playbooks, and walk judges through the strongest demo path.

## Scope

This slice includes four features:

1. **Cognee live-mode hardening**: the bridge recognizes current Cognee REST API endpoints and reports a precise connection state.
2. **Docs editor**: team memory sources become editable shared docs with access controls and audit history.
3. **Loop export**: workspace loops can be exported as Markdown, JSON, and prompt templates.
4. **Guided demo flow**: the Demo page becomes an actionable checklist with buttons that route to each proof point.

It does not add accounts, a database, billing, real-time collaboration, or hosted deployment automation. The app remains a localStorage-backed hackathon demo with a backend bridge for Cognee.

## Architecture

### Cognee Bridge

The Node bridge keeps secrets out of the browser and speaks to Cognee through a version-aware adapter. It checks `/health`, `/api/v1/datasets`, and the current ingestion surface before claiming live mode.

For ingestion, the bridge tries the current documented workflow first:

- `POST /api/v1/add`
- `POST /api/v1/cognify`
- `POST /api/v1/search`

If a server supports `POST /api/v1/remember`, the bridge can use that as a compatibility path. If neither path works, it returns a structured fallback reason instead of failing the UI.

### Docs Editor

The Docs page uses existing `MemorySource` records as the document model. A user can view docs that pass `canViewMemorySource`. Owners, managers, and editors can edit docs they can view. Managers and owners can restrict access.

Saving a doc:

- updates `body`, `title`, `type`, `updatedAt`
- resets `ingestionStatus` to `draft` when the body changes
- appends a `memory.edited` audit event

Re-ingesting a doc uses the existing Cognee ingestion action and appends `memory.ingested`.

### Loop Export

Loop Builder gets an export panel for the selected loop. Exports are generated client-side from the selected `LoopPlaybook`:

- Markdown playbook for humans and README-style sharing
- JSON for tooling
- Prompt template for copying into an agent or assistant

The UI supports copy-to-clipboard and download. If clipboard access fails, the export text remains visible.

### Guided Demo Flow

The Demo page becomes a seven-step checklist:

1. Duplicate or open a workspace loop.
2. Open Docs and edit a governed source.
3. Ingest that doc into Cognee.
4. Improve a loop with Cognee recall.
5. Switch to viewer mode and prove restricted memory is excluded.
6. Export the loop.
7. Save run notes.

Each step has a button that navigates to the relevant page. The page also displays completion signals derived from state, not hardcoded claims.

## Data Flow

The browser owns local application state. Service actions mutate immutable `AppState` snapshots and write them to localStorage through the existing persistence layer.

Cognee operations flow through:

`UI action -> loopActions/cognee service -> /api/cognee/* -> server/cogneeClient.js -> Cognee REST API`

Permission filtering remains in LoopOS before recall. The bridge receives only allowed sources for the active user.

## Error Handling

- Cognee status never blocks the app. It returns `live`, `auth-needed`, `api-mismatch`, or `demo-fallback`.
- Ingest failures fall back to deterministic demo mode and keep audit wording honest.
- Docs save failures show a toast and leave state unchanged.
- Export copy failures keep the generated text visible so the user can select it manually.

## Testing

Use TDD for service and bridge behavior:

- Cognee client selects current API workflow and fallback paths.
- Docs edit action resets ingestion status and records audit events.
- Export helpers produce deterministic Markdown, JSON, and prompt output.
- Demo checklist derives step completion from real state.

Browser QA must cover:

- Dashboard connection status.
- Docs edit and re-ingest flow.
- Loop export copy/download visibility.
- Guided Demo navigation.
- Viewer recall still excludes restricted memory.
- Mobile Demo/Docs navigation has no horizontal page overflow.
