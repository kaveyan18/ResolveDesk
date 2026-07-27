# AGENTS.md — ResolveDesk

This file is the source of truth for AI-assisted development on this repo.
Read it fully before starting any feature. One feature per prompt. Verify
before moving to the next.

## 1. What this project is

ResolveDesk is a complaint management system for a college. Students report
campus issues (electrical, plumbing, IT, facility, etc.), technicians
resolve them, department heads assign and oversee work, and admins manage
the system end to end.

**Scope:** core complaint lifecycle — raise, assign, resolve, track, report.
No anonymous complaints. No department-based routing (assignment is
skill-based, not department-based).

## 2. Tech stack

- **Frontend:** React 19 + Vite + TailwindCSS
- **Backend:** Node.js / Express + Socket.IO + MongoDB (Mongoose)
- **Auth:** JWT with bcrypt
- **Charts:** Recharts (admin analytics dashboard)

## 3. Core features

- Real-time per-complaint chat via Socket.IO
- Notification system
- Admin analytics dashboard (Recharts) with CSV export
- Staff accounts require admin approval before activation

Treat all of the above as working and stable. Changes to this underlying
logic should only happen when a task explicitly calls for it — most work
should be additive (new screens, new fields, new copy) rather than
architectural.

## 4. Roles

- **Student** — raise complaints, upload images, track status, view history,
  rate completed complaints, receive notifications.
- **Technician** — view assigned complaints, update status, add comments,
  upload completion images.
- **Department Head** — view department complaints, assign to technicians,
  set priority, monitor technician workload, view reports.
- **Admin** — manage users, manage departments, view all complaints,
  analytics, system config.

## 5. Complaint status & priority enums

Keep these exact values and colors consistent across frontend, backend, and
DB seed data — they're referenced by badge components everywhere.

**Status:** `Pending` (yellow) → `Assigned` (blue) → `In Progress` (purple) →
`Resolved` (green) → `Closed` (gray). `Rejected` (red) is a terminal state
off the `Pending` branch.

**Priority:** `Critical` (red) · `High` (orange) · `Medium` (blue) ·
`Low` (gray).

## 6. UI/UX reference

A responsive HTML prototype covering all four roles' screens exists at
`ResolveDesk-UIUX-Prototype.html`. Treat it as the visual/interaction
reference when building or restyling frontend components — not as code to
copy wholesale.

Design tokens to carry into the Tailwind config:
- Primary: `#2A4FD1` / dark `#1E3AA0` / soft bg `#E9EDFC`
- Ink: `#12172B` · Muted text: `#666F8A` · Border: `#E5E7F0` · App bg: `#F4F5FA`
- Success `#1F9D6C` · Warning `#DE8F1F` · Danger `#DB4C4C` · Purple (in-progress) `#7C5CD6`
- Display font: Space Grotesk · Body: Inter · Mono (IDs/timestamps): IBM Plex Mono
- Signature interaction pattern: vertical "status thread" timeline with a
  pulsing dot on the current step — used on complaint detail/tracking and
  technician work screens.

Mobile rule: sidebar collapses to bottom nav below 760px; tables become
stacked label:value cards, not horizontal scroll.

## 7. Workflow rules for this repo

1. **One feature per prompt.** Don't bundle unrelated changes into a single
   task.
2. **Verify before moving on.** Run the app / relevant tests and confirm the
   feature works before starting the next prompt.
3. **Minimal, additive diffs.** Prefer extending existing patterns over
   introducing new ones. If a change requires touching routing, auth, or
   data models in a structural way, stop and flag it rather than expanding
   scope silently.
4. **Stay in scope.** No anonymous complaints, no department-based routing —
   even if they seem like natural extensions.
5. **Keep status/priority enums and colors in sync** across frontend
   components, backend validation, and seed/fixture data whenever either is
   touched.

## 8. Open items (not yet decided)

- Final college-specific category list
- Whether department names are freeform (admin-managed) or a fixed seeded list
- Copy/tone pass for student-facing microcopy (empty states, errors, toasts)
