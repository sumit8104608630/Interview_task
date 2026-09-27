const router = require('express').Router();
const c = require('../controllers/quotationController');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const s = require('../model/quotationSchema');

router.use(auth);
router.get('/', requireRole('ADMIN', 'SALES'), c.getAll);
router.post('/', requireRole('ADMIN', 'SALES'), validate(s.createQuotationSchema), c.create);
router.get('/:id', requireRole('ADMIN', 'SALES'), c.getById);
router.get('/:id/items', requireRole('ADMIN', 'SALES'), c.getItems);
router.patch('/:id/status', requireRole('ADMIN', 'SALES'), validate(s.updateQuotationStatusSchema), c.updateStatus);
router.post('/:id/convert', requireRole('ADMIN'), c.convertToSalesOrder);

module.exports = router;
