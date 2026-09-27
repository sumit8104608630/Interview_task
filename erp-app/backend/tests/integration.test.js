const request = require('supertest');
const bcrypt = require('bcryptjs');
const db = require('../db');
const app = require('../src/app');
const { signToken } = require('../utils/jwt');

const headers = (u) => ({ Authorization: `Bearer ${signToken({ sub: u.id, role: u.role })}` });

beforeAll(async () => {
  await db.migrate.rollback({}, true);
  await db.migrate.latest();
});
afterAll(async () => {
  await db.migrate.rollback({}, true);
  await db.destroy();
});

let admin, sales, custA, prodB, prodC, prodD;

beforeEach(async () => {
  await db.migrate.rollback({}, true).catch(() => {});
  await db.migrate.latest();

  const ph = bcrypt.hashSync('password123', 10);
  [admin] = await db('users').insert({ name: 'A', email: 'a@a.com', password_hash: ph, role: 'ADMIN' }).returning('*');
  [sales] = await db('users').insert({ name: 'S', email: 's@s.com', password_hash: ph, role: 'SALES' }).returning('*');
  [custA] = await db('customers').insert({ company_name: 'C1', contact_person: 'CP', mobile: '111' }).returning('*');
  const prods = await db('products').insert([
    { product_code: 'B-TEST', product_name: 'ProdB', category: 'X', unit: 'piece', base_price: 100 },
    { product_code: 'C-TEST', product_name: 'ProdC', category: 'X', unit: 'piece', base_price: 100 },
    { product_code: 'D-TEST', product_name: 'ProdD', category: 'X', unit: 'piece', base_price: 100 },
  ]).returning('*');
  prodB = prods[0];
  prodC = prods[1];
  prodD = prods[2];
  for (const p of prods) {
    await db('inventory').insert({ product_id: p.id, physical_qty: 100, reserved_qty: 0, damaged_qty: 0 });
  }
  expect(admin.role).toBe('ADMIN');
  expect(sales.role).toBe('SALES');
});

