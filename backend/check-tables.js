require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const tables = ['progress','bookmarks','tasks','streak','typing_scores','aptitude_scores','video_timestamps','course_files'];

(async () => {
  console.log('Checking Supabase tables...\n');
  for (const t of tables) {
    const r = await supabase.from(t).select('*').limit(1);
    if (r.error && r.error.code === 'PGRST205') {
      console.log('  MISSING:', t, '← needs to be created');
    } else if (r.error) {
      console.log('  ERROR:  ', t, r.error.message);
    } else {
      console.log('  OK:     ', t);
    }
  }
  console.log('\nDone.');
})();
