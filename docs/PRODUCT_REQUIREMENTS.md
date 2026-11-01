> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps product requirements

Status: proposed. Requirement completion has not been verified.

## Release definitions

| Release | Purpose | Included capability |
| --- | --- | --- |
| Planning | Review the project before coding | Documentation and reserved directories only. |
| v0.1 | Complete one usable purchase approval journey | Organizations, membership, session authentication, fixed purchase form, sequential approvals, and audit history. |
| v0.2 | Make the process configurable | Schema-driven forms, conditional routing, immutable published versions, and version-change handling. |
| v0.3 | Demonstrate reliable operations | Durable event outbox, Redis workers, reminders, outbound webhooks, retry visibility, and private attachments. |
| v1.0 portfolio | Make the completed scope reviewable | Verified setup, deployment, critical tests, reproducible measurements, documentation, and a public demo when authorized. |

Portfolio v1.0 is a project milestone, not a claim of enterprise certification or unlimited production readiness.

## Functional requirements

| ID | Requirement | First release |
| --- | --- | --- |
| FR-01 | Users sign in and sign out using a first-party browser session. | v0.1 |
| FR-02 | Active members access only their organizations and authorized records. | v0.1 |
| FR-03 | Administrators manage organization memberships and additive roles. | v0.1 |
| FR-04 | Requesters save and edit their own drafts and submit a valid purchase request. | v0.1 |
| FR-05 | Assigned approvers see a pending inbox and approve or reject with an optional approval comment and mandatory rejection reason. | v0.1 |
| FR-06 | Requests advance through manager then finance approval; final decisions produce a terminal status. | v0.1 |
| FR-07 | Authorized users inspect request details and a chronological business history. | v0.1 |
| FR-08 | Requesters cancel their own draft or pending request and may create a new request linked to a rejected or cancelled one. | v0.1 |
| FR-09 | Administrators reassign a pending step to an eligible member with a recorded reason. | v0.1 |
| FR-10 | Administrators configure allowed form fields and server-validated rules through a structured editor. | v0.2 |
| FR-11 | Administrators preview, validate, and publish an approval policy with deterministic amount-based routing. | v0.2 |
| FR-12 | Submitted requests retain their published configuration and submission snapshot. | v0.2 |
| FR-13 | A changed published version prompts draft owners to review and revalidate before submitting. | v0.2 |
| FR-14 | Administrators archive a workflow to stop new submissions while existing requests continue. | v0.2 |
| FR-15 | Notification and integration events survive process failure through a durable outbox and retry handling. | v0.3 |
| FR-16 | Pending steps receive due dates and one reminder per configured reminder window. | v0.3 |
| FR-17 | Administrators configure restricted HTTPS webhook destinations, inspect attempts, and replay eligible failed deliveries. | v0.3 |
| FR-18 | Users attach approved file types to drafts and authorized viewers download clean, private attachments. | v0.3 |
| FR-19 | Authorized dashboards show pending work, request counts, and aging using organization-scoped queries. | v0.3 |

All releases retain a fixed reference currency of MYR. Multi-currency accounting and foreign exchange are out of scope.

## Permission model

| Action | Requester | Assigned approver | Organization administrator | Auditor |
| --- | --- | --- | --- | --- |
| Create and edit an owned draft | Yes | With requester role | With requester role | No |
| Read a request | Own requests | Requests with a recorded assignment | Organization requests | Organization requests |
| Approve or reject | No through requester role | Current pending assigned step only | Only with a valid approver assignment | No |
| Cancel a request | Own draft or pending request | Only if also its requester | No implicit override | No |
| Configure workflows and memberships | No | No | Yes | No |
| Reassign pending work | No | No | Yes, with reason | No |
| Read organization audit records | Own request history only | Assigned request history only | Yes | Yes |

Roles are additive and organization-scoped. An administrator cannot bypass self-approval prevention or modify a completed decision. Every role requires active membership.

## Acceptance criteria

### AC-01 Organization isolation

Given two organizations and unrelated members, attempts to access the other organization's resources by URL, record ID, search, pagination, file download, or background work fail without revealing record existence. The same identity can access both only if it has active membership in both.

### AC-02 Purchase lifecycle

A valid draft can be submitted once, appear in the correct manager inbox, proceed to finance, and end as approved. A rejected or cancelled request cannot continue to approval. Drafts do not create approval tasks.

### AC-03 Permission and assignment

An unassigned approver, inactive member, requester attempting self-approval, or administrator without the relevant assignment cannot make an approval decision. Reassignment immediately invalidates the old assignee's right to act on that pending step.

### AC-04 Consistency under repetition and concurrency

Repeated submissions using the same idempotency key create one submission result. Concurrent approve, reject, cancel, or reassign actions produce one valid serialized outcome and an explainable conflict for the losing action.

### AC-05 Historical correctness

A request submitted under published version 1 continues under version 1 after version 2 is published. A stale draft receives a version conflict and must be reviewed against the current version before submission. Publishing never mutates an existing published version.

### AC-06 Form and policy validation

Invalid field definitions, unsupported operators, ambiguous routing, missing eligible approvers, cycles, and a route with no approval step prevent publication or submission as appropriate. Server validation rejects invalid answers even if client checks are bypassed.

### AC-07 Recoverable background work

A committed business action retains a durable event even if a worker is unavailable. After recovery, internal event consumers avoid duplicate effects through deduplication. Outbound webhook delivery is at least once; consumers receive a stable event identifier and must deduplicate.

### AC-08 Usability

Each core screen has loading, empty, error, validation, and permission-denied behavior. Users can complete the request and decision journeys with a keyboard. Submission feedback identifies the current status and the next responsible party.

### AC-09 Attachments

Before attachment functionality is released, unsupported, oversized, unscanned, or unsafe files cannot be downloaded. Organization and request-level authorization apply to every download, including generated temporary links.

### AC-10 Portfolio evidence

Release claims link to actual verification. The demo uses synthetic data. Setup instructions are exercised on a clean environment, and performance results include the environment, dataset, workload, and errors.

## Nonfunctional requirements

| ID | Requirement | Verification approach |
| --- | --- | --- |
| NFR-01 | Organization boundaries are enforced server-side. | Positive and negative authorization integration tests. |
| NFR-02 | Core transitions preserve database invariants. | PostgreSQL integration and concurrency tests. |
| NFR-03 | The UI is understandable and keyboard-accessible. | Browser tests and manual accessibility review. |
| NFR-04 | Local setup and release procedures are reproducible. | Fresh setup and release rehearsal. |
| NFR-05 | Failures can be investigated without logging secrets or request contents. | Structured logging review and recovery exercises. |
| NFR-06 | Application frontend code remains JavaScript and JSX. | File inventory, dependency review, and build verification. |
| NFR-07 | Performance is measured under a declared workload. | Repeatable baseline and documented results; no current SLA. |
| NFR-08 | Documentation reflects the implemented release. | Release checklist and traceability review. |

## Explicitly deferred

Parallel branches, delegated approvals, automatic approval, arbitrary expressions, custom scripts, drag-and-drop diagrams, SSO, mobile applications, billing, AI-generated decisions, broad external API access, and advanced analytics require separate scope decisions.
