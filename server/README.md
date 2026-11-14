# NIB-Connect Backend: Supplier Enterprise Suite (Student 2)

## Developer Details

- **Student Name:** Melat Mehari
- **Role:** Supplier Enterprise Suite Developer
- **User Role:** `TIER1_SUPPLIER`
- **Tech Stack:** Node.js, Express.js, Prisma ORM, MySQL

---

## 🚀 How to Run the Backend

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure your database credentials and secrets are configured:

```env
PORT=5000
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/nib_connect"
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:5173
WAYBILL_SECRET=your_waybill_secret_key_here
NODE_ENV=development
```

### 3. Prisma ORM Setup

Generate the Prisma Client:

```bash
npx prisma generate
```

Push schema to MySQL:

```bash
npx prisma db push
```

### 4. Start the Server

- Development:
  ```bash
  npm run dev
  ```
- Production:
  ```bash
  npm start
  ```

Server will run on `http://localhost:5000`.

---

## 📡 API Route Structure

### Health Check

- `GET /api/health` - Connectivity verification endpoint for Student 1 & 5

### Supplier Endpoints (`/api/supplier`)

Protected by role authentication (`TIER1_SUPPLIER`). Non-supplier requests receive HTTP 403.

- **Profile**:
  - `GET /api/supplier/profile`
  - `POST /api/supplier/profile`
  - `PATCH /api/supplier/profile`
- **Products**:
  - `GET /api/supplier/products`
  - `POST /api/supplier/products`
  - `GET /api/supplier/products/:id`
  - `PATCH /api/supplier/products/:id`
  - `DELETE /api/supplier/products/:id`
- **Orders**:
  - `GET /api/supplier/orders`
  - `GET /api/supplier/orders/:id`
  - `POST /api/supplier/orders/:id/dispatch`
  - `POST /api/supplier/orders/:id/mark-arrived`
- **Settlements**:
  - `GET /api/supplier/settlements`
- **Dashboard**:
  - `GET /api/supplier/dashboard`

---

## 🧪 Verification & Testing

Run the backend test script to verify server boot, health check, and RBAC enforcement:

```bash
node test_server.js
```
