const { createApp } = require('./app');
const { connectDB } = require('./config/db');
const { env } = require('./config/env');
const { startJobs } = require('./jobs');
const { seedAdmin } = require('./scripts/seedAdmin');

async function start() {
  await connectDB();

  // Auto-seed admin in development (or if needed)
  if (env.NODE_ENV === 'development') {
    try {
      await seedAdmin();
    } catch (err) {
      console.error('[seed] Failed to auto-seed admin:', err.message);
    }
  }

  // Background jobs (cron)
  startJobs();

  const app = createApp();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[API] Running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[FATAL] Failed to start server', err);
  process.exit(1);
});
