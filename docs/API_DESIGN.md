> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps API design

Status: proposed contract. No routes, controllers, or OpenAPI artifact exist yet.

## Conventions

The browser API base will be `/api/v1`. Organization-owned resources use `/organizations/{organizationId}` beneath that base. The authenticated actor comes from the session, never from a client-provided actor ID.

Use JSON responses, ISO 8601 UTC timestamps, opaque identifiers, bounded pagination, and English error messages. Money is represented as integer minor units and `currency` is MYR in the initial product.

The API does not expose direct status updates. Business commands such as submit, approve, reject, cancel, and reassign enforce the lifecycle.

## Browser session endpoints

| Method and path | Purpose |
| --- | --- |
| GET `/sanctum/csrf-cookie` | Initialize CSRF protection. |
| POST `/login` | Authenticate and regenerate the session. |
| POST `/logout` | Invalidate the session and rotate CSRF state. |
| GET `/api/v1/me` | Return the current identity and safe session information. |
| GET `/api/v1/organizations` | List the user's active organization memberships. |

The login and logout routes follow the session authentication boundary rather than the organization resource prefix. Credentials and session tokens are never stored in browser local storage.

## v0.1 resources

The table uses `ORG` as shorthand for `/api/v1/organizations/{organizationId}`.

| Method and path | Purpose | Access |
| --- | --- | --- |
| GET `ORG/members` | List members available to the administrator. | Administrator |
| POST `ORG/members` | Add a known existing account by exact identity through a controlled membership flow. | Administrator |
| PATCH `ORG/members/{membershipId}` | Change allowed roles or membership status. | Administrator |
| GET `ORG/workflows` | List usable workflow definitions and current published metadata. | Active permitted member |
| GET `ORG/workflows/{workflowId}` | Load the form and current policy the member may use. | Active permitted member |
| GET `ORG/requests` | List visible requests with supported filters. | Active permitted member |
| POST `ORG/requests` | Create an owned draft. | Requester |
| GET `ORG/requests/{requestId}` | Read the request snapshot, current step, and permitted history. | Authorized viewer |
| PATCH `ORG/requests/{requestId}` | Edit an owned draft with an expected revision. | Owning requester |
| POST `ORG/requests/{requestId}/submit` | Validate and submit using an expected published version. | Owning requester |
| POST `ORG/requests/{requestId}/cancel` | Cancel an owned draft or pending request. | Owning requester |
| POST `ORG/requests/{requestId}/copy` | Create an owned draft linked to an owned rejected or cancelled request. | Owning requester |
| GET `ORG/approvals` | List the actor's actionable pending steps. | Approver |
| POST `ORG/requests/{requestId}/steps/{stepId}/approve` | Decide the current pending step. | Assigned approver |
| POST `ORG/requests/{requestId}/steps/{stepId}/reject` | Reject with a required reason. | Assigned approver |
| POST `ORG/requests/{requestId}/steps/{stepId}/reassign` | Replace an eligible assignee with an audit reason. | Administrator |
| GET `ORG/audit-events` | Read authorized organization history. | Administrator or auditor |

New organization provisioning and initial account creation are development/bootstrap concerns in v0.1. Public self-registration, email invitations, and password recovery are deferred until their complete security and delivery flows are scoped. The member-add endpoint must not offer global user search or expose unrelated profiles.

## v0.2 resources

| Method and path | Purpose |
| --- | --- |
| POST `ORG/workflows` | Create an administrator-owned workflow definition draft. |
| PATCH `ORG/workflows/{workflowId}` | Edit draft configuration using its expected draft revision. |
| POST `ORG/workflows/{workflowId}/validate` | Validate and preview the proposed schema and routing. |
| POST `ORG/workflows/{workflowId}/publish` | Create an immutable published version from the expected draft revision. |
| GET `ORG/workflows/{workflowId}/versions` | List authorized published-version metadata. |
| GET `ORG/workflows/{workflowId}/versions/{versionId}` | Inspect a permitted historical configuration. |
| POST `ORG/workflows/{workflowId}/archive` | Prevent new submissions while retaining active requests. |

All write operations in this table require administrator permission. The version-inspection response must not expose membership details beyond the caller's permissions.

## v0.3 resources

| Method and path | Purpose |
| --- | --- |
| POST `ORG/requests/{requestId}/attachments` | Upload an allowed private file to an owned draft. |
| DELETE `ORG/requests/{requestId}/attachments/{attachmentId}` | Remove an attachment from an owned draft. |
| GET `ORG/requests/{requestId}/attachments/{attachmentId}/download` | Authorize a download of a clean file. |
| GET `ORG/notifications` | List the actor's notifications. |
| POST `ORG/notifications/{notificationId}/read` | Mark an owned notification as read. |
| GET and POST `ORG/webhook-endpoints` | Inspect or configure authorized destinations. |
| PATCH `ORG/webhook-endpoints/{endpointId}` | Update permitted endpoint settings or disable delivery. |
| POST `ORG/webhook-endpoints/{endpointId}/rotate-secret` | Rotate signing credentials through a controlled flow. |
| GET `ORG/webhook-deliveries` | Inspect organization-scoped delivery state. |
| GET `ORG/webhook-deliveries/{deliveryId}/attempts` | Inspect redacted delivery attempts. |
| POST `ORG/webhook-deliveries/{deliveryId}/replay` | Request an audited replay after terminal failure. |
| GET `ORG/overview` | Return scoped request and aging summaries. |

Webhook configuration requires administrator permission and destination restrictions. Notifications and downloads enforce both organization and resource-level authorization.

## Mutation contracts

Draft edits include an expected request revision. Submission includes an expected request revision, the reviewed published version identifier, and an `Idempotency-Key` header. Decision, cancellation, and reassignment commands include the expected request revision and also use idempotency protection.

Canonical payload hashes include the actor's organization context, target resource, action, and validated business input. Reusing a key with different input returns a conflict. Duplicate successful requests return the original safe result within the retention window; permanent state constraints continue to prevent repeated transitions afterward.

Business idempotency is not inferred from a disabled browser button or the client's network retry behavior.

## Response behavior

Successful single-resource responses use a `data` object. List responses use `data` plus pagination `meta` and navigation links. Responses expose only fields the caller is authorized to see.

Errors contain a stable machine-readable code, a user-facing message, an optional field-error map, and a correlation identifier. This is a FlowOps convention, not a claim of compliance with a separate API response standard.

| Status | Intended use |
| --- | --- |
| 200 | Successful read or action returning a result. |
| 201 | Draft, configuration, or other resource created. |
| 202 | A permitted background action accepted. |
| 204 | Successful logout or deletion with no response body. |
| 401 | No valid authenticated session. |
| 403 | Known in-organization action is forbidden to this actor. |
| 404 | Missing resource or resource outside the caller's authorized organization visibility. |
| 409 | Stale revision, changed published version, terminal state, or idempotency conflict. |
| 419 | Laravel session/CSRF mismatch; return controlled session recovery guidance. |
| 422 | Invalid fields, unsupported configuration, or an ineligible assignment. |
| 429 | Rate limit reached. |

## Specification work deferred until implementation

Exact request schemas, field limits, pagination cursors, OpenAPI validation, and framework authentication wiring will be finalized with the implementation. This document must not be presented as a generated or tested API specification.
