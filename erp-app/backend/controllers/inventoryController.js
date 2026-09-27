const service = require('../service/inventoryService');
const asyncHandler = require('../utils/asyncHandler');
const getAll = asyncHandler(async (req, res) => res.json({ data: await service.getAll(), error: null }));
const getByProduct = asyncHandler(async (req, res) => res.json({ data: await service.getByProductId(req.params.productId), error: null }));
const patch = asyncHandler(async (req, res) => res.json({ data: await service.patch(req.params.productId, req.body), error: null }));
module.exports = { getAll, getByProduct, patch };
