# Student 4 Week 6 RBAC test matrix

This matrix records the Week 6 role checks against the Week 5 integration
branch. “Blocked” means the endpoint is not present in this branch and must
not be treated as a successful authorization test.

| Required scenario | Endpoint / evidence | Expected | Result |
| --- | --- | --- | --- |
| Startup accesses own profile | `GET /api/users/me`; `server/test/auth.test.js` | 200 | PASS |
| Startup accesses another startup profile | No public profile-by-ID route; the operator-only `GET /api/ops/users/:id` rejects a startup; `server/test/operations.test.js` | Denied | PASS for available routes |
| Supplier accesses own products | Supplier product-management endpoint is not mounted in this branch | Allowed | BLOCKED pending integration |
| Supplier accesses another supplier's products | Supplier product-management endpoint is not mounted in this branch | Denied | BLOCKED pending integration |
| Supplier dispatches own `PLACED` order | Supplier dispatch endpoint is not mounted in this branch | Allowed | BLOCKED pending integration |
| Supplier dispatches another supplier's order | Supplier dispatch endpoint is not mounted in this branch | Denied | BLOCKED pending integration |
| Operator allocates voucher | `POST /api/vouchers`; `server/test/auth.test.js` | 201 | PASS |
| Startup allocates voucher | `POST /api/vouchers`; `server/test/auth.test.js` | 403 | PASS |
| EU officer reads reports | `GET /api/vouchers/summary`; `server/test/auth.test.js` | 200 | PASS for voucher aggregates; other EU reports await Student 5 integration |
| EU officer creates voucher | `POST /api/vouchers`; `server/test/auth.test.js` | 403 | PASS |
| EU officer verifies supplier | `PATCH /api/ops/suppliers/:id/verify`; `server/test/operations.test.js` | 403 | PASS |
| Operator views audit logs | `GET /api/audit-logs`; `server/test/auth.test.js` | 200 | PASS |
| Supplier views audit logs | `GET /api/audit-logs`; `server/test/auth.test.js` | 403 | PASS |
| Beneficiary confirms own OTP | Delivery-confirmation endpoint is absent | Allowed | BLOCKED pending Student 3 implementation |
| Supplier confirms beneficiary OTP | Delivery-confirmation endpoint is absent | Denied | BLOCKED pending Student 3 implementation |
| Deactivated user logs in | `POST /api/auth/login`; `server/test/auth.test.js` | 401, generic message | PASS |
| Deactivated user's existing token accesses API | `GET /api/users/me`; `server/test/auth.test.js` | 403 | PASS |
| Expired JWT accesses protected route | `GET /api/users/me`; `server/test/auth.test.js` | 401 | PASS |
| Invalid role accesses operator route | `GET /api/operator/access-check`; `server/test/auth.test.js` | 403 | PASS |

Run the implemented API checks from `server/` with `npm test`. The suite uses
an in-memory Prisma substitute. A final cross-branch run is required after the
Student 1, 2, 3, and 5 endpoints are integrated.
