const db = require('../db');
const productModel = require('../model/productModel');
const { ConflictError, NotFoundError } = require('../utils/customErrors');

const getAll = () => productModel.findAll();
const getById = async (id) => {
  const p = await productModel.findById(id);
  if (!p) throw new NotFoundError('Product not found');
  return p;
};
const create = async (d) => {
  const dup = await productModel.findByCode(d.product_code);
  if (dup) throw new ConflictError('Product code already exists');
  const [p] = await db.transaction(async (trx) => {
    const [np] = await productModel.create(d, trx);
    await trx('inventory').insert({ product_id: np.id, physical_qty: 0, reserved_qty: 0, damaged_qty: 0 });
    return [np];
  });
  return productModel.findById(p.id);
};
const update = async (id, d) => {
  const [p] = await productModel.update(id, d);
  if (!p) throw new NotFoundError('Product not found');
  return productModel.findById(id);
};
const remove = async (id) => {
  const rows = await productModel.remove(id);
  if (!rows) throw new NotFoundError('Product not found');
  return true;
};
module.exports = { getAll, getById, create, update, remove };
