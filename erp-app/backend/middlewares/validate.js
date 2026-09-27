const { BadRequestError } = require('../utils/customErrors');
const validate = (schema, src = 'body') => (req, res, next) => {
  try {
    req[src] = schema.parse(req[src]);
    next();
  } catch (e) {
    const msgs = e.errors.map((x) => `${(x.path||[]).join('.')||'field'}: ${x.message}`).join(', ');
    next(new BadRequestError(`Validation failed: ${msgs}`));
  }
};
module.exports = validate;
