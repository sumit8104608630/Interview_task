const service = require('../service/customerService');
const asyncHandler = require('../utils/asyncHandler');
const getAll = asyncHandler(async (req, res) => res.json({ data: await service.getAll(), error: null }));
const getById = asyncHandler(async (req, res) => res.json({ data: await service.getById(req.params.id), error: null }));
const create = asyncHandler(async (req, res) => {
  const c = await service.create(req.body);
  res.status(201).json({ data: c, error: null });
});
const update = asyncHandler(async (req, res) => res.json({ data: await service.update(req.params.id, req.body), error: null }));
const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.json({ data: { success: true }, error: null });
});
module.exports = { getAll, getById, create, update, remove };
