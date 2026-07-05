# User Directed Loop Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user improvement prompt to Loop Builder so the Improve Loop action applies a visible user suggestion and the Improvement Report explains it.

**Architecture:** Keep the feature in the existing Loop Builder flow. `LoopBuilder` owns the textarea and demo-fill state, `App` passes the suggestion into `improveLoop`, `loopActions` forwards it to `suggestLoopImprovements`, and `ImprovementReport` renders the user request next to Cognee recall and generated plan details.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, existing LoopOS service layer.

---

### Task 1: Add Improvement Prompt UI

**Files:**
- Modify: `src/pages/LoopBuilder.tsx`
- Test: `src/pages/LoopBuilder.test.tsx`

- [ ] **Step 1: Write the failing test**

Add a test that renders `LoopBuilder`, clicks `Use demo suggestion`, verifies the textarea is filled, clicks `Improve Loop`, and asserts `onRunAndRecallLoop` receives the suggestion.

- [ ] **Step 2: Run the focused test**

Run: `npm test -- LoopBuilder`

Expected: FAIL because the button, textarea, and submitted suggestion do not exist yet.

- [ ] **Step 3: Implement the prompt panel**

Add `improvementPrompt` state, a textarea before the lifecycle strip/action bar, a `Use demo suggestion` button, and rename the main command to `Improve Loop`.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- LoopBuilder`

Expected: PASS.

### Task 2: Thread Suggestion Through Improvement Logic

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/services/loopActions.ts`
- Modify: `src/services/cognee.ts`
- Test: `src/services/loopActions.test.ts`

- [ ] **Step 1: Write the failing service test**

Add a test that calls `improveLoop` with `improvementPrompt` and expects the returned improvement to include `userRequest`.

- [ ] **Step 2: Run the service test**

Run: `npm test -- src/services/loopActions.test.ts`

Expected: FAIL because the improvement result does not include the user request.

- [ ] **Step 3: Implement data flow**

Update function signatures so `onRunAndRecallLoop(loopId, patch, improvementPrompt)` calls `improveLoop(..., improvementPrompt)`, and `suggestLoopImprovements` includes `userRequest` plus prompt-aware plan/suggestions.

- [ ] **Step 4: Run service tests**

Run: `npm test -- src/services/loopActions.test.ts`

Expected: PASS.

### Task 3: Make Improvement Report Explain The User Request

**Files:**
- Modify: `src/components/ImprovementReport.tsx`
- Test: `src/pages/LoopBuilder.test.tsx`

- [ ] **Step 1: Extend UI test**

Render a `lastImprovement` with `userRequest` and assert the report shows `User requested` and the request text.

- [ ] **Step 2: Implement report card**

Render a compact card in `ImprovementReport` showing the user request before the memory/plan/suggestions cards.

- [ ] **Step 3: Verify all checks**

Run:

```bash
npm test
npm run build
```

Expected: 73+ tests pass and production build passes.
