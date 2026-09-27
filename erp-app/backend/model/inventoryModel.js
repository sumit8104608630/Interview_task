const db = require('../db');

const LOW_STOCK_THRESHOLD = 20;

const baseCols = [
  'inventory.id',
  'inventory.product_id',
  'inventory.physical_qty',
  'inventory.reserved_qty',
  'inventory.damaged_qty',
  'inventory.updated_at',
  'products.product_code',
  'products.product_name',
  'products.category',
  'products.unit',
  'products.base_price',
  db.raw('(inventory.physical_qty - inventory.reserved_qty - inventory.damaged_qty) as available_qty'),
];

const findAll = () => db('inventory')
  .join('products', 'inventory.product_id', 'products.id')
  .select(baseCols)
  .orderBy('products.product_name', 'asc');

const findByProductId = (pid) => db('inventory')
  .join('products', 'inventory.product_id', 'products.id')
  .select(baseCols)
  .where('inventory.product_id', pid).first();

const findRawByProductId = (pid, trx = db) => trx('inventory').where({ product_id: pid }).first();
const updateByProductId = (pid, d, trx = db) => trx('inventory').where({ product_id: pid }).update({ ...d, updated_at: trx.fn.now() }).returning('*');

const getTotalAvailableValue = async () => Number((await db('inventory')
  .join('products', 'inventory.product_id', 'products.id')
  .select(db.raw('SUM((inventory.physical_qty - inventory.reserved_qty - inventory.damaged_qty) * products.base_price) as total_value'))
  .first()).total_value || 0);

const getLowStockItems = (threshold = LOW_STOCK_THRESHOLD) => db('inventory')
  .join('products', 'inventory.product_id', 'products.id')
  .select(
    'inventory.product_id',
    'products.product_code',
    'products.product_name',
    'inventory.physical_qty',
    'inventory.reserved_qty',
    'inventory.damaged_qty',
    db.raw('(inventory.physical_qty - inventory.reserved_qty - inventory.damaged_qty) as available_qty')
  )
  .whereRaw('(inventory.physical_qty - inventory.reserved_qty - inventory.damaged_qty) <= ?', [threshold])
  .orderBy('available_qty', 'asc');

module.exports = {
  LOW_STOCK_THRESHOLD,
  findAll,
  findByProductId,
  findRawByProductId,
  updateByProductId,
  getTotalAvailableValue,
  getLowStockItems,
};
