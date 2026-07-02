# Submission-Ready Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a submission-ready LoopOS demo flow with hardened Cognee live detection, editable governed docs, loop exports, and a guided demo checklist.

**Architecture:** Extend existing service-action patterns. The backend Cognee client becomes API-shape aware; frontend state actions handle docs edits and exports; React pages compose the workflow without introducing routing dependencies.

**Tech Stack:** React, Vite, TypeScript, Vitest, Node HTTP bridge, Cognee REST API.

---

### Task 1: Cognee API Hardening

**Files:**
- Modify: `server/cogneeClient.js`
- Modify: `server/cogneeClient.test.js`
- Modify: `src/services/cognee.ts`
- Modify: `src/services/cognee.test.ts`
- Modify: `docs/DEPLOYMENT.md`

- [ ] Write failing tests for status modes `live`, `auth-needed`, `api-mismatch`, and `demo-fallback`.
- [ ] Write failing tests for current API ingestion using `add` then `cognify`.
- [ ] Implement API-shape detection and current API ingestion.
- [ ] Preserve `remember` compatibility when available.
- [ ] Surface mode and reason in frontend status.
- [ ] Update deployment docs with current endpoint expectations.

### Task 2: Governed Docs Editor

**Files:**
- Create: `src/pages/DocsEditor.tsx`
- Create: `src/pages/DocsEditor.test.tsx`
- Modify: `src/services/loopActions.ts`
- Modify: `src/services/loopActions.test.ts`
- Modify: `src/components/Layout.tsx`
- Modify: `src/App.tsx`

- [ ] Write failing action tests for editing a memory source.
- [ ] Implement `updateMemorySource`.
- [ ] Write failing page test for viewing, editing, restricting, and ingesting docs.
- [ ] Add Docs navigation and page wiring.
- [ ] Show permission-safe doc list and editor controls.

### Task 3: Loop Export

**Files:**
- Create: `src/services/exportLoop.ts`
- Create: `src/services/exportLoop.test.ts`
- Modify: `src/pages/LoopBuilder.tsx`

- [ ] Write failing tests for Markdown, JSON, and prompt-template export output.
- [ ] Implement deterministic export helpers.
- [ ] Add export panel to Loop Builder.
- [ ] Add copy and download actions with visible export text.

### Task 4: Guided Demo Flow

**Files:**
- Create: `src/services/demoProgress.ts`
- Create: `src/services/demoProgress.test.ts`
- Modify: `src/pages/DemoMode.tsx`
- Modify: `src/pages/DemoMode.test.tsx`
- Modify: `src/App.tsx`

- [ ] Write failing tests for derived demo checklist completion.
- [ ] Implement demo progress helper.
- [ ] Replace static Demo page steps with actionable checklist.
- [ ] Add navigation callbacks from Demo page to app pages.
- [ ] Include state-derived proof badges.

### Task 5: Verification

**Files:**
- Modify: `README.md`

- [ ] Update README demo script for Docs, Export, and Guided Demo.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run browser QA for Dashboard, Docs, Builder export, Demo guide, viewer permissions, and mobile navigation.
- [ ] Commit final implementation.
