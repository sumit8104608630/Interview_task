const { z } = require('zod');

const sendOTPSchema = z.object({ email: z.string().email() });
const verifyOTPAndRegisterSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(120),
  otp: z.string().length(6),
  role: z.enum(['ADMIN', 'SALES']).optional().default('SALES'),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const forgotPasswordSendOTPSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(6).max(120),
});
module.exports = { sendOTPSchema, verifyOTPAndRegisterSchema, loginSchema, forgotPasswordSendOTPSchema, resetPasswordSchema };
