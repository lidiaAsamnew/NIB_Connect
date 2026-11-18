# NIB-Connect Mini

## Project Overview

NIB-Connect Mini is a full-stack platform designed to support the connection between startup beneficiaries, suppliers, and NIB operational processes.

The project includes beneficiary and supplier workflows, voucher and order management, escrow and clearing processes, authentication and security, compliance reporting, and quality assurance.

## Tech Stack

- **Frontend:** React JS
- **Backend:** Node.js, Express
- **ORM:** Prisma
- **Database:** MySQL
- **API Testing:** Postman
- **Version Control:** Git and GitHub

## Team Roles

| Role | Main Responsibility |
|---|---|
| Beneficiary Gateway Developer | React frontend for startup/beneficiary users, including authentication, vouchers, orders, and dashboard workflows. |
| Supplier Enterprise Suite Developer | Supplier backend and frontend workflows, including supplier profiles, products, and supplier-side orders. |
| Escrow and Clearing Gateway Developer | Voucher lifecycle, order state machine, OTP delivery handshake, escrow transactions, and mock NIB ledger clearing. |
| NIB Operations and Security Developer | Authentication, JWT, RBAC, security middleware, audit logs, notifications, and NIB operations controls. |
| EU Compliance, QA, and Deployment Developer | Compliance reporting, API documentation, Postman testing, QA strategy, automated testing, deployment, and release readiness. |

## Features

- User registration and login
- Role-based access control
- Startup/beneficiary profile management
- Supplier profile and product management
- Voucher allocation and lifecycle management
- Order creation and order status tracking
- Delivery OTP handshake verification
- Escrow transaction and clearing workflow
- NIB operations and security monitoring
- Audit logging and notifications
- EU compliance and read-only reporting
- API testing and quality assurance
- Deployment and release readiness

## Prerequisites

Before setting up NIB-Connect Mini, make sure the following are installed:

- Node.js
- npm
- MySQL
- Git
- Postman

## Backend Setup

1. Navigate to the backend directory:

```bash
cd server
```

2. Install the backend dependencies:

```bash
npm install
```

3. Configure the environment variables using the `.env.example` file.

4. Run Prisma migrations:

```bash
npx prisma migrate dev
```

5. Seed the database:

```bash
npx prisma db seed
```

6. Start the backend development server:

```bash
npm run dev
```

The backend API runs on the port configured in the environment variables.

## Frontend Setup

1. Navigate to the frontend directory:

```bash
cd client
```

2. Install the frontend dependencies:

```bash
npm install
```

3. Start the frontend development server:

```bash
npm run dev
```

The frontend development server runs on the port provided by the React/Vite development environment.

## MySQL Setup

1. Make sure MySQL is installed and running.

2. Create the development database:

```sql
CREATE DATABASE nib_connect_dev;
```

3. Configure the `DATABASE_URL` in your local `.env` file:

```env
DATABASE_URL="mysql://root:password@localhost:3306/nib_connect_dev"
```

Replace the username and password with your local MySQL credentials.

## Prisma Migration

After configuring the database connection, run Prisma migrations from the `server` directory:

```bash
cd server
npx prisma migrate dev
```

This creates and updates the database structure based on the Prisma schema.

To generate the Prisma client:

```bash
npx prisma generate
```

## Seeding

After running the Prisma migration, seed the development database with the project's sample data:

```bash
npx prisma db seed
```

The seed data is intended for development and testing purposes.

## Environment Variables

Create a local `.env` file based on `.env.example`.

The main environment variables include:

- `PORT` — Backend server port
- `NODE_ENV` — Application environment
- `DATABASE_URL` — MySQL database connection
- `JWT_SECRET` — Secret used for JWT authentication
- `JWT_EXPIRES_IN` — JWT expiration time
- `WAYBILL_SECRET` — Secret used for waybill-related security
- `CORS_ORIGIN` — Allowed frontend origin
- `MOCK_LEDGER_FAIL_RATE` — Mock ledger failure rate for testing
- `VITE_API_BASE_URL` — Backend API URL used by the frontend

Never commit the `.env` file or real secrets to GitHub. Use `.env.example` as the safe configuration template.

## API Documentation

The project API follows the standards defined in `docs/api-standards.md`.

API request definitions are organized under:

```text
postman/NIB-Connect/
```

The Postman environment is available at:

```text
postman/NIB-Connect-dev.postman_environment.json
```

The default development API base URL is:

```text
http://localhost:5000/api
```