describe('Test1: Pricing backend-authoritative (preview)', () => {
  test('grand_total is recalculated on server', async () => {
    const res = await request(app)
      .post('/api/quotations')
      .set(headers(sales))
      .send({
        customer_id: custA.id,
        valid_until: new Date(Date.now() + 86400000 * 30),
        enquiry_id: 0,
        items: [{ product_id: prodB.id, quantity: 10, unit_price: 100, discount_pct: 0, gst_pct: 18 }],
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test('full quotation flow pricing', async () => {
    const er1 = await request(app).post('/api/enquiries').set(headers(sales)).send({
      customer_id: custA.id, items: [{ product_id: prodB.id, quantity: 50 }],
    });
    expect([200, 201]).toContain(er1.status);
    const enquiry = er1.body.data;
    const qr = await request(app).post('/api/quotations').set(headers(sales)).send({
      enquiry_id: enquiry.id,
      customer_id: custA.id,
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
      items: [
        { product_id: prodB.id, quantity: 50, unit_price: 450, discount_pct: 5, gst_pct: 18 },
      ],
    });
    expect(qr.status).toBe(201);
    const quotation = qr.body.data;
    const expectedBase = 50 * 450;
    const expectedDisc = expectedBase * 0.05;
    const expectedTax = expectedBase - expectedDisc;
    const expectedGst = expectedTax * 0.18;
    const expectedTotal = expectedTax + expectedGst;
    expect(quotation.grand_total).toBe(+expectedTotal.toFixed(2));
    const its = await request(app).get(`/api/quotations/${quotation.id}/items`).set(headers(sales));
    expect(its.status).toBe(200);
    expect(+its.body.data[0].line_amount).toBe(+expectedTotal.toFixed(2));
  });
});

describe('Test2: Cannot convert non-ACCEPTED quotations', () => {
  test('DRAFT convert returns 409', async () => {
    const er1 = await request(app).post('/api/enquiries').set(headers(sales)).send({
      customer_id: custA.id, items: [{ product_id: prodB.id, quantity: 50 }],
    });
    const qD = await request(app).post('/api/quotations').set(headers(sales)).send({
      enquiry_id: er1.body.data.id,
      customer_id: custA.id,
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
      items: [{ product_id: prodC.id, quantity: 5, unit_price: 100, discount_pct: 0, gst_pct: 0 }],
    });
    const c1 = await request(app).post(`/api/quotations/${qD.body.data.id}/convert`).set(headers(sales));
    expect(c1.status).toBe(409);
  });

  test('REJECTED convert returns 409', async () => {
    const er1 = await request(app).post('/api/enquiries').set(headers(sales)).send({
      customer_id: custA.id, items: [{ product_id: prodB.id, quantity: 50 }],
    });
    const qRr = await request(app).post('/api/quotations').set(headers(sales)).send({
      enquiry_id: er1.body.data.id,
      customer_id: custA.id,
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
      items: [{ product_id: prodD.id, quantity: 1, unit_price: 50, discount_pct: 0, gst_pct: 0 }],
    });
    await request(app).patch(`/api/quotations/${qRr.body.data.id}/status`).set(headers(sales)).send({ status: 'SENT' });
    await request(app).patch(`/api/quotations/${qRr.body.data.id}/status`).set(headers(sales)).send({ status: 'REJECTED' });
    const r = await request(app).post(`/api/quotations/${qRr.body.data.id}/convert`).set(headers(sales));
    expect(r.status).toBe(409);
  });
});

describe('Test3: Duplicate convert to Sales Order returns 409', () => {
  test('Convert → convert second time → 409', async () => {
    const er1 = await request(app).post('/api/enquiries').set(headers(sales)).send({
      customer_id: custA.id, items: [{ product_id: prodB.id, quantity: 50 }],
    });
    const qr = await request(app).post('/api/quotations').set(headers(sales)).send({
      enquiry_id: er1.body.data.id,
      customer_id: custA.id,
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString(),
      items: [{ product_id: prodB.id, quantity: 50, unit_price: 450, discount_pct: 5, gst_pct: 18 }],
    });
    await request(app).patch(`/api/quotations/${qr.body.data.id}/status`).set(headers(sales)).send({ status: 'SENT' });
    const accepted = await request(app).patch(`/api/quotations/${qr.body.data.id}/status`).set(headers(sales)).send({ status: 'ACCEPTED' });
    expect(accepted.status).toBe(200);
    const so1 = await request(app).post(`/api/quotations/${qr.body.data.id}/convert`).set(headers(sales));
    expect(so1.status).toBe(201);
    const so2 = await request(app).post(`/api/quotations/${qr.body.data.id}/convert`).set(headers(sales));
    expect(so2.status).toBe(409);
    const cnt = await db('sales_orders').where('quotation_id', qr.body.data.id).count('* as n').first();
    expect(parseInt(cnt.n, 10)).toBe(1);
  });
});

describe('Test4: Confirm with insufficient stock → 409 and no side effects', () => {
  test('Exceeds inventory returns 409, reserved remains same', async () => {
    const er = await request(app).post('/api/enquiries').set(headers(sales)).send({
      customer_id: custA.id, items: [{ product_id: prodC.id, quantity: 1000 }],
    });
    const eq = await request(app).post('/api/quotations').set(headers(sales)).send({
      enquiry_id: er.body.data.id, customer_id: custA.id,
      items: [{ product_id: prodC.id, quantity: 1000, unit_price: 100, discount_pct: 0, gst_pct: 0 }],
    });
    await request(app).patch(`/api/quotations/${eq.body.data.id}/status`).set(headers(sales)).send({ status: 'SENT' });
    await request(app).patch(`/api/quotations/${eq.body.data.id}/status`).set(headers(sales)).send({ status: 'ACCEPTED' });
    const soR = await request(app).post(`/api/quotations/${eq.body.data.id}/convert`).set(headers(sales));
    expect(soR.status).toBe(201);
    const before = await db('inventory').where({ product_id: prodC.id }).first();
    const r = await request(app).post(`/api/sales-orders/${soR.body.data.id}/confirm`).set(headers(admin));
    expect(r.status).toBe(409);
    const after = await db('inventory').where({ product_id: prodC.id }).first();
    expect(after.reserved_qty).toBe(before.reserved_qty);
  });
});

describe('Test5: SALES role cannot confirm sales order (RBAC 403)', () => {
  test('SALES gets 403', async () => {
    const er = await request(app).post('/api/enquiries').set(headers(sales)).send({
      customer_id: custA.id, items: [{ product_id: prodD.id, quantity: 5 }],
    });
    const eq = await request(app).post('/api/quotations').set(headers(sales)).send({
      enquiry_id: er.body.data.id, customer_id: custA.id,
      items: [{ product_id: prodD.id, quantity: 5, unit_price: 100, discount_pct: 0, gst_pct: 0 }],
    });
    await request(app).patch(`/api/quotations/${eq.body.data.id}/status`).set(headers(sales)).send({ status: 'SENT' });
    await request(app).patch(`/api/quotations/${eq.body.data.id}/status`).set(headers(sales)).send({ status: 'ACCEPTED' });
    const so = await request(app).post(`/api/quotations/${eq.body.data.id}/convert`).set(headers(sales));
    expect(so.status).toBe(201);
    const r = await request(app).post(`/api/sales-orders/${so.body.data.id}/confirm`).set(headers(sales));
    expect(r.status).toBe(403);
  });
});
