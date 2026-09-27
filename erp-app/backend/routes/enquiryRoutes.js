const router = require('express').Router();
const c = require('../controllers/enquiryController');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const s = require('../model/enquirySchema');

router.use(auth, requireRole('ADMIN', 'SALES'));
router.get('/', c.getAll);
router.post('/', validate(s.createEnquirySchema), c.create);
router.get('/:id', c.getById);
router.get('/:id/items', c.getItems);
router.patch('/:id/status', validate(s.updateEnquiryStatusSchema), c.updateStatus);

module.exports = router;
