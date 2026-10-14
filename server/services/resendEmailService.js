
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendResendVerificationEmail(email, verificationUrl) {
  const { data, error } = await resend.emails.send({
    from: "SmartCoop <onboarding@resend.dev>",
    to: [email],
    subject: "Verify Your SmartCoop Newsletter Subscription",
    text: `Thank you for subscribing to SmartCoop!

Please confirm your email address by opening this link:

${verificationUrl}

This verification link will expire in 1 hour.

If you did not request this subscription, ignore this email.`
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = { sendResendVerificationEmail };
