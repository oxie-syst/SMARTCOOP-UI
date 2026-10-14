const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

async function sendVerificationEmail(email, verificationUrl) {
  await transporter.sendMail({
    from: `"SmartCoop" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your SmartCoop Newsletter Subscription",
    text: `Thank you for subscribing to SmartCoop!

Please confirm your email address by opening this link:

${verificationUrl}

If you did not request this subscription, you can ignore this email.`
  });
}

module.exports = { sendVerificationEmail };