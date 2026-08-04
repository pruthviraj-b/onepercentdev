const { ValidationError } = require('../utils/errors');

module.exports = function validate(schema, source = 'body') {
  return (req, res, next) => {
    if (!schema || typeof schema.parse !== 'function') return next();
    try { req[source] = schema.parse(req[source]); next(); }
    catch (error) { next(error instanceof ValidationError ? error : new ValidationError('Validation failed', error.issues || error.message)); }
  };
};
