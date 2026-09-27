const router = require('express').Router();
const c = require('../controllers/productController');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const s = require('../model/productSchema');

router.use(auth);
router.get('/', requireRole('ADMIN', 'SALES'), c.getAll);
router.get('/:id', requireRole('ADMIN', 'SALES'), c.getById);
router.post('/', requireRole('ADMIN'), validate(s.createProductSchema), c.create);
router.put('/:id', requireRole('ADMIN'), validate(s.updateProductSchema), c.update);
router.delete('/:id', requireRole('ADMIN'), c.remove);

module.exports = router;
