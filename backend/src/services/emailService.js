const nodemailer = require('nodemailer');
const { env } = require('../config/env');

function isSmtpConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS);
}

function getTransport() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
}

async function sendEmailOtp({ to, otp }) {
  // In college projects, SMTP may not be configured. We still want the flow to work.
  if (!isSmtpConfigured()) {
    // eslint-disable-next-line no-console
    console.log(`[EMAIL OTP] To: ${to} | OTP: ${otp}`);
    return;
  }

  const transporter = getTransport();

  await transporter.sendMail({
    from: `\"${env.EMAIL_FROM_NAME}\" <${env.EMAIL_FROM_ADDRESS}>`,
    to,
    subject: 'Your College Voting OTP',
    text: `Your OTP is: ${otp}. It expires in ${env.OTP_TTL_MINUTES} minutes.`
  });
}

module.exports = {
  sendEmailOtp
};
