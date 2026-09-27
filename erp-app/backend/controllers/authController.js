const service = require('../service/authService');
const asyncHandler = require('../utils/asyncHandler');

const sendOTP = asyncHandler(async (req, res) => {
  const r = await service.sendRegistrationOTP(req.body.email);
  res.json({ data: r, error: null });
});
const register = asyncHandler(async (req, res) => {
  const r = await service.verifyOTPAndRegister(req.body);
  res.status(201).json({ data: r, error: null });
});
const login = asyncHandler(async (req, res) => {
  const r = await service.login(req.body);
  res.json({ data: r, error: null });
});
const forgotPasswordOTP = asyncHandler(async (req, res) => {
  const r = await service.sendForgotPasswordOTP(req.body.email);
  res.json({ data: r, error: null });
});
const resetPassword = asyncHandler(async (req, res) => {
  const r = await service.resetPassword(req.body);
  res.json({ data: r, error: null });
});
const me = asyncHandler(async (req, res) => {
  const r = await service.getCurrentUser(req.user.id);
  res.json({ data: r, error: null });
});
module.exports = { sendOTP, register, login, forgotPasswordOTP, resetPassword, me };
