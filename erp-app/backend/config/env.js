require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  otpService: {
    url: process.env.OTP_SERVICE_URL || 'https://otp-microservise.vercel.app/api',
  },
};
