# First release scope

The owner authorized implementation after reviewing the smaller purchase approval engine proposal. This document supersedes the broader staged feature scope in the original planning documents for the current release.

## Included

- React JavaScript and JSX frontend with a Laravel REST backend and PostgreSQL.
- Cookie-based login, organization selection, and organization-scoped roles.
- Fixed purchase form: title, amount in MYR, department, and justification.
- Save draft, edit draft, submit, approve, reject, cancel, and copy a terminal request.
- Approval inbox, request details, decision timeline, and organization audit history.
- Simple policy settings for a threshold, named manager, and named finance reviewer.
- Immutable published policies, stale-draft checks, and request snapshots.
- Database constraints, row locks, expected revisions, and command idempotency.
- Synthetic demo organizations, meaningful tests, local setup, and CI.

## Deferred

Dynamic forms, visual editors, attachments, email delivery, Redis workers, reminders, webhooks, AI, billing, and unrestricted membership administration.

FlowOps remains the working folder name. The name is already used by other products; no unique branding claim is made. The owner authorized GitHub publication on 1 November 2026. Hosted deployment remains separate.
