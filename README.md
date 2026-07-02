# LoopOS

LoopOS is a memory-powered loop engineering platform for solo developers and AI teams. It helps users create, share, govern, and improve reusable AI workflow loops with Cognee-style durable memory.

## Hackathon Positioning

LoopOS is built for the WeMakeDevs Cognee hackathon theme: AI that does not forget. The app demonstrates:

- Structured loop playbooks for repeatable AI workflows
- Markdown memory sources that can be ingested into Cognee
- Governed Docs editing with access controls and audit history
- Permission-aware recall for team workspaces
- Role-based access for owners, managers, editors, and viewers
- Markdown, JSON, and prompt-template exports for loop playbooks
- Audit history for shared docs, shared loops, and runs
- Run notes that feed future loop improvements
- An actionable Demo checklist for hackathon judging

## Local Setup

```bash
npm install
npm run dev
```

## What You Need To Run

For the full hackathon demo with the LoopOS API bridge:

```powershell
npm install
Copy-Item .env.example .env
npm run dev:full
```

Run those commands from the project root, then open `http://127.0.0.1:5173`.

If Cognee is not running, LoopOS uses demo fallback mode. To connect real Cognee, edit `.env`:

```dotenv
COGNEE_BASE_URL=http://127.0.0.1:8000
COGNEE_AUTH_MODE=none
```

For Cognee Cloud:

```dotenv
COGNEE_BASE_URL=https://api.cognee.ai
COGNEE_AUTH_MODE=api-key
COGNEE_API_KEY=your-cognee-cloud-api-key
```

See `docs/DEPLOYMENT.md` for local Docker and hosted deployment notes.

For verification:

```bash
npm test
npm run build
```

## Cognee Integration Notes

The current MVP includes a Cognee bridge with a deterministic fallback. The browser app calls `/api/cognee/*`, and the local Node bridge proxies those calls to Cognee's REST API:

- `ingestMemorySource(source)`
- `recallForLoop(loop, allowedSources)`
- `suggestLoopImprovements(loop, recalledSources, runs)`
- `storeRunNotes(run)`

The bridge uses Cognee v1 endpoints when available:

- `POST /api/v1/add`
- `POST /api/v1/cognify`
- `POST /api/v1/search`
- `POST /api/v1/remember` as a compatibility fallback

The important product behavior is enforced before recall: LoopOS filters visible memory sources, then the bridge queries only the Cognee datasets for those allowed sources.

## Demo Script

1. Open the Demo page and follow the checklist.
2. Open Templates and duplicate the Security Review Loop if you want a fresh loop.
3. Open Docs, edit a shared Markdown doc, and save it to create an audit event.
4. Re-ingest the changed doc from Docs or Memory so Cognee can recall it.
5. Open Loop Builder and click `Improve with Cognee`.
6. Switch to Vera Viewer from Demo and improve again to show restricted security memory is excluded.
7. Use the Loop Builder export panel to copy or download Markdown, JSON, or prompt-template output.
8. Save run notes from Loop Builder and open Runs to see the memory-backed run record.
