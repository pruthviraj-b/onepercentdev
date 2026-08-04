const context = require('./context');

const registerRoutes = require('../routes');

registerRoutes(context);

module.exports = context.app;
