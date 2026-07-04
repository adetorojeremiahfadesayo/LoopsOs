# Supervisor Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a LoopOS Supervisor page that monitors one or two agent loops, summarizes logs and activity, flags guardrail risks, and highlights approval gates for high-risk actions.

**Architecture:** Keep the first version frontend-only and derived from existing `AppState` data: loops, runs, audit events, memory sources, and users. Add a focused page component plus navigation wiring; avoid new persistence until real external log ingestion exists.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Tailwind CSS, lucide-react.

---

### Task 1: Supervisor Page Behavior

**Files:**
- Create: `src/pages/SupervisorPage.tsx`
- Test: `src/pages/SupervisorPage.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { seedState } from "../domain/seed";
import { SupervisorPage } from "./SupervisorPage";

describe("SupervisorPage", () => {
  it("shows a senior engineer supervisor overview for two agents", () => {
    const state = seedState();
    const workspace = state.workspaces.find((item) => item.kind === "solo")!;

    render(<SupervisorPage state={state} workspace={workspace} />);

    expect(screen.getByRole("heading", { name: "Supervisor" })).toBeInTheDocument();
    expect(screen.getByText("Senior AI engineer oversight for active agent loops.")).toBeInTheDocument();
    expect(screen.getByText("Codex")).toBeInTheDocument();
    expect(screen.getByText("Claude Code")).toBeInTheDocument();
  });

  it("surfaces guardrails and high-risk approval gates", () => {
    const state = seedState();
    const workspace = state.workspaces.find((item) => item.kind === "solo")!;

    render(<SupervisorPage state={state} workspace={workspace} />);

    expect(screen.getByText("Guardrail review")).toBeInTheDocument();
    expect(screen.getByText("Require approval for high-risk actions")).toBeInTheDocument();
    expect(screen.getByText(/delete files, change auth or security code/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/pages/SupervisorPage.test.tsx`

Expected: FAIL because `./SupervisorPage` does not exist.

- [ ] **Step 3: Implement the page**

Create `SupervisorPage.tsx` with derived cards for Codex and Claude Code, guardrail rows, loop overview, and recent activity based on existing state.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/pages/SupervisorPage.test.tsx`

Expected: PASS.

### Task 2: Navigation Wiring

**Files:**
- Modify: `src/components/Layout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add navigation and route**

Add `supervisor` to `PageId`, add a `ShieldCheck` navigation item labelled `Supervisor`, import `SupervisorPage` in `App.tsx`, and render it for the new page id.

- [ ] **Step 2: Run related tests**

Run: `npm test -- src/pages/SupervisorPage.test.tsx`

Expected: PASS.

- [ ] **Step 3: Run full verification**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.
