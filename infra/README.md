# Infrastructure

`router.php` is a router for the local PHP development server. The repository itself is not a public web root. Production deployments must expose only built frontend assets and `apps/api/public` behind correctly configured HTTPS routing.

The prepared workstation has ignored project-local PHP and PostgreSQL runtimes. `npm run dev` can start that isolated database when it is not running. No machine-wide Laragon configuration was changed.

The GitHub Actions workflow provisions PostgreSQL 17 for verification. A public hosting provider, production deployment, Docker configuration, and operational service commitments are outside this release.
