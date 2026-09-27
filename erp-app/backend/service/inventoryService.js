const inventoryModel = require('../model/inventoryModel');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');

const getAll = () => inventoryModel.findAll();
const getByProductId = async (pid) => {
  const r = await inventoryModel.findByProductId(pid);
  if (!r) throw new NotFoundError('Inventory not found');
  return r;
};
const patch = async (pid, d) => {
  const cur = await inventoryModel.findRawByProductId(pid);
  if (!cur) throw new NotFoundError('Inventory not found');
  const next = {
    physical_qty: d.physical_qty != null ? d.physical_qty : cur.physical_qty,
    damaged_qty: d.damaged_qty != null ? d.damaged_qty : cur.damaged_qty,
  };
  if ((cur.reserved_qty + next.damaged_qty) > next.physical_qty) {
    throw new BadRequestError('Invalid inventory: reserved + damaged cannot exceed physical');
  }
  const [r] = await inventoryModel.updateByProductId(pid, next);
  return inventoryModel.findByProductId(pid);
};
module.exports = { getAll, getByProductId, patch };
