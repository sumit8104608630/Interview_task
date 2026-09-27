const db = require('../db');

const findAll = () => db('dispatches')
  .join('sales_orders', 'dispatches.sales_order_id', 'sales_orders.id')
  .join('users', 'dispatches.created_by', 'users.id')
  .select('dispatches.*', 'sales_orders.order_number', 'users.name as created_by_name')
  .orderBy('dispatches.created_at', 'desc');

const findById = (id) => db('dispatches')
  .join('sales_orders', 'dispatches.sales_order_id', 'sales_orders.id')
  .join('customers', 'sales_orders.customer_id', 'customers.id')
  .leftJoin('users', 'dispatches.created_by', 'users.id')
  .select(
    'dispatches.*',
    'sales_orders.order_number',
    'sales_orders.status as order_status',
    'customers.company_name',
    'customers.contact_person',
    'customers.mobile',
    'users.name as created_by_name'
  )
  .where('dispatches.id', id).first();

const findItems = (did) => db('dispatch_items')
  .join('products', 'dispatch_items.product_id', 'products.id')
  .leftJoin('sales_order_items', 'dispatch_items.sales_order_item_id', 'sales_order_items.id')
  .select(
    'dispatch_items.*',
    'products.product_code',
    'products.product_name',
    'products.unit',
    'sales_order_items.unit_price'
  )
  .where({ dispatch_id: did });

const nextNumber = async (trx = db) => {
  const y = new Date().getFullYear();
  const r = await trx('dispatches').where('dispatch_number', 'like', `DSP-${y}-%`).max('dispatch_number as num').first();
  const n = (r.num && parseInt(r.num.split('-')[2], 10)) || 0;
  return `DSP-${y}-${String(n+1).padStart(4, '0')}`;
};

const create = (d, items, trx = db) => trx.transaction(async (t) => {
  const [disp] = await t('dispatches').insert(d).returning('*');
  for (const it of items) await t('dispatch_items').insert({ ...it, dispatch_id: disp.id });
  return disp;
});

const count = async () => parseInt((await db('dispatches').count('* as total').first()).total, 10);
module.exports = { findAll, findById, findItems, nextNumber, create, count };
