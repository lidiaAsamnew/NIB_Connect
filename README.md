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

API testing is performed using Postman. The Postman collection is available at:

```text
postman/NIB-Connect.postman_collection.json
```

The Postman environment is available at:

```text
postman/NIB-Connect-dev.postman_environment.json
```

The default development API base URL is:

```text
http://localhost:5000/api
```

The API documentation and Postman collection should be updated as new endpoints are implemented.

## Testing

API testing is performed using Postman.

The basic API checks include:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`

Automated API tests and regression checks will be added as the backend modules become available.

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
- Compliance reporting and testing will be finalized after the backend data and team modules are integrated.


