# Student 4 Week 6 security test report

## Scope and method

The Week 6 branch, based on the Week 5 integration branch, was tested locally
with `npm test` and reviewed for authentication, authorization, input handling,
audit/security-event logging, notification ownership, session expiry, and
deployment settings.
The API tests use an in-memory Prisma substitute; they do not prove behavior
against a deployed database or live infrastructure.

## Validation run

- `server/npm test`: 22 tests passed.
- `client/npm run lint`: passed.
- `client/npm run build`: passed.
- `npx prisma validate`: passed.
- Postman collection JSON parse and `git diff --check`: passed.
- Local browser checks: mocked expired-token 401 and deactivated-account 403
  both cleared session storage, redirected to sign-in, and showed the expected
  message.

## Results

| # | Security case | Expected result | Result / evidence |
| --- | --- | --- | --- |
| 1 | Submit a SQL-like expression to operator user search | Treated as data; must not broaden results | PASS in `server/test/operations.test.js`; route uses Prisma filters. A real MySQL injection test was not run. |
| 2 | Render user-controlled notification and account text | Display as text, not executable markup | PASS by source review: UI renders values as React text and contains no `dangerouslySetInnerHTML`. Browser payload testing remains outstanding. |
| 3 | Use a JWT signed with a different secret | Protected endpoint returns 401 | PASS in `server/test/auth.test.js`. |
| 4 | Use an expired JWT | Protected endpoint returns 401; client clears the session, redirects to sign-in, and shows the required message | PASS: backend test plus local browser check with mocked 401 verified redirect, cleared session storage, and exact message. |
| 5 | Change the public registration role to a privileged role | Registration is rejected | PASS in `server/test/auth.test.js`. |
| 6 | Access an API using a deactivated account's existing token or attempt login | Protected API returns 403; login returns generic 401 | Backend PASS in `server/test/auth.test.js` and `server/test/operations.test.js`; local browser check with mocked 403 verified session clearing and the deactivation message. |
| 7 | Access operator APIs as startup, supplier, or EU officer | Request is denied | PASS across `server/test/operations.test.js` and `server/test/auth.test.js`. |
| 8 | Mark another user's notification as read | Request returns 404 without disclosing ownership | PASS in `server/test/operations.test.js`. |
| 9 | Allocate a voucher as startup or EU officer | Request returns 403 | PASS in `server/test/auth.test.js`. |
| 10 | Verify a supplier as EU officer | Request returns 403 | PASS in `server/test/operations.test.js`. |
| 11 | Spoof `X-Forwarded-For` without a trusted proxy configuration | Logged address remains the direct peer address | PASS in `server/test/auth.test.js`. |
| 12 | Trust a proxy address | Forwarded client IP is used only when its proxy CIDR is explicitly configured | PASS in `server/test/auth.test.js`. |
| 13 | Inspect tracked files for `.env` | Local environment file is ignored and not tracked | PASS: `server/.env` is ignored and not tracked. |
| 14 | Search application code for raw SQL and frontend HTML injection | No unsafe raw-query or HTML-injection API is present | PASS by source scan; Prisma filter use and React text rendering are used. |
| 15 | Search the built frontend bundle for server environment secrets | No JWT/database secret names or placeholders appear in public assets | PASS: production assets contain no `JWT_SECRET`, `DATABASE_URL`, `SHADOW_DATABASE_URL`, or placeholder secret string. |
| 16 | Brute-force or replay a delivery OTP | Rate-limited/locked and replay denied | BLOCKED: delivery-confirmation implementation is not present; do not simulate against a substitute endpoint. |
| 17 | Read another user's order or settlement, or settle uncleared funds | Denied / settlement blocked | BLOCKED: the corresponding owner-scoped and clearing APIs are not present in this branch. |
| 18 | Confirm mock OTP is disabled in production | No production mock endpoint | No mock OTP endpoint is present in this branch. Recheck after teammate delivery code is integrated. |
| 19 | Check live CORS, production secrets, database migration, and deployment behavior | Production configuration is restricted and healthy | NOT RUN: no deployment environment or live URLs were supplied. |

## Audit-event coverage

The current branch writes `USER_REGISTERED`, `USER_LOGIN_SUCCESS`,
`USER_LOGIN_FAILED`, `SUPPLIER_VERIFIED`, `SUPPLIER_UNVERIFIED`,
`VOUCHER_ALLOCATED`, `VOUCHER_EXPIRED`, `USER_DEACTIVATED`, `USER_ACTIVATED`,
and `SECURITY_EVENT_CREATED` audit actions.

`SUPPLIER_PROFILE_CREATED`, product lifecycle actions, order lifecycle and
clearing actions, and OTP attempt outcomes cannot be completed or verified
until the corresponding teammate APIs are integrated. Security events are
stored in the separate `SecurityEvent` table; no synthetic audit event is
created for a missing delivery/clearing action.

## Security finding addressed

Request-based security events now record `req.ip`. Express trusts forwarded
addresses only for the explicit `TRUSTED_PROXY_CIDRS` allowlist; it does not
trust forwarded headers by default. Production deployments must configure the
actual proxy CIDRs and prevent direct untrusted access to the application.
Production error responses remain generic, and production logs omit raw error
objects.

## Limitations

The automated API suite uses mocked database behavior, so it is not a
substitute for a deployed MySQL test. OTP brute-force/replay controls,
order/settlement ownership checks, and reconciliation require the missing
teammate APIs. Live deployment checks, browser XSS payload tests, screenshots,
and a demo recording remain to be completed during final integration.
