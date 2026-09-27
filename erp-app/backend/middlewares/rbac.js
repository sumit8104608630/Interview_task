const { ForbiddenError } = require('../utils/customErrors');
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ForbiddenError(`Access denied. Required role(s): ${roles.join(', ')}`));
  }
  next();
};
module.exports = { requireRole };
