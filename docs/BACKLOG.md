> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps initial backlog

Status: planned implementation work. No application item below is complete or started.

## Work ordering

Implement a small usable slice, verify it, and update the documentation before expanding. Backlog IDs can later become GitHub issues; no issues have been created.

| ID | Work item | Depends on | Requirement or exit evidence |
| --- | --- | --- | --- |
| BASE-01 | Select isolated compatible runtimes and record exact versions. | Owner start instruction | Verified setup; NFR-04. |
| BASE-02 | Scaffold React JavaScript and Laravel without introducing TypeScript. | BASE-01 | Frontend build and language inventory; NFR-06. |
| BASE-03 | Configure PostgreSQL, session authentication, and development proxy. | BASE-02 | Login, protected read, logout, CSRF, and session-expiry checks; FR-01. |
| BASE-04 | Add synthetic organizations, memberships, and additive roles. | BASE-03 | Role and membership behavior; FR-02, FR-03. |
| BASE-05 | Establish organization policies and tenant-aware repository queries. | BASE-04 | AC-01 negative tests. |
| MVP-01 | Add the fixed workflow version and purchase draft form. | BASE-05 | Save and edit an owned draft; FR-04. |
| MVP-02 | Add atomic submission, assignment checks, and idempotency. | MVP-01 | AC-02, AC-03, AC-04. |
| MVP-03 | Add the approval inbox and request detail view. | MVP-02 | Assigned tasks and clear history; FR-05, FR-07, AC-08. |
| MVP-04 | Add approve and reject transitions with concurrency protection. | MVP-03 | One valid decision under concurrent calls; FR-06, AC-04. |
| MVP-05 | Add cancellation and source-linked draft copies. | MVP-04 | Terminal-state rules; FR-08. |
| MVP-06 | Add pending-step reassignment and administrative audit events. | MVP-04 | Old assignment invalidated; FR-09, AC-03. |
| MVP-07 | Complete the core browser journey and accessible error states. | MVP-05, MVP-06 | AC-02 and AC-08 release rehearsal. |
| CFG-01 | Build the structured field editor and authoritative schema validation. | MVP-07 | FR-10, AC-06. |
| CFG-02 | Add bounded amount routing and route preview. | CFG-01 | Boundary, invalid-route, and assignment checks; FR-11. |
| CFG-03 | Publish immutable versions and handle stale drafts. | CFG-02 | Historical and stale-draft tests; FR-12, FR-13, AC-05. |
| CFG-04 | Archive definitions while preserving active requests. | CFG-03 | FR-14. |
| REL-01 | Add outbox events, effect deduplication, and recovery sweeps. | CFG-04 | Worker interruption and queue-loss evidence; FR-15, AC-07. |
| REL-02 | Add Redis workers, scheduling, reminders, and notification records. | REL-01 | One reminder per window; FR-16. |
| REL-03 | Add restricted HTTPS endpoints and signed delivery contracts. | REL-01 | Destination and signature tests; FR-17. |
| REL-04 | Add retries, attempt history, and terminal-failure replay. | REL-03 | Stable event IDs and recoverable failure demo; AC-07. |
| REL-05 | Add private attachments with scanning and authorized downloads. | CFG-04; storage/scanner selection | FR-18, AC-09. |
| REL-06 | Add organization overview and aging queries. | REL-02 | Scoped counts and query review; FR-19. |
| PORT-01 | Exercise setup, deployment, backup restoration, and operating notes. | Included feature milestones | NFR-04, NFR-05. |
| PORT-02 | Run volunteer sessions and address observed usability problems. | MVP-07 | Recorded task outcomes without invented metrics. |
| PORT-03 | Record a reproducible performance baseline and query improvements. | Included feature milestones | NFR-07. |
| PORT-04 | Prepare demo, screenshots, video, release notes, and truthful README claims. | PORT-01 to PORT-03 | AC-10, NFR-08. |
| PORT-05 | Select a license and publish to the owner's GitHub when requested. | PORT-04; publication instruction | Owner-controlled publication. |

## Definition of ready

A work item has an understood user outcome, release scope, dependencies, permissions, failure cases, and acceptance evidence. Resolve conflicting specifications before implementing the affected behavior.

## Definition of done

- The intended behavior works for permitted users.
- Unauthorized and invalid actions fail without partial business state.
- Meaningful tests cover the item's risks and pass on the intended runtime.
- User-facing states and errors are understandable.
- Documentation and release claims reflect the result.
- No credentials, unrelated changes, or unexplained dependencies are introduced.

## Planning stage completion

Repository and documentation preparation are tracked in the root [changelog](../CHANGELOG.md). This does not mark any implementation backlog item as done.
