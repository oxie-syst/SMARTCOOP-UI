const {
  validateEmailAddress
} = require("../services/emailValidationService");
const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const db = require("../db");
const { sendVerificationEmail } = require("../services/emailService");

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Newsletter API is working"
  });
});

router.post("/subscribe", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address."
    });
  }

try {
  const validation = await validateEmailAddress(email);

  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message
    });
  }
} catch (error) {
  console.error("Email validation error:", error.message);

  return res.status(503).json({
    success: false,
    message: "Email validation is temporarily unavailable. Please try again."
  });
}


  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256")
    .update(token)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  db.query(
    "SELECT IsVerified FROM NewsletterSubscribers WHERE Email = ?",
    [email],
    (selectError, rows) => {
      if (selectError) {
        console.error(selectError);
        return res.status(500).json({
          success: false,
          message: "Database error."
        });
      }

      if (rows.length && rows[0].IsVerified) {
        return res.json({
          success: true,
          message: "If this email is eligible, a confirmation email will be sent."
        });
      }

      const sql = `
        INSERT INTO NewsletterSubscribers
          (Email, VerificationTokenHash, TokenExpiresAt)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          VerificationTokenHash = VALUES(VerificationTokenHash),
          TokenExpiresAt = VALUES(TokenExpiresAt)
      `;

      db.query(sql, [email, tokenHash, expiresAt], async (saveError) => {
        if (saveError) {
          console.error(saveError);
          return res.status(500).json({
            success: false,
            message: "Unable to save subscription request."
          });
        }

        const baseUrl = process.env.PUBLIC_BASE_URL;

        if (!baseUrl) {
          return res.status(500).json({
            success: false,
            message: "Email verification is not configured."
          });
        }

        const verificationUrl =
          `${baseUrl.replace(/\/$/, "")}/api/newsletter/verify?token=${token}`;

        try {
          await sendVerificationEmail(email, verificationUrl);

            res.json({
            success: true,
            verified: false,
            message: "Verification required. Please check your inbox and confirm your email to complete the subscription."
            });
        } catch (error) {
          console.error("Newsletter email error:", error);
          res.status(500).json({
            success: false,
            message: "Unable to send verification email."
          });
        }
      });
    }
  );
});

router.get("/verify", (req, res) => {
  const token = String(req.query.token || "");

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).send("Invalid verification link.");
  }

  const tokenHash = crypto.createHash("sha256")
    .update(token)
    .digest("hex");

  db.query(
    `UPDATE NewsletterSubscribers
     SET IsVerified = TRUE,
         VerifiedAt = NOW(),
         VerificationTokenHash = NULL,
         TokenExpiresAt = NULL
     WHERE VerificationTokenHash = ?
       AND IsVerified = FALSE
       AND TokenExpiresAt > NOW()`,
    [tokenHash],
    (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).send("Verification failed.");
      }

      if (result.affectedRows === 0) {
        return res.status(400).send(
          "Verification link is invalid, expired, or already used."
        );
      }

      res.send("Your SmartCoop Newsletter subscription is now verified!");
    }
  );
});

module.exports = router;
