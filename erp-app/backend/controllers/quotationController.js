const service = require('../service/quotationService');
const asyncHandler = require('../utils/asyncHandler');
const getAll = asyncHandler(async (req, res) => res.json({ data: await service.getAll(), error: null }));
const getById = asyncHandler(async (req, res) => res.json({ data: await service.getById(req.params.id), error: null }));
const getItems = asyncHandler(async (req, res) => res.json({ data: await service.getItems(req.params.id), error: null }));
const create = asyncHandler(async (req, res) => {
  const c = await service.create(req.body, req.user.id);
  res.status(201).json({ data: c, error: null });
});
const updateStatus = asyncHandler(async (req, res) => res.json({ data: await service.updateStatus(req.params.id, req.body.status), error: null }));
const convertToSalesOrder = asyncHandler(async (req, res) => {
  const c = await service.convertToSalesOrder(req.params.id, req.user.id);
  res.status(201).json({ data: c, error: null });
});
module.exports = { getAll, getById, getItems, create, updateStatus, convertToSalesOrder };
