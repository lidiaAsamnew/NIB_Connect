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
- The EU Compliance login page currently accepts only `EU_COMPLIANCE_OFFICER`, although the dashboard route guard and backend compliance routes also permit `NIB_SYSTEM_OPERATOR`. The development login endpoint is available only when `NODE_ENV=development`.

## EU MEAL Compliance Dashboard

### 1. Module Overview

The EU MEAL Compliance Dashboard is a read-only reporting interface for EU compliance monitoring. It displays summary and aggregated reporting data, with read-only explorers for orders, vouchers, and escrow transactions. The compliance API routes use `GET` requests and do not provide write operations.

### 2. Dashboard Pages

The frontend router defines the dashboard at `/eu`. The following `/compliance/...` paths are redirects to the corresponding dashboard pages:

| Dashboard page | `/compliance` route | Redirect destination |
|---|---|---|
| Overview | `/compliance/dashboard` | `/eu/dashboard` |
| Weekly allocation | `/compliance/weekly-stream` | `/eu/weekly-allocation-stream` |
| Sector report | `/compliance/sector-report` | `/eu/sector-report` |
| Region report | `/compliance/region-report` | `/eu/region-report` |
| Orders | `/compliance/orders` | `/eu/orders` |
| Vouchers | `/compliance/vouchers` | `/eu/vouchers` |
| Escrow transactions | `/compliance/escrow` | `/eu/escrow-transactions` |

The overview is also available at `/eu/` and `/eu/dashboard`.

These redirects are registered in [client/src/App.jsx](client/src/App.jsx); dashboard pages and their route guard are in [client/src/routes/euRoutes.jsx](client/src/routes/euRoutes.jsx).

### 3. Dashboard Features

- **Summary cards:** total startups, total suppliers, verified suppliers, allocated/committed/settled voucher value, total orders, cleared orders, pending-handshake orders, and socio-economic savings.
- **Charts and visual analytics:** orders by status; gross versus cleared values by sector; weekly allocation trend; and gross versus cleared values by region. The weekly allocation page also switches between table and chart views.
- **Shared filters:** start date, end date, sector, and region. Summary cards are overall totals and are not filtered.
- **Weekly allocation stream:** groups values by reporting week and market sector. The API applies date filters; the UI applies sector filtering to returned rows. Region does not filter this stream.
- **Sector and region reports:** aggregate order totals, cleared orders, gross value, savings, and cleared value. The region report also includes startup counts. Sector rows can be sorted by sector, cleared value, or savings.
- **Read-only explorers:** orders support status, supplier ID, and order ID/waybill search; vouchers support status and startup ID; escrow supports direction and order ID. The explorers also apply shared date/sector/region filters where supported. Lists are paginated; order details are shown in a read-only dialog.
- **Report states:** shared report components display loading, empty, and error states; report errors have retry controls. The dashboard renders access-denied messages for HTTP 401/403 responses.
- **CSV downloads:** individual report pages have CSV download buttons. Weekly, sector, and region downloads use the loaded report rows. Order, voucher, and escrow downloads fetch all matching pages before creating the browser download.
- **Report packages:** the overview provides JSON micro-data and ZIP report package downloads, described below.
- **Responsive/accessibility support:** the sidebar and filters reflow on smaller screens, charts resize, and wide tables scroll horizontally. Table headers use column scope and charts have accessible text labels.

### 4. Backend API Endpoints

The backend mounts these routes under `/api/compliance`. Every endpoint below is a `GET` request.

| Endpoint | Purpose |
|---|---|
| `/api/compliance/summary` | Overall startup, supplier, voucher, order, and impact summary. |
| `/api/compliance/weekly-allocation-stream` | Weekly allocations grouped by reporting week and sector. |
| `/api/compliance/sector-report` | Order summary grouped by sector. |
| `/api/compliance/region-report` | Order summary grouped by region. |
| `/api/compliance/orders` | Paginated order records. |
| `/api/compliance/vouchers` | Paginated voucher records. |
| `/api/compliance/escrow-transactions` | Paginated escrow transaction records. |
| `/api/compliance/order-status-report` | Order summary grouped by status. |
| `/api/compliance/voucher-status-report` | Voucher summary grouped by status. |
| `/api/compliance/escrow-summary` | Escrow summary grouped by direction and status. |
| `/api/compliance/report-package` | JSON weekly-sector micro-data package. |
| `/api/compliance/report-package.zip` | ZIP archive of six CSV reports and a manifest. |
| `/api/compliance/export/orders.csv` | Download all matching order records as CSV. |
| `/api/compliance/export/vouchers.csv` | Download all matching voucher records as CSV. |
| `/api/compliance/export/weekly-allocation-stream.csv` | Download the weekly allocation stream as CSV. |
| `/api/compliance/export/sector-summary.csv` | Download the sector summary as CSV. |
| `/api/compliance/export/region-summary.csv` | Download the region summary as CSV. |
| `/api/compliance/export/escrow-transactions.csv` | Download all matching escrow transaction records as CSV. |

Paginated JSON list endpoints return records in `data` and page information in `meta.pagination`. Non-paginated reports return `{ "success": true, "data": ... }`.

