const db = require('../db');

const findAll = () => db('sales_orders')
  .join('customers', 'sales_orders.customer_id', 'customers.id')
  .leftJoin('quotations', 'sales_orders.quotation_id', 'quotations.id')
  .leftJoin('users', 'sales_orders.created_by', 'users.id')
  .select(
    'sales_orders.id',
    'sales_orders.order_number',
    'sales_orders.quotation_id',
    'sales_orders.customer_id',
    'sales_orders.order_date',
    'sales_orders.total_amount',
    'sales_orders.status',
    'sales_orders.created_by',
    'sales_orders.confirmed_by',
    'sales_orders.confirmed_at',
    'sales_orders.created_at',
    'customers.id as customer_row_id',
    'customers.company_name',
    'customers.contact_person',
    'customers.mobile',
    'customers.email as customer_email',
    'customers.city',
    'quotations.id as quotation_row_id',
    'quotations.quotation_number',
    'users.id as user_row_id',
    'users.name as created_by_name'
  )
  .orderBy('sales_orders.created_at', 'desc');

const findById = (id) => db('sales_orders')
  .join('customers', 'sales_orders.customer_id', 'customers.id')
  .leftJoin('quotations', 'sales_orders.quotation_id', 'quotations.id')
  .leftJoin('users', 'sales_orders.created_by', 'users.id')
  .select(
    'sales_orders.id',
    'sales_orders.order_number',
    'sales_orders.quotation_id',
    'sales_orders.customer_id',
    'sales_orders.order_date',
    'sales_orders.total_amount',
    'sales_orders.status',
    'sales_orders.created_by',
    'sales_orders.confirmed_by',
    'sales_orders.confirmed_at',
    'sales_orders.created_at',
    'customers.id as customer_row_id',
    'customers.company_name',
    'customers.contact_person',
    'customers.mobile',
    'customers.email as customer_email',
    'customers.city',
    'quotations.id as quotation_row_id',
    'quotations.quotation_number',
    'users.id as user_row_id',
    'users.name as created_by_name'
  )
  .where('sales_orders.id', id).first();

const findItems = (soid) => db('sales_order_items')
  .join('products', 'sales_order_items.product_id', 'products.id')
  .select(
    'sales_order_items.*',
    'products.product_code',
    'products.product_name',
    'products.unit'
  )
  .where({ sales_order_id: soid });

const findRawById = (id, trx = db) => trx('sales_orders').where({ id }).first();
const findRawItemById = (id, trx = db) => trx('sales_order_items').where({ id }).first();

const nextOrderNumber = async (trx = db) => {
  const y = new Date().getFullYear();
  const r = await trx('sales_orders').where('order_number', 'like', `SO-${y}-%`).max('order_number as num').first();
  const n = (r.num && parseInt(r.num.split('-')[2], 10)) || 0;
  return `SO-${y}-${String(n+1).padStart(4, '0')}`;
};

const create = (header, items, trx = db) => trx.transaction(async (t) => {
  const [so] = await t('sales_orders').insert(header).returning('*');
  for (const it of items) {
    await t('sales_order_items').insert({
      sales_order_id: so.id,
      product_id: it.product_id,
      quantity: it.quantity,
      unit_price: it.unit_price,
      reserved_qty: 0,
      dispatched_qty: 0,
    });
  }
  return so;
});

const updateStatus = (id, status, meta = {}, trx = db) => trx('sales_orders').where({ id }).update({ status, ...meta }).returning('*');
const updateItem = (itemId, d, trx = db) => trx('sales_order_items').where({ id: itemId }).update(d).returning('*');
const updateItemByOrderProduct = (soid, pid, d, trx = db) => trx('sales_order_items').where({ sales_order_id: soid, product_id: pid }).update(d);
const countByStatus = async (trx = db) => {
  const rows = await trx('sales_orders').select('status').count('* as total').groupBy('status');
  const o = {};
  for (const r of rows) o[r.status] = parseInt(r.total, 10);
  return o;
};
module.exports = {
  findAll, findById, findItems, findRawById, findRawItemById,
  nextOrderNumber, create, updateStatus, updateItem, updateItemByOrderProduct,
  countByStatus,
};
