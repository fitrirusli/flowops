# Contributing

Read the [current release scope](docs/RELEASE_SCOPE.md) and [implementation](docs/IMPLEMENTATION.md). The owner has authorized implementation of the smaller purchase approval engine.

## Conventions

- Use English for documentation, product text, identifiers, and comments.
- Write React components in JavaScript and JSX. Do not introduce TypeScript application code.
- Keep business transitions inside backend services and authorization on the server.
- Preserve immutable published policies and submitted request details.
- Keep organization context in every tenant query and browser cache key.
- Keep synthetic data, credentials, generated output, and local runtimes out of commits as appropriate.
- Update tests when a change introduces meaningful business behavior or failure cases.

## Verification

Run `npm test` for the backend, frontend helpers, PostgreSQL concurrency scenarios, and production build. Start the development servers and run `npm run test:e2e` for browser journeys. See [local development](docs/LOCAL_DEVELOPMENT.md) for a dedicated test database.

PHP changes must follow the nested Laravel guidelines and formatting configuration. Describe the user problem, resulting behavior, and verification in a change description.

## Publication

Repository publication is authorized by the owner. Hosted deployment remains separate. The owner has not selected an open-source license; the Laravel framework and other dependencies retain their own licenses.
