> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps operations plan

Status: future operating design. No deployment, live service, backup, or monitoring exists.

## Deployment stages

Local development is the first target. A private review deployment follows a verified v0.1 journey. A restricted public portfolio demo follows a release rehearsal and an explicit publication instruction.

The first deployment may serve static React assets and the Laravel API behind one TLS origin. PostgreSQL is private. Redis, workers, the scheduler, storage, and scanning are introduced only with the relevant features.

## Process responsibilities

| Process | Responsibility |
| --- | --- |
| Web/API | Authenticate, authorize, validate, and execute transaction-protected business commands. |
| PostgreSQL | Store authoritative state and later durable outbox/effect records. |
| Outbox publisher | Enqueue committed work and retry safely after interruptions. |
| Worker | Process deduplicated effects and update durable delivery state. |
| Scheduler | Find due reminders and recover overdue effects or deliveries. |
| Storage/scanner | Quarantine, validate, and serve authorized clean attachments. |

One scheduler owner or equivalent locking is needed to avoid overlapping work. Locks are supplemented by durable uniqueness constraints.

## Deployment rehearsal

Before release, verify the selected runtimes, secrets, TLS, private network access, database migration path, application health, and rollback compatibility. Build assets and run required checks from committed lockfiles.

Apply backward-compatible migrations where possible, deploy the application, restart long-lived workers with compatible code, and smoke-test authentication, organization isolation, a complete approval journey, and included background work.

Exact commands depend on the eventual hosting choice and will be added only after they are exercised.

## Observability

Record correlation IDs, action outcomes, API latency, database errors, pending-step age, outbox age, effect recovery count, webhook failure rate, worker health, and scheduler freshness where those features exist.

Separate liveness from readiness. A live process may still be unable to serve requests if PostgreSQL is unavailable. Queue failures should appear as degraded background processing without implying that committed approval state was lost.

Do not log credentials, session cookies, raw form contents, attachment contents, or unrestricted external response bodies.

## Recovery runbooks to verify

| Symptom | Intended investigation and recovery |
| --- | --- |
| User cannot act on a pending step | Check membership, assignment, request revision, and concurrent history. Reassign through the audited application flow if appropriate. |
| Approvals work but notifications stop | Check worker/scheduler health and durable outbox/effect age. Restore processing and retry overdue work. |
| Redis loses queued messages | Re-enqueue overdue effects from durable PostgreSQL state. |
| Webhook repeatedly fails | Inspect redacted attempts, destination restrictions, endpoint status, and remote health. Replay only eligible terminal failures. |
| An attachment is unavailable | Check scan status, storage access, and authorization. Keep downloads blocked until clean state is verified. |
| A deployment fails | Determine schema compatibility, restore the previous compatible application version, and verify core journeys. |
| A credential is exposed | Revoke/rotate it, inspect relevant access, and remove the exposed material through the appropriate repository and service procedures. |

These are runbook requirements, not completed recovery exercises.

## Backup and restoration

Use encrypted database backups and storage backups for the actual retained data. Define a retention period and perform restoration into a separate environment. Verify tenant boundaries, workflow versions, decisions, attachment references, and pending delivery recovery after restoration.

Backups alone do not establish recovery. Document the last successful restore, observed recovery time, and potential data-loss window. RPO, RTO, and availability commitments are not defined at the proposal stage.

## Public demo limits

Use fictional organizations, synthetic users, safe sample requests, and resettable state. Disable credential changes, user provisioning, arbitrary endpoint registration, and other actions that could affect other visitors or external systems.

Keep delivery demonstrations on a controlled receiver. Apply resource quotas, rate limits, and an explicit reset schedule when the demo is implemented. Do not send real email or permit unrestricted uploads merely to populate the demo.

## Cost and ownership

The owner will select the hosting provider, budget, domain, storage, and any email service. Track resource costs and limits after provisioning. No account, paid service, domain, or cloud resource has been created.
