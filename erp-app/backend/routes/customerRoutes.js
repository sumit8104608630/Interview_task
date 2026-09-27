const router = require('express').Router();
const c = require('../controllers/customerController');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const s = require('../model/customerSchema');

router.use(auth, requireRole('ADMIN', 'SALES'));
router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', validate(s.createCustomerSchema), c.create);
router.put('/:id', validate(s.updateCustomerSchema), c.update);
router.delete('/:id', c.remove);

module.exports = router;
