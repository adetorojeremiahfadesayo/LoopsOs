# LoopOS Cognee Demo Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real Cognee HTTP bridge, a sharper hackathon demo surface, and runnable deployment instructions while preserving the current local demo fallback.

**Architecture:** The browser app calls local `/api/cognee/*` endpoints instead of calling Cognee directly. A small Node HTTP server proxies to Cognee Cloud or a local Cognee REST server, derives one Cognee dataset per LoopOS memory source, and fails gracefully so the frontend can keep using the deterministic demo adapter.

**Tech Stack:** React, Vite, TypeScript, Vitest, Node built-in HTTP server, Cognee HTTP API.

---

### Task 1: Cognee HTTP Bridge

**Files:**
- Create: `server/cogneeClient.js`
- Create: `server/index.js`
- Create: `server/cogneeClient.test.js`
- Modify: `vite.config.ts`
- Modify: `package.json`

- [x] Write failing tests for dataset naming, auth headers, remember, recall, and run-note storage.
- [x] Implement the Node Cognee client with injectable `fetch`.
- [x] Add HTTP routes for status, ingest, recall, and store-run.
- [x] Proxy `/api` from Vite to the backend server.
- [x] Add `dev:api` and `dev:full` scripts.
- [x] Run server tests and full test suite.

### Task 2: Frontend Cognee Adapter

**Files:**
- Create: `src/services/cognee.test.ts`
- Modify: `src/services/cognee.ts`
- Modify: `src/services/loopActions.test.ts`

- [x] Write failing frontend tests for live backend success and fallback behavior.
- [x] Update the Cognee service to call `/api/cognee/*` first.
- [x] Preserve current deterministic fallback messages when the backend is missing or Cognee is unavailable.
- [x] Expose status metadata for the UI.
- [x] Run frontend service and loop action tests.

### Task 3: Hackathon Demo Polish

**Files:**
- Create: `src/pages/DemoMode.tsx`
- Modify: `src/components/Layout.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/App.tsx`

- [x] Add a Demo page with pitch, live walkthrough, judging proof, and run commands.
- [x] Add Cognee connection status to Dashboard and Demo page.
- [x] Keep mobile nav usable with the additional page.
- [x] Run browser QA on dashboard, memory, builder, and demo page.

### Task 4: Deployment Readiness

**Files:**
- Create: `.env.example`
- Create: `docs/DEPLOYMENT.md`
- Create: `scripts/dev-full.js`
- Modify: `README.md`
- Modify: `.gitignore`

- [x] Document local Cognee, Cognee Cloud, demo fallback, and deploy steps.
- [x] Add a script that starts backend and Vite together.
- [x] Update README with the exact commands the user should run.
- [x] Run tests, build, and browser verification.
