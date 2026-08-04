const app = require('./app');
const { app: _app, PORT, IS_PRODUCTION, supabase, COURSES_DATA } = require('./context');

function startServer() {
  app.listen(PORT, async () => {
    console.log(`\n  ● 1% Dev Academy — API Server (Supabase + Cloudinary)`);
    console.log(`  ● http://localhost:${PORT}`);
    console.log(`  ● Supabase: ${process.env.SUPABASE_URL}`);
    console.log(`  ● Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`  ● Courses: ${Object.keys(COURSES_DATA).join(', ')}\n`);

    const { error } = await supabase.from('user_profiles').select('user_id').limit(1);
    if (error && error.message.includes('schema cache')) {
      console.log('  ⚠  Analytics tables NOT found in Supabase.');
      console.log('  ➜  Run this SQL in Supabase Dashboard → SQL Editor:');
      console.log(`  ➜  File: backend/src/database/run-analytics-schema.sql`);
      console.log('  ➜  Copy → paste entire file → click Run\n');
    } else {
      console.log('  ✓  Analytics tables ready.\n');
    }
  });
}

process.on('unhandledRejection', reason => console.error(JSON.stringify({ level: 'error', type: 'unhandledRejection', reason: String(reason) })));
process.on('uncaughtException', error => { console.error(JSON.stringify({ level: 'fatal', type: 'uncaughtException', message: error.message, stack: IS_PRODUCTION ? undefined : error.stack })); process.exit(1); });

if (require.main === module) startServer();

module.exports = app;