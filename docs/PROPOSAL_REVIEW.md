> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps proposal review

Status: awaiting owner review. This page records proposed choices; it does not authorize application coding.

## Confirmed owner requirements

| Requirement | Record |
| --- | --- |
| Project name and location | FlowOps, in its own folder under the personal workspace. |
| Documentation language | English. |
| Frontend language | React JavaScript and JSX. No TypeScript application code. |
| Current stage | Prepare the base structure and complete proposal documentation. |
| Implementation boundary | Start application coding only after a later owner instruction. |
| Portfolio intention | Prepare a project suitable for eventual publication on the owner's GitHub profile. |

## Recommended design for review

| Decision | Recommendation | Reason |
| --- | --- | --- |
| First use case | Purchase approval | A concrete process with understandable rules and a clear demo. |
| First runnable scope | Fixed manager then finance approval | Deliver one complete journey before making it configurable. |
| Frontend | React JavaScript with Vite | Matches the owner's existing React knowledge. |
| Backend | Laravel 13 on a supported compatible PHP runtime | Fits existing Laravel experience and supports the proposed modules. |
| Architecture | Modular monolith in one repository | Keeps boundaries clear with manageable operational work. |
| Database | PostgreSQL 17 on a current supported patch | Supports relational constraints, transactions, and JSON snapshots. |
| Browser authentication | Sanctum with cookie-based sessions | Fits one first-party web application. |
| Initial tenancy | Shared database with organization-scoped records | Makes multi-tenant design demonstrable with a constrained setup. |
| Initial interface | Accessible desktop-first admin workspace, usable on mobile | Fits form entry, review, and operational work. |

These recommendations remain revisable before implementation. The language requirement and current coding boundary are explicit owner instructions.

## Assumptions to validate through development

- A user may belong to multiple organizations with different roles.
- Each organization designates named approvers; approvals are not inferred from an external HR system.
- Self-approval is prohibited. Missing or conflicting assignments block publication or submission.
- The initial sample product uses MYR and a fictional MYR 5,000 threshold.
- Purchase approval does not execute payments or manage inventory.
- Public demo data is synthetic and demonstration access is restricted.

## Choices that can wait

Hosting provider, domain, public repository license, email provider, object storage provider, final visual branding, and an operating budget can be selected at the release milestone that needs them. These do not need to interrupt documentation review.

Parallel approvals, delegated approvers, drag-and-drop editing, SSO, AI assistance, and external API tokens require their own scope decision if they are added later.

## Environment findings

The current CLI exposes PHP 8.1.10 and a PostgreSQL 14.5 client. The proposed backend needs a compatible PHP runtime, and the database baseline needs a separate setup decision. No runtime or existing database has been changed. See [development setup](DEVELOPMENT_SETUP.md).

## Suggested review order

Read the [proposal](PROJECT_PROPOSAL.md), then the [user journeys](USER_JOURNEYS.md), then the [roadmap](ROADMAP.md). Technical readers can continue to [architecture](ARCHITECTURE.md) and [workflow rules](WORKFLOW_ENGINE.md).

## How work continues

Feedback may revise any proposed product or architecture choice. A later explicit instruction to start coding permits implementation within the agreed scope; it does not require repeated confirmation for routine implementation decisions.

Current implementation status: **not started**. No acceptance criteria, benchmark targets, or operational capabilities are claimed as passed.
