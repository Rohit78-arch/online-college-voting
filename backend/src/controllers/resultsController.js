const mongoose = require('mongoose');

const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');

const { Election } = require('../models/Election');
const { CandidateProfile } = require('../models/CandidateProfile');
const { AdminLog } = require('../models/AdminLog');

const { buildElectionResults } = require('../services/resultsService');
const { ELECTION_STATUS, ROLES } = require('../utils/constants');

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/* =========================================================
   HELPERS : PDF & EXCEL BUFFER BUILDERS
========================================================= */

function buildResultsPdfBuffer(results) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text(`Election Results: ${results.election.name}`, {
      underline: true
    });
    doc.moveDown();

    results.positions.forEach((pos, i) => {
      doc.fontSize(14).text(`${i + 1}. Position: ${pos.title}`);
      doc.moveDown(0.5);

      pos.candidates.forEach((c) => {
        doc.fontSize(11).text(
          `• ${c.user?.fullName} — Votes: ${c.votes} (${c.percentage}%)`
        );
      });

      doc.moveDown();
    });

    doc.end();
  });
}

async function buildResultsExcelBuffer(results) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Results');

  sheet.columns = [
    { header: 'Position', key: 'position', width: 25 },
    { header: 'Candidate', key: 'candidate', width: 30 },
    { header: 'Votes', key: 'votes', width: 10 },
    { header: 'Percentage', key: 'percentage', width: 15 }
  ];

  results.positions.forEach((pos) => {
    pos.candidates.forEach((c) => {
      sheet.addRow({
        position: pos.title,
        candidate: c.user?.fullName,
        votes: c.votes,
        percentage: `${c.percentage}%`
      });
    });
  });

  return workbook.xlsx.writeBuffer();
}

/* =========================================================
   ADMIN CONTROLLERS
========================================================= */

/**
 * Admin: Get full results
 */
const adminGetResults = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only admin can access results');
  }

  const results = await buildElectionResults(req.params.electionId);
  res.json({ success: true, data: results });
});

/**
 * Admin: Publish results
 */
const adminPublishResults = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only admin can publish results');
  }

  const election = await Election.findById(req.params.electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  if (election.status !== ELECTION_STATUS.ENDED) {
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
 * Admin: Analytics
 */
const adminGetAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only admin can view analytics');
  }

  const results = await buildElectionResults(req.params.electionId);

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
 * Admin: Export PDF
 */
const adminExportResultsPdf = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only admin can export results');
  }

  const results = await buildElectionResults(req.params.electionId);
  const buffer = await buildResultsPdfBuffer(results);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=results-${results.election.id}.pdf`
  );

  res.send(buffer);
});

/**
 * Admin: Export Excel
 */
const adminExportResultsExcel = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only admin can export results');
  }

  const results = await buildElectionResults(req.params.electionId);
  const buffer = await buildResultsExcelBuffer(results);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=results-${results.election.id}.xlsx`
  );

  res.send(buffer);
});

/* =========================================================
   CANDIDATE CONTROLLER
========================================================= */

/**
 * Candidate: Get results (after publish)
 */
const candidateGetResults = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.CANDIDATE) {
    throw new ApiError(403, 'Only candidates can view results');
  }

  const election = await Election.findById(req.params.electionId).lean();
  if (!election) throw new ApiError(404, 'Election not found');

  if (election.status !== ELECTION_STATUS.ENDED) {
    throw new ApiError(403, 'Results are not available yet');
  }

  if (!election.resultsPublished) {
    throw new ApiError(403, 'Results are not published yet');
  }

  const profile = await CandidateProfile.findOne({
    electionId: new mongoose.Types.ObjectId(req.params.electionId),
    userId: req.user._id
  });

  if (!profile) {
    throw new ApiError(403, 'Forbidden');
  }

  const results = await buildElectionResults(req.params.electionId);
  res.json({ success: true, data: results });
});

/* ========================================================= */

module.exports = {
  adminGetResults,
  adminPublishResults,
  adminGetAnalytics,
  adminExportResultsPdf,
  adminExportResultsExcel,
  candidateGetResults
};
