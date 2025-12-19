const path = require('path');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { router: apiRouter } = require('./routes');
const { env } = require('./config/env');
const { notFound } = require('./middlewares/notFound');
const { errorHandler } = require('./middlewares/errorHandler');

function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS - for college project allow localhost frontends
  app.use(
    cors({
      origin: true,
      credentials: true
    })
  );

  // Basic request logging
  app.use(morgan('dev'));

  // Rate limit to slow down brute force attacks
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false
    })
  );

  // Body parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Serve uploads publicly
  // Example: /uploads/candidates/photos/<file>
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  // Routes
  app.use('/api/v1', apiRouter);

  // 404 + Error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
