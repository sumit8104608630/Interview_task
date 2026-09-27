const db = require('../db');

const invSelect = [
  'products.*',
  db.raw('COALESCE(inventory.physical_qty, 0) as physical_qty'),
  db.raw('COALESCE(inventory.reserved_qty, 0) as reserved_qty'),
  db.raw('COALESCE(inventory.damaged_qty, 0) as damaged_qty'),
  db.raw('COALESCE(inventory.physical_qty, 0) - COALESCE(inventory.reserved_qty, 0) - COALESCE(inventory.damaged_qty, 0) as available_qty'),
];

const findAll = () => db('products')
  .leftJoin('inventory', 'products.id', 'inventory.product_id')
  .select(invSelect)
  .orderBy('products.created_at', 'desc');

const findById = (id) => db('products')
  .leftJoin('inventory', 'products.id', 'inventory.product_id')
  .select(invSelect)
  .where('products.id', id).first();

const findByCode = (c) => db('products').where({ product_code: c }).first();
const create = (d, trx = db) => trx('products').insert(d).returning('*');
const update = (id, d, trx = db) => trx('products').where({ id }).update(d).returning('*');
const remove = (id) => db('products').where({ id }).del();
const count = async () => parseInt((await db('products').count('* as total').first()).total, 10);

const findRandom = (limit = 10) => db('products')
  .leftJoin('inventory', 'products.id', 'inventory.product_id')
  .select(invSelect)
  .orderByRaw('RANDOM()')
  .limit(limit);

module.exports = { findAll, findById, findByCode, create, update, remove, count, findRandom };
