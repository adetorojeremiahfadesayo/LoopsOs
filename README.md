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

For verification:

```bash
npm test
npm run build
```

## Cognee Integration Notes

The current MVP includes a mockable Cognee service in `src/services/cognee.ts`. It exposes the integration boundary the real Cognee adapter should satisfy:

- `ingestMemorySource(source)`
- `recallForLoop(loop, allowedSources)`
- `suggestLoopImprovements(loop, recalledSources, runs)`
- `storeRunNotes(run)`

The important product behavior is already enforced locally: recall only receives memory sources visible to the active user.

## Demo Script

1. Open the team workspace, `Loop Engineering Guild`.
2. Review shared docs: project overview, coding standards, and restricted security rules.
3. Open Templates and duplicate the Security Review Loop.
4. Open Loop Builder and click `Improve with Cognee`.
5. Switch users to Vera Viewer and improve the loop again to show restricted security memory is excluded.
6. Return as Maya Manager, open Team, and restrict or grant access to a memory source.
7. Check the audit log to see the access change.
8. Save run notes from Loop Builder and open Runs to see the memory-backed run record.
