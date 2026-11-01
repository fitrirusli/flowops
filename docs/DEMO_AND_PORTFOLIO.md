> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps demo and portfolio plan

Status: planned demonstration. There is no live application, video, screenshot, or benchmark yet.

## Reviewer experience

The root README should explain the product in a few paragraphs and link to a usable demo when one exists. A reviewer who wants more detail can inspect architecture decisions, a complete request journey, critical tests, and measured results.

Keep screenshots and videos tied to a release. Label any design-only material clearly rather than presenting it as a working screen.

## Synthetic demonstration organizations

Use Northstar Labs and Cedar Works with separate memberships, configurations, requests, and histories. Include a multi-organization user with different roles to demonstrate that permissions follow the selected workspace.

Shared public demonstration accounts will have constrained capabilities. Do not expose real personal information, production credentials, or an unrestricted organization administrator.

## Short product video

Target approximately 90 seconds for the ordinary user story:

1. Explain the purchase approval problem in one sentence.
2. Submit a purchase request and show the current responsible step.
3. Process the assigned approvals and display the history.
4. Open the second organization to show a separate workspace.
5. End with the repository and documentation links.

If the video includes v0.2 behavior, show the route selected for a MYR 15,000 request. If it shows only v0.1, describe the fixed manager-then-finance sequence accurately.

## Technical walkthrough

A separate five-to-ten-minute walkthrough can demonstrate:

- A workflow publication followed by an older request retaining its original version.
- A stale draft requiring review before submission.
- A duplicate decision or concurrent action producing one valid business outcome.
- Denied cross-organization API access through an actual integration test.
- A controlled webhook failure, retry history, recovery, and stable event ID in v0.3.
- The transaction boundary, tenant constraints, and test evidence behind those behaviors.

Do not squeeze every technical explanation into the short product video.

## Repository evidence

Before publication, provide verified setup instructions, architecture and relationship diagrams, decision records, critical automated tests, CI results, a changelog, implemented release scope, and known limitations.

Add screenshots of the request editor, approval inbox, request history, workflow configuration when implemented, and delivery history when implemented. Capture synthetic data only.

## Performance and reliability claims

Publish actual measurements with the exact environment and workload. Show limitations, error rates, and reproduction steps. A local load test does not prove production traffic capacity or long-term availability.

Distinguish tested recovery from general promises. Explain that webhook delivery is at least once and requires receiver deduplication. Do not claim exactly-once external effects or an uptime percentage without suitable evidence.

## Volunteer validation

Ask three to five testers to complete representative tasks. Record completion, confusing steps, and follow-up improvements with their consent. Report the actual sample and method. Do not invent conversion, productivity, or customer-adoption figures.

## Interview discussion prompts

- Why does each request retain a published workflow version?
- What happens when approval and cancellation arrive together?
- How is a membership change enforced for an existing browser session?
- How do background workers recover after queue loss?
- Why can a webhook receiver see the same event twice?
- What trade-offs come with a shared tenant database?
- What problems are prevented by the selected constraints and tests?
- What would need to change for a substantially larger deployment?

Answers should refer to the implemented release and its evidence. The [FAQ](FAQ.md) supplies initial explanation material, not claims of completed implementation.

## Publication checklist

Review secrets and project ownership, select a license, confirm screenshots contain synthetic data, verify all public links, and publish only when the owner asks for that step. No public repository, remote, demo URL, or social post has been created during planning.
