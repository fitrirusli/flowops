> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps project proposal

Status: proposed design for owner review. Implementation has not started.

## Executive overview

FlowOps is a web application for organizations that need a clear, configurable way to submit requests and obtain approval. Administrators define a form and an approval policy. Employees submit requests, assigned approvers make decisions, and authorized users can inspect the history.

The first release focuses on purchase approval. Later releases extend the same foundation with configurable fields, conditional routing, workflow versioning, and reliable integrations. The initial users are internal teams and small organizations with repeatable approval processes.

The project has two purposes: deliver a usable approval product and provide public evidence of practical full-stack engineering. The portfolio should show working behavior, tested failure cases, and documented design decisions.

## The problem

Requests handled through email, messaging, and spreadsheets make it difficult to answer who needs to act, which policy applies, whether a request has changed, and why a decision was made. A form alone does not resolve these coordination problems.

Organizations also change their policies. A request already in progress should remain understandable after an administrator changes the form or approval sequence. Failed notifications should be visible and recoverable without corrupting approval state.

These are product hypotheses to validate with pilot users. No customer interviews or adoption metrics have been collected yet.

## Intended users

| User | Main need |
| --- | --- |
| Requester | Submit a complete request and understand its current status. |
| Approver | See assigned work and make an informed decision. |
| Organization administrator | Configure users and approval policies without changing application code. |
| Auditor | Inspect organization history without modifying decisions. |
| Maintainer | Diagnose failures, operate the service, and explain its behavior. |

One person may hold multiple organization roles. Permissions remain scoped to each organization.

## First product scenario

A fictional organization, Northstar Labs, uses FlowOps for purchase requests in MYR. The form captures a title, description, department, purchase amount, and business justification.

In the first runnable release, every submitted request follows a fixed two-stage process: a designated manager approves first, followed by a designated finance reviewer. The requester cannot approve their own request.

The configurable release adds a sample policy: requests below MYR 5,000 require manager approval; requests of MYR 5,000 or more require manager approval followed by finance approval. The threshold is an example policy, not a regulatory requirement.

A separate fictional organization, Cedar Works, has its own members, records, and configuration. Its presence in the demo makes data isolation observable.

## Proposed product capabilities

- Organization workspaces with server-enforced access boundaries.
- Request drafts, submission, approval inboxes, and decision history.
- Administrator-managed form and workflow definitions.
- Published versions that preserve the meaning of existing requests.
- Rejection, cancellation, and a new request linked to a rejected request.
- An audit history for meaningful business and administrative actions.
- Later, reminders, outbound webhook delivery, retry controls, and operational visibility.

The detailed release boundaries are in [product requirements](PRODUCT_REQUIREMENTS.md).

## What makes the project valuable

For users, FlowOps should make responsibility and progress visible. For the developer, it creates practical problems involving relational modeling, authorization, concurrency, state machines, configuration validation, and durable background work.

For a technical reviewer, the strongest evidence will be a working demo, critical automated tests, explicit trade-offs, and reproducible measurements. A technology list alone does not establish reliability or scale.

The project can support discussions about full-stack, backend, and enterprise software roles. It cannot guarantee a hiring outcome or demonstrate large-scale production experience before that experience exists.

## Technology direction

The frontend will use React with JavaScript and JSX. The backend will use Laravel with PostgreSQL. The first-party application will authenticate with a cookie-based session. Redis and workers enter the delivery plan when background reliability is implemented.

One repository will hold the frontend, backend, documentation, and future infrastructure files. The backend will be a modular monolith with explicit business responsibilities.

See [architecture](ARCHITECTURE.md) and [decision records](decisions/README.md) for rationale.

## Deliberate boundaries

The initial project does not include billing, a mobile app, a marketplace, an arbitrary scripting engine, a general BPMN implementation, or a visual drag-and-drop workflow editor. Parallel approval branches, delegation, and AI assistance are later candidates rather than MVP requirements.

FlowOps records an organization's approval policy. It does not provide accounting, payment execution, legal certification, or regulatory compliance certification.

## Success criteria

The first usable release should let a requester complete a purchase request, let assigned approvers process it, and show an understandable history. A second organization's members must be unable to access the first organization's records through the interface or API.

The configurable release should demonstrate a changed threshold without altering existing requests. The reliability release should demonstrate recovery from a failed outbound webhook and duplicate-safe internal transitions.

Before a public portfolio release, a new developer should be able to follow verified setup instructions. A reviewer should be able to understand the purpose from the root README and inspect deeper documentation as needed.

## Validation plan

Invite three to five volunteer testers once a complete request journey is available. Ask them to submit a request, find its status, process an approval, and explain what happens next. Record task outcomes and confusing interactions without collecting unnecessary personal information.

Use their findings to refine the product. Report only observed results; early tester feedback is not proof of broad market demand.

## Effort and cost assumptions

The owner is a solo developer with React JavaScript and Laravel experience. A preliminary planning envelope is 12 to 16 weeks at roughly 12 to 15 focused hours per week for a constrained portfolio release. This is an estimate to revise after the first vertical slice, not a delivery promise.

The development setup should run locally. Public hosting, a domain, managed storage, and email services may add costs. Provider selection and an actual budget remain open; no services have been purchased or provisioned.

## Current deliverable

This repository currently contains the proposal, design documentation, directory notes, and repository housekeeping files. There are no application features, installed project dependencies, or deployment artifacts.

The next owner decision is whether to revise the proposal or explicitly authorize implementation. See [proposal review](PROPOSAL_REVIEW.md).
