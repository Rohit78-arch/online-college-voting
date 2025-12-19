const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

/**
 * Builds a PDF in-memory and returns a Buffer.
 * Keep it simple + readable for college submission.
 */
async function buildResultsPdfBuffer(results) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const chunks = [];

      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).text('Election Results', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Election: ${results.election.name}`);
      doc.text(`Ended At: ${results.election.endedAt || 'N/A'}`);
      doc.text(`Total Votes Cast: ${results.summary.totalVotesCast}`);
      doc.text(`Turnout: ${results.summary.turnoutPct}% (Eligible: ${results.summary.totalEligibleVoters})`);

      doc.moveDown();

      for (const pos of results.positions) {
        doc.fontSize(14).text(`${pos.title} (Total votes: ${pos.totalVotes})`);
        doc.moveDown(0.25);

        if (!pos.candidates.length) {
          doc.fontSize(11).text('No votes recorded for this position.');
          doc.moveDown();
          continue;
        }

        pos.candidates.forEach((c, idx) => {
          const name = c.user?.fullName || 'Unknown';
          doc.fontSize(11).text(`${idx + 1}. ${name} — ${c.votes} votes (${c.percentage}%)`);
        });

        doc.moveDown();
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Builds an Excel workbook buffer.
 */
async function buildResultsExcelBuffer(results) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'College Voting System';

  const sheet = workbook.addWorksheet('Results');

  sheet.addRow(['Election', results.election.name]);
  sheet.addRow(['Ended At', String(results.election.endedAt || '')]);
  sheet.addRow(['Total Votes Cast', results.summary.totalVotesCast]);
  sheet.addRow(['Eligible Voters', results.summary.totalEligibleVoters]);
  sheet.addRow(['Turnout %', results.summary.turnoutPct]);
  sheet.addRow([]);

  for (const pos of results.positions) {
    sheet.addRow([`Position: ${pos.title}`, '', '', '']);
    sheet.addRow(['Rank', 'Candidate', 'Votes', 'Percentage']);

    if (!pos.candidates.length) {
      sheet.addRow(['-', 'No votes', 0, 0]);
      sheet.addRow([]);
      continue;
    }

    pos.candidates.forEach((c, idx) => {
      sheet.addRow([idx + 1, c.user?.fullName || 'Unknown', c.votes, c.percentage]);
    });

    sheet.addRow([]);
  }

  sheet.columns = [
    { width: 10 },
    { width: 35 },
    { width: 10 },
    { width: 12 }
  ];

  return workbook.xlsx.writeBuffer();
}

module.exports = {
  buildResultsPdfBuffer,
  buildResultsExcelBuffer
};
