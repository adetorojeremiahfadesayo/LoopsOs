# LoopOS Design Spec

## Product Summary

LoopOS is a memory-powered loop engineering platform for solo developers and AI teams. It helps users create, edit, share, govern, and improve reusable AI workflow loops using Cognee as the long-term memory layer.

The product turns scattered prompts, Markdown documents, team rules, prior agent runs, and successful patterns into structured loop playbooks. A loop playbook defines what an AI workflow should do, what context it should recall, what it should remember afterward, and how success should be checked.

## Positioning

LoopOS is best positioned as "GitHub for AI loops plus Cognee memory."

It is not only a prompt template library. It is a workspace where developers and teams can build reusable loops, attach durable context, track edits, manage access, and improve workflows over time.

## Target Users

### Solo Developers

Solo developers use LoopOS to create reusable AI workflows for coding, debugging, research, documentation, security review, and content refinement. They need fast setup, useful templates, editable loop steps, and persistent memory from project documents and previous runs.

### AI Teams

AI teams use LoopOS to share approved loop templates, centralize AI-related documents, control who can access sensitive context, and trace who changed shared workflows. They need role-based access, shared documents, edit history, and audit logs.

Non-technical users are out of scope for the hackathon MVP and can be added later as a no-code template marketplace.

## Core Concepts

### Loop Playbook

A loop playbook is a structured AI workflow. It contains:

- Name
- Goal
- Input requirements
- Agent steps
- Memory sources to recall
- Memory notes to save after a run
- Validation checks
- Expected output format
- Owner
- Visibility and permissions
- Version history

### Memory Source

A memory source is a document or note ingested into Cognee. The MVP supports Markdown text and manually pasted content. Each memory source has:

- Title
- Body
- Type: project docs, team rules, prompt examples, run notes, security policy, research notes
- Owner
- Workspace
- Access policy
- Cognee memory status
- Created and updated timestamps

### Workspace

A workspace groups loops, memory sources, members, roles, and audit events. The MVP supports:

- Solo workspace
- Team workspace

### Run

A run is an execution record for a loop. The MVP does not need to execute autonomous agents end to end. Instead, it should generate a memory-backed loop plan, let the user mark results, and save run notes. Each run records:

- Loop used
- Retrieved memory sources
- Generated plan
- User edits
- Outcome notes
- Improvement suggestions
- Timestamp

## Primary MVP Pages

### Dashboard

The dashboard gives users a quick overview of their LoopOS workspace.

It shows:

- Recent loops
- Recent memory sources
- Recent runs
- Team activity when inside a team workspace
- Suggested loop improvements from saved run notes

### Loop Builder

The Loop Builder is the main creation surface. Users can create or edit a loop playbook through structured fields.

Fields:

- Loop name
- Goal
- Input requirements
- Step list
- Memory sources to recall
- What to remember after each run
- Validation checks
- Output format

The MVP should include an "Improve this loop" action. This action recalls relevant Cognee memory and suggests better steps, missing checks, or useful context sources.

### Template Library

The Template Library contains starter loops. Users can duplicate a template into their solo or team workspace.

MVP templates:

- Code Feature Loop
- Bug Fix Loop
- Security Review Loop
- Research Brief Loop
- Documentation Loop
- Content Refinement Loop

Each template includes default steps, validation checks, memory rules, and output format guidance.

### Memory Library

The Memory Library lets users add Markdown documents and notes into Cognee.

MVP actions:

- Create memory source
- Paste Markdown or plain text
- Select source type
- Assign access policy
- Ingest into Cognee
- View memory source details
- Search or filter local memory records

### Team Workspace

The Team Workspace page is the main team mode. It shows shared docs, shared loops, members, permissions, and audit history.

Sections:

- Team overview
- Shared loops
- Shared memory sources
- Members
- Roles
- Access controls
- Audit log

Managers can grant specific members access to sensitive documents. Team docs are shared by default, but managers can restrict selected docs to specific people.

### Run History

Run History shows previous loop runs and what was learned.

