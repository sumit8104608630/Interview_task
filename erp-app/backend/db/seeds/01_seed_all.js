const bcrypt = require('bcryptjs');
const PASSWORD = 'password123';
const ph = bcrypt.hashSync(PASSWORD, 10);

exports.seed = async (knex) => {
  await knex('dispatch_items').del();
  await knex('dispatches').del();
  await knex('sales_order_items').del();
  await knex('sales_orders').del();
  await knex('quotation_items').del();
  await knex('quotations').del();
  await knex('enquiry_items').del();
  await knex('enquiries').del();
  await knex('inventory').del();
  await knex('products').del();
  await knex('customers').del();
  await knex('users').del();

  const users = await knex('users').insert([
    { name: 'Admin User', email: 'admin@example.com', password_hash: ph, role: 'ADMIN' },
    { name: 'Sales User', email: 'sales@example.com', password_hash: ph, role: 'SALES' },
  ]).returning('*');
  const admin = users[0];
  const sales = users[1];

  const custs = await knex('customers').insert([
    { company_name: 'Acme Industrial Co.', contact_person: 'John Smith', mobile: '+919876543210', email: 'john@acme.com', city: 'Mumbai' },
    { company_name: 'Global Manufacturing Ltd.', contact_person: 'Sarah Johnson', mobile: '+919876543211', email: 'sarah@globalmfg.com', city: 'Delhi' },
    { company_name: 'Precision Engineering Works', contact_person: 'Raj Patel', mobile: '+919876543212', email: 'raj@precisioneng.com', city: 'Pune' },
  ]).returning('*');

  const prods = await knex('products').insert([
    { product_code: 'PRD-001', product_name: 'Deep Groove Ball Bearing', category: 'Bearings', unit: 'piece', base_price: 450.0 },
    { product_code: 'PRD-002', product_name: 'Industrial Valve', category: 'Valves', unit: 'piece', base_price: 2850.0 },
    { product_code: 'PRD-003', product_name: 'Hex Bolt M12x50', category: 'Fasteners', unit: 'box', base_price: 180.0 },
    { product_code: 'PRD-004', product_name: 'Electric Motor 5HP', category: 'Motors', unit: 'piece', base_price: 18500.0 },
    { product_code: 'PRD-005', product_name: 'Hydraulic Coupling', category: 'Hydraulics', unit: 'piece', base_price: 3200.0 },
    { product_code: 'PRD-006', product_name: 'Steel Fastener Set', category: 'Fasteners', unit: 'set', base_price: 750.0 },
  ]).returning('*');

  for (const p of prods) {
    const lowStockCodes = ['PRD-003', 'PRD-006'];
    const isLow = lowStockCodes.includes(p.product_code);
    await knex('inventory').insert({
      product_id: p.id,
      physical_qty: isLow ? 15 : 200,
      reserved_qty: 0,
      damaged_qty: isLow ? 3 : 5,
    });
  }

  const enqResult = await knex('enquiries').insert({
    enquiry_number: 'ENQ-2026-0001',
    customer_id: custs[0].id,
    enquiry_date: new Date(),
    required_date: new Date(Date.now() + 14 * 86400000),
    notes: 'Urgent requirement. Please process ASAP.',
    status: 'QUOTED',
    created_by: sales.id,
  }).returning('*');
  const enq = enqResult[0];

  await knex('enquiry_items').insert([
    { enquiry_id: enq.id, product_id: prods[0].id, quantity: 50 },
    { enquiry_id: enq.id, product_id: prods[1].id, quantity: 10 },
    { enquiry_id: enq.id, product_id: prods[2].id, quantity: 20 },
  ]);

  const c1 = { qty: 50, price: 450, disc: 5, gst: 18 };
  const b1 = c1.qty * c1.price;
  const d1 = (b1 * c1.disc) / 100;
  const t1 = b1 - d1;
  const g1 = (t1 * c1.gst) / 100;
  const l1 = t1 + g1;

  const c2 = { qty: 10, price: 2850, disc: 3, gst: 18 };
  const b2 = c2.qty * c2.price;
  const d2 = (b2 * c2.disc) / 100;
  const t2 = b2 - d2;
  const g2 = (t2 * c2.gst) / 100;
  const l2 = t2 + g2;

  const c3 = { qty: 20, price: 180, disc: 0, gst: 18 };
  const b3 = c3.qty * c3.price;
  const d3 = (b3 * c3.disc) / 100;
  const t3 = b3 - d3;
  const g3 = (t3 * c3.gst) / 100;
  const l3 = t3 + g3;

  const gt = l1 + l2 + l3;

  const quoResult = await knex('quotations').insert({
    quotation_number: 'QUO-2026-0001',
    enquiry_id: enq.id,
    customer_id: custs[0].id,
    valid_until: new Date(Date.now() + 30 * 86400000),
    status: 'ACCEPTED',
    grand_total: +gt.toFixed(2),
    created_by: sales.id,
  }).returning('*');
  const quo = quoResult[0];

  await knex('quotation_items').insert([
    { quotation_id: quo.id, product_id: prods[0].id, quantity: c1.qty, unit_price: c1.price, discount_pct: c1.disc, gst_pct: c1.gst, line_amount: +l1.toFixed(2) },
    { quotation_id: quo.id, product_id: prods[1].id, quantity: c2.qty, unit_price: c2.price, discount_pct: c2.disc, gst_pct: c2.gst, line_amount: +l2.toFixed(2) },
    { quotation_id: quo.id, product_id: prods[2].id, quantity: c3.qty, unit_price: c3.price, discount_pct: c3.disc, gst_pct: c3.gst, line_amount: +l3.toFixed(2) },
  ]);

  console.log('Seed data created successfully!');
  console.log(`ADMIN: admin@example.com / ${PASSWORD}`);
  console.log(`SALES: sales@example.com / ${PASSWORD}`);
  console.log('Unconverted ACCEPTED quotation: QUO-2026-0001 (ready for convert → confirm → dispatch demo)');
};
