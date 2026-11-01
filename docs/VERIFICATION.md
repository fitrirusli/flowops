# Verification record

## Environment

The implementation is exercised locally on Windows using PHP 8.4.27, PostgreSQL 17.11, Node.js 24.11.1, and Chromium through Playwright. Exact library versions are recorded in Composer and npm lockfiles.

The development database and dedicated test database are separate. The three race scenarios use independent PHP processes and PostgreSQL connections synchronized by a start barrier.

## Checks

Final local results on 27 October 2026:

| Check | Result |
| --- | --- |
| PHPUnit API integration | 24 tests passed, 121 assertions. |
| JavaScript helpers | 4 tests passed, including exact money and timezone boundaries. |
| Independent PostgreSQL races | All 3 scenarios passed. |
| Playwright browser journeys | All 3 scenarios passed on the combined development launcher. |
| Frontend production build | Passed. |
| Composer manifest and lock validation | Passed. |
| Laravel Pint formatting | Applied successfully. |
| Setup command on the prepared workstation | Passed; existing data preserved. |
| Markdown links and source language | 94 local links valid; no application TypeScript source. |

The commands are:

- `npm test`: backend integration, JavaScript helpers, PostgreSQL concurrency scenarios, and frontend production build.
- `npm run test:e2e`: actual browser login, complete sequential approval, policy publication, historical version preservation, organization switching, and mobile navigation.
- Composer validation and Laravel Pint formatting.
- Local Markdown link and source-language checks.

## Concurrency evidence

## Hosted CI environment isolation

The first GitHub Actions run on 1 November 2026 exposed application database settings inherited by the API test process. The test database guard correctly refused to run against that configuration.

The test launcher now explicitly selects PostgreSQL, `flowops_test`, an empty database URL override, and array-backed cache/session drivers before Artisan starts. The database guard remains unchanged. A local regression run with inherited application settings passed all 24 API tests and 121 assertions.

The latest hosted result is available in [GitHub Actions](https://github.com/fitrirusli/flowops/actions/workflows/ci.yml).

## Concurrency evidence

The implemented race suite covers simultaneous approve/reject, simultaneous approve/cancel, and simultaneous duplicate submission using one idempotency key. These are real overlapping database operations rather than sequential mocked requests.

## Browser evidence

Screenshots are generated under `.local/screenshots` and are visually inspected during development. Failure traces stay under ignored `test-results`. These are local QA artifacts, not a hosted demo or a user video.

## Limits

GitHub Actions has executed; the latest hosted result is linked above. A fresh machine installation has not been independently rehearsed. No public application deployment, customer pilot, production traffic benchmark, uptime measurement, backup restoration exercise, or compliance assessment is claimed.

The project does not contain the deferred dynamic builder, attachments, background workers, or integrations. Earlier planning documents describe those as future possibilities and are not implementation evidence.
