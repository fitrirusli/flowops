> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps frequently asked questions

Status: answers describe the proposed product. Implementation has not started.

## What is FlowOps?

FlowOps is a planned web application for configurable forms and approval workflows. It helps organizations collect requests, assign decisions, and follow their history in one workspace.

## What problem does it solve?

It makes the current status, responsible approver, applicable policy, and decision history visible. The intended users currently coordinate repeatable approvals through tools such as messages, email, or spreadsheets. That problem statement still needs pilot validation.

## Who is it for?

Internal teams and organizations with repeatable approval processes. The first reference process is purchase approval. The initial project is scoped for a useful portfolio product rather than an unrestricted enterprise automation suite.

## What does the first release actually include?

v0.1 will contain session login, separate organizations, memberships and roles, a fixed purchase form, drafts, manager then finance approval, rejection, cancellation, reassignment, and history. Configuration comes in v0.2, and durable background delivery comes in v0.3.

## Can I run it today?

No. The current repository contains proposals, design documentation, and reserved directories. There are no application dependencies, source files, migrations, or run commands.

## Why build this project?

It combines a concrete user workflow with practical engineering problems: authorization, relational data, concurrency, immutable configuration, and recovery from process failure. It also matches the owner's React JavaScript and Laravel experience while creating room to develop deeper skills.

## Why purchase approval first?

It is easy to explain and gives the project a measurable end-to-end journey. An amount threshold creates a useful policy example without requiring a general programming language or an external accounting system.

## Can it handle claims, onboarding, or other processes?

The configurable foundation may support similar form-and-approval processes later. Those use cases need their own validation and permissions. The proposal does not claim that all business processes work automatically.

## Is it a payment or accounting system?

No. It records approval decisions. It does not transfer funds, produce an accounting ledger, manage inventory, or certify a transaction's regulatory compliance.

## Will it use TypeScript?

The application frontend will use JavaScript and JSX. Components, hooks, tooling, and browser tests will be written in those languages. Third-party dependencies may include type declarations internally, but application development will not require authoring TypeScript.

## Why React and Laravel?

They fit the owner's existing experience and the needs of an interactive form-and-approval product. React handles the interface; Laravel owns authorization, validation, routing, and transaction-protected business behavior.

## Why a modular monolith?

One deployable backend makes transactions and local development manageable for a solo project. Internal modules still have clear responsibilities. Separate services can be considered later if operational evidence justifies the added complexity.

## What does multi-tenancy mean here?

Different organizations share the application and database but have separate members, configuration, requests, and history. Every relevant operation must check organization membership and resource permissions. A separate workspace screen alone does not establish isolation.

## Can an administrator approve everything?

No. Administrator permission manages workspace configuration and assignments. Approval still requires a valid current assignment, active membership, and compliance with self-approval restrictions. Completed decisions cannot be silently rewritten.

## What happens if the requester is also the assigned approver?

Submission is blocked until an eligible different approver is configured. The engine does not silently skip the step or permit self-approval. A later reassignment must also satisfy that rule.

## What if an approver leaves the organization?

They lose authority on subsequent operations. A pending step remains visible as blocked work and an administrator can reassign it with a reason. Historical decisions and actor references remain preserved.

## What happens when a workflow changes?

Published versions are immutable. Submitted requests keep the version and route they used. A draft based on an older published version must be reviewed and validated against the current version before submission.

## Can a rejected request be edited and submitted again?

The original request remains terminal. The requester can create a linked new draft, review the current form and policy, and submit that new request. Earlier decisions remain attached to the original record.

## What happens if two people act at the same time?

The server uses transactions, row locks, expected revisions, and uniqueness constraints to serialize valid actions. One result is committed and the other action receives a conflict where appropriate. This behavior must be verified against PostgreSQL with real concurrent operations.

## How will failures be handled?

The reliability release adds a durable outbox, event-effect tracking, retry history, and recovery sweeps. Business state is committed independently of external service availability. A failed notification does not reverse an approval decision.

## Are webhooks delivered exactly once?

No. The proposed contract is at-least-once delivery. A receiver may process a request before a response is lost. Repeated delivery carries the same event ID so the receiver can deduplicate.

## Are audit records tamper-proof?

Normal application operations will not edit business history. That does not make stored data immune to a privileged database administrator. Stronger tamper-evidence would require additional controls and verification.

## Will there be attachments?

Attachments are planned for v0.3 with private storage, content validation, scanning, and authorized downloads. They stay disabled if the security gate cannot be met.

## Will there be a visual builder or AI?

The first configuration editor uses structured controls. Drag-and-drop editing and AI assistance are deferred. They are not needed to validate the core approval product.

## How will quality be demonstrated?

Through a working demo, critical authorization and concurrency tests, versioning examples, failure-recovery exercises, accessible user journeys, and reproducible performance measurements. None of those application results exists yet.

## Will this guarantee a job or impress every company?

No project guarantees a hiring outcome. The goal is to create inspectable evidence of relevant engineering skills and give the owner concrete decisions, failures, and trade-offs to explain in interviews.

## Is FlowOps already open source or hosted on GitHub?

No public repository or license has been created during this stage. The owner intends eventual GitHub publication. Licensing and publication will be completed when requested.

## What needs attention before coding?

The owner needs to review the proposed scope and give the implementation instruction. The active PHP 8.1 CLI also needs a compatible isolated alternative for the proposed Laravel 13 backend. See [development setup](DEVELOPMENT_SETUP.md).

## Where should a reviewer start?

Read the root [README](../README.md) for an overview, the [proposal](PROJECT_PROPOSAL.md) for purpose, [product requirements](PRODUCT_REQUIREMENTS.md) for scope, and [architecture](ARCHITECTURE.md) for design. The [proposal review](PROPOSAL_REVIEW.md) distinguishes owner requirements from recommendations.
