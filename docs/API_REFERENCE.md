# Implemented API reference

All routes return JSON. Organization resources begin with `/api/v1/organizations/{organizationId}`. In the table, `ORG` means that prefix. UUID route parameters, active membership, and resource visibility are checked server-side.

## Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/sanctum/csrf-cookie` | Initialize CSRF protection. |
| POST | `/login` | Authenticate with email and password; rotate the session. |
| POST | `/logout` | End the session. |
| GET | `/api/v1/me` | Current identity and active organization memberships. |
| GET | `/api/v1/demo` | Local/testing credential shortcuts when demo mode is enabled. |

Browser API clients send Accept: application/json, credentials, and the CSRF cookie value in X-XSRF-TOKEN for mutations. Sanctum's first-party session handling requires a configured Origin or Referer. Login limits repeated failed attempts per email and IP, with an additional overall route limit.

## Workspace

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `ORG/overview` | Counts, accessible recent requests, approved value, and recent visible history. |
| GET | `ORG/policy` | Current published policy; version history for administrators/auditors. |
| POST | `ORG/policy/publish` | Publish the next policy version as an administrator. |
| GET | `ORG/members` | Administrator-only read-only membership directory. |
| GET | `ORG/audit-events` | Administrator/auditor organization history. |

Policy publication requires revision, threshold_minor, manager_membership_id, finance_membership_id, and change_note. The two reviewers must be distinct active approvers in the current organization. The change note is 8 to 500 characters.

## Requests

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `ORG/requests` | Search and filter visible requests. |
| POST | `ORG/requests` | Create an owned draft. |
| GET | `ORG/requests/{id}` | Read an accessible request and history. |
| PATCH | `ORG/requests/{id}` | Update an owned draft with an expected revision. |
| POST | `ORG/requests/{id}/submit` | Submit against the reviewed policy version. |
| POST | `ORG/requests/{id}/cancel` | Cancel an owned draft or pending request. |
| POST | `ORG/requests/{id}/copy` | Create a new draft from an owned rejected/cancelled request. |
| POST | `ORG/requests/{id}/steps/{stepId}/approve` | Approve the current assigned step. |
| POST | `ORG/requests/{id}/steps/{stepId}/reject` | Reject the current assigned step with a reason. |

Draft fields are title (3–160 characters), amount_minor (1–99999999999), department, and justification (10–10000 characters). Allowed departments are Engineering, Design, Marketing, Operations, Finance, and People. The product supports MYR only. Draft saving validates these fields; partially incomplete drafts are not stored.

Submission requires revision and policy_version_id. Approval/rejection require revision and an optional approval reason or mandatory rejection reason, up to 2000 characters. Cancellation requires revision. The current step ID comes from the authorized request response.

Create, submit, decide, cancel, copy, and publish require an Idempotency-Key of 8–100 permitted characters. Draft PATCH uses optimistic revision protection. An exact protected-command replay returns the recorded response, which can precede subsequent changes; clients should refetch for the newest state.

## Lists and responses

Request lists accept status (all/draft/pending/approved/rejected/cancelled), view (all/mine/inbox), search (up to 100 characters), and page. The inbox view requires an approver role and contains only current assigned pending steps. Lists return 12 records per page. Audit history accepts type (all/request/step/policy), page, and returns 20 records per page.

Success responses use data. Paginated responses add meta with current_page, last_page, and total. Errors use message, code, optional errors, and request_id.

| Status | Meaning |
| --- | --- |
| 401 | No valid authenticated session. |
| 403 | An in-organization action is forbidden. |
| 404 | Missing or inaccessible organization/resource. |
| 409 | Changed revision, stale policy, incompatible lifecycle state, or reused key with different input. |
| 419 | CSRF/session mismatch. |
| 422 | Invalid input or ineligible assignment. |
| 429 | Rate limit reached. |

The server ignores extra client fields instead of mass-assigning ownership, organization, or status. No endpoint permits editing submitted content, published versions, decisions, or audit history.

There is no generated OpenAPI document or external API-token contract in this release.
