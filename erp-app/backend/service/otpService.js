const axios = require('axios');
const config = require('../config/env');

const sendOTP = async (email) => {
  const r = await axios.post(`${config.otpService.url}/send-otp`, { email });
  return r.data;
};
const verifyOTP = async (email, otp) => {
  const r = await axios.post(`${config.otpService.url}/verify-otp`, { email, otp });
  return r.data;
};
const sendEmail = async (data) => {
  const r = await axios.post(`${config.otpService.url}/send-email`, data);
  return r.data;
};
module.exports = { sendOTP, verifyOTP, sendEmail };
