const router = require('express').Router();
const c = require('../controllers/dashboardController');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

router.use(auth, requireRole('ADMIN', 'SALES'));
router.get('/stats', c.getStats);

module.exports = router;
