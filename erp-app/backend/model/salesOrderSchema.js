const { z } = require('zod');
const updateSalesOrderStatusSchema = z.object({ status: z.enum(['CONFIRMED','CANCELLED']) });
module.exports = { updateSalesOrderStatusSchema };
