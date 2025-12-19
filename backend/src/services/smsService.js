const twilio = require('twilio');
const { env } = require('../config/env');
const { ApiError } = require('../utils/apiError');

function isTwilioConfigured() {
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER);
}

function getTwilioClient() {
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

/**
 * NOTE: Twilio expects E.164 format ideally (e.g., +919999999999).
 * In your UI, store and submit mobile in E.164 to avoid delivery issues.
 */
async function sendMobileOtp({ to, otp }) {
  if (!isTwilioConfigured()) {
    // Fallback for development/demo without Twilio
    // eslint-disable-next-line no-console
    console.log(`[MOBILE OTP] To: ${to} | OTP: ${otp}`);
    return;
  }

  const client = getTwilioClient();

  await client.messages.create({
    from: env.TWILIO_FROM_NUMBER,
    to,
    body: `Your College Voting OTP is ${otp}. Expires in ${env.OTP_TTL_MINUTES} minutes.`
  });
}

module.exports = {
  sendMobileOtp
};
