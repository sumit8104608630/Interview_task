# PERN ERP Implementation Plan

## 1) What this project is actually simulating

This is not a generic “ERP app” demo. It is a B2B industrial sales workflow used as a systems-design and backend integrity exercise.

The business process is:

Customer inquiry → quotation → accepted quotation → sales order → stock reservation → dispatch

This maps to a realistic manufacturing/distribution company where:

- Sales team negotiates and quotes products.
- Admin team owns stock truth and fulfillment actions.
- Inventory must be reserved before shipment.
- Stock allocation must be concurrency-safe.
- State transitions must be strictly controlled.

The real challenge is not the UI. The real challenge is data integrity.

The system is designed to answer questions like:

- Can a salesperson quote without a valid enquiry?
- Can a rejected or draft quotation become an order?
- Can the same stock be reserved twice in parallel?
- Can an admin dispatch more than was actually reserved?
- Can a non-admin confirm stock and create a fake commitment?

That is why the project emphasizes:

- Role-based access control
- Strict status transitions
- Server-side pricing calculation
- Database locks and transactions
- Inventory availability checks with row-level locking

---

## 2) End-to-end user flow

### Role 1: Sales User
Sales user acts as the front-line commercial role.

Responsibilities:

- Create customer records
- Create enquiries for requested products and quantities
- Prepare quotations with pricing, discounts, and GST
- Update quotation status to SENT / ACCEPTED / REJECTED
- Convert accepted quotation into a sales order

Sales users do not have authority to confirm inventory or dispatch goods.

### Role 2: Admin
Admin acts as the stock and fulfillment gatekeeper.

Responsibilities:

- Confirm a pending sales order
- Reserve stock only when available
- Dispatch stock only after reservation
- Handle inventory adjustments and damaged stock actions
- Cancel or reverse orders when needed

Admins own the “real-world inventory commitment” decisions.

---

## 3) Workflow example with numbers

### Initial inventory

Product: Bearing X100

- physical_qty = 200
- reserved_qty = 60
- available = 140

### Step A: Customer enquiry
Customer asks for 80 units.

Sales user creates an enquiry:

- customer = ABC Engineering
- product = Bearing X100
- quantity = 80
- status = NEW

No inventory is touched at this step.

### Step B: Quotation
Sales user creates quotation for 80 units.

Example price:

- Unit price = ₹500
- Discount = 5%
- GST = 18%

Calculation:

- Base = 80 × 500 = 40,000
- Discount = 2,000
- Taxable = 38,000
- GST = 6,840
- Grand total = 44,840

This total must be recalculated by the backend, not trusted from the browser.

### Step C: Accepted quotation
Customer accepts the quote.

- quotation status = ACCEPTED
- enquiry status = WON

### Step D: Convert to sales order
Sales user clicks “Convert to sales order”.

The system creates:

- sales_orders row
- sales_order_items row
- order status = PENDING

This is still just a business commitment; no inventory is reduced yet.

### Step E: Admin confirms order
Admin confirms order.

System checks available stock:

- available = physical - reserved = 200 - 60 = 140
- required = 80
- 80 <= 140 -> valid

Then stock is reserved:

- physical_qty remains 200
- reserved_qty becomes 140
- available becomes 60

Order status becomes CONFIRMED.

This is the critical inventory-reservation step.

### Step F: Dispatch
Admin dispatches the order.

Dispatch of 80 units:

- physical_qty = 200 - 80 = 120
- reserved_qty = 140 - 80 = 60
- available = 60

Order status becomes DISPATCHED.

The distinction is important:

- reserve = promise stock to a customer
- dispatch = physically ship stock and consume the reserved stock

---

## 4) Business rules that must be enforced

### Enquiry rules

- Enquiry must belong to a valid customer.
- Enquiry can contain multiple products.
- Only sales/admin roles can create and view enquiries.
- A quotation can only be created from an existing enquiry.

### Quotation rules

- Quotation must reference an enquiry and customer.
- Grand total is server-calculated.
- Status flow is usually:
  - DRAFT → SENT → ACCEPTED
  - or DRAFT → SENT → REJECTED
- A rejected or draft quotation cannot become an order.
- Only one sales order should be created from one quotation.

### Sales order rules

- Sales order is created only from accepted quotation.
- A sales order can be created once only.
- Status flow: PENDING → CONFIRMED → DISPATCHED / CANCELLED
- Admin confirms; sales cannot confirm.
- Admin dispatches; sales cannot dispatch.

### Inventory rules

