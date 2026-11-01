> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../../README.md) and the shipped release documents.

# ADR 001 React JavaScript

Status: owner requirement recorded.

Date: 27 October 2026.

## Context

The owner knows React JavaScript and explicitly asked that FlowOps avoid TypeScript because they need to understand and maintain the application.

## Decision

Use React with JavaScript and JSX. Use Vite's JavaScript React template when scaffolding is authorized. Components use `.jsx`; hooks, utilities, configuration, and browser tests use `.js`.

Do not add TypeScript application source, `tsconfig`, or a TypeScript starter. Third-party packages may ship internal type declarations without changing the application language.

## Alternatives

TypeScript could provide compile-time data-shape checks, but it conflicts with the owner's explicit requirement. It is not selected.

## Consequences

Use readable component boundaries, consistent naming, runtime response validation where useful, authoritative backend validation, linting, and behavioral tests. Keep examples understandable to an experienced React JavaScript developer.

## Revisit condition

Revisit only if the owner explicitly changes the language requirement. Do not migrate automatically because a library's examples use TypeScript.
