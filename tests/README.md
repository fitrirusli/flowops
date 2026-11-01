# Verification

- `apps/api/tests/Feature/ApprovalEngineTest.php`: authentication, permissions, tenant boundaries, routing, policy history, idempotency, lifecycle, and database constraints.
- `apps/web/src/lib/format.test.js`: exact MYR minor-unit conversion and invalid-input handling.
- `tests/concurrency.mjs`: three real races using independent PHP processes and PostgreSQL connections.
- `tests/e2e/purchase-journey.spec.js`: real browser sessions, approval journey, policy publication, workspace switching, and responsive navigation.

Run `npm test`, then start the local application and run `npm run test:e2e`. The concurrency suite resets only a dedicated database whose name ends in `_test`. Never point verification at a development or production database.

See [verification](../docs/VERIFICATION.md) for evidence and limits.
