const { z } = require('zod');

const updateCandidateProfileSchema = z.object({
  // Allowed always before approval
  photoUrl: z.string().url().optional(),
  electionSymbolUrl: z.string().url().optional(),

  // Position can be changed only before approval
  positionId: z.string().min(1).optional(),

  // Manifesto can be edited until election starts
  manifesto: z.string().trim().max(4000).optional()
});

module.exports = {
  updateCandidateProfileSchema
};
