const service = require('../service/dispatchService');
const asyncHandler = require('../utils/asyncHandler');
const getAll = asyncHandler(async (req, res) => res.json({ data: await service.getAll(), error: null }));
const getById = asyncHandler(async (req, res) => res.json({ data: await service.getById(req.params.id), error: null }));
const getItems = asyncHandler(async (req, res) => res.json({ data: await service.getItems(req.params.id), error: null }));
module.exports = { getAll, getById, getItems };
