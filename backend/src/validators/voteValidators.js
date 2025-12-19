const { z } = require('zod');

const castVoteSchema = z.object({
  /**
   * One ballot = selections for ALL positions.
   * Each selection includes:
   * - positionId (from Election.positions._id)
   * - candidateUserId (User._id of approved candidate)
   */
  selections: z
    .array(
      z.object({
        positionId: z.string().min(1),
        candidateUserId: z.string().min(1)
      })
    )
    .min(1)
});

module.exports = {
  castVoteSchema
};
