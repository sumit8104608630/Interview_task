const { z } = require('zod');
const createCustomerSchema = z.object({
  company_name: z.string().min(2).max(160),
  contact_person: z.string().min(2).max(120),
  mobile: z.string().min(8).max(20),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().max(80).optional().or(z.literal('')),
});
const updateCustomerSchema = z.object({
  company_name: z.string().min(2).max(160).optional(),
  contact_person: z.string().min(2).max(120).optional(),
  mobile: z.string().min(8).max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().max(80).optional().or(z.literal('')),
});
module.exports = { createCustomerSchema, updateCustomerSchema };