- If available stock < requested quantity, confirm fails.
- Reservation is only accepted if sufficient stock exists.
- Physically shipped quantity cannot exceed reserved quantity.
- Reserved quantity cannot exceed physical quantity.
- Damaged stock can reduce usable quantity without affecting sales commitments incorrectly.

---

## 5) Database design

### Core tables

#### users

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','SALES')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### customers

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(180) NOT NULL,
  contact_person VARCHAR(120),
  mobile VARCHAR(30),
  email VARCHAR(150),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### products

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  product_code VARCHAR(60) UNIQUE NOT NULL,
  product_name VARCHAR(180) NOT NULL,
  category VARCHAR(80),
  unit VARCHAR(40),
  base_price DECIMAL(12,2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### inventory

```sql
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INT UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  physical_qty INT NOT NULL DEFAULT 0,
  reserved_qty INT NOT NULL DEFAULT 0,
  damaged_qty INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (reserved_qty + damaged_qty <= physical_qty)
);
```

Important concept:

- physical_qty = total stock physically present
- reserved_qty = stock already promised to confirmed orders
- damaged_qty = stock lost/damaged and unusable
- available = physical_qty - reserved_qty

### Enquiry tables

```sql
CREATE TYPE enquiry_status AS ENUM ('NEW','QUOTED','WON','LOST');

CREATE TABLE enquiries (
  id SERIAL PRIMARY KEY,
  enquiry_number VARCHAR(40) UNIQUE NOT NULL,
  customer_id INT NOT NULL REFERENCES customers(id),
  enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  required_date DATE,
  notes TEXT,
  status enquiry_status NOT NULL DEFAULT 'NEW',
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE enquiry_items (
  id SERIAL PRIMARY KEY,
  enquiry_id INT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0)
);
```

### Quotation tables

```sql
CREATE TYPE quotation_status AS ENUM ('DRAFT','SENT','ACCEPTED','REJECTED');

CREATE TABLE quotations (
  id SERIAL PRIMARY KEY,
  quotation_number VARCHAR(40) UNIQUE NOT NULL,
  enquiry_id INT NOT NULL REFERENCES enquiries(id),
  customer_id INT NOT NULL REFERENCES customers(id),
  valid_until DATE,
  status quotation_status NOT NULL DEFAULT 'DRAFT',
  grand_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL,
  discount_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  gst_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  line_amount DECIMAL(14,2) NOT NULL
);
```

### Sales order tables

```sql
CREATE TYPE order_status AS ENUM ('PENDING','CONFIRMED','DISPATCHED','CANCELLED');

CREATE TABLE sales_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(40) UNIQUE NOT NULL,
  quotation_id INT UNIQUE NOT NULL REFERENCES quotations(id),
  customer_id INT NOT NULL REFERENCES customers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount DECIMAL(14,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'PENDING',
  created_by INT NOT NULL REFERENCES users(id),
  confirmed_by INT REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_order_items (
  id SERIAL PRIMARY KEY,
  sales_order_id INT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL,
  reserved_qty INT NOT NULL DEFAULT 0,
  dispatched_qty INT NOT NULL DEFAULT 0,
  CHECK (dispatched_qty <= reserved_qty)
);
```

### Dispatch table

```sql
CREATE TABLE dispatches (
  id SERIAL PRIMARY KEY,
  dispatch_number VARCHAR(40) UNIQUE NOT NULL,
  sales_order_id INT NOT NULL REFERENCES sales_orders(id),
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  dispatch_date TIMESTAMPTZ DEFAULT NOW(),
  vehicle_number VARCHAR(80),
  driver_name VARCHAR(120),
  created_by INT NOT NULL REFERENCES users(id)
);
```

### Optional but recommended

```sql
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id),
  movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('RESERVE','RELEASE','DISPATCH','DAMAGED','ADJUSTMENT','CANCELLED')),
  quantity INT NOT NULL,
  reference_type VARCHAR(40),
  reference_id INT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

This makes auditing and dispute resolution much easier.

---

## 6) Concurrency-safe inventory reservation

This is the most important technical requirement.

### The problem

Two admins can try to confirm two orders for the same product at the same time.

Example:

- Product inventory: physical = 100, reserved = 20, available = 80
- Order A needs 70
- Order B needs 70

If both requests read available = 80 before either writes, both pass.

That is overselling.

### Correct solution

Use a transaction and row lock on the inventory row:

```sql
BEGIN;
SELECT * FROM inventory WHERE product_id = $1 FOR UPDATE;

-- check available stock here
-- if request_qty > physical_qty - reserved_qty then reject

UPDATE inventory
SET reserved_qty = reserved_qty + $2,
    updated_at = NOW()
WHERE product_id = $1;

COMMIT;
```

This makes the second transaction wait until the first commits, then re-read the latest value.

This is the canonical pattern for concurrency-safe reservation logic.

### Why this is the right architecture

Because the real invariant is:

available = physical_qty - reserved_qty

and this must be checked and updated atomically.

You do not rely on application code alone. You lock the row in the database so the “read-then-write” race cannot happen.

---

## 7) Business logic for each state transition

### 1. Create enquiry
Rules:

- Valid customer_id required
- items must reference valid products
- quantity > 0
- no inventory allocation yet

### 2. Create quotation
Rules:

- quotation must belong to an existing enquiry
- enquiry must not already have a different active quotation in a way your domain rejects
- compute line amounts and grand total on backend
- create quotation_items rows
- update enquiry status to QUOTED

### 3. Accept/reject quotation
Rules:

- status can move to SENT first, then ACCEPTED or REJECTED
- accepted quotation means enquiry becomes WON
- rejected quotation means enquiry becomes LOST

### 4. Convert accepted quotation to sales order
Rules:

- quotation status must be ACCEPTED
- no existing sales order for this quotation
- create sales_order and sales_order_items from quotation_items
- copy pricing and quantity from the accepted quotation
- set order status to PENDING

### 5. Confirm order
Rules:

- only ADMIN can confirm
- sales order status must be PENDING
- lock inventory row(s) for each product
- compute available_qty = physical_qty - reserved_qty
- if requested qty exceeds available, reject with 409
- otherwise update reserved_qty for each product
- set order status = CONFIRMED
- set confirmed_by and confirmed_at

### 6. Dispatch order
Rules:

- only ADMIN can dispatch
- order must be CONFIRMED
- for each item, dispatch quantity must not exceed reserved_qty
- decrement physical_qty by dispatched amount
- decrement reserved_qty by dispatched amount
- create dispatch record(s)
- if all items dispatched, mark order as DISPATCHED

### 7. Cancel order
Rules:

- usually only allowed if not already dispatched
- release reserved stock back to available
- update order status to CANCELLED

This should be treated as a specific required extension rather than an afterthought.

---

## 8) API surface

### Auth

- POST /api/auth/send-otp
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot-password/send-otp
- POST /api/auth/forgot-password/reset
- GET /api/auth/me

### Customers

- GET /api/customers
- POST /api/customers
- GET /api/customers/:id
- PATCH /api/customers/:id
- DELETE /api/customers/:id

### Products

- GET /api/products
- POST /api/products
- GET /api/products/:id
- PATCH /api/products/:id

### Inventory

- GET /api/inventory
- PATCH /api/inventory/:productId

### Enquiries

- GET /api/enquiries
- POST /api/enquiries
- GET /api/enquiries/:id
- PATCH /api/enquiries/:id/status

### Quotations

- GET /api/quotations
- POST /api/quotations
- GET /api/quotations/:id
- PATCH /api/quotations/:id/status
- POST /api/quotations/:id/convert
- GET /api/quotations/:id/items

### Sales orders

- GET /api/sales-orders
- GET /api/sales-orders/:id
- POST /api/sales-orders/:id/confirm
- POST /api/sales-orders/:id/dispatch
- POST /api/sales-orders/:id/cancel

---

## 9) RBAC rules

### Sales

Allowed:

- customer creation and viewing
- enquiry creation and viewing
- quotation creation and viewing
- quoting/status updates
- convert accepted quotation to order

Not allowed:

- confirm sales order
- dispatch order
- inventory edits
- damaged stock adjustment
- cancel confirmed order

### Admin

Allowed:

- all sales actions
- inventory management
- confirming orders
- dispatching orders
- canceling committed orders
- damaged stock adjustments

Backend must enforce RBAC; frontend buttons are only UI hints.

---

## 10) Required tests (5 major tests)

These are the tests you should build first because they cover the real business risk.

### Test 1: Pricing must be server-authoritative

- Create a quotation with a manipulated unit price or discount
- Verify server recalculates grand_total and line_amount
- Confirm browser-tainted values are ignored

### Test 2: Non-accepted quotation cannot convert to sales order

- DRAFT quotation convert should fail
- REJECTED quotation convert should fail
- This prevents invalid order creation

### Test 3: Duplicate conversion must fail

- Accepted quotation converted once
- second conversion returns 409
- only one sales order exists for that quotation

### Test 4: Insufficient stock confirmation fails with no side effects

- Confirm order requiring more stock than available
- expect 409
- inventory reserved_qty must not change

### Test 5: Sales user cannot confirm an order

- Sales role tries to confirm
- expect 403 Forbidden
- proves RBAC enforcement

Optional but highly recommended:

- concurrency test with two simultaneous confirm requests
- dispatch exceeds reserved quantity test
- cancelled order cannot be dispatched

---

## 11) 48-hour implementation roadmap

### Hour 0-4: Setup and project scaffolding

- initialize backend and frontend
- configure PostgreSQL
- setup Knex migrations and seed scripts
- define env config and JWT auth
- create folder structure

### Hour 5-10: Authentication and user model

- users table
- password hashing
- JWT generation and verification
- role enum
- login/register endpoints
- auth middleware and RBAC middleware

### Hour 11-16: Customers, products, and inventory base models

- CRUD for customer and product
- inventory table and initial stock records
- inventory read endpoints
- validation and error handling

### Hour 17-22: Enquiry and quotation workflows

- enquiry creation and items
- quotation creation and item pricing
- quotation status update
- accepted/rejected logic
- enquiry status synchronization

### Hour 23-30: Sales order conversion and confirmation logic

- accepted quotation -> sales order
- uniqueness on quotation_id
- confirm order endpoint
- stock reservation transaction
- row lock and invariant validation

### Hour 31-36: Dispatch logic and inventory movement

- dispatch creation
- reject over-dispatch and duplicate dispatch
- decrement physical_qty and reserved_qty
- mark order as DISPATCHED when complete

### Hour 37-40: Tests and edge cases

- write the five required tests
- add insufficient stock tests
- add RBAC checks
- add duplicate conversion checks

### Hour 41-44: Frontend integration

- login screen
- dashboard
- enquiry/quotation/order pages
- role-based UI hide/show
- API integration with JWT

### Hour 45-48: Hardening and demo polish

- clean error messages
- final README and flow explanations
- seed demo data
- run end-to-end smoke tests
- prepare live demo narrative

---

## 12) Two likely live-verification changes to design for early

These are the two scenario changes most interviewers or evaluators often introduce once the basic flow works.

### A) Damaged stock adjustment

A warehouse clerk reports that some stock is damaged and unusable.

Example:

- physical_qty = 200
- damaged_qty = 0
- reserved_qty = 50
- available = 150

Then damaged stock is discovered:

- 10 units damaged

The correct system behavior is:

- physical_qty should reduce to 190
- damaged_qty should increase to 10
- available should become 140 if the reserved stock is unaffected

If the damaged stock is already part of reserved inventory, the logic must be more careful. The schema should be ready for this by including `damaged_qty` in `inventory` from day one.

### B) Order cancellation

A confirmed order may need to be cancelled before dispatch.

Example:

- order is CONFIRMED
- reserved_qty = 80

On cancel:

- release 80 units from reserved stock
- order becomes CANCELLED
- do not allow dispatch after cancellation

This is why the schema should be designed with a clear status progression and a cancellation path from the beginning.

---

## 13) Recommended implementation stance

For this project, the strongest choice is:

- Backend: Node.js + Express + Knex + PostgreSQL
- Database: PostgreSQL, because row-level locking is native and reliable
- Architecture: controller → service → repository/model, with transactions in service layer

This matches the business problem better than ORM-heavy abstractions because the core requirement is atomic inventory logic under concurrency.

---

## 14) Short interview explanation you can say out loud

“This project simulates a manufacturing company’s sales order pipeline. A sales user creates an enquiry, builds a quotation, and converts an accepted quote into a sales order. The admin then confirms inventory availability and reserves stock before dispatch. The core technical challenge is ensuring stock reservation is concurrency-safe using database row locks, so two admins cannot over-reserve the same inventory at the same time. The workflow is designed to enforce strict business rules, role-based access control, and server-side pricing so the system behaves correctly under real operational conditions.”

---

## 15) Final takeaway

This project is really about one idea:

The system must model business truth, not just UI actions.

And in a real ERP, business truth is not how the browser says the order looks — it is what the database says the inventory and status transitions actually are.

That is why the project emphasizes:

- database constraints
- state transitions
- RBAC protection
- transaction safety
- server-side calculations
- auditability

If you build those correctly, the rest of the ERP workflow becomes straightforward.
