const router = require('express').Router();
const c = require('../controllers/dispatchController');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');

router.use(auth, requireRole('ADMIN', 'SALES'));
router.get('/', c.getAll);
router.get('/:id', c.getById);
router.get('/:id/items', c.getItems);

module.exports = router;
