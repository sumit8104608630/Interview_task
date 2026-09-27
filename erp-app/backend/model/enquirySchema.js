const { z } = require('zod');
const item = z.object({ product_id: z.coerce.number().int().min(1), quantity: z.coerce.number().int().min(1) });
const createEnquirySchema = z.object({
  customer_id: z.coerce.number().int().min(1),
  enquiry_date: z.coerce.date().optional(),
  required_date: z.coerce.date().optional(),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(item).min(1),
});
const updateEnquiryStatusSchema = z.object({ status: z.enum(['NEW','QUOTED','WON','LOST']) });
module.exports = { createEnquirySchema, updateEnquiryStatusSchema };
