> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps development setup plan

Status: environment inventory and future setup plan. The application cannot run yet.

## Current workspace

The project directory is `C:\laragon\www\personal\FlowOps`. It contains documentation and repository preparation files only. There is no React application, Laravel application, database schema, dependency lockfile, environment file, or container configuration.

Do not run scaffold or installation commands during the current planning stage. A later owner instruction will start implementation.

## Observed local tools

Inventory date: 27 October 2026. These observations describe CLI tools on the current PATH; they do not establish running services or the complete machine configuration.

| Tool | Observed result | Meaning for later implementation |
| --- | --- | --- |
| Git | Executable found | Available for local repository management. |
| Node.js | v24.11.1 | Node 24 is the proposed LTS major; review its current patch and package compatibility before installation. |
| npm | Command found; version not checked | Verify the package manager during scaffolding. |
| PHP | 8.1.10 | Does not satisfy the proposed Laravel 13 minimum of PHP 8.3. |
| Composer | Command found; version not checked | Verify Composer and its PHP executable after selecting the project runtime. |
| PostgreSQL client | psql 14.5 | This is a client version, not proof of a database server version or a running service. |
| Docker | Command not found on PATH | Installation and daemon availability are not established. |
| Redis | redis-server command not found on PATH | Service availability is not established. |

No application dependencies were installed and no existing tools, services, or databases were changed for this inventory.

## Proposed runtime baseline

| Component | Planning baseline |
| --- | --- |
| Frontend | React with JavaScript and JSX, built by Vite using its JavaScript React template. |
| Node.js | Supported Node 24 LTS patch compatible with selected packages. |
| Backend | Laravel 13 with a current compatible PHP 8.4 patch. |
| Database | PostgreSQL 17 with a current supported patch. |
| Background processing | Supported Redis release and compatible PHP client, selected for v0.3. |
| Local email inspection | Development-only mail sink, selected when notifications are implemented. |

These are proposed major versions. No package versions have been pinned. At implementation, record exact versions, review compatibility, and commit the resulting application lockfiles.

## Runtime gap and isolation

The active Laragon PHP 8.1 runtime must not be used to scaffold Laravel 13. The implementation setup should use a compatible project runtime without silently changing unrelated Laragon projects.

The recommended reproducible direction is a project-specific Docker Compose environment once Docker availability is confirmed. A documented native Laragon option may use a compatible side-by-side PHP installation and a separate FlowOps database. Do not point an upgraded PostgreSQL server at an existing older data directory.

Select one working primary setup, verify it end to end, and then document the alternative only if it has been exercised. Existing machine-wide tools should not be replaced as an incidental project change.

## Planned local topology

| Component | Suggested local endpoint | Notes |
| --- | --- | --- |
| Vite web application | `http://localhost:5173` | Browser-facing development origin. |
| Laravel API | `http://localhost:8000` | Accessed through the frontend development proxy. |
| PostgreSQL | Private local port, commonly 5432 | Use a dedicated database and credentials; check port availability. |
| Redis in v0.3 | Private local port, commonly 6379 | Do not expose publicly. |

Keep one consistent hostname. The proxy must forward API routes, login, logout, and the CSRF-cookie endpoint. Final session, stateful-domain, and proxy settings must be verified through an actual browser login test.

## Implementation setup sequence

After authorization:

1. Recheck runtime requirements and select isolated compatible tools.
2. Confirm that the reserved application directories contain only their planning README files; preserve or relocate those notes before scaffolding.
3. Scaffold Vite with the JavaScript React template and Laravel into their designated directories.
4. Add the smallest dependency set needed for the first vertical slice.
5. Create safe environment examples with placeholders and ignored local environment files.
6. Create a dedicated PostgreSQL development database and a separate disposable test database.
7. Implement migrations and synthetic organizations/accounts for local development.
8. Configure session authentication and the local proxy.
9. Verify login, a protected API request, logout, and tenant-context denial in the browser.
10. Document only the commands that actually succeed on the chosen setup.

There are intentionally no copy-and-run installation commands yet: manifests, framework files, and verified commands do not exist.

## Configuration categories to document later

Application URL and environment, database credentials, session and CSRF domains, allowed origins, log configuration, and later Redis, private storage, scanning, mail, and webhook egress settings.

Only public frontend configuration may be bundled into browser assets. Database passwords, signing secrets, and service credentials belong in backend environment configuration or a deployment secret store.

## Official references

- [Laravel 13 release notes](https://laravel.com/docs/13.x/releases): minimum PHP 8.3 and supported PHP versions.
- [Vite getting started](https://vite.dev/guide/): JavaScript React template and Node requirements.
- [Node.js release status](https://nodejs.org/en/about/previous-releases): use a supported LTS line for deployment.
- [PostgreSQL version policy](https://www.postgresql.org/support/versioning/): supported major versions and current minor-release guidance. PostgreSQL 14 reaches its listed end of support on 12 November 2026.

References were checked on 27 October 2026 and must be reviewed again before implementation.
