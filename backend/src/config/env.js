const getEnv = (name, fallback = undefined) => process.env[name] ?? fallback;

module.exports = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: Number(getEnv('PORT', 3001)),
  repoRoot: getEnv('REPO_ROOT'),
  supabaseUrl: getEnv('SUPABASE_URL', 'http://127.0.0.1:54321'),
  supabaseServiceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY', 'local-development-key'),
  corsOrigins: getEnv('CORS_ORIGINS', 'http://localhost:3005,http://localhost:3000'),
  jsonBodyLimit: getEnv('JSON_BODY_LIMIT', '2mb'),
  rateLimitPerMinute: Number(getEnv('RATE_LIMIT_PER_MINUTE', 120)),
  adminPassword: getEnv('ADMIN_PASSWORD'),
};
