
const express = require("express");
const { Resend } = require("resend");
const db = require("../db");

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/", async (req, res) => {
  try {
    if (!process.env.RESEND_WEBHOOK_SECRET) {
      console.error("Missing RESEND_WEBHOOK_SECRET");
      return res.sendStatus(500);
    }

    const event = resend.webhooks.verify({
      payload: req.body.toString("utf8"),
      headers: {
        id: req.headers["svix-id"],
        timestamp: req.headers["svix-timestamp"],
        signature: req.headers["svix-signature"]
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET
    });

    if (
      event.type !== "email.delivered" &&
      event.type !== "email.bounced"
    ) {
      return res.sendStatus(200);
    }

    const emailId = event.data?.email_id;

    if (!emailId) {
      console.error("Webhook missing email_id");
      return res.sendStatus(200);
    }

    const status =
      event.type === "email.bounced"
        ? "Bounced"
        : "Delivered";

    db.query(
      `UPDATE NewsletterSubscribers
       SET DeliveryStatus = ?
       WHERE ResendEmailID = ?
       AND DeliveryStatus != 'Bounced'`,
      [status, emailId],
      (error, result) => {
        if (error) {
          console.error("Webhook database error:", error);
          return res.sendStatus(500);
        }

        console.log(
          "Resend webhook:",
          event.type,
          "Updated rows:",
          result.affectedRows
        );

        res.sendStatus(200);
      }
    );
  } catch (error) {
    console.error("Invalid Resend webhook:", error.message);
    res.sendStatus(400);
  }
});

module.exports = router;
