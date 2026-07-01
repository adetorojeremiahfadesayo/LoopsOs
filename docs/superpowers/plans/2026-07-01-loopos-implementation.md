# LoopOS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hackathon-ready LoopOS web app that demonstrates memory-backed loop playbooks, solo and team workspaces, Cognee-style document memory, role-based access, and audit history.

**Architecture:** Use a Vite React app with TypeScript and focused domain/service modules. State is persisted in browser localStorage for the MVP, with services separated so the Cognee adapter can be replaced by real API calls later. UI pages consume shared selectors/actions rather than embedding permission or audit logic directly in components.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, lucide-react, Vitest, Testing Library, localStorage persistence, mockable Cognee service adapter.

---

## File Structure

- `package.json`: project scripts and dependencies.
- `vite.config.ts`: Vite and Vitest configuration.
- `tsconfig.json`, `tsconfig.node.json`: TypeScript configuration.
- `index.html`: Vite entry HTML.
- `src/main.tsx`: React root.
- `src/App.tsx`: app shell, navigation, selected workspace/user state, page routing.
- `src/index.css`: global Tailwind and custom design tokens.
- `src/domain/types.ts`: shared domain types for users, workspaces, loops, memory sources, runs, and audit events.
- `src/domain/seed.ts`: deterministic demo data for solo and team workspaces.
- `src/services/storage.ts`: localStorage load/save/reset behavior.
- `src/services/permissions.ts`: role and memory-source access checks.
- `src/services/audit.ts`: audit event builder.
- `src/services/cognee.ts`: Cognee memory adapter with mock ingest/recall/improvement behavior and environment-driven real-mode placeholder.
- `src/services/loopActions.ts`: app actions that mutate state, call Cognee, and record audit events.
- `src/components/Layout.tsx`: shell, sidebar, top bar, workspace/user switchers.
- `src/components/StatCard.tsx`: compact metric cards.
- `src/components/SectionHeader.tsx`: reusable section header with optional action.
- `src/components/Badge.tsx`: status and role badges.
- `src/components/EmptyState.tsx`: reusable empty-state surface.
- `src/pages/Dashboard.tsx`: overview of loops, memory, runs, and activity.
- `src/pages/Templates.tsx`: template library and duplication action.
- `src/pages/LoopBuilder.tsx`: loop editing, improvement suggestions, generated plan, and run note capture.
- `src/pages/MemoryLibrary.tsx`: Markdown memory source creation, ingestion, filtering, and access policy display.
- `src/pages/TeamWorkspace.tsx`: members, shared docs, role/access controls, and audit log.
- `src/pages/RunHistory.tsx`: generated plans, retrieved memory, notes, and improvements.
- `src/test/setup.ts`: Testing Library setup.
- `src/services/permissions.test.ts`: permission behavior tests.
- `src/services/loopActions.test.ts`: action/audit/Cognee behavior tests.

## Task 1: Scaffold The App

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create project metadata and scripts**

Create `package.json` with:

```json
{
  "name": "loopos",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "lucide-react": "^0.468.0",
    "vite": "^6.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Add Vite, TypeScript, and test setup**

Create `vite.config.ts` with React and Vitest configured for jsdom:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts"
  }
});
```

- [ ] **Step 3: Create the initial React shell**

Create `src/main.tsx`, `src/App.tsx`, and `src/index.css` so `npm run dev` renders a "LoopOS" heading on a polished app background.

- [ ] **Step 4: Install dependencies and verify scaffold**

Run: `npm install`

Run: `npm run build`

Expected: build completes and creates `dist/`.

- [ ] **Step 5: Commit scaffold**

