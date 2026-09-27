const { z } = require('zod');
const qi = z.object({
  product_id: z.coerce.number().int().min(1),
  quantity: z.coerce.number().int().min(1),
  unit_price: z.coerce.number().min(0),
  discount_pct: z.coerce.number().min(0).max(100).default(0),
  gst_pct: z.coerce.number().min(0).max(100).default(0),
});
const createQuotationSchema = z.object({
  enquiry_id: z.coerce.number().int().min(1),
  customer_id: z.coerce.number().int().min(1),
  valid_until: z.coerce.date().optional(),
  items: z.array(qi).min(1),
});
const updateQuotationStatusSchema = z.object({ status: z.enum(['DRAFT','SENT','ACCEPTED','REJECTED']) });
module.exports = { createQuotationSchema, updateQuotationStatusSchema };
