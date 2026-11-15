# Week 2 authorization matrix

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

## Implemented in this phase

- The existing `/api/users/me` endpoint returns the authenticated user's
  profile. Public registration remains limited to startup owners and suppliers.
- Audit-log and security-event list endpoints are NIB-operator-only.
- The voucher demonstration permits operators to allocate/list vouchers,
  startup owners to read only their own vouchers, and EU compliance officers
  to read aggregate totals.
- Authentication and role checks run before route handlers. Unknown
  permission names fail during route setup.
- Request bodies, filters, and route parameters are validated before use.

Product, order, settlement, supplier-verification, and EU-report routes are
future modules. Their rows document the intended policy; they do not authorize
adding those business routes or changing escrow, settlement, or clearing logic
in this phase.

The voucher demo associates the recipient directly with a
`WOMEN_STARTUP_OWNER` user. This is a temporary relationship because the
repository has no agreed `StartupProfile` model. Confirm the business
relationship with the team before extending the voucher data model.
