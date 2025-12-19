const fs = require('fs');
const path = require('path');
const multer = require('multer');

const { env } = require('../config/env');
const { ApiError } = require('../utils/apiError');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
ensureDir(uploadRoot);

/**
 * Store files under:
 *  uploads/candidates/photos
 *  uploads/candidates/symbols
 */
function makeStorage(subdir) {
  const dest = path.join(uploadRoot, subdir);
  ensureDir(dest);

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = ext && ext.length <= 10 ? ext : '';
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${safeExt}`);
    }
  });
}

function imageFileFilter(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
  return cb(new ApiError(400, 'Only image uploads are allowed'), false);
}

const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;

const uploadCandidatePhoto = multer({
  storage: makeStorage(path.join('candidates', 'photos')),
  fileFilter: imageFileFilter,
  limits: { fileSize: maxBytes }
});

const uploadCandidateSymbol = multer({
  storage: makeStorage(path.join('candidates', 'symbols')),
  fileFilter: imageFileFilter,
  limits: { fileSize: maxBytes }
});

module.exports = {
  uploadCandidatePhoto,
  uploadCandidateSymbol,
  uploadRoot
};
