const path = require('path');

const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { env } = require('../config/env');

/**
 * Builds a public URL path for a stored upload.
 * We serve static files from /uploads (see app.js).
 */
function fileToPublicUrl(filePathAbs) {
  const uploadRootAbs = path.resolve(process.cwd(), env.UPLOAD_DIR);
  const rel = path.relative(uploadRootAbs, filePathAbs).split(path.sep).join('/');
  return `/uploads/${rel}`;
}

const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'File is required');
  res.status(201).json({ success: true, data: { url: fileToPublicUrl(req.file.path) } });
});

const uploadSymbol = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'File is required');
  res.status(201).json({ success: true, data: { url: fileToPublicUrl(req.file.path) } });
});

module.exports = {
  uploadPhoto,
  uploadSymbol
};
