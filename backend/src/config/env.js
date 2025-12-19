const dotenv = require('dotenv');

dotenv.config();

/**
 * Small helper to enforce required env vars in production.
 * In development we keep it forgiving, but still try to surface issues early.
 */
function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    // In production, crash fast if critical config is missing.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required env var: ${name}`);
    }
  }
  return value;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),

  MONGO_URI: required('MONGO_URI', 'mongodb://127.0.0.1:27017/college_voting'),

  JWT_SECRET: required('JWT_SECRET', 'dev_secret_change_me'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  OTP_LENGTH: Number(process.env.OTP_LENGTH || 6),
  OTP_TTL_MINUTES: Number(process.env.OTP_TTL_MINUTES || 10),
  OTP_COOLDOWN_SECONDS: Number(process.env.OTP_COOLDOWN_SECONDS || 60),

  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'College Voting System',
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || 'no-reply@college.edu',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  SMS_PROVIDER: process.env.SMS_PROVIDER || 'console',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,

  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_UPLOAD_MB: Number(process.env.MAX_UPLOAD_MB || 5)
};

module.exports = { env };
