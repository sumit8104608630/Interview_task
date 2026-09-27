const db = require('../db');
const { calculateLineAmount, calculateGrandTotal } = require('../utils/pricing');

const findAll = () => db('quotations')
  .join('customers', 'quotations.customer_id', 'customers.id')
  .leftJoin('enquiries', 'quotations.enquiry_id', 'enquiries.id')
  .leftJoin('users', 'quotations.created_by', 'users.id')
  .select(
    'quotations.id',
    'quotations.quotation_number',
    'quotations.enquiry_id',
    'quotations.customer_id',
    'quotations.valid_until',
    'quotations.status',
    'quotations.grand_total',
    'quotations.created_by',
    'quotations.created_at',
    'customers.id as customer_row_id',
    'customers.company_name',
    'customers.contact_person',
    'customers.mobile',
    'customers.email as customer_email',
    'customers.city',
    'enquiries.id as enquiry_row_id',
    'enquiries.enquiry_number',
    'users.id as user_row_id',
    'users.name as created_by_name'
  )
  .orderBy('quotations.created_at', 'desc');

const normalizeDecimalFields = (row) => {
  if (!row) return row;
  const numericFields = ['grand_total', 'unit_price', 'line_amount'];
  for (const field of numericFields) {
    if (row[field] !== undefined && row[field] !== null && typeof row[field] !== 'number') {
      row[field] = Number(row[field]);
    }
  }
  return row;
};

const findById = async (id) => {
  const row = await db('quotations')
    .join('customers', 'quotations.customer_id', 'customers.id')
    .leftJoin('enquiries', 'quotations.enquiry_id', 'enquiries.id')
    .leftJoin('users', 'quotations.created_by', 'users.id')
    .select(
      'quotations.id',
      'quotations.quotation_number',
      'quotations.enquiry_id',
      'quotations.customer_id',
      'quotations.valid_until',
      'quotations.status',
      'quotations.grand_total',
      'quotations.created_by',
      'quotations.created_at',
      'customers.id as customer_row_id',
      'customers.company_name',
      'customers.contact_person',
      'customers.mobile',
      'customers.email as customer_email',
      'customers.city',
      'enquiries.id as enquiry_row_id',
      'enquiries.enquiry_number',
      'users.id as user_row_id',
      'users.name as created_by_name'
    )
    .where('quotations.id', id).first();
  return normalizeDecimalFields(row);
};

const findItems = async (qid) => {
  const rows = await db('quotation_items')
    .join('products', 'quotation_items.product_id', 'products.id')
    .select('quotation_items.*', 'products.product_code', 'products.product_name', 'products.unit')
    .where({ quotation_id: qid });

  return rows.map((row) => normalizeDecimalFields(row));
};

const findRawById = (id, trx = db) => trx('quotations').where({ id }).first();
const findByEnquiryId = (eid, trx = db) => trx('quotations').where({ enquiry_id: eid });
const updateStatus = (id, status, trx = db) => trx('quotations').where({ id }).update({ status }).returning('*');

const nextNumber = async (trx = db) => {
  const y = new Date().getFullYear();
  const r = await trx('quotations').where('quotation_number', 'like', `QUO-${y}-%`).max('quotation_number as num').first();
  const n = (r.num && parseInt(r.num.split('-')[2], 10)) || 0;
  return `QUO-${y}-${String(n+1).padStart(4, '0')}`;
};

const create = (d, items, trx = db) => trx.transaction(async (t) => {
  const its = items.map((i) => ({ ...i, line_amount: calculateLineAmount(i.quantity, i.unit_price, i.discount_pct||0, i.gst_pct||0).lineAmount }));
  const grandTotal = calculateGrandTotal(items);
  const [quo] = await t('quotations').insert({ ...d, grand_total: grandTotal }).returning('*');
  for (const it of its) await t('quotation_items').insert({ ...it, quotation_id: quo.id });
  return quo;
});

const countByStatus = async (trx = db) => {
  const rows = await trx('quotations').select('status').count('* as total').groupBy('status');
  const o = {};
  for (const r of rows) o[r.status] = parseInt(r.total, 10);
  return o;
};
module.exports = { findAll, findById, findItems, findRawById, findByEnquiryId, updateStatus, nextNumber, create, countByStatus };
