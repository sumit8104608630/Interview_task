const service = require('../service/dashboardService');
const asyncHandler = require('../utils/asyncHandler');
const getStats = asyncHandler(async (req, res) => res.json({ data: await service.getStats(), error: null }));
module.exports = { getStats };
