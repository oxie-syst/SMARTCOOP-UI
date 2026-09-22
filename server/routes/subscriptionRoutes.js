const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/:userId", (req, res) => {
  const { userId } = req.params;

  db.query(
    `
      SELECT
        UserID,
        FullName,
        Email,
        PhoneNumber,
        FarmName,
        FarmLocation,
        FarmSize,
        IsPremium,
        SubscriptionStatus,
        SubscriptionStart,
        SubscriptionEnd,
        SubscriptionPrice,
        IsFirstPremium
      FROM users
      WHERE UserID = ?
      LIMIT 1
    `,
    [userId],
    (error, results) => {
      if (error) {
        console.error(
          "Subscription Status Error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to load subscription."
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found."
        });
      }

      const user = results[0];

      return res.json({
        success: true,

        user: {
          userId:
            user.UserID,

          fullName:
            user.FullName,

          email:
            user.Email,

          phoneNumber:
            user.PhoneNumber,

          farmName:
            user.FarmName,

          farmLocation:
            user.FarmLocation,

          farmSize:
            user.FarmSize
        },

        subscription: {
          isPremium:
            Boolean(
              Number(user.IsPremium)
            ),

          status:
            user.SubscriptionStatus,

          start:
            user.SubscriptionStart,

          end:
            user.SubscriptionEnd,

          price:
            user.SubscriptionPrice,

          isFirstPremium:
            Boolean(
              Number(user.IsFirstPremium)
            ),

          availablePrice:
            Number(user.IsFirstPremium)
              ? 649
              : 1299
        }
      });
    }
  );
});

router.post("/activate", (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required."
    });
  }

  db.query(
    `
      SELECT
        IsPremium,
        IsFirstPremium
      FROM users
      WHERE UserID = ?
      LIMIT 1
    `,
    [userId],
    (error, results) => {
      if (error) {
        console.error(
          "Premium Check Error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to check subscription."
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found."
        });
      }

      const user = results[0];

      if (Number(user.IsPremium)) {
        return res.status(400).json({
          success: false,
          message:
            "Your Premium subscription is already active."
        });
      }

      const price =
        Number(user.IsFirstPremium)
          ? 649
          : 1299;

      db.query(
        `
          UPDATE users
          SET
            IsPremium = 1,
            SubscriptionStatus = 'Active',
            SubscriptionStart = NOW(),
            SubscriptionEnd =
              DATE_ADD(NOW(), INTERVAL 1 MONTH),
            SubscriptionPrice = ?,
            IsFirstPremium = 0
          WHERE UserID = ?
        `,
        [price, userId],
        updateError => {
          if (updateError) {
            console.error(
              "Premium Activation Error:",
              updateError
            );

            return res.status(500).json({
              success: false,
              message:
                "Unable to activate Premium."
            });
          }

          return res.json({
            success: true,
            message:
              "SmartCoop Premium activated successfully.",

            subscription: {
              isPremium: true,
              status: "Active",
              price
            }
          });
        }
      );
    }
  );
});

module.exports = router;