Keep the API documentation and request definitions in sync as endpoints are implemented.

## Testing

API testing is performed using Postman.

The basic API checks include:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`

Automated backend tests cover selected modules, including EU compliance reporting. Run the server tests from `server` with `npm test`.

Testing results and defects are documented in the project's QA documentation.

## Deployment

Before deployment, the application should pass the project's QA and release-readiness checks.

Deployment preparation includes:

- Verifying environment variables and production configuration
- Running database migrations
- Running available automated tests
- Checking API health and version endpoints
- Verifying frontend and backend connectivity
- Reviewing security configuration
- Confirming that no secrets are committed to the repository

Deployment and final verification will be completed after the team modules are integrated.

## Known Limitations

- The NIB core banking system is represented using a mock ledger for development and testing.
- SMS, USSD, and real payment integrations are not part of the initial implementation.
- Some API endpoints and frontend features depend on the completion and integration of the respective team modules.
- Real frontend authentication integration and logout remain pending. The backend reporting endpoints enforce JWT role authorization.

## EU Compliance Reporting (Weeks 2 and 3)

The EU Compliance module provides read-only reporting APIs and a responsive MEAL dashboard for authorized users.

### Week 2 — EU reporting APIs

The backend reporting service in [server/src/services/reportingService.js](server/src/services/reportingService.js) reads and aggregates compliance data, including weekly allocations, sector and region summaries, and order, voucher, and escrow records. The frontend service layer in [client/src/services/complianceService.js](client/src/services/complianceService.js) calls these APIs, unwraps the common response envelope, and reads pagination metadata for record-list endpoints.

All compliance API routes require a Bearer JWT and one of these roles:

- `EU_COMPLIANCE_OFFICER`
- `NIB_SYSTEM_OPERATOR`

The reporting endpoints are read-only `GET` requests:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/compliance/summary` | Dashboard totals and financial impact summary. |
| GET | `/api/compliance/weekly-allocation-stream` | Weekly totals grouped by reporting week and sector. Applies date filters only. |
| GET | `/api/compliance/sector-report` | Order totals grouped by sector. |
| GET | `/api/compliance/region-report` | Order totals grouped by region. |
| GET | `/api/compliance/vouchers` | Paginated voucher records. |
| GET | `/api/compliance/orders` | Paginated order records. |
| GET | `/api/compliance/escrow-transactions` | Paginated escrow transaction records. |
| GET | `/api/compliance/order-status-report` | Order totals grouped by status. |
| GET | `/api/compliance/voucher-status-report` | Voucher totals grouped by status. |
| GET | `/api/compliance/escrow-summary` | Escrow totals grouped by direction and status. |

Non-paginated reports return `{ "success": true, "data": ... }`. Paginated reports return records in `data` and pagination details in `meta.pagination`. Date filters use `startDate` and `endDate`; reports that support market filters accept `sector` and `region`.

The initial reporting pages provide summary cards, weekly allocation, sector and region reports, and tabular Orders, Vouchers, and Escrow Transactions views. The tabular pages include pagination where the API is paginated.

### Week 3 — EU MEAL dashboard and exports

The dashboard is implemented under `/eu` with these seven views. `/eu` and `/eu/dashboard` both open the overview:

| Dashboard page | Frontend route |
|---|---|
| Overview and summary cards | `/eu/` or `/eu/dashboard` |
| Weekly allocation | `/eu/weekly-allocation-stream` |
| Sector report | `/eu/sector-report` |
| Region report | `/eu/region-report` |
| Orders | `/eu/orders` |
| Vouchers | `/eu/vouchers` |
| Escrow transactions | `/eu/escrow-transactions` |

The seven assignment URLs are supported as redirects to the existing pages: `/compliance/dashboard`, `/compliance/weekly-stream`, `/compliance/sector-report`, `/compliance/region-report`, `/compliance/orders`, `/compliance/vouchers`, and `/compliance/escrow`.

The overview uses live reporting API data for three Recharts views: orders by status, gross versus cleared values by sector, and weekly allocation. It also displays these summary cards:

1. Total Startups
2. Total Suppliers
3. Verified Suppliers
4. Total Voucher Value Allocated
5. Total Committed Value
6. Total Settled Value
7. Total Orders
8. Cleared Orders
9. Pending Handshake Orders
10. Socio-Economic Savings

