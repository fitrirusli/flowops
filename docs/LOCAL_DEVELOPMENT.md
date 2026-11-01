# Local development

## Prepared workstation

The project is located at `C:\laragon\www\personal\FlowOps`.

Project-local ignored runtimes are prepared under `.local/runtime`: PHP 8.4.27, Composer, and PostgreSQL 17.11. PostgreSQL data lives in `.local/postgres` and listens only on 127.0.0.1:55432. It does not replace the existing Laragon PostgreSQL service on port 5432 or the system PHP executable.

The application environment files contain the dedicated local database credentials and generated application key. These files and runtime data are ignored by Git.

From the project root:

```sh
npm run dev
```

This starts the API on 127.0.0.1:8011 and Vite on 127.0.0.1:5173. It also starts the prepared isolated PostgreSQL instance when necessary. Ctrl+C stops the application servers and any database instance started by that invocation.

Do not serve the repository root through Apache. A root `.htaccess` denies direct repository access; the normal local entry point is the Vite URL.

## Fresh checkout prerequisites

- Node.js 24 with npm.
- PHP 8.3 or newer, preferably a current compatible PHP 8.4 patch, with pdo_pgsql, mbstring, openssl, curl, fileinfo, intl, and zip.
- Composer 2.
- PostgreSQL 17 and two dedicated databases: `flowops` and `flowops_test`.

Use a database account authorized for those databases. Test migrations need permission to create and drop tables inside the test database. Avoid using a production database account or database.

The runtime binaries are not part of the repository. `FLOWOPS_PHP` can specify a PHP executable. `COMPOSER_PHAR` can specify a Composer PHAR when Composer is not on PATH.

## Fresh checkout setup

1. Copy `apps/api/.env.example` to `apps/api/.env`.
2. Configure the dedicated PostgreSQL host, port, database, username, and password. Keep `APP_ENV=local` for local setup.
3. Enable `FLOWOPS_DEMO_MODE=true` if you want the local sign-in page to offer the synthetic account shortcuts.
4. Run the setup command from the root.

```sh
npm run setup
```

The command installs locked backend and frontend dependencies, generates an application key if missing, applies migrations, seeds synthetic local data if the application has no organizations, and builds the frontend. It does not create databases or change installed system runtimes.

Stop the development servers before running setup. The setup command checks the application ports first, because Windows locks native dependency files while Vite is running.

The seed operation is additive only on an empty application and skips an existing organization dataset. It never resets the development database. Demo seeding is restricted to local or testing environments.

## Demo users

All synthetic users use `FlowOpsDemo!2026` locally.

| Account | Organization roles |
| --- | --- |
| alex@flowops.test | Northstar administrator/requester; Cedar auditor. |
| maya@flowops.test | Northstar manager approver. |
| noah@flowops.test | Northstar finance approver. |
| sarah@flowops.test | Northstar requester; Cedar administrator/requester. |
| felix@flowops.test | Cedar manager approver. |
| ava@flowops.test | Cedar finance approver. |
| jordan@flowops.test | Northstar auditor. |

These are development accounts, not production credentials. The credential shortcut endpoint is unavailable unless demo mode is enabled and the application environment is local or testing.

## Tests

Copy `apps/api/.env` to `apps/api/.env.testing`, set `APP_ENV=testing`, and set `DB_DATABASE=flowops_test`. Keep a valid application key and compatible database credentials. The prepared workstation already has this file.

```sh
npm test
```

This runs API integration tests, JavaScript helper tests, independent PostgreSQL race scenarios, and the frontend build. The race suite rebuilds the disposable test schema. The default test database is `flowops_test`; `FLOWOPS_TEST_DATABASE` can change the race suite database only to a name ending in `_test`. PHPUnit deliberately targets `flowops_test`.

For browser tests, keep `npm run dev` running in one terminal, then use another terminal:

```sh
npx playwright install chromium
npm run test:e2e
```

Browser tests create synthetic requests and publish a new policy version in the running local demo. They do not delete those records. Screenshots are stored under ignored `.local/screenshots` and failure traces under ignored `test-results`.

## Commands

| Command | Action |
| --- | --- |
| `npm run setup` | Install and prepare the configured local application. |
| `npm run dev` | Start API and web development servers together. |
| `npm run dev:web` | Start only Vite for an already running API. |
| `npm run test:api` | Run PHPUnit on PostgreSQL. |
| `npm run test:web` | Run JavaScript helper tests. |
| `npm run test:concurrency` | Run independent-process database races. |
| `npm run test:e2e` | Run browser journeys against running servers. |
| `npm run build` | Create production frontend assets. |

## Troubleshooting

A port-in-use error means an existing process already owns 8011 or 5173. Stop the appropriate server; the scripts do not terminate unrelated processes.

A PHP version error means the wrong CLI is selected. Use the prepared project runtime or set `FLOWOPS_PHP` explicitly. Do not downgrade Laravel to fit the machine's PHP 8.1.

A CSRF/session error usually needs a consistent browser hostname and correct proxy settings. Use 127.0.0.1 consistently. Authentication paths, `/api`, and `/sanctum` must reach the same backend; do not bypass the frontend proxy for ordinary browser use.

For an API failure, inspect `apps/api/storage/logs/laravel.log` using the displayed request ID. Do not paste credentials or full environment files into issues.

## Deployment boundary

The included PHP and Vite servers are development servers. A hosted deployment needs HTTPS, a proper PHP web server rooted at `apps/api/public`, built frontend assets, an appropriate application database user, secure cookies, a stable application key, secret management, and a verified backup/restore procedure. No hosted deployment has been performed.
