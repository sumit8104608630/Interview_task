const { z } = require('zod');
const updateInventorySchema = z.object({
  physical_qty: z.coerce.number().int().min(0).optional(),
  damaged_qty: z.coerce.number().int().min(0).optional(),
});
module.exports = { updateInventorySchema };