Sector and region charts use the shared filters. The Weekly Allocation page provides table and chart views. Shared filters provide start date, end date, sector, and region. The weekly allocation API supports date filters only; its sector filter is applied to the returned rows in the browser, and region does not filter this stream. The overall summary cards are unfiltered.

The sector report includes sorting by cleared value and savings; the region report includes a gross-versus-cleared chart. The order explorer supports status, supplier ID, and order ID/waybill search, pagination, a read-only detail dialog, and date/sector/region filters. The voucher explorer supports status and startup ID filters; the escrow explorer supports direction and order ID filters. These explorers also use the shared date/sector/region filters where supported by their APIs.

CSV exports use the reusable browser utility in [client/src/utils/csvExport.js](client/src/utils/csvExport.js). Weekly Allocation, Sector, and Region export the loaded report rows. Orders, Vouchers, and Escrow Transactions fetch all matching API pages before exporting, rather than exporting only the visible page. CSV output uses headers, UTF-8 encoding, escaping, and formula-injection protection.

### Verifiable report packages

`GET /api/compliance/report-package` returns the JSON weekly-sector micro-data package. Its response is `{ "success": true, "data": { ... } }`; package metadata includes:

- `packageType`: `weekly-sector`
- `generatedAt`: ISO timestamp
- `generatedBy`: the authenticated user's role
- `filters`: the applied weekly date filters
- `recordCount`: number of rows in the data array
- `checksum`: SHA-256 of `JSON.stringify(data)`
- `data`: weekly allocation rows grouped by reporting week and sector

The weekly-sector package applies `startDate` and `endDate`; sector and region are not applied by the weekly allocation service.

`GET /api/compliance/report-package.zip` preserves the ZIP export. It contains six CSV reports and `manifest.json`; the manifest records the generation timestamp, applied filters, the weekly-filter limitation, and each CSV's filename, record count, and SHA-256 checksum.

For example, using the documented local API base and a valid authorized JWT:

```bash
curl -H "Authorization: Bearer <JWT>" \
  "http://localhost:5000/api/compliance/report-package?startDate=2025-01-01&endDate=2025-12-31"
```

To save the ZIP response:

```bash
curl -H "Authorization: Bearer <JWT>" \
  "http://localhost:5000/api/compliance/report-package.zip" \
  --output eu-compliance-report.zip
```

### Dashboard states, responsiveness, and access

The shared report UI displays loading states, empty states, API errors, retry buttons, and HTTP 401/403 access-denied messages. The dashboard has a top navigation bar and reporting sidebar; its layout and filters reflow on narrow screens, charts resize, and wide tables scroll horizontally. The tables expose column headers to assistive technology, and monetary values are formatted in ETB.

Backend role authorization is enforced on every compliance route. The client API currently documents real sign-in integration as pending; in development it can attach a configured test token. Do not put real credentials or tokens in this README.

The dashboard's visible **EU Compliance Officer** badge is a static display label. It is not dynamically read from an authenticated user session. Real frontend authentication integration and logout remain pending because the client authentication context and session integration are not complete. The static development-token setup must not be treated as a verified user sign-in flow.

### Week 3 evidence

The Student 5 Week 3 evidence is organized in `docs/week3-evidence/`. The required screenshot filenames are:

- `01-overview.png`
- `02-weekly-stream.png`
- `03-sector-report.png`
- `04-region-report.png`
- `05-order-explorer.png`
- `06-voucher-explorer.png`
- `07-escrow-transactions.png`
- `08-csv-download.png`
- `09-report-package-json.png`

The README records the expected evidence location and filenames but does not claim that each screenshot demonstrates a successful browser action or HTTP response.

### Tests and API request files

Run the backend tests from `server`:

```bash
npm test
```

Compliance coverage is in:

- [server/tests/compliance.reporting.test.js](server/tests/compliance.reporting.test.js) — reporting API access and response checks.
- [server/tests/reportPackageService.test.js](server/tests/reportPackageService.test.js) — ZIP contents, CSV data, pagination, manifest, and checksum checks.
- [server/tests/compliance.report-package.test.js](server/tests/compliance.report-package.test.js) — JSON package response, checksum, filters, role authorization, and ZIP route checks.

Compliance request definitions are in [postman/NIB-Connect/Compliance/](postman/NIB-Connect/Compliance/), and the environment file is [postman/NIB-Connect-dev.postman_environment.json](postman/NIB-Connect-dev.postman_environment.json). The environment defines `baseUrl` and an empty `token` variable to be set locally. The repository currently contains these request-definition files, not a single exported Postman collection JSON.
