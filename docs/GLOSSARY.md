> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../README.md) and the shipped release documents.

# FlowOps glossary

| Term | Meaning in this project |
| --- | --- |
| Organization | An isolated workspace with its own membership, configuration, and records. |
| Tenant | The engineering term for an organization using the shared application. |
| Membership | A user's active or inactive relationship with one organization. |
| Role | A named group of permissions within an organization. |
| Requester | A member permitted to create and submit requests. |
| Approver | A member eligible to decide a specifically assigned approval step. |
| Administrator | A member permitted to manage organization configuration and memberships. |
| Auditor | A member with read access to organization history and no decision authority. |
| Workflow definition | The administrator-managed identity and editable draft of a business process. |
| Published version | An immutable form and approval-policy snapshot. |
| Request | One draft or submitted execution of a business process. |
| Submission snapshot | Validated answers and route retained when a request is submitted. |
| Route | The ordered approval steps selected from a published policy. |
| Step | A concrete unit of approval work assigned to a member. |
| Terminal state | Approved, rejected, or cancelled; ordinary execution cannot resume. |
| Revision | A changing resource counter used to detect stale updates. |
| Idempotency | Repeating the same protected action returns the original effect instead of creating another. |
| Transaction | A group of database changes committed or rolled back together. |
| Row lock | A database mechanism for coordinating concurrent changes to a record. |
| Outbox | Durable event records committed with business state before background publishing. |
| Event effect | One tracked internal result of processing an event, with deduplication and recovery state. |
| Webhook | A signed outbound HTTP notification to an approved external receiver. |
| At-least-once delivery | Delivery may be repeated; the receiver needs deduplication. |
| Audit history | Authorized business and administrative action history. |
| Observability | The ability to investigate behavior using suitable logs, metrics, and state. |
| Modular monolith | One backend deployment with clear internal responsibilities. |
| Vertical slice | A small complete user journey that crosses the interface, API, and database. |
| MVP | The smallest usable release that validates the chosen core journey. |
| SLA | A service commitment; no availability or latency SLA is defined in this proposal. |
