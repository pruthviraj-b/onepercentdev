const serverless = require('serverless-http');
const app = require('../../src/app/server');

const expressHandler = serverless(app);

exports.handler = (event, context) => {
  // Netlify removes the /api prefix before invoking the function, while our
  // Express routes intentionally keep /api. Restore it for the existing API.
  const originalPath = event.path || '/';
  if (!originalPath.startsWith('/api')) event.path = `/api${originalPath}`;
  return expressHandler(event, context);
};
