# EU Compliance Access Control

## Purpose

The EU Compliance module provides read-only reporting over orders, vouchers, and escrow activity. It exposes summary metrics, allocation streams, grouped reports, and record-level views for authorized compliance users.

## Available Endpoints

The server mounts the compliance router at `/api/compliance`. Every endpoint below is a `GET` request and uses the same authentication and role checks.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/compliance/summary` | Overall order and voucher summary. |
| `GET /api/compliance/weekly-allocation-stream` | Weekly order allocation grouped by reporting week and sector. |
| `GET /api/compliance/sector-report` | Order totals grouped by startup sector. |
| `GET /api/compliance/region-report` | Order totals grouped by startup region. |
| `GET /api/compliance/order-status-report` | Order totals grouped by order status. |
| `GET /api/compliance/voucher-status-report` | Voucher totals grouped by voucher status. |
| `GET /api/compliance/escrow-summary` | Escrow transaction totals grouped by direction and status. |
| `GET /api/compliance/orders` | Paginated order records and related reporting fields. |
| `GET /api/compliance/vouchers` | Paginated voucher records and related startup/order fields. |
| `GET /api/compliance/escrow-transactions` | Paginated escrow transaction records and related order/voucher fields. |

Non-paginated reports return `{ "success": true, "data": ... }`. The orders, vouchers, and escrow-transactions endpoints return `{ "success": true, "data": [...], "meta": { "pagination": ... } }`.

## Authentication and Roles

Each route applies `authenticate` followed by `authorizeRoles`. The authentication middleware expects an `Authorization` header beginning with `Bearer `, verifies the supplied JWT, and assigns its decoded claims to `req.user`.

The permitted roles are:

- `EU_COMPLIANCE_OFFICER`
- `NIB_SYSTEM_OPERATOR`

The role middleware checks `req.user.role` against those values. Other roles are denied.

## Unauthorized Requests

- A missing bearer token is passed to the error handler as an unauthorized error (HTTP 401).
- An invalid or expired token is also rejected with HTTP 401.
- A request with a valid token but an unpermitted role is rejected with HTTP 403.
- The active error handler in `server/src/app.js` returns a JSON error response containing `success: false` and a `message`; it includes `errors` when the error supplies them.

## Read-Only Scope

All compliance routes are registered with `router.get`. Their controllers call reporting-service functions that read and aggregate database records; the compliance route/controller/service path does not expose create, update, or delete operations.

## Current Limitations

- The server app does not mount a login route, and the inspected compliance/authentication code only verifies tokens supplied by clients. It does not issue JWTs or define a login response field.
- `authenticate` uses `process.env.JWT_SECRET` when set, but falls back to the literal `default_jwt_secret_dev` when it is not. A deployment must provide its intended secret through configuration; the code itself does not enforce that configuration is present.
- Compliance access therefore depends on a valid JWT being obtained elsewhere. The middleware does not implement credential checking, token refresh, or account/session management.

## Implementation References

- Router and role gate: `server/src/routes/complianceRoutes.js`
- Router mount and error response: `server/src/app.js`
- Response envelopes: `server/src/controllers/complianceController.js`
- JWT verification and role checks: `server/src/middlewares/auth.middleware.js`
- Reporting reads and aggregations: `server/src/services/reportingService.js`
- HTTP error status classes: `server/src/utils/errors.js`