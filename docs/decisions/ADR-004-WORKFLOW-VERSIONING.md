> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../../README.md) and the shipped release documents.

# ADR 004 Workflow versioning and bounded execution

Status: proposed.

Date: 27 October 2026.

## Context

Approval policies and forms change over time. Active requests need stable meaning, and a portfolio project needs a workflow engine whose behavior can be explained and tested.

## Decision

Keep editable draft configuration separate from immutable published versions. Bind each submitted request to one published version and retain validated answers and its resolved route.

Begin with sequential approvals and bounded amount conditions. Do not evaluate arbitrary expressions or support cycles. Runtime reassignment is a distinct audited operation and does not mutate the published policy.

## Alternatives

Always reading the latest policy would let an administrator's edit change an in-progress request. Copying mutable configuration without a version identity would make policy comparison and provenance harder. A general workflow language would enlarge scope and the validation surface considerably.

## Consequences

Published records and submission snapshots consume additional storage. Drafts need explicit version-conflict handling. Historical interfaces must distinguish the original policy from later runtime reassignment.

## Revisit condition

Add parallel approvals or richer operators only after a concrete use case, a revised execution model, and suitable concurrency and validation tests are defined.
