const db = require('../db');

const findAll = () => db('enquiries')
  .join('customers', 'enquiries.customer_id', 'customers.id')
  .leftJoin('users', 'enquiries.created_by', 'users.id')
  .select(
    'enquiries.*',
    'customers.company_name',
    'customers.contact_person',
    'customers.mobile',
    'users.name as created_by_name'
  )
  .orderBy('enquiries.created_at', 'desc');

const findById = (id) => db('enquiries')
  .join('customers', 'enquiries.customer_id', 'customers.id')
  .leftJoin('users', 'enquiries.created_by', 'users.id')
  .select(
    'enquiries.*',
    'customers.company_name',
    'customers.contact_person',
    'customers.mobile',
    'customers.email as customer_email',
    'customers.city',
    'users.name as created_by_name'
  )
  .where('enquiries.id', id).first();

const findItems = (enqId) => db('enquiry_items')
  .join('products', 'enquiry_items.product_id', 'products.id')
  .select('enquiry_items.*', 'products.product_code', 'products.product_name', 'products.category', 'products.unit', 'products.base_price')
  .where({ enquiry_id: enqId });

const findRawById = (id, trx = db) => trx('enquiries').where({ id }).first();
const nextNumber = async (trx = db) => {
  const y = new Date().getFullYear();
  const r = await trx('enquiries').where('enquiry_number', 'like', `ENQ-${y}-%`).max('enquiry_number as num').first();
  const n = (r.num && parseInt(r.num.split('-')[2], 10)) || 0;
  return `ENQ-${y}-${String(n+1).padStart(4, '0')}`;
};
const create = (d, items, trx = db) => trx.transaction(async (t) => {
  const [enq] = await t('enquiries').insert(d).returning('*');
  for (const it of items) await t('enquiry_items').insert({ ...it, enquiry_id: enq.id });
  return enq;
});
const updateStatus = (id, status, trx = db) => trx('enquiries').where({ id }).update({ status }).returning('*');
const countByStatus = async (trx = db) => {
  const rows = await trx('enquiries').select('status').count('* as total').groupBy('status');
  const o = {};
  for (const r of rows) o[r.status] = parseInt(r.total, 10);
  return o;
};
module.exports = { findAll, findById, findItems, findRawById, nextNumber, create, updateStatus, countByStatus };
