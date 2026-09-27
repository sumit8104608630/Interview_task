# PERN ERP System

Production-quality **PERN Stack ERP application** implementing the complete business workflow:

> **Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch**

Built with a clean layered architecture (Route → Controller → Service → Repository → PostgreSQL), OTP-based email verification authentication, concurrency-safe inventory reservation using PostgreSQL row-level locking, and a Tailwind CSS React dashboard.

---

## Technology Stack

### Backend
- Node.js + Express.js
- PostgreSQL + Knex.js (migrations, seeds, queries)
- JWT authentication + bcryptjs password hashing
- **OTP Email Verification** via [otp-microservise.vercel.app](https://otp-microservise.vercel.app/)
- Zod request validation
- CORS, centralized error handling, custom HTTP errors
- Jest + Supertest (pricing + RBAC + concurrency-safe integration tests)
- Swagger/OpenAPI auto-docs at `/api-docs`

### Frontend
- React 18 + Vite
- React Router v6 + Context API (Auth state)
- Axios with JWT interceptors
- **Tailwind CSS** for styling

---

## Project Structure

```
erp-app/
├── backend/
│   ├── config/
│   │   └── env.js
│   ├── controllers/        # HTTP request/response only
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── productController.js
│   │   ├── inventoryController.js
│   │   ├── enquiryController.js
│   │   ├── quotationController.js
│   │   ├── salesOrderController.js
│   │   ├── dispatchController.js
│   │   └── dashboardController.js
│   ├── db/
│   │   ├── index.js
│   │   ├── migrations/      # Knex schema migrations
│   │   └── seeds/           # Demo seed data
│   ├── middlewares/
│   │   ├── auth.js          # JWT verification
│   │   ├── rbac.js          # requireRole('ADMIN','SALES')
│   │   ├── validate.js      # Zod validation
│   │   └── errorHandler.js  # Centralized error response
│   ├── model/               # DB query repositories + Zod schemas
│   ├── routes/              # HTTP endpoints + Swagger annotations
│   ├── service/             # BUSINESS LOGIC layer (transactions, pricing, OTP)
│   ├── src/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── pricing.test.js
│   │   └── integration.test.js
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── customErrors.js  # 400/401/403/404/409
│   │   ├── jwt.js
│   │   └── pricing.js       # Backend-authoritative pricing engine
│   ├── knexfile.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css         # Tailwind + components
        ├── api/
        │   └── apiClient.js  # Axios + JWT interceptor
        ├── auth/
        │   ├── AuthContext.jsx
        │   └── ProtectedRoute.jsx
        ├── components/
        │   └── Layout.jsx    # Sidebar Nav + Header
        └── pages/            # Login, Dashboard, 7 ERP modules
```

---

## Installation & Setup

### 1. Prerequisites
- Node.js ≥ 18
- PostgreSQL ≥ 14
- Two databases: `erp_db` (dev) and `erp_db_test` (tests)

### 2. Backend Setup
```bash
cd erp-app/backend
cp .env.example .env          # edit DATABASE_URL + JWT_SECRET
npm install

# Run migrations + seeds
npm run migrate
npm run seed

# Run backend
npm run dev                   # http://localhost:5000
# API Docs:  http://localhost:5000/api-docs
```

### 3. Frontend Setup
```bash
cd erp-app/frontend
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

### 4. Run Tests
```bash
cd erp-app/backend
# ensure TEST_DATABASE_URL is set
npm test
```

---

## Workflow Diagram

```
Customer Enquiry (NEW)
       │  create → QUOTED
       ▼
Quotation (DRAFT → SENT → ACCEPTED)
       │  /api/quotations/:id/convert
       ▼
Sales Order (PENDING)
       │  /api/sales-orders/:id/confirm  ── SELECT ... FOR UPDATE
       ▼                                   ── Transaction lock
Sales Order (CONFIRMED)  ── reserved_qty increased on each inventory row
       │  /api/sales-orders/:id/dispatch
       ▼
Dispatch (DSP-YYYY-NNNN)   ── physical_qty -= qty, reserved_qty -= qty
       │
       ▼
Sales Order → DISPATCHED (when all items fully dispatched)
```

---

## Authentication (OTP Email Verification)

Integrated with [https://otp-microservise.vercel.app/](https://otp-microservise.vercel.app/):

| Flow | Endpoint | Description |
|------|----------|-------------|
| Register 1 | `POST /api/auth/send-otp` | Sends 6-digit OTP to email |
| Register 2 | `POST /api/auth/register` | Verifies OTP + creates user |
| Login | `POST /api/auth/login` | email + password → JWT (8h) |
| Forgot PW 1 | `POST /api/auth/forgot-password/send-otp` | OTP via email |
| Forgot PW 2 | `POST /api/auth/forgot-password/reset` | OTP + new password |
| Profile | `GET /api/auth/me` | Current user via JWT |

> OTP service calls are in [`backend/service/otpService.js`](backend/service/otpService.js)

---

## Role-Based Access Control (RBAC)

Server-side enforcement via `middlewares/rbac.js` + `requireRole(...)`.

| Feature | ADMIN | SALES |
|---------|-------|-------|
| Create/view Customers | ✅ | ✅ |
| Create/view Products | ✅ (create) | ✅ (view) |
| Modify Inventory | ✅ | ❌ |
| Create/view Enquiries / Quotations | ✅ | ✅ |
| Convert ACCEPTED quotation → SO | ✅ | ✅ |
| Confirm Sales Order (reserve stock) | ✅ | ❌ |
| Dispatch Order | ✅ | ❌ |
| Cancel Confirmed Order | ✅ | ❌ |

> Frontend hides buttons based on role — but **backend always enforces** (403 Forbidden).

---

## API Endpoints Summary

| Method | Route | Auth | Role |
|--------|-------|------|------|
| **Auth** | | | |
| POST | `/api/auth/send-otp` | ❌ | - |
| POST | `/api/auth/register` | ❌ | - |
| POST | `/api/auth/login` | ❌ | - |
| POST | `/api/auth/forgot-password/send-otp` | ❌ | - |
| POST | `/api/auth/forgot-password/reset` | ❌ | - |
| GET | `/api/auth/me` | ✅ | any |
| **Customers** | | | |
| GET / POST | `/api/customers` | ✅ | ADMIN + SALES |
| GET / PATCH / DELETE | `/api/customers/:id` | ✅ | ADMIN (delete) |
| **Products** | | | |
| GET / POST | `/api/products` | ✅ | ADMIN creates |
| **Inventory** | | | |
| GET | `/api/inventory` | ✅ | ADMIN + SALES |
| PATCH | `/api/inventory/:productId` | ✅ | ADMIN only |
| **Enquiries** | | | |
| GET / POST | `/api/enquiries` | ✅ | ADMIN + SALES |
| GET | `/api/enquiries/:id` | ✅ | ADMIN + SALES |
| PATCH | `/api/enquiries/:id/status` | ✅ | ADMIN + SALES |
| **Quotations** | | | |
| GET / POST | `/api/quotations` | ✅ | ADMIN + SALES |
| GET | `/api/quotations/:id` | ✅ | ADMIN + SALES |
| PATCH | `/api/quotations/:id/status` | ✅ | ADMIN + SALES |
| POST | `/api/quotations/:id/convert` | ✅ | ADMIN + SALES |
| **Sales Orders** | | | |
| GET | `/api/sales-orders` | ✅ | ADMIN + SALES |
| GET | `/api/sales-orders/:id` | ✅ | ADMIN + SALES |
| POST | `/api/sales-orders/:id/confirm` | ✅ | **ADMIN only** |
| POST | `/api/sales-orders/:id/dispatch` | ✅ | **ADMIN only** |
| POST | `/api/sales-orders/:id/cancel` | ✅ | **ADMIN only** |
| **Dispatches** | | | |
| GET | `/api/dispatches` | ✅ | ADMIN + SALES |
| GET | `/api/dispatches/:id` | ✅ | ADMIN + SALES |
| **Dashboard** | | | |
| GET | `/api/dashboard/stats` | ✅ | ADMIN + SALES |
| Health | | | |
| GET | `/api/health` | ❌ | - |
| Docs | | | |
| GET | `/api-docs` | ❌ | - |

---

## Inventory Concurrency (Why `SELECT ... FOR UPDATE`)

The critical problem — two concurrent admins confirm orders needing the same stock:

> Without locking → race condition:
> ```
> Available = 100
> A reads 100, reserves 80
> B reads 100, reserves 50    ← stale read!
> Final reserved = 130       ← INVALID (over-available)
> ```

**Backend solution inside a single PostgreSQL transaction** (`service/salesOrderService.js → confirmSalesOrder`):

```js
await knex.transaction(async (trx) => {
  for (const item of orderItems) {
    // 1) ROW-LEVEL LOCK — other transactions WAIT here
    const inventory = await trx('inventory')
      .where({ product_id: item.product_id })
      .forUpdate()          // ← critical: exclusive row lock
      .first();

    // 2) Check AFTER acquiring lock (reads post-commit value)
    const available = inv.physical - inv.reserved - inv.damaged;
    if (item.quantity > available) throw new ConflictError('Insufficient stock');

    // 3) Update inside the locked transaction
    await trx('inventory').where({product_id}).update({ reserved_qty: reserved + qty });
    await trx('sales_order_items').where({id}).update({ reserved_qty: qty });
  }
  await trx('sales_orders').update({ status: 'CONFIRMED', ... });
});
```

With locking (Correct):
```
A locks row → B waits
A reserves 80 → commits
B continues, reads available = 20
B requests 50 > 20 → 409 Conflict
Final reserved = 80 ✅
```

Same row-locking strategy applied to:
- ✅ `confirmSalesOrder`
- ✅ `cancelSalesOrder` (releases reservation)
- ✅ `createDispatch` (reduces physical + reserved atomically)

---

## Database Schema Summary

Tables created via Knex migrations (see `backend/db/migrations/`):

| Table | Key Columns |
|-------|-------------|
| `users` | id, name, email, password_hash, role (ADMIN/SALES) |
| `customers` | id, company_name, contact_person, mobile, email, city |
| `products` | id, product_code (unique), product_name, category, unit, base_price |
| `inventory` | id, product_id (1:1 unique FK), physical_qty, reserved_qty, damaged_qty |
| `enquiries` + `enquiry_items` | ENQ-YYYY-NNNN, customer FK, status (NEW/QUOTED/WON/LOST), items (product, qty) |
| `quotations` + `quotation_items` | QUO-YYYY-NNNN, enquiry FK, grand_total, status (DRAFT/SENT/ACCEPTED/REJECTED), line_items (price, disc%, gst%, line_amount) |
| `sales_orders` + `sales_order_items` | SO-YYYY-NNNN, quotation_id (UNIQUE ← 1:1), status (PENDING/CONFIRMED/DISPATCHED/CANCELLED), items track reserved_qty + dispatched_qty |
| `dispatches` + `dispatch_items` | DSP-YYYY-NNNN, sales_order FK, vehicle/driver, items reference `sales_order_item_id` to prevent duplicate/over-dispatch |

PostgreSQL enforces invariants via CHECK constraints:
- `reserved_qty + damaged_qty <= physical_qty`
- `dispatched_qty <= reserved_qty`
- all quantities / prices >= 0
- `discount_pct BETWEEN 0 AND 100`
- unique FK on `sales_orders.quotation_id` (One quotation → One sales order max)

---

## Demo Credentials (Seed Data)

| Role | Email | Password |
|------|-------|----------|
| ADMIN | `admin@example.com` | `password123` |
| SALES | `sales@example.com` | `password123` |

Seeded with 3 customers, 6 products + inventory, 1 ENQUIRY → 1 **ACCEPTED quotation (QUO-2026-0001)** ready to convert → confirm → dispatch for live demos.

---

## Standard API Response

Success:
```json
{ "data": { ... }, "error": null }
```

Error:
```json
{
  "data": null,
  "error": { "message": "Insufficient stock" }
}
```

HTTP Status Codes: 400 (validation), 401 (unauthenticated), 403 (role), 404 (not found), 409 (business conflict / DB constraint / race-condition-safe), 500 (server).

---

## Number Generation

Back-end generates readable business identifiers — never trust frontend:

- `ENQ-YYYY-0001`, `QUO-YYYY-0001`, `SO-YYYY-0001`, `DSP-YYYY-0001`

---

## Transaction Boundaries (Mandatory)

`knex.transaction(...)` wraps all multi-write operations:

1. Quotation → Sales Order conversion
2. Sales Order **Confirmation + Inventory Reservation** (FOR UPDATE locks)
3. Dispatch creation (per-item lock: SOI → inventory)
4. Sales Order Cancellation (release reservation)

---

## Running the End-to-End Demo

1. Login as **SALES**
2. Create a **Customer** → Create **Enquiry** → Create **Quotation**
3. Send → Accept the Quotation → **Convert** to Sales Order
4. Login as **ADMIN**
5. **Confirm** SO — inventory gets reserved atomically
6. **Dispatch** (fill vehicle/driver + quantities) — inventory drops, SO becomes `DISPATCHED`

Also demonstrate:
- SALES tries Confirm Order → **403 Forbidden**
- Confirm order with insufficient stock → **409 Conflict**
- Convert same quotation twice → **409 Conflict** (unique FK)
- Cancel a CONFIRMED order → reservation is released
- Low stock products shown on Dashboard

---

## Test Coverage (Jest + Supertest)

| Test | Assertion |
|------|-----------|
| Pricing Engine | Grand total matches independently calculated expected value (proves backend owns pricing) |
| Invalid Conversion | DRAFT / REJECTED quotation → 409 |
| Duplicate Conversion | ACCEPTED × 2 → 201 then 409, SO count stays 1 |
| Insufficient Inventory | Available 10, Requested 20 → 409, inventory unchanged |
| RBAC Enforcement | SALES token POST confirm → 403 |

Run: `npm test` inside `backend/`.

---

## Known Assumptions / Design Decisions

1. **OTP Microservice**: Uses the external Vercel service for all email OTPs; no SMTP configuration required locally.
2. **Auth Registration**: Admin role can be self-assigned during registration for demo purposes — restrict the schema in production.
3. **Inventory 1:1 with Products**: Created automatically when a product is added (service layer).
4. **Line Totals Recalculation**: Frontend shows totals for UX, backend **always** recalculates and overwrites with `calculateLineAmount`/`calculateGrandTotal`.
5. **Numbering**: Yearly sequences (not globally unique) with 4-digit zero-padded suffix — simple + readable.

---

## Code Layers (Architecture)

```
HTTP Request
    │
    ▼
Routes  →  endpoints, attaches auth/rbac/validate middleware
    │
    ▼
Controllers  →  extract req.body/params, call 1 service, format response
    │
    ▼
Services  →  BUSINESS LOGIC. Transactions. Pricing engine. FOR UPDATE strategy.
    │        Calls multiple Model (repository) functions + OTP service
    ▼
Model / Repository  →  pure Knex queries, no business logic, reusable
    │
    ▼
PostgreSQL (constraints, indexes, row-level locks)
```

This separation makes the code easy to explain and defend in a live technical interview.

---

Happy coding & good luck with the interview round! 🏢
