
const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", async (req, res) => {
  try {
    const userId = Number(req.session?.userId);
    const { rating, category, message, page } = req.body;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Please log in to submit feedback."
      });
    }

    const allowedCategories = [
      "Bug Report",
      "Suggestion",
      "General Feedback",
      "Others"
    ];

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      !allowedCategories.includes(category) ||
      typeof message !== "string" ||
      !message.trim() ||
      message.trim().length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid feedback details."
      });
    }

    const [users] = await new Promise((resolve, reject) => {
      db.query(
        "SELECT UserID, Role, AccountStatus FROM users WHERE UserID = ? LIMIT 1",
        [userId],
        (error, rows) => error ? reject(error) : resolve([rows])
      );
    });

    if (
      !users.length ||
      String(users[0].Role).toLowerCase() === "admin" ||
      String(users[0].AccountStatus).toLowerCase() !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message: "Your account cannot submit feedback."
      });
    }

    const safePage =
      typeof page === "string" ? page.trim().slice(0, 150) : "";

    db.query(
      `INSERT INTO feedback
       (UserID, Rating, Category, Message, Page)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, rating, category, message.trim(), safePage],
      (error, result) => {
        if (error) {
          console.error("FEEDBACK INSERT ERROR:", error);
          return res.status(500).json({
            success: false,
            message: "Unable to save feedback."
          });
        }

        return res.status(201).json({
          success: true,
          message: "Thank you! Your feedback has been submitted.",
          feedbackId: result.insertId
        });
      }
    );
  } catch (error) {
    console.error("FEEDBACK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit feedback."
    });
  }
});

module.exports = router;
