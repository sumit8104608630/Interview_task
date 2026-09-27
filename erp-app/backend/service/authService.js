const bcrypt = require('bcryptjs');
const userModel = require('../model/userModel');
const otpService = require('./otpService');
const { signToken } = require('../utils/jwt');
const {
  BadRequestError, UnauthorizedError, NotFoundError, ConflictError,
} = require('../utils/customErrors');

const sendRegistrationOTP = async (email) => {
  if (!email) throw new BadRequestError('Email required');
  const u = await userModel.findByEmail(email);
  if (u) throw new ConflictError('Account already exists with this email');
  return otpService.sendOTP(email);
};

const verifyOTPAndRegister = async (payload) => {
  const { name, email, password, otp, role } = payload;
  if (!otp || otp.length !== 6) throw new BadRequestError('Invalid OTP');
  const exist = await userModel.findByEmail(email);
  if (exist) throw new ConflictError('Account already exists with this email');
  const v = await otpService.verifyOTP(email, otp);
  if (!v || !v.success) throw new BadRequestError((v && v.message) || 'Invalid OTP');
  const hash = bcrypt.hashSync(password, 10);
  const [user] = await userModel.create({ name, email, password_hash: hash, role: role || 'SALES' });
  const token = signToken({ sub: user.id, role: user.role });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

const login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) throw new UnauthorizedError('Invalid email or password');
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) throw new UnauthorizedError('Invalid email or password');
  const token = signToken({ sub: user.id, role: user.role });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

const sendForgotPasswordOTP = async (email) => {
  const u = await userModel.findByEmail(email);
  if (!u) throw new NotFoundError('No account found for that email');
  return otpService.sendOTP(email);
};

const resetPassword = async ({ email, otp, newPassword }) => {
  if (!otp || otp.length !== 6) throw new BadRequestError('Invalid OTP');
  const u = await userModel.findByEmail(email);
  if (!u) throw new NotFoundError('No account found for that email');
  const v = await otpService.verifyOTP(email, otp);
  if (!v || !v.success) throw new BadRequestError((v && v.message) || 'Invalid OTP');
  const hash = bcrypt.hashSync(newPassword, 10);
  const [updated] = await userModel.updatePassword(u.id, hash);
  return { id: updated.id, email: updated.email };
};

const getCurrentUser = async (userId) => {
  const u = await userModel.findById(userId);
  if (!u) throw new UnauthorizedError('User not found');
  return { id: u.id, name: u.name, email: u.email, role: u.role };
};

module.exports = {
  sendRegistrationOTP, verifyOTPAndRegister, login, sendForgotPasswordOTP, resetPassword, getCurrentUser,
};
