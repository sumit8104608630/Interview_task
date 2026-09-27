const { z } = require('zod');
const createProductSchema = z.object({
  product_code: z.string().min(2).max(40),
  product_name: z.string().min(2).max(160),
  category: z.string().max(80).optional().or(z.literal('')),
  unit: z.string().min(1).max(20),
  base_price: z.coerce.number().min(0),
});
const updateProductSchema = z.object({
  product_code: z.string().min(2).max(40).optional(),
  product_name: z.string().min(2).max(160).optional(),
  category: z.string().max(80).optional().or(z.literal('')),
  unit: z.string().min(1).max(20).optional(),
  base_price: z.coerce.number().min(0).optional(),
});
module.exports = { createProductSchema, updateProductSchema };
