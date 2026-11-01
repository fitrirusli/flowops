> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps security and privacy design

Status: proposed controls. No security assessment or implemented protection is claimed.

## Assets and trust boundaries

The application will handle identities, organization membership, purchase information, decisions, configuration, attachments, and webhook credentials. The browser, uploaded content, administrator-entered configuration, and external webhook servers are untrusted inputs.

Organization administrators manage their own workspace. They do not receive platform-wide access or a permission to bypass business invariants. Platform maintenance is a separate operational responsibility.

## Main threats and intended controls

| Threat | Intended control |
| --- | --- |
| Access to another organization's records | Membership checks, tenant policies, scoped queries, composite references, and negative integration tests. |
| Unauthorized approval | Current assignment checks, active membership, self-approval prevention, and transaction-protected decisions. |
| Duplicate or conflicting changes | Idempotency, row locking, expected revisions, and database constraints. |
| Session theft or request forgery | HTTPS, secure session cookies, CSRF protection, session rotation, and controlled origins. |
| Script injection through forms | Escaped text rendering, bounded field configuration, and no executable expressions. |
| Malicious files | Private storage, type and size validation, scanning, safe download headers, and request-level authorization. |
| Requests to internal services through webhooks | Restricted destinations, network egress controls, IP validation, and disabled redirects. |
| Credential leakage | Environment-based secrets, encrypted webhook secrets, log redaction, and repository exclusions. |
| Misleading audit assurances | Append-only application paths with explicit limits on privileged database access. |

## Authentication

Use Laravel's password hashing and Sanctum session authentication for the browser application. Set production session cookies to HttpOnly and Secure, use an appropriate SameSite policy, regenerate the session after login, and invalidate it on logout.

CSRF tokens protect session-authenticated mutations. CORS must allow only configured browser origins with credentials; a wildcard credentialed origin is not acceptable. Do not put browser authentication tokens in local storage.

Rate-limit authentication and sensitive mutations. Return generic login failures. Public account recovery and invitations remain deferred until their end-to-end flows are implemented and verified.

## Organization and resource authorization

Resolve an organization from a validated route parameter, then verify active membership. Require resource ownership and action permission inside that organization. Repeat these checks for list filters, relationships, downloads, caches, notifications, and background effects.

Opaque identifiers reduce casual guessing but are not an authorization control. Frontend route guards and hidden buttons are usability features, not security boundaries.

Membership deactivation takes effect on the next authorized operation even if the user still has a valid global session. Background jobs carry explicit organization and event identifiers, establish their own context, and clear it between jobs.

## Configuration safety

Use allowlisted field types, operators, and bounded sizes. Reject unknown control fields. Never interpret form definitions, rule strings, or templates as executable code. Render user text without unsafe raw HTML injection.

Published versions are immutable through normal application operations. Changes to membership, configuration, publication, reassignment, and integration settings produce audit events.

## Private attachments in v0.3

The initial proposal permits PDF, JPEG, and PNG files up to 10 MB per file and five files per request. These are proposed product limits to confirm during implementation.

Validate file content and MIME information, randomize storage keys, keep files outside the public web root, and retain original names only as sanitized metadata. New files remain quarantined until scanning succeeds. Downloads fail closed while scanning is unavailable or reports a problem.

Before download, verify the current organization, the viewer's access to the request, and the file's clean scan state. Use attachment disposition and content-type protections. Any storage URL must be short-lived and issued only after authorization.

If a scanning path is not available, attachment functionality stays disabled rather than being released with an unverified safety claim.

## Outbound webhook restrictions in v0.3

Only administrators can configure approved HTTPS destinations. The initial deployment uses a maintainer-controlled hostname allowlist. Resolve and validate all IPv4 and IPv6 addresses for every attempt, block loopback, private, link-local, metadata, and other non-public ranges, and enforce equivalent network egress restrictions.

Prevent DNS rebinding by ensuring the connection uses an address that was validated for that attempt while retaining TLS hostname verification. Disable redirects so a permitted destination cannot redirect to an internal service. Apply short connection and response timeouts and a small response-size cap.

Sign payload bytes using HMAC-SHA256 with a per-endpoint secret. Include an event ID, timestamp, and signature headers. Document receiver-side timestamp tolerance, signature verification, and event-ID deduplication. Encryption and signature verification details will be tested with the final delivery contract.

Local failure demonstrations use a deliberately isolated test receiver under a test-only transport. Production destination restrictions must not be weakened to make a demo work.

## Data minimization and logging

Collect only information needed for the approval use case. Use fictional organizations and synthetic requests in the public demo. Do not import resumes, employer data, real payroll records, or private research information.

Logs contain correlation identifiers, action categories, timing, and redacted outcomes. They do not contain passwords, cookies, webhook secrets, complete form answers, file contents, or arbitrary external response bodies.

Audit history records business actions and actors. It is distinct from diagnostic logging. Normal users cannot edit history, but privileged infrastructure access can still affect stored records; tamper-evidence would require additional controls.

## Retention and data handling

Before real organizational use, define retention periods for requests, attachments, audit events, delivery metadata, idempotency records, and backups. Define a controlled account and organization removal process that addresses historical references and backups.

Keep secrets out of version control, rotate exposed credentials, and restrict database and storage access by service responsibility. Public demonstration accounts must not grant unrestricted platform administration or arbitrary external integration access.

## Release verification

The release must include tenant-isolation tests, permission tests, concurrency tests, dependency review, and a manual session/file/webhook review for the features actually included. Passing these checks does not establish regulatory certification or eliminate the need for future security review.
