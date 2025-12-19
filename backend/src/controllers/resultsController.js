const mongoose = require('mongoose');

const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { Election } = require('../models/Election');
const { AdminLog } = require('../models/AdminLog');
const { buildElectionResults } = require('../services/resultsService');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/**
 * Admin: get full results (only when ENDED)
 */
const adminGetResults = asyncHandler(async (req, res) => {
  const { electionId } = req.params;
  const results = await buildElectionResults(electionId);
  res.json({ success: true, data: results });
});

/**
 * Admin: publish results (toggle)
 */
const adminPublishResults = asyncHandler(async (req, res) => {
  const { electionId } = req.params;
  const election = await Election.findById(electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  if (election.status !== 'ENDED') {
    throw new ApiError(400, 'Can publish only after election ends');
  }

  election.resultsPublished = true;
  await election.save();

  await AdminLog.create({
    adminUserId: req.user._id,
    type: 'RESULTS',
    action: 'PUBLISH_RESULTS',
    targetId: String(election._id),
    meta: { name: election.name }
  });

  res.json({ success: true, message: 'Results published' });
});

/**
 * Admin: analytics (basic)
 */
const adminGetAnalytics = asyncHandler(async (req, res) => {
  const { electionId } = req.params;
  const results = await buildElectionResults(electionId);

  // Derive a minimal analytics view
  const topPositions = results.positions.map((p) => ({
    positionId: p.positionId,
    title: p.title,
    totalVotes: p.totalVotes,
    winnerCount: p.winners.length,
    topCandidate: p.candidates[0]?.user?.fullName
  }));

  const chart = results.positions.map((p) => ({
    positionId: p.positionId,
    title: p.title,
    totalVotes: p.totalVotes,
    series: p.candidates.map((c) => ({
      candidateUserId: c.candidateUserId,
      name: c.user?.fullName,
      votes: c.votes,
      percentage: c.percentage
    }))
  }));

  res.json({
    success: true,
    data: {
      summary: results.summary,
      election: results.election,
      chart
    }
  });
});

/**
 * Admin: export PDF
 */
const adminExportResultsPdf = asyncHandler(async (req, res) => {
  const results = await buildElectionResults(req.params.electionId);

  const buffer = await buildResultsPdfBuffer(results);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=results-${results.election.id}.pdf`);

  res.send(buffer);
});

/**
 * Admin: export Excel
 */
const adminExportResultsExcel = asyncHandler(async (req, res) => {
  const results = await buildElectionResults(req.params.electionId);

  const buffer = await buildResultsExcelBuffer(results);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=results-${results.election.id}.xlsx`);

  res.send(buffer);
});

/**
 * Candidate: get results (ONLY after published)
 * Rules:
 * - must be ENDED
 * - resultsPublished=true
 * - candidate must be a candidate IN THIS election
 */
const candidateGetResults = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.electionId).lean();
  if (!election) throw new ApiError(404, 'Election not found');

  if (election.status !== ELECTION_STATUS.ENDED) {
    throw new ApiError(403, 'Results are not available yet.');
  }

  if (!election.resultsPublished) {
    throw new ApiError(403, 'Results are not published yet.');
  }

  // Ensure this candidate belongs to this election
  const profile = await CandidateProfile.findOne({
    electionId: new mongoose.Types.ObjectId(req.params.electionId),
    userId: req.user._id
  }).select('_id');

  if (!profile) {
    throw new ApiError(403, 'Forbidden');
  }

  const results = await buildElectionResults(req.params.electionId);
  res.json({ success: true, data: results });
});

module.exports = {
  adminGetResults,
  adminGetAnalytics,
  adminPublishResults,
  adminExportResultsPdf,
  adminExportResultsExcel,
  candidateGetResults
};
