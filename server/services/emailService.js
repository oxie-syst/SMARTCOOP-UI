const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER?.trim(),
    pass: process.env.EMAIL_APP_PASSWORD?.replace(/\s/g, "")
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