Run:

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json index.html src
git commit -m "feat: scaffold LoopOS app"
```

## Task 2: Add Domain Model, Seed Data, And Persistence

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/seed.ts`
- Create: `src/services/storage.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Define domain types**

Create typed models for `User`, `Workspace`, `LoopPlaybook`, `MemorySource`, `RunRecord`, `AuditEvent`, and `AppState`. Include role literals `owner`, `manager`, `editor`, and `viewer`.

- [ ] **Step 2: Create deterministic seed data**

Seed:

- Solo user: "Ada Solo"
- Team manager: "Maya Manager"
- Team developer: "Devon Developer"
- Team viewer: "Vera Viewer"
- Solo workspace
- Team workspace named "Loop Engineering Guild"
- Six templates matching the design spec
- Three team memory sources: project overview, coding standards, security rules
- One restricted security rules document visible to Maya and Devon
- One existing security review loop
- Three audit events

- [ ] **Step 3: Add localStorage persistence**

Implement `loadAppState`, `saveAppState`, and `resetAppState`. Invalid stored JSON must fall back to seed state.

- [ ] **Step 4: Wire persistence into App**

Load state on app startup and save when state changes. Add a "Reset demo" command in the app shell.

- [ ] **Step 5: Run verification**

Run: `npm run build`

Expected: TypeScript and Vite build pass.

- [ ] **Step 6: Commit domain and persistence**

Run:

```bash
git add src
git commit -m "feat: add LoopOS domain state"
```

## Task 3: Implement Permissions, Audit, And Cognee Services

**Files:**
- Create: `src/services/permissions.ts`
- Create: `src/services/audit.ts`
- Create: `src/services/cognee.ts`
- Create: `src/services/permissions.test.ts`

- [ ] **Step 1: Write permission tests**

Create tests asserting:

- Owners and managers can access restricted memory sources.
- Editors can access restricted memory only when explicitly included in `allowedUserIds`.
- Viewers cannot edit loops.
- Solo users can access solo workspace memory.

- [ ] **Step 2: Run tests and confirm they fail**

Run: `npm test -- src/services/permissions.test.ts`

Expected: test runner fails because `permissions.ts` is not implemented.

- [ ] **Step 3: Implement permissions service**

Implement:

- `getWorkspaceRole(state, workspaceId, userId)`
- `canViewMemorySource(state, source, userId)`
- `canEditLoop(state, loop, userId)`
- `canManageWorkspace(state, workspaceId, userId)`

- [ ] **Step 4: Implement audit service**

Implement `createAuditEvent` that accepts actor, action, target type, target name, and optional before/after summaries.

- [ ] **Step 5: Implement Cognee mock adapter**

Implement:

- `ingestMemorySource(source)`
- `recallForLoop(loop, allowedSources)`
- `suggestLoopImprovements(loop, recalledSources, runs)`
- `storeRunNotes(run)`

The mock adapter must return deterministic, human-readable results that mention Cognee so the demo makes the memory integration visible.

- [ ] **Step 6: Run tests and build**

Run: `npm test`

Run: `npm run build`

Expected: tests and build pass.

- [ ] **Step 7: Commit services**

Run:

```bash
git add src/services
git commit -m "feat: add permission audit and memory services"
```

## Task 4: Implement App Actions

**Files:**
- Create: `src/services/loopActions.ts`
- Create: `src/services/loopActions.test.ts`

- [ ] **Step 1: Write action tests**

Create tests asserting:

- Duplicating a template creates a workspace loop and audit event.
- Ingesting a memory source updates status and creates an audit event.
- Restricting a memory source changes access policy and creates an audit event.
- Improving a loop uses only memory sources visible to the current user.
- Completing a run stores run notes and appends an audit event.

- [ ] **Step 2: Run tests and confirm they fail**

Run: `npm test -- src/services/loopActions.test.ts`

Expected: test runner fails because `loopActions.ts` is not implemented.

- [ ] **Step 3: Implement action service**

Implement pure async functions that accept `AppState` and return the next `AppState` plus user-facing result data:

- `duplicateTemplate`
- `createMemorySource`
- `ingestMemory`
- `restrictMemorySource`
- `updateLoop`
- `improveLoop`
- `completeRun`

- [ ] **Step 4: Run tests and build**

Run: `npm test`

Run: `npm run build`

Expected: tests and build pass.

- [ ] **Step 5: Commit actions**

Run:

```bash
git add src/services
git commit -m "feat: add LoopOS state actions"
```

## Task 5: Build Shared UI Shell And Dashboard

**Files:**
- Create: `src/components/Layout.tsx`
- Create: `src/components/StatCard.tsx`
- Create: `src/components/SectionHeader.tsx`
- Create: `src/components/Badge.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `src/pages/Dashboard.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Build reusable UI components**

Create focused components for layout, badges, cards, section headers, and empty states.

- [ ] **Step 2: Build app navigation**

Navigation items:

- Dashboard
- Loop Builder
- Templates
- Memory
- Team
- Runs

Include workspace and user switchers in the top bar.

- [ ] **Step 3: Build dashboard page**

Dashboard shows:

- Count of loops, memory sources, runs, and audit events
- Recent loops
- Recent memory sources
- Recent audit events
- A highlighted "Cognee memory signal" panel explaining what context is ready to recall

- [ ] **Step 4: Verify UI**

Run: `npm run build`

Expected: build passes.

- [ ] **Step 5: Commit shell and dashboard**

Run:

```bash
git add src
git commit -m "feat: build LoopOS dashboard"
```

## Task 6: Build Templates, Memory Library, And Team Workspace

**Files:**
- Create: `src/pages/Templates.tsx`
- Create: `src/pages/MemoryLibrary.tsx`
- Create: `src/pages/TeamWorkspace.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Build Template Library**