The reporting functions in [server/src/services/reportingService.js](server/src/services/reportingService.js) define the available query filters:

- All reports that accept dates use `startDate` and `endDate`.
- Orders accept `status`, `sector`, `region`, `search`, `startupId`, `supplierId`, `voucherId`, `page`, and `pageSize`, in addition to date filters.
- Vouchers accept `status`, `startupId`, `allocatedById`, `sector`, and `region`, in addition to date and pagination filters.
- Escrow transactions accept `direction`, `status`, `orderId`, `voucherId`, `sector`, and `region`, in addition to date and pagination filters.
- Sector and region reports accept order `status`, `sector`, and `region`, in addition to dates.
- Weekly allocation applies only date filters. Sector and region query values do not filter the backend weekly report.
- Order-status report accepts the order report filters. Voucher-status report accepts date and voucher `status` filters. Escrow summary has no query filters.

### 5. Authorization

Each compliance route uses the `authenticate` middleware followed by `authorizeRoles` in [server/src/routes/complianceRoutes.js](server/src/routes/complianceRoutes.js). The backend permits only:

- `EU_COMPLIANCE_OFFICER`
- `NIB_SYSTEM_OPERATOR`

The dashboard route guard permits the same two roles. The current login page, however, accepts only the EU Compliance Officer role; see Limitations.

### 6. CSV and Report Package Exports

The browser report pages generate CSV downloads with the shared utility in [client/src/utils/csvExport.js](client/src/utils/csvExport.js). For the three paginated explorer reports, the UI requests all matching pages before exporting instead of exporting only the currently visible page.

The six backend CSV endpoints return `text/csv; charset=utf-8` downloads. Their CSV generation reuses the existing report-package CSV serializer, including cell quoting, UTF-8 BOM, and formula-injection protection. The orders, vouchers, and escrow CSV endpoints fetch all pages of matching records. Query filters are passed to their corresponding reporting functions; page/pageSize are set internally for the complete export.

The JSON package contains weekly-sector rows and package metadata: `packageType`, ISO `generatedAt`, authenticated role in `generatedBy`, applied date filters, `recordCount`, `data`, and a SHA-256 checksum of `JSON.stringify(data)`. This package applies `startDate` and `endDate` only.

The ZIP package contains six CSV files and `manifest.json`. The manifest includes the generation time, normalized applied filters, a note that weekly allocation uses date filters only, and each CSV file's record count and SHA-256 checksum of its generated CSV bytes. ZIP reports use `sector-report.csv` and `region-report.csv`; standalone endpoints use `sector-summary.csv` and `region-summary.csv`. The ZIP route normalizes only `startDate`, `endDate`, `sector`, and `region`; it does not preserve report-specific filters such as order search/status or voucher/escrow IDs.

### 7. Testing

Run the backend tests from the `server` directory:

```bash
npm test
```

Compliance test coverage includes:

- [server/tests/compliance.reporting.test.js](server/tests/compliance.reporting.test.js) — reporting API responses, order search, and authentication/authorization.
- [server/tests/reportPackageService.test.js](server/tests/reportPackageService.test.js) — ZIP contents, CSV data/escaping, pagination, manifest, and checksums.
- [server/tests/compliance.report-package.test.js](server/tests/compliance.report-package.test.js) — JSON package data, checksum, filters, authorization, and ZIP route.
- [server/tests/compliance.csv-exports.test.js](server/tests/compliance.csv-exports.test.js) — CSV export authorization, filter forwarding, pagination beyond 100 records, response headers/filenames, and CSV escaping/formula-injection protection.

Compliance Postman request definitions are in [postman/NIB-Connect/Compliance/](postman/NIB-Connect/Compliance/). The environment file is [postman/NIB-Connect-dev.postman_environment.json](postman/NIB-Connect-dev.postman_environment.json); it defines `baseUrl` and an empty `token` variable to configure locally.

### 8. Limitations

- The weekly allocation API and JSON package apply date filters only. The weekly UI filters the returned rows by sector; region has no effect on the weekly stream.
- The summary cards are not filtered by the shared dashboard filters.
- The JSON package is weekly-sector micro-data, not a package of all dashboard datasets. The ZIP package is the multi-report package.
- The development login route is available only when `NODE_ENV=development` and configured development credentials and a JWT secret are provided through the server environment. It issues an `EU_COMPLIANCE_OFFICER` user; the login page rejects other roles even though the dashboard route guard and backend permit `NIB_SYSTEM_OPERATOR`.
- The NIB core banking system remains represented by a mock ledger. SMS, USSD, and real payment integrations are not part of the current implementation.

### 9. Week 3 Evidence

Expected evidence folder: `docs/week3-evidence/`.

Expected screenshot filenames:

1. `01-overview.png`
2. `02-weekly-stream.png`
3. `03-sector-report.png`
4. `04-region-report.png`
5. `05-order-explorer.png`
6. `06-voucher-explorer.png`
7. `07-escrow-transactions.png`
8. `08-csv-download.png`
9. `09-report-package-json.png`

These are expected evidence filenames and do not confirm that the screenshots currently exist.
