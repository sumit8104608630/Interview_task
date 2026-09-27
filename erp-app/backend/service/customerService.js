const customerModel = require('../model/customerModel');
const { NotFoundError } = require('../utils/customErrors');

const getAll = () => customerModel.findAll();
const getById = async (id) => {
  const c = await customerModel.findById(id);
  if (!c) throw new NotFoundError('Customer not found');
  return c;
};
const create = (d) => customerModel.create(d).then((r) => r[0]);
const update = async (id, d) => {
  const [c] = await customerModel.update(id, d);
  if (!c) throw new NotFoundError('Customer not found');
  return c;
};
const remove = async (id) => {
  const rows = await customerModel.remove(id);
  if (!rows) throw new NotFoundError('Customer not found');
  return true;
};
module.exports = { getAll, getById, create, update, remove };
