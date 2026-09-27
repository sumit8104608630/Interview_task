const service = require('../service/salesOrderService');
const asyncHandler = require('../utils/asyncHandler');
const getAll = asyncHandler(async (req, res) => res.json({ data: await service.getAll(), error: null }));
const getById = asyncHandler(async (req, res) => res.json({ data: await service.getById(req.params.id), error: null }));
const getItems = asyncHandler(async (req, res) => res.json({ data: await service.getItems(req.params.id), error: null }));
const confirm = asyncHandler(async (req, res) => res.json({ data: await service.confirmSalesOrder(req.params.id, req.user.id), error: null }));
const cancel = asyncHandler(async (req, res) => res.json({ data: await service.cancelSalesOrder(req.params.id), error: null }));
const dispatch = asyncHandler(async (req, res) => {
  const d = await service.createDispatch(req.params.id, req.body, req.user.id);
  res.status(201).json({ data: d, error: null });
});
module.exports = { getAll, getById, getItems, confirm, cancel, dispatch };
