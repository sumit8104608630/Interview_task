const router = require('express').Router();
const c = require('../controllers/salesOrderController');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const validate = require('../middlewares/validate');
const s = require('../model/dispatchSchema');

router.use(auth);
router.get('/', requireRole('ADMIN', 'SALES'), c.getAll);
router.get('/:id', requireRole('ADMIN', 'SALES'), c.getById);
router.get('/:id/items', requireRole('ADMIN', 'SALES'), c.getItems);
router.post('/:id/confirm', requireRole('ADMIN'), c.confirm);
router.post('/:id/cancel', requireRole('ADMIN'), c.cancel);
router.post('/:id/dispatch',
  requireRole('ADMIN'),
  (req, res, next) => {
    try {
      const id = Number(req.params && req.params.id);
      if (!Number.isFinite(id) || !Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          data: null,
          error: 'Invalid sales order id in URL: expected numeric integer > 0',
        });
      }
      if (!req.body || typeof req.body !== 'object') req.body = {};
      req.body.sales_order_id = id;
      req.body.items = Array.isArray(req.body.items) ? req.body.items.map((it) => ({
        ...(it || {}),
        sales_order_item_id: (it && it.sales_order_item_id != null) ? Number(it.sales_order_item_id) : undefined,
        product_id: (it && it.product_id != null) ? Number(it.product_id) : undefined,
        quantity: (it && it.quantity != null) ? Number(it.quantity) : undefined,
      })) : req.body.items;
      next();
    } catch (e) {
      next(e);
    }
  },
  validate(s.createDispatchSchema),
  c.dispatch
);

module.exports = router;
