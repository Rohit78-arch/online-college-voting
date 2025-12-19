const { startElectionAutoCloseJob } = require('./electionAutoCloseJob');

function startJobs() {
  startElectionAutoCloseJob();
}

module.exports = { startJobs };
