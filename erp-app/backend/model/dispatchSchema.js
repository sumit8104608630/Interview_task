const { z } = require('zod');
const di = z.object({
  sales_order_item_id: z.coerce.number().int().min(1),
  product_id: z.coerce.number().int().min(1),
  quantity: z.coerce.number().int().min(1),
});
const createDispatchSchema = z.object({
  sales_order_id: z.coerce.number().int().min(1),
  dispatch_date: z.coerce.date().optional(),
  vehicle_number: z.string().optional().or(z.literal('')),
  driver_name: z.string().optional().or(z.literal('')),
  items: z.array(di).min(1),
});
module.exports = { createDispatchSchema };
