# Authorization matrix

The API must authenticate each protected request, authorize the requested
action on the server, and scope user-owned database queries by the owner.
Frontend route guards do not replace these checks.

| Resource / action | Startup owner | Tier-1 supplier | NIB operator | EU compliance |
| --- | --- | --- | --- | --- |
| Own profile | Read/update own | Read/update own | Read own | No access |
| Vouchers | Read own | No access | Create/read all | Aggregate read-only |
| Products | Read verified | Manage own | Read all | Aggregate read-only |
| Orders | Create/read own | Read/dispatch own | Read all | Aggregate read-only |
| Settlements | Read own | Read own | Read all | Aggregate read-only |
| Supplier verification | No access | Submit own | Approve/verify | No access |
| Audit logs | No access | No access | Read | No access |
| Security events | No access | No access | Read | No access |
| EU reports | No access | No access | Read | Read-only |

## Implemented

- The existing `/api/users/me` endpoint returns the authenticated user's
  profile. Public registration remains limited to startup owners and suppliers.
- Audit-log and security-event list endpoints are NIB-operator-only.
- The voucher demonstration permits operators to allocate/list vouchers,
  startup owners to read only their own vouchers, and EU compliance officers
  to read aggregate totals.
- Every `/api/ops/*` route authenticates and requires the NIB system operator
  role. Supplier verification writes are rate limited and transactionally
  audit logged.
- Operator APIs provide read-only voucher, order, and escrow monitoring.
- The beneficiary product catalog is restricted to active products from
  verified suppliers.
- Authentication and role checks run before route handlers. Unknown
  permission names fail during route setup.
- Request bodies, filters, and route parameters are validated before use.

The Week 2 voucher allocation route still associates its recipient directly
with a `WOMEN_STARTUP_OWNER` user. Week 3 adds optional startup profile links
and domain status values for monitoring while retaining the legacy status
values. Operator routes never change voucher, order, escrow, settlement, or
clearing data.
