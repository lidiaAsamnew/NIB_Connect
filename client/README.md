# Beneficiary Gateway (client)

React app for women startup owners (role `WOMEN_STARTUP_OWNER`).

## Run it
1. `cd client`
2. `npm install`
3. Copy `.env.example` to `.env` and set the values below.
4. `npm run dev`, then open http://localhost:5173

## Environment variables
| Name | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL, for example `http://localhost:5000/api` |
| `VITE_USE_MOCK_AUTH` | `true` uses fake login and register in development only |

## Test user
No default user yet. With `VITE_USE_MOCK_AUTH=true` any valid email or phone and password logs in.

## Week 1 pages
`/`, `/login`, `/register`, `/not-found`, and protected placeholders: `/dashboard`, `/startup/profile`, `/vouchers`, `/products`, `/orders`, `/notifications`.
