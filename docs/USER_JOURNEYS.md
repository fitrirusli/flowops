> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps user journeys and interface plan

Status: proposed interaction design. No screens have been implemented.

## Interface direction

Use a clear workspace layout with organization switching, a small primary navigation, readable tables, labeled status badges, and a request timeline. The priority is understanding who needs to act and what happens next.

The interface is desktop-first and adapts to mobile. Forms use visible labels, error summaries, descriptive buttons, and keyboard-friendly controls. Color supplements text rather than carrying meaning alone.

## Planned screens

| Screen | Primary user | Main actions |
| --- | --- | --- |
| Sign in | All users | Sign in, receive errors, and recover an expired session. |
| Organization chooser | Multi-organization members | Choose an authorized workspace. |
| Workspace overview | All members | See accessible requests and pending responsibilities. |
| My requests | Requester | Filter owned requests and start a draft. |
| Request editor | Requester | Enter answers, save a draft, review, and submit. |
| Request details | Authorized viewer | Read the snapshot, current step, decision history, and status. |
| Approval inbox | Approver | Open pending work and approve or reject. |
| Members and roles | Administrator | Manage membership and eligible approvers. |
| Workflow configuration | Administrator | Configure fields and routing, validate, preview, and publish in v0.2. |
| Audit history | Administrator or auditor | Filter business and administrative history. |
| Delivery history | Administrator | Inspect webhook attempts and replay eligible failures in v0.3. |

## Journey 1 Submit a purchase request

1. The requester signs in and chooses Northstar Labs.
2. They open My requests and create a purchase request.
3. The form explains required information and the approval policy.
4. They save a draft and may return to it later.
5. They review the purchase amount, justification, and intended approval route.
6. They submit. The server validates current membership, answers, configuration, and approver eligibility.
7. The details screen shows the request as pending and names the current step.

If the current policy changed after the draft was loaded, show a review prompt, identify affected fields, and require resubmission against the current version. Preserve entered answers where safe.

## Journey 2 Process an approval

1. An assigned approver opens the inbox for the current organization.
2. They read the submitted information and previous decisions.
3. They choose approve or reject. Rejection requires a reason.
4. The server checks the assignment and applies a transaction-protected transition.
5. The interface shows the resulting state and refreshes the inbox.

If another action already changed the request, show that the task is no longer actionable and refresh the details. Disabling a button improves feedback but does not replace server-side concurrency protection.

## Journey 3 Recover an unavailable approver

1. An administrator identifies a pending step assigned to an unavailable member.
2. They select an eligible replacement and supply a reason.
3. The server verifies organization membership, self-approval restrictions, and step state.
4. The timeline records the old assignee, new assignee, reason, and actor.
5. The original assignee loses the ability to decide that pending step.

Reassignment changes the active assignment, not the historical workflow policy or earlier decisions.

## Journey 4 Publish a revised policy

Available from v0.2.

1. An administrator edits the workflow's mutable draft configuration.
2. They preview example amounts below, at, and above MYR 5,000.
3. Validation checks field rules, valid routes, and eligible named approvers.
4. Publishing creates an immutable version and updates the current version pointer.
5. Existing submitted requests retain their original version. New submissions use the current version after review.

The publish confirmation explains the effect on new submissions and existing requests.

## Journey 5 Inspect an integration failure

Available from v0.3.

1. A completed request creates a durable event for its organization's webhook endpoint.
2. An administrator opens delivery history after a failed attempt.
3. They see a redacted failure category, attempt number, next attempt time, and stable event ID.
4. Automatic retries proceed within the configured limits, or an authorized administrator requests a manual replay after terminal failure.
5. A successful delivery is recorded without repeating the approval transition.

## Shared interaction states

| State | Expected behavior |
| --- | --- |
| Loading | Show progress without displaying another organization's cached records. |
| Empty | Explain what belongs here and show a permitted next action. |
| Invalid form | Identify fields, keep valid answers, and focus an accessible error summary. |
| Expired session | Explain the session expiry and return to sign in safely. |
| Forbidden or missing record | Avoid exposing information about inaccessible records. |
| Changed version or state | Explain the conflict and reload authoritative information. |
| Network failure | Preserve local input where safe and offer a clear retry. |
| Successful action | Show the resulting state and next responsible step. |

## Data entry and presentation

Use MYR currency formatting for sample amounts while storing exact minor-unit integers. Show human-readable timestamps in the viewer's selected timezone and retain UTC on the server. The initial default presentation timezone is Asia/Singapore.

Avoid displaying infrastructure terms, internal IDs, or stack traces in ordinary user flows. Technical identifiers may appear in administrator delivery details and support diagnostics when useful.

## Prototype boundary

No wireframes, component code, generated designs, or frontend routes exist yet. Screen names describe intended behavior and can be refined during implementation.