It shows:

- Loop name
- Generated plan
- Retrieved context
- User edits
- Outcome notes
- Improvement suggestions
- Timestamp

## Roles And Permissions

The MVP has four roles:

- Owner: full control over workspace, members, docs, loops, and permissions
- Manager: manage members, docs, loops, and permissions, except ownership transfer
- Editor: create and edit allowed loops and memory sources
- Viewer: view and run allowed loops only

Permission behavior:

- Solo users can access everything in their solo workspace.
- Team workspace members can see shared loops and shared docs by default.
- Restricted docs are visible only to allowed members, managers, and owners.
- Cognee recall must respect memory source access policy.
- All changes to shared loops, shared memory sources, members, roles, and permissions create audit events.

## Audit Log

The audit log records important team changes.

Events:

- Memory source created
- Memory source edited
- Memory source access changed
- Loop created
- Loop edited
- Loop duplicated from template
- Loop access changed
- Member invited
- Member role changed
- Run completed
- Loop improvement generated

Each event records:

- Actor
- Action
- Target type
- Target name
- Before summary when relevant
- After summary when relevant
- Timestamp

## Cognee Integration

Cognee is the product's memory layer.

The MVP should use Cognee for:

- Ingesting Markdown documents as memory
- Recalling relevant memory for a selected loop
- Suggesting loop improvements from prior run notes and documents
- Storing improvement notes from completed runs

Expected memory flow:

1. User adds a Markdown memory source.
2. LoopOS stores local metadata and sends the source body to Cognee.
3. User opens a loop and requests improvement or plan generation.
4. LoopOS fetches allowed memory sources for that user.
5. LoopOS asks Cognee to recall relevant memory.
6. LoopOS combines the loop, recalled memory, and template rules into a generated plan.
7. After the run, user saves outcome notes.
8. LoopOS sends useful run notes back to Cognee so future runs improve.

If Cognee is unavailable during local development, the app should show a clear connection error and preserve the local draft.

## Hackathon Demo Script

The demo should show a team security review workflow.

1. Manager opens a team workspace.
2. Manager adds Markdown docs: project overview, coding standards, and security rules.
3. LoopOS ingests the docs into Cognee.
4. Manager restricts the security rules doc to selected members.
5. Developer duplicates the Security Review Loop template.
6. Developer asks LoopOS to improve the loop.
7. LoopOS recalls allowed team memory and suggests team-specific steps.
8. Developer edits the loop.
9. Audit log records the loop edit.
10. Developer records run notes after a simulated review.
11. LoopOS saves the notes to Cognee and suggests a future improvement.

This demo proves memory, loop engineering, team governance, permissions, and traceability.

## Non-Goals For MVP

The MVP will not include:

- Billing
- Public marketplace
- Full no-code automation builder
- Full autonomous agent runtime
- Real-time multiplayer editing
- OAuth organization management
- Enterprise SSO
- Complex groups or departments
- File uploads beyond pasted Markdown/text

## Success Criteria

The MVP is successful if a judge can understand and verify that:

- LoopOS creates structured loop playbooks.
- Users can add documents as Cognee-backed memory.
- Cognee memory is used to improve or generate loop plans.
- Team workspaces have shared docs and shared loops.
- Managers can restrict specific memory sources to selected users.
- Shared changes are recorded in an audit log.
- The demo clearly shows how loops improve over time through memory.

## Recommended Build Approach

Build a polished web app prototype with real local persistence and a thin Cognee integration layer.

The application should prioritize:

- Clear product flow over broad feature count
- Strong demo data
- Simple, reliable permission checks
- Visible Cognee memory moments
- Clean audit trail

The first implementation should use a single app with mockable service boundaries:

- UI components for dashboard, loop builder, template library, memory library, team workspace, and run history
- Local data store for workspaces, users, loops, memory sources, runs, and audit events
- Cognee service module for ingest and recall
- Permission service module for access checks
- Audit service module for recording changes

This keeps the MVP hackathon-ready while leaving a clean path to a real backend later.
