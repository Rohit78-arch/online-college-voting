const cron = require('node-cron');
const { Election } = require('../models/Election');
const { ELECTION_STATUS } = require('../utils/constants');

/**
 * Runs every minute to check for elections that have expired.
 * If autoCloseEnabled is true and endsAt < now, mark as ENDED.
 */
function startElectionAutoCloseJob() {
  console.log('[Job] Election Auto-Close Job initialized (running every minute).');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find running elections that should end
      const expiredElections = await Election.find({
        status: ELECTION_STATUS.RUNNING,
        autoCloseEnabled: true,
        endsAt: { $lte: now }
      });

      if (expiredElections.length === 0) return;

      console.log(`[Job] Found ${expiredElections.length} elections to auto-close.`);

      for (const election of expiredElections) {
        election.status = ELECTION_STATUS.ENDED;
        election.endedAt = now;
        await election.save();
        console.log(`[Job] Election "${election.name}" (ID: ${election._id}) has been auto-closed.`);
      }
    } catch (err) {
      console.error('[Job] Error in election auto-close job:', err);
    }
  });
}

module.exports = { startElectionAutoCloseJob };
