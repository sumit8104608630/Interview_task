const router = require('express').Router();
const c = require('../controllers/authController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const s = require('../model/authSchema');

router.post('/send-otp', validate(s.sendOTPSchema), c.sendOTP);
router.post('/register', validate(s.verifyOTPAndRegisterSchema), c.register);
router.post('/login', validate(s.loginSchema), c.login);
router.post('/forgot-password/send-otp', validate(s.forgotPasswordSendOTPSchema), c.forgotPasswordOTP);
router.post('/forgot-password/reset', validate(s.resetPasswordSchema), c.resetPassword);
router.get('/me', auth, c.me);

module.exports = router;
