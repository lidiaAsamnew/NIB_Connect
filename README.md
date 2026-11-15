# NIB-Connect

NIB-Connect is a B2B supply-chain platform. This repository contains the Week 1
authentication foundation and the Week 2 RBAC, request-validation, audit, and
security-event work.

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

Audit logs accept `action`, `entityType`, `from`, `to`, `page`, and `limit`.
Security events accept `eventType`, `from`, `to`, `page`, and `limit`. Dates
use `YYYY-MM-DD`; page size is capped at 100. Invalid bodies, query filters,
and route parameters return a structured `400` response.

Authentication outcomes, authorization denials, invalid authentication
attempts, and authentication rate limits are recorded without passwords,
bearer tokens, or raw login identifiers. Audit and security-event endpoints
are protected by server-side role checks; frontend route guards are an
additional user-experience measure, not an authorization boundary.

The voucher endpoints are a small authorization demo, not escrow, settlement,
or clearing logic. The demo links a voucher directly to a startup-owner `User`
because this repository does not yet define a `StartupProfile`. See
[docs/rbac-matrix.md](./docs/rbac-matrix.md) for role policy and scope notes.