Show six templates with goal, steps, validation checks, and duplicate action. Duplicating a template creates an audit event and moves the user to the copied loop.

- [ ] **Step 2: Build Memory Library**

Provide a form for title, type, body, and access policy. Show memory cards with ingestion status, access status, and an ingest action.

- [ ] **Step 3: Build Team Workspace**

Show shared loops, shared docs, members, role badges, a manager-only access control for the security rules doc, and audit log.

- [ ] **Step 4: Verify UI**

Run: `npm test`

Run: `npm run build`

Expected: tests and build pass.

- [ ] **Step 5: Commit workspace pages**

Run:

```bash
git add src
git commit -m "feat: add templates memory and team workspace"
```

## Task 7: Build Loop Builder And Run History

**Files:**
- Create: `src/pages/LoopBuilder.tsx`
- Create: `src/pages/RunHistory.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Build Loop Builder**

Support selecting a loop, editing goal, steps, validation checks, memory rules, and output format. Add "Improve with Cognee memory" and "Save run notes" actions.

- [ ] **Step 2: Build generated plan panel**

Show recalled memory titles, generated plan text, and improvement suggestions.

- [ ] **Step 3: Build Run History**

Show previous run records with loop name, recalled memory, generated plan, outcome notes, suggestions, and timestamp.

- [ ] **Step 4: Verify UI**

Run: `npm test`

Run: `npm run build`

Expected: tests and build pass.

- [ ] **Step 5: Commit builder and runs**

Run:

```bash
git add src
git commit -m "feat: add loop builder and run history"
```

## Task 8: Polish, Browser QA, And Demo Readiness

**Files:**
- Modify: `src/index.css`
- Modify: relevant page/component files found during QA
- Create: `README.md`

- [ ] **Step 1: Add README**

Document:

- What LoopOS is
- Hackathon positioning
- Local setup commands
- Cognee integration notes
- Demo script

- [ ] **Step 2: Run full verification**

Run: `npm test`

Run: `npm run build`

Expected: tests and build pass.

- [ ] **Step 3: Start local dev server**

Run: `npm run dev`

Expected: Vite prints a localhost URL.

- [ ] **Step 4: Browser QA**

Verify:

- Dashboard is readable at desktop and mobile widths.
- Template duplication works.
- Memory creation and ingestion work.
- Manager can restrict a memory source.
- Developer recall does not include restricted docs unless allowed.
- Audit log updates after edits.
- Loop improvement produces visible Cognee-backed suggestions.
- Run notes appear in Run History.

- [ ] **Step 5: Commit final polish**

Run:

```bash
git add README.md src
git commit -m "chore: polish LoopOS demo"
```

## Self-Review

Spec coverage:

- Structured loop playbooks are covered by Tasks 2, 4, and 7.
- Cognee-backed memory ingestion and recall are covered by Tasks 3, 4, 6, and 7.
- Solo and team workspaces are covered by Tasks 2, 5, and 6.
- Restricted team docs and role-based permissions are covered by Tasks 3, 4, and 6.
- Audit history is covered by Tasks 3, 4, 5, and 6.
- Demo readiness is covered by Task 8.

Placeholder scan:

- The plan avoids undefined follow-up work and uses concrete files, commands, and expected verification.

Type consistency:

- Domain names are consistent across service and page tasks: `LoopPlaybook`, `MemorySource`, `RunRecord`, `AuditEvent`, and `AppState`.
