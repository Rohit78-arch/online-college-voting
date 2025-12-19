const { ApiError } = require('./apiError');

/**
 * Validate req.body with a zod schema.
 * Throws ApiError(400) with details if invalid.
 */
function validateBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(400, 'Invalid request body', result.error.flatten());
  }
  return result.data;
}

module.exports = { validateBody };
