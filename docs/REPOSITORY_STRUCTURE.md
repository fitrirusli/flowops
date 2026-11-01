> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps repository structure

## Existing structure

The current tree contains documentation and repository housekeeping only.

```text
FlowOps/
  README.md
  AGENTS.md
  CONTRIBUTING.md
  CHANGELOG.md
  .editorconfig
  .gitattributes
  .gitignore
  apps/
    web/
      README.md
    api/
      README.md
  docs/
    README.md
    PROJECT_PROPOSAL.md
    PROPOSAL_REVIEW.md
    PRODUCT_REQUIREMENTS.md
    USER_JOURNEYS.md
    ARCHITECTURE.md
    WORKFLOW_ENGINE.md
    DATA_MODEL.md
    API_DESIGN.md
    SECURITY_AND_PRIVACY.md
    TEST_STRATEGY.md
    DEVELOPMENT_SETUP.md
    REPOSITORY_STRUCTURE.md
    ROADMAP.md
    BACKLOG.md
    OPERATIONS.md
    DEMO_AND_PORTFOLIO.md
    FAQ.md
    GLOSSARY.md
    decisions/
      README.md
      ADR-001-REACT-JAVASCRIPT.md
      ADR-002-MODULAR-MONOLITH.md
      ADR-003-TENANCY-AND-SESSIONS.md
      ADR-004-WORKFLOW-VERSIONING.md
  infra/
    README.md
  tests/
    README.md
```

## Intended implementation layout

The following locations are a plan, not existing source files.

| Location | Intended contents |
| --- | --- |
| `apps/web/src/app/` | Application entry, routing, providers, and layout. |
| `apps/web/src/features/auth/` | Login and session behavior. |
| `apps/web/src/features/organizations/` | Workspace selection and membership screens. |
| `apps/web/src/features/requests/` | Drafts, form entry, request details, and history. |
| `apps/web/src/features/approvals/` | Inbox and decision interactions. |
| `apps/web/src/features/workflows/` | Later administrator configuration and publishing. |
| `apps/web/src/components/` | Reusable interface elements with a real shared need. |
| `apps/web/src/lib/` | HTTP client, shared formatting, and small utilities. |
| `apps/api/app/Http/` | Routes' controllers, request validation, and response resources. |
| `apps/api/app/Policies/` | Organization and resource authorization. |
| `apps/api/app/Models/` | Eloquent models and relationships. |
| `apps/api/app/Actions/` | Business operations grouped by module. |
| `apps/api/app/Jobs/` | Later durable event and delivery processing. |
| `apps/api/database/` | Migrations, factories, and synthetic seeders. |
| `apps/api/tests/` | Backend business and API tests. |
| `tests/e2e/` | Browser journeys in JavaScript. |
| `tests/load/` | Reproducible load scenarios and measurement notes. |
| `infra/` | Future local and deployment infrastructure configuration. |

Keep normal Laravel conventions initially. Separate deployable modules or a custom package architecture are not required by this directory plan.

## Naming and language

React components use `.jsx`. Frontend hooks, helpers, configuration, and browser tests use `.js`. Backend application code uses PHP. Documentation uses Markdown and English.

Avoid `.ts`, `.tsx`, `tsconfig`, and TypeScript application templates. A dependency may internally ship type declarations; that does not require the owner to author TypeScript.

## Files deliberately absent

There are no `package.json`, `composer.json`, dependency lockfiles, `.env` files, migrations, Dockerfiles, CI workflows, executable scripts, or application source files during the planning stage. They will be created only after implementation is authorized.
