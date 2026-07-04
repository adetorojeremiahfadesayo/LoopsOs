# LoopOS

![LoopOS supervisor screen](public/loopos-assets/screenshots/supervisor-desktop.png)

### Build AI workflows that remember, improve, supervise, and safely forget.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vite.dev)
[![Cognee](https://img.shields.io/badge/Cognee-memory-10B981)](https://www.cognee.ai)

**Built for the WeMakeDevs Cognee Hackathon - AI that does not forget**

[Quick Start](#quick-start) | [Demo](#demo) | [Architecture](#architecture) | [Tech Stack](#tech-stack)

---

## At A Glance

| Item | Details |
|---|---|
| Track | Cognee hackathon |
| Theme | AI that does not forget |
| Main demo route | Local: `http://127.0.0.1:5173` |
| Core hook | Turn repeatable AI-agent work into memory-backed loops with recall, supervision, handoff, and forget controls |
| Memory layer | Cognee local, Cognee Cloud, or deterministic demo fallback |
| Agent support | Codex, Claude Code, generic CLI handoff bundles, and Supervisor monitoring |
| Stack | React, TypeScript, Vite, Tailwind CSS, Node.js API bridge, Cognee REST API |

## The Problem

AI coding and research agents are powerful, but most sessions are still disposable. A developer gives an agent context, the agent runs, and then the hard-won decisions, mistakes, constraints, and improvements disappear into chat history or scattered logs.

When teams use more than one agent, the problem gets sharper: Codex may edit code, Claude Code may reason through architecture, and the human has to manually compare outputs, remember guardrails, and decide what should carry forward.

## The Solution

LoopOS turns agent work into governed memory loops:

```text
Choose loop template
  -> edit loop files
  -> remember context in Cognee
  -> recall allowed memory
  -> improve the workflow
  -> hand off to an agent
  -> supervise agent activity
  -> save run notes
  -> forget stale or sensitive memory
```

The result is a solo-first AI workflow workbench where agents can reuse durable memory without losing guardrails, permissions, or the ability to forget.

## Meet The Supervisor

The Supervisor is the senior AI engineer view inside LoopOS. It monitors active agent lanes, compares signals, keeps guardrails visible, and gives the human an approval checkpoint before risky actions move forward.

| Stage | What The Supervisor Does |
|---|---|
| **Activate Workflow** | Attaches live monitoring to the current loop and creates a new activity signal |
| **Agent Monitor** | Watches Codex and Claude Architect as separate lanes |
| **Guardrails** | Expands approval rules only when the user wants to review them |
| **Activity Feed** | Keeps compact logs, run notes, and audit events at the bottom |
| **Continue Workflow** | Moves the user from supervision into the next Forget step |

## Visual Tour

| Supervisor Desktop | Supervisor Mobile |
|:---:|:---:|
| ![LoopOS desktop supervisor](public/loopos-assets/screenshots/supervisor-desktop.png) | ![LoopOS mobile supervisor](public/loopos-assets/screenshots/supervisor-mobile.png) |
| *Live agent monitor, guardrails, and workflow continuation* | *Responsive monitoring view with active agent animation* |

## Demo

Run the local full demo with the frontend and Node API bridge:

```bash
npm install
npm run dev:full
```

Open:

```text
http://127.0.0.1:5173
```

The demo includes:

- A solo-first Cognee setup flow
- Loop templates for web building, research, code review, support, and docs maintenance
- Editable generated files such as `LOOP.md`, `MODEL.md`, `SOUL.md`, `MEMORY.md`, `TOOLS.md`, and `HANDOFF.md`
- Cognee remember, recall, improve, and forget lifecycle
- Agent handoff bundles for Codex, Claude Code, and generic CLI agents
- Supervisor monitoring for multi-agent activity
- Final Forget step for stale, wrong, or sensitive memory

### Demo Walkthrough

| Step | Flow |
|---|---|
| 1 | Open Dashboard and choose hosted demo, local Cognee, or custom Cognee Cloud |
| 2 | Open Templates and choose one of the five loop patterns |
| 3 | Edit generated files in Workspace and remember them into Cognee |
| 4 | Run and recall the loop in Loop Builder |
| 5 | Review the agent handoff bundle |
| 6 | Activate Supervisor to monitor agent activity and guardrails |
| 7 | Continue to Forget and remove memory that should not affect future runs |

## Why LoopOS Stands Out

| Common agent workflow | LoopOS |
|---|---|
| One-off prompts | Repeatable loop templates |
| Context disappears after a run | Cognee-backed memory sources and run notes |
| Every agent sees everything | Permission-aware memory filtering before recall |
| No clear workflow files | Generated Markdown loop workspace |
| No supervision layer | Live Supervisor page with guardrails and compact activity |
| Memory only grows | Explicit Forget step for stale or sensitive context |

## Architecture

```text
React + Vite frontend
|
|-- Setup
|   |-- Hosted LoopOS Cognee demo
|   |-- Local open source Cognee
|   |-- Custom Cognee Cloud connection
|
|-- Loop workspace
|   |-- Template duplication
|   |-- Editable Markdown files
|   |-- Remember loop files
|
|-- Cognee lifecycle
|   |-- Remember
|   |-- Recall permission-filtered memory
|   |-- Improve generated plan
|   |-- Store run notes
|   |-- Forget stale memory
|
|-- Agent surfaces
|   |-- Agent Handoff bundles
|   |-- Supervisor live monitor
|   |-- Guardrail approval review
|
|-- Node API bridge
    |-- /api/cognee/status
    |-- /api/cognee/ingest
    |-- /api/cognee/remember-loop-file
    |-- /api/cognee/recall
    |-- /api/cognee/store-run
    |-- /api/cognee/forget
```

## Cognee Integration

The Node bridge keeps Cognee credentials out of browser code. The frontend calls `/api/cognee/*`, and the backend proxies to Cognee REST endpoints when available.

The bridge uses:

```text
POST /api/v1/add
POST /api/v1/cognify
POST /api/v1/search
POST /api/v1/remember   # compatibility fallback
```

LoopOS can also run in demo fallback mode, so judges can still explore the product behavior if Cognee is not available.

### Cognee Environment Variables

```env
# Default local Cognee
COGNEE_BASE_URL=http://127.0.0.1:8000
COGNEE_AUTH_MODE=none
COGNEE_API_KEY=

# Hosted LoopOS demo path
LOOPOS_DEMO_COGNEE_BASE_URL=https://api.cognee.ai
LOOPOS_DEMO_COGNEE_AUTH_MODE=api-key
LOOPOS_DEMO_COGNEE_API_KEY=
```

## Agent Handoff And Supervisor

LoopOS prepares handoff bundles for:

- Codex
- Claude Code
- Generic CLI agents

The Supervisor page then gives the human a governance view over the workflow:

- Separate Codex and Claude Architect lanes
- Live activity event when monitoring is activated
- Guardrails collapsed behind a button
- Approval gate for risky actions
- Compact recent activity feed
- Continue button to move into the Forget step

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, custom LoopOS motion styles |
| Icons | lucide-react |
| Backend bridge | Node.js HTTP server |
| Memory | Cognee REST API, Cognee Cloud, local Cognee, demo fallback |
| State | Browser local storage for MVP app state |
| Testing | Vitest, Testing Library |
| Deployment fit | Railway for full-stack demo, Vercel for static frontend |

## Quick Start

```bash
git clone https://github.com/adetorojeremiahfadesayo/LoopsOs.git
cd LoopsOs
npm install
cp .env.example .env
npm run dev:full
```

Open:

```text
http://127.0.0.1:5173
```

On Windows PowerShell:

```powershell
git clone https://github.com/adetorojeremiahfadesayo/LoopsOs.git
cd LoopsOs
npm install
Copy-Item .env.example .env
npm run dev:full
```

## Deployment

For the full hackathon demo, Railway is the simplest fit because LoopOS has a Node API bridge as well as a Vite frontend.

Recommended deployment shape:

```text
Railway
|-- Build: npm run build
|-- Start: node server/index.js
|-- Variables: LOOPOS_DEMO_COGNEE_* values
```

Vercel is a good fit for the static frontend if the backend is hosted separately. In that split setup, deploy `dist/` to Vercel and route `/api/*` to the Railway API bridge.

See `docs/DEPLOYMENT.md` for more deployment notes.

## Quality Checks

```bash
npm test
npm run build
```

Current verified status:

```text
21 test files passed
71 tests passed
Production build passed
```

## Security

Never commit real API keys, tokens, private logs, or sensitive memory content.

Secrets belong in `.env`, `.env.local`, Railway variables, or Vercel environment variables. They should not be placed in frontend code.

Before public submission, verify no env file is tracked:

```bash
git ls-files -- ".env*" "**/.env*"
```

That command should not show real secret files.

## Submission Checklist

- [x] Cognee memory lifecycle: Remember, Recall, Improve, Forget
- [x] Solo-first judgeable flow
- [x] Five reusable loop templates
- [x] Editable Markdown loop workspace
- [x] Backend-only Cognee Cloud key path
- [x] Agent handoff bundles
- [x] Supervisor monitoring page
- [x] Guardrails and high-risk approval review
- [x] Tests and build passing
- [ ] Live deployed app URL
- [ ] Demo video URL
- [ ] Hackathon submission URL

## Still Needed Before Submission

Add these when ready:

- Railway or Vercel deployment URL
- Demo video URL
- Final Cognee hackathon submission link
- License file, if you want a license badge

---

Built so your agents remember the right things, forget the risky things, and keep the human in the loop.
