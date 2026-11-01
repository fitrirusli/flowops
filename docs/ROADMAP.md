> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps delivery roadmap

Status: proposed sequence. Application work has not started.

## Planning envelope

Use 12 to 16 weeks at approximately 12 to 15 focused hours per week as an initial estimate for a constrained portfolio release. Runtime setup, unfamiliar tooling, and reliability features may increase this. Re-estimate after the first complete vertical slice.

Release gates define usable outcomes. If effort exceeds the envelope, complete and publish an honestly scoped milestone rather than presenting planned features as finished.

## Phase 0 Proposal and repository preparation

Current phase.

- Prepare the proposal, release boundaries, technical design, and FAQ.
- Record the JavaScript frontend requirement.
- Inventory the environment without changing installed tools or services.
- Reserve application, infrastructure, and verification directories.
- Keep application implementation behind the owner's explicit start instruction.

Exit: the owner can review a concrete proposal and provide revisions or authorize coding.

## Phase 1 Runtime and first vertical slice

Indicative effort: 1 to 2 weeks after implementation authorization.

- Establish a compatible isolated PHP runtime and dedicated PostgreSQL databases.
- Scaffold Laravel and the JavaScript React application.
- Implement session login, organization context, and a protected request.
- Create synthetic organizations and roles.
- Establish formatting, a production frontend build, and meaningful initial API checks.

Exit: a user can sign in, select an authorized organization, and receive a protected response. Unauthorized organization access is denied. Setup instructions have been exercised.

## Phase 2 Purchase approval MVP

Indicative effort: 3 to 4 weeks.

- Build the fixed purchase form, draft persistence, and submission.
- Build manager then finance approval, rejection, cancellation, and source-linked copies.
- Add pending-step reassignment with an audit reason.
- Add request details, history, and organization-scoped lists.
- Verify permissions, idempotency, real concurrency, and core browser journeys.

Exit: v0.1 is usable end to end with two isolated organizations and a fixed internal published configuration. Deployment to a private review environment can be considered when requested.

## Phase 3 Configurable forms and policy

Indicative effort: 3 to 4 weeks.

- Add a structured administrator editor for supported fields and routing.
- Validate schemas, route boundaries, and named assignments.
- Publish immutable workflow versions and retain submission snapshots.
- Handle stale drafts and archive definitions safely.
- Verify that existing requests continue under their original version.

Exit: v0.2 demonstrates a policy change and a form change without rewriting historical requests. A visual drag-and-drop editor is not part of this phase.

## Phase 4 Reliability and controlled integrations

Indicative effort: 3 to 4 weeks, revised after the outbox exercise.

- Add the durable outbox and recoverable event effects.
- Introduce Redis workers and scheduler processes.
- Add due dates, deduplicated reminders, and notification records.
- Add restricted signed webhooks, retry attempts, and audited replay.
- Add private attachments only after scanning and authorization are verified.
- Exercise process interruption, queue loss, and duplicate external delivery.

Exit: v0.3 has documented recovery behavior and observable failures. If attachments cannot meet the security gate, record them as deferred and keep them disabled.

## Phase 5 Portfolio release

Indicative effort: 2 or more weeks, partly overlapping previous phases.

- Collect volunteer feedback on the core journeys.
- Improve usability and keyboard accessibility.
- Produce actual performance measurements and a failure-recovery demonstration.
- Rehearse deployment, backup restoration, and clean setup.
- Update the README, screenshots, video, implemented-feature matrix, and known limitations.
- Select a license and prepare GitHub publication when the owner requests it.

Exit: v1.0 portfolio claims match the tested release, and reviewers can inspect the product and its evidence.

## Risk and response

| Risk | Early response |
| --- | --- |
| Scope grows into a general automation platform | Keep purchase approval and bounded routing as the reference process. |
| Configuration editor consumes the schedule | Deliver the fixed journey first and use structured controls. |
| Runtime setup affects unrelated projects | Use project isolation and a dedicated database. |
| Tenant leakage | Establish negative authorization tests before adding broad features. |
| Reliability is assumed from framework queues | Exercise crash boundaries and recover from database state. |
| Documentation becomes detached from code | Update release claims and contracts with every relevant change. |
| Public demo creates cost or abuse | Limit capabilities, use synthetic data, and define quotas before launch. |

## Later candidates

Parallel approval groups, delegation, visual workflow editing, SSO, advanced analytics, and assisted configuration can be evaluated after the core product is validated. They are not prerequisites for a strong initial portfolio.
