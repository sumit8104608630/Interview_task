const dispatchModel = require('../model/dispatchModel');
const { NotFoundError } = require('../utils/customErrors');

const getAll = () => dispatchModel.findAll();
const getById = async (id) => {
  const d = await dispatchModel.findById(id);
  if (!d) throw new NotFoundError('Dispatch not found');
  return d;
};
const getItems = async (id) => {
  await getById(id);
  return dispatchModel.findItems(id);
};
module.exports = { getAll, getById, getItems };
