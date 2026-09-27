const router = require('express').Router();
const c = require('../controllers/inventoryController');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const s = require('../model/inventorySchema');

router.use(auth);
router.get('/', requireRole('ADMIN', 'SALES'), c.getAll);
router.get('/product/:productId', requireRole('ADMIN', 'SALES'), c.getByProduct);
router.patch('/product/:productId', requireRole('ADMIN'), validate(s.updateInventorySchema), c.patch);

module.exports = router;
