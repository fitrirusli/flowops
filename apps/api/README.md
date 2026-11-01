# FlowOps API

Laravel 13 and PostgreSQL power the purchase approval engine. Authentication uses Sanctum with first-party browser sessions and CSRF protection.

Controllers validate requests and delegate business transitions to `ApprovalEngine`. `TenantAccess` scopes resource visibility and permissions. `RequestPresenter` returns the caller's permitted request and policy representation.

Run commands from the repository root using the scripts documented in [local development](../../docs/LOCAL_DEVELOPMENT.md). The active Laragon PHP 8.1 runtime is not compatible with this application; the prepared machine uses a project-local PHP 8.4 runtime.

See the [implemented API reference](../../docs/API_REFERENCE.md) and [verification record](../../docs/VERIFICATION.md).
