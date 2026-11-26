# NIB-Connect

NIB-Connect is a B2B supply-chain platform. This repository contains the Week 1
authentication foundation, Week 2 RBAC and audit services, the Week 3–5 NIB
operations control layer, and ongoing Week 6 security hardening.

## API setup

Requirements: Node.js 20 or newer and MySQL 8 or compatible.

1. In `server/`, run `npm ci`.
2. Copy `server/.env.example` to `server/.env` and set the database URLs and a
   random `JWT_SECRET` of at least 32 characters.
3. Generate the Prisma client and apply the checked-in migrations:

   ```sh
   npm run db:generate
   npx prisma migrate deploy
   ```

4. Start the API with `npm start`. Run API tests with `npm test`.

Public registration only accepts `WOMEN_STARTUP_OWNER` and `TIER1_SUPPLIER`.
Privileged operator and EU accounts must be provisioned through a controlled
process, not the public registration endpoint.

## Week 2 endpoints

All protected routes require `Authorization: Bearer <token>`.

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/api/audit-logs` | NIB system operator |
| `GET` | `/api/audit-logs/:id` | NIB system operator |
| `GET` | `/api/security-events` | NIB system operator |
| `POST` | `/api/vouchers` | NIB system operator |
| `GET` | `/api/vouchers` | NIB system operator |
| `GET` | `/api/vouchers/mine` | Startup owner; only their vouchers |
| `GET` | `/api/vouchers/summary` | EU compliance officer; aggregates only |
| `GET` | `/api/ops/dashboard` | NIB system operator |
| `GET` | `/api/ops/suppliers` | NIB system operator |
| `GET` | `/api/ops/suppliers/:id` | NIB system operator |
| `PATCH` | `/api/ops/suppliers/:id/verify` | NIB system operator; audit logged |
| `PATCH` | `/api/ops/suppliers/:id/unverify` | NIB system operator; audit logged |
| `GET` | `/api/ops/vouchers` | NIB system operator; filtered and paginated |
| `GET` | `/api/ops/vouchers/:id` | NIB system operator |
| `GET` | `/api/ops/orders` | NIB system operator; filtered and paginated |
| `GET` | `/api/ops/orders/:id` | NIB system operator; safe timeline and escrow details |
| `GET` | `/api/ops/escrow-summary` | NIB system operator; read-only |
| `GET` | `/api/products` | Startup owner; active products from verified suppliers only |

Audit logs accept `action`, `entityType`, `from`, `to`, `page`, and `limit`.
Security events accept `eventType`, `userId`, `orderId`, `ipAddress`, `from`,
`to`, `page`, and `limit`. Dates use `YYYY-MM-DD`; page size is capped at 100.
Sensitive metadata keys are removed before storage and from API responses.
Invalid bodies, query filters, and route parameters return a structured `400`
response.

Authentication outcomes, authorization denials, invalid authentication
attempts, and authentication rate limits are recorded without passwords,
bearer tokens, or raw login identifiers. Audit and security-event endpoints
are protected by server-side role checks; frontend route guards are an
additional user-experience measure, not an authorization boundary.

The Week 2 voucher allocation endpoint remains available for compatibility.
The Week 3 monitoring layer understands both its legacy `ACTIVE`/`REDEEMED`
statuses and the domain statuses used by Student 3's voucher/order work. The
dashboard and escrow endpoints only read operational records; they do not
change voucher, order, escrow, or clearing data.

## Week 3 NIB operations control layer

The five operator pages are available at `/operator/dashboard`,
`/operator/suppliers`, `/operator/vouchers`, `/operator/orders`, and
`/operator/escrow`. The operator audit and security-event pages are available
at `/operator/audit-logs` and `/operator/security-events`. Security events can
be filtered by type, date, user, order, and IP; sensitive metadata is redacted
from API responses. The frontend route guard is supplementary; the server
authenticates and authorizes every `/api/ops/*` request as
`NIB_SYSTEM_OPERATOR`.

Supplier verification and unverification update the profile and write an
`AuditLog` entry in one transaction. Operator supplier responses deliberately
omit bank account numbers. The beneficiary catalog endpoint is role-protected
and queries only active products whose supplier is verified.

Week 3 adds `StartupProfile`, `SupplierProfile`, `Product`, `Order`,
`OrderItem`, `DeliveryHandshake`, `EscrowTransaction`, and `Notification`
models. It adds optional startup and expiry fields to the existing voucher
table and expands the voucher status enum without removing Week 2 status
values. Its migration is additive to the Week 2 schema. Do not apply
Student 3's full-rewrite migration alongside this branch: that migration uses
different table names and would create duplicate user/voucher domain tables.
Coordinate the final team merge so all student branches use the reconciled
Week 3 schema and migration.

Operational notifications are written for supplier sign-ups, suspicious OTP
security events, repeated failed-login spikes (five failures in 15 minutes,
with a one-hour cooldown), and orders waiting for a delivery handshake beyond
`HANDSHAKE_PENDING_ALERT_MINUTES` (default 60). The server checks pending
handshake orders at startup and every five minutes. A future handshake route
must record `SUSPICIOUS_OTP_ATTEMPT` or `OTP_BRUTE_FORCE_SUSPECTED` through
`recordSecurityEvent` to activate the notification hook.

Import `server/postman/NIB-Connect-Week1.postman_collection.json` for
authentication and Week 3/4 operator request examples. Set `operatorToken` and,
for supplier decisions, `supplierId` to values from a local development
database. The collection contains empty token/password variables, not
credentials.

## Week 4 security-event review

The operator security-event page is available at `/operator/security-events`.
It provides paginated filtering by event type, date range, user ID, order ID,
and IP address, with a details view for each event. Apply the additive Week 4
security-event migration before using the new order and IP filters:

```sh
npx prisma migrate deploy
npm run db:generate
```

The delivery-confirmation endpoint and clearing service are not present in the
shared Student 3 branch yet. OTP throttling, lockout, beneficiary-only
authorization, and replay checks must be integrated with that implementation
when it is available; this branch does not replace the clearing logic.

## Week 5 operator administration

The operator can search and view accounts at `/operator/users`, activate or
deactivate accounts, expire overdue allocated vouchers from the voucher
monitoring page, and review personal alerts at `/operator/notifications`.
User status changes and each voucher expiry are written to the audit log in
the same database transaction. An operator cannot deactivate their own
account. Login rejects deactivated accounts, and protected API requests using
their existing tokens return `403`.

`GET /api/ops/users` supports `search`, `role`, `status`, `page`, and `limit`.
`GET /api/ops/users/:id` returns a safe account detail view. Operator-only
`PATCH /api/ops/users/:id/activate` and `/deactivate` manage account status.
`POST /api/ops/vouchers/expire-overdue` expires only `ALLOCATED` vouchers
whose `expiresAt` is in the past, with one audit entry for each update.

Authenticated users can only read and mark their own notifications through
`GET /api/notifications`, `PATCH /api/notifications/:id/read`, and
`PATCH /api/notifications/read-all`. The operator notification center shows
the unread count and supports type filtering. Scheduled alerts flag supplier
profiles pending verification for more than 24 hours and active/allocated
vouchers expiring within seven days; duplicate alerts are suppressed per
supplier or voucher.

The audit viewer supports actor name/email, action, entity type, entity ID,
date-range filters, pagination, and metadata display. Reconciliation remains
read-only and awaits Student 3's endpoint/contract; this branch does not
reimplement reconciliation or change financial amounts or clearing records.

See [docs/rbac-matrix.md](./docs/rbac-matrix.md) for role policy and scope
notes.

## NIB Operations and Security Module

This module provides secure authentication and role checks, audit/security
event recording, and the NIB operator control layer. Public registration is
limited to startup owners and Tier-1 suppliers. Passwords are bcrypt-hashed;
protected requests verify the JWT and reload the user's current active status
from the database. The frontend clears an expired session, redirects to sign-in,
and shows “Your session has expired. Please login again.”

The server-side permissions are documented in
[docs/rbac-matrix.md](./docs/rbac-matrix.md), and implemented Week 6 cases are
recorded in [docs/student4-rbac-test-matrix.md](./docs/student4-rbac-test-matrix.md).
The security test outcomes and blocked integration cases are in
[docs/student4-security-test-report.md](./docs/student4-security-test-report.md).
The operator demo outline is in
[docs/student4-operator-demo-script.md](./docs/student4-operator-demo-script.md).
The Week 6 contribution statement is in
[docs/student4-contribution-statement.md](./docs/student4-contribution-statement.md).

Audit logs cover account registration/login, supplier decisions, voucher
allocation/expiry, and user activation changes. Security events cover failed
authentication, rate limits, authorization denials, and deactivated-account
access. Sensitive credentials and OTP data are not included in logs. Operator
pages include dashboard, supplier review, user management, voucher/order/escrow
monitoring, audit history, security events, and notifications. Relevant API
routes are listed in the endpoint tables above and the Week 4/5 sections.

Security-event creation also writes a `SECURITY_EVENT_CREATED` audit entry
containing only the event type. Login failures use the `USER_LOGIN_FAILED`
action. Remaining business-action audit entries depend on their corresponding
supplier product, order, delivery-confirmation, and clearing APIs being
integrated.

### Deployment security checklist

- Set `NODE_ENV=production` and use a unique `JWT_SECRET` of at least 32
  characters; never use values from `.env.example`.
- Set `CLIENT_ORIGIN` to the exact deployed frontend origin.
- Keep `.env` files out of version control; `.env.example` contains placeholders.
- Leave `TRUSTED_PROXY_CIDRS` empty for direct connections. Behind a reverse
  proxy, set it only to a comma-separated list of actual trusted proxy
  IPs/CIDRs and block direct untrusted access to the app.
- Keep Helmet and authentication rate limiting enabled.
- Configure production database credentials outside source control and apply
  checked-in migrations with `npx prisma migrate deploy`.
- No mock OTP endpoint is present in this branch. Recheck any teammate
  delivery-confirmation implementation before deployment.
- The production error handler returns a generic response and avoids logging
  raw exception details.
- No live backend/frontend deployment URLs are available in this branch.

### Known limitations

Delivery-confirmation OTP throttling, lockout, beneficiary-only authorization,
and replay prevention await Student 3's implementation. Reconciliation awaits
its API/contract. Supplier product-management, supplier order-dispatch, and
full EU reporting test cases require the relevant teammate branches to be
reviewed and integrated. The Week 6 matrix marks these as blocked rather than
claiming they passed. Run `npm test` in `server/` and `npm run build` in
`client/` for the currently integrated code.
