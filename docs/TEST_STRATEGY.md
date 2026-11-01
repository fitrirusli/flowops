> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps test strategy

Status: verification plan only. No application tests or passing results exist.

## Purpose

Verify business behavior and failure recovery with the smallest useful set of tests. Give particular attention to organization isolation, unauthorized decisions, immutable history, concurrent actions, and durable background processing.

## Planned tools and placement

| Level | Proposed tools | Location |
| --- | --- | --- |
| Backend rules and API integration | Pest or PHPUnit on PostgreSQL | `apps/api/tests/` after scaffolding |
| React behavior | Vitest and React Testing Library using JavaScript | `apps/web/src/` or its test directory |
| Browser journeys | Playwright using JavaScript | `tests/e2e/` |
| Load and performance | k6 using JavaScript | `tests/load/` |
| Static and formatting checks | ESLint, Laravel Pint, and compatible PHP analysis selected during setup | Application configuration after authorization |

Use a real PostgreSQL test database for locking, JSONB, constraints, and isolation-sensitive behavior. SQLite-only tests cannot establish PostgreSQL concurrency correctness.

## Critical scenarios

| Scenario | Required evidence | Traceability |
| --- | --- | --- |
| Cross-organization reads and writes | Requests, inboxes, versions, audit lists, downloads, caches, and jobs cannot cross tenant boundaries. | FR-02, AC-01, NFR-01 |
| End-to-end purchase approval | Draft, submit, manager approval, finance approval, and terminal history agree. | FR-04 to FR-07, AC-02 |
| Permission denial | Unassigned, inactive, and self-approving actors cannot decide. | FR-05, AC-03 |
| Reassignment | Old assignee loses authority and the new assignee can act; reason is audited. | FR-09, AC-03 |
| Repeated submit | Same key and payload return one result; changed input with the same key conflicts. | AC-04 |
| Concurrent decisions | Parallel operations use separate database connections and synchronization to exercise real overlap. | AC-04, NFR-02 |
| Approve/cancel/reassign races | One valid serialized state survives; audit records match that state. | AC-04 |
| Policy publication | Invalid routes fail, published content stays immutable, and active requests keep their version. | FR-11 to FR-13, AC-05 |
| Threshold boundaries | MYR 4,999.99, 5,000.00, and 5,000.01 select the specified routes. | FR-11, AC-06 |
| Stale draft | Changed version requires review without silently changing a submitted request. | FR-13, AC-05 |
| Worker and Redis failure | Database events and overdue effects recover without losing committed business work. | FR-15, AC-07 |
| Duplicate background delivery | Internal effects deduplicate; webhook attempts retain a stable event ID. | FR-15, AC-07 |
| Destination restrictions | Blocked IPv4/IPv6 addresses, redirects, rebinding, and oversized responses cannot bypass delivery policy. | FR-17 |
| Attachment safety | Cross-tenant, unscanned, oversized, and disallowed files cannot be downloaded. | FR-18, AC-09 |
| Accessible user flow | Keyboard navigation, labeled fields, error summaries, and status feedback work. | AC-08, NFR-03 |

## Test data

Use at least two fictional organizations with distinct requesters, approvers, administrators, and auditors. Include one identity with different roles across both organizations to expose context mistakes.

Include inactive members, a requester who is also an approver, an archived workflow, multiple published versions, terminal requests, blocked assignments, and failed deliveries. Test data is synthetic and resettable.

## Failure exercises

At the reliability milestone, simulate a worker stopping before enqueue acknowledgement, after creating a delivery record, and after an external receiver accepts a request. Also simulate Redis message loss and a scheduler overlap.

Validate recovery from durable database state. Do not treat an in-process mock or a green unit test as proof that a crash boundary is handled.

## Performance baseline

First measure request listing, approval inboxes, request detail reads, and decision writes independently. Record dataset size, organization count, request distribution, concurrent workload, warm-up, duration, hardware, software versions, p50/p95 latency, throughput, and error rate.

A proposed baseline dataset is 10 organizations and 10,000 total requests, with a separate test containing one larger tenant. Establish an initial workload after the first deployment, then set a justified improvement target. No latency or availability SLA is claimed now.

## CI and release gates

After implementation, pull requests should run relevant formatting, static checks, backend tests, frontend tests, and a frontend production build. Browser tests can use a small representative suite in CI with broader release checks where justified.

A release requires the critical scenarios for its included features, verified setup instructions, and recorded results. Do not introduce an arbitrary coverage percentage as a substitute for testing the risky behavior.

## Current verification scope

During planning, verify document links, requirement references, directory contents, and consistency between release scope and architecture. There is no application build or test command to run yet.
