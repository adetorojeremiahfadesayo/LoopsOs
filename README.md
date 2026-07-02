# LoopOS

LoopOS is a memory-powered loop engineering platform for solo developers and AI teams. It helps users create, share, govern, and improve reusable AI workflow loops with Cognee-style durable memory.

## Hackathon Positioning

LoopOS is built for the WeMakeDevs Cognee hackathon theme: AI that does not forget. The app demonstrates:

- Structured loop playbooks for repeatable AI workflows
- Markdown memory sources that can be ingested into Cognee
- Permission-aware recall for team workspaces
- Role-based access for owners, managers, editors, and viewers
- Audit history for shared docs, shared loops, and runs
- Run notes that feed future loop improvements

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

Then open `http://127.0.0.1:5173`.

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

The important product behavior is enforced before recall: LoopOS filters visible memory sources, then the bridge queries only the Cognee datasets for those allowed sources.

## Demo Script

1. Open the team workspace, `Loop Engineering Guild`.
2. Review shared docs: project overview, coding standards, and restricted security rules.
3. Open Templates and duplicate the Security Review Loop.
4. Open Loop Builder and click `Improve with Cognee`.
5. Switch users to Vera Viewer and improve the loop again to show restricted security memory is excluded.
6. Return as Maya Manager, open Team, and restrict or grant access to a memory source.
7. Check the audit log to see the access change.
8. Save run notes from Loop Builder and open Runs to see the memory-backed run record.
