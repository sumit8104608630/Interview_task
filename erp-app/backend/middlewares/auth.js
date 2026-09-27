const { verifyToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../utils/customErrors');

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next(new UnauthorizedError('Authentication required'));
  const token = header.split(' ')[1];
  try {
    const d = verifyToken(token);
    req.user = { id: d.sub, role: d.role };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
module.exports = auth;
