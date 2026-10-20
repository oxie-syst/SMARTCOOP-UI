const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

router.get("/:userId", (req, res) => {
  const userId = req.params.userId;

  const userQuery = `
    SELECT
      UserID,
      FullName,
      Email,
      PhoneNumber,
      FarmName,
      FarmLocation,
      FarmSize
    FROM users
    WHERE UserID = ?
  `;

  db.query(userQuery, [userId], (err, userResults) => {
    if (err) {
      console.error("SETTINGS USER LOAD ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to load user settings."
      });
    }

    if (!userResults.length) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const settingsQuery = `
      SELECT
        EmailAlerts,
        SMSAlerts,
        PushNotifications,
        WeeklyReports,
        HealthAlerts,
        FeedingReminders
      FROM user_settings
      WHERE UserID = ?
    `;

    db.query(settingsQuery, [userId], (settingsErr, settingsResults) => {
      if (settingsErr) {
        console.error("SETTINGS LOAD ERROR:", settingsErr);

        return res.status(500).json({
          success: false,
          message: "Failed to load notification settings."
        });
      }

      const notifications =
        settingsResults.length
          ? settingsResults[0]
          : {
              EmailAlerts: 1,
              SMSAlerts: 0,
              PushNotifications: 1,
              WeeklyReports: 1,
              HealthAlerts: 1,
              FeedingReminders: 1
            };

      res.json({
        success: true,
        user: userResults[0],
        notifications
      });
    });
  });
});

router.put("/:userId/profile", (req, res) => {
  const userId = req.params.userId;

  const { fullName, phoneNumber } = req.body;

  if (typeof fullName !== "string" || !fullName.trim()) {
    return res.status(400).json({
      success: false,
      message: "Full name is required."
    });
  }

  const phone = phoneNumber == null
    ? ""
    : String(phoneNumber).trim();

  if (phone && !/^09\d{9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid 11-digit Philippine mobile number."
    });
  }
  const invalidPhoneNumbers = [
    "09123456789",
    "09876543210"
  ];

  if (invalidPhoneNumbers.includes(phone)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid phone number."
    });
  }

  const query = `
    UPDATE users
    SET FullName = ?, PhoneNumber = ?
    WHERE UserID = ?
  `;

  db.query(
    query,
    [fullName.trim(), phone || null, userId],
    (err, result) => {
if (err) {
  console.error("PROFILE UPDATE ERROR:", err);

  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "Phone number is already registered to another account."
    });
  }

  return res.status(500).json({
    success: false,
    message: "Failed to update profile."
  });
}

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          message: "User not found."
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully."
      });
    }
  );
});

router.put("/:userId/farm", (req, res) => {
  const userId = req.params.userId;

  const {
    farmName,
    farmLocation,
    farmSize
  } = req.body;

  const query = `
    UPDATE users
    SET
      FarmName = ?,
      FarmLocation = ?,
      FarmSize = ?
    WHERE UserID = ?
  `;

  db.query(
    query,
    [
      farmName || null,
      farmLocation || null,
      farmSize || null,
      userId
    ],
    (err) => {
      if (err) {
        console.error("FARM UPDATE ERROR:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to update farm information."
        });
      }

      res.json({
        success: true,
        message: "Farm information saved successfully."
      });
    }
  );
});

router.put("/:userId/notifications", (req, res) => {
  const userId = req.params.userId;

  const {
    emailAlerts,
    smsAlerts,
    pushNotifications,
    weeklyReports,
    healthAlerts,
    feedingReminders
  } = req.body;

  const query = `
    INSERT INTO user_settings (
      UserID,
      EmailAlerts,
      SMSAlerts,
      PushNotifications,
      WeeklyReports,
      HealthAlerts,
      FeedingReminders
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)

    ON DUPLICATE KEY UPDATE
      EmailAlerts = VALUES(EmailAlerts),
      SMSAlerts = VALUES(SMSAlerts),
      PushNotifications = VALUES(PushNotifications),
      WeeklyReports = VALUES(WeeklyReports),
      HealthAlerts = VALUES(HealthAlerts),
      FeedingReminders = VALUES(FeedingReminders)
  `;

  db.query(
    query,
    [
      userId,
      emailAlerts ? 1 : 0,
      smsAlerts ? 1 : 0,
      pushNotifications ? 1 : 0,
      weeklyReports ? 1 : 0,
      healthAlerts ? 1 : 0,
      feedingReminders ? 1 : 0
    ],
    (err) => {
      if (err) {
        console.error("NOTIFICATION UPDATE ERROR:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to save notification preferences."
        });
      }

      res.json({
        success: true,
        message: "Notification preferences saved."
      });
    }
  );
});

router.put("/:userId/password", (req, res) => {
  const userId = req.params.userId;

  const {
    currentPassword,
    newPassword
  } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current and new password are required."
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must contain at least 6 characters."
    });
  }

  const query = `
    SELECT Password
    FROM users
    WHERE UserID = ?
  `;

  db.query(query, [userId], async (err, results) => {
    if (err) {
      console.error("PASSWORD LOAD ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to verify password."
      });
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    try {
      const storedPassword = results[0].Password;

      let passwordMatches = false;

      if (
        storedPassword.startsWith("$2a$") ||
        storedPassword.startsWith("$2b$")
      ) {
        passwordMatches =
          await bcrypt.compare(
            currentPassword,
            storedPassword
          );
      } else {
        passwordMatches =
          currentPassword === storedPassword;
      }

      if (!passwordMatches) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect."
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          10
        );

      const updateQuery = `
        UPDATE users
        SET Password = ?
        WHERE UserID = ?
      `;

      db.query(
        updateQuery,
        [hashedPassword, userId],
        (updateErr) => {
          if (updateErr) {
            console.error("PASSWORD UPDATE ERROR:", updateErr);

            return res.status(500).json({
              success: false,
              message: "Failed to update password."
            });
          }

          res.json({
            success: true,
            message: "Password updated successfully."
          });
        }
      );
    } catch (error) {
      console.error("PASSWORD ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update password."
      });
    }
  });
});

router.delete("/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  const sessionUserId = Number(req.session?.userId);
  const { password, confirmation } = req.body || {};

  if (!sessionUserId) {
    return res.status(401).json({
      success: false,
      message: "Please log in first."
    });
  }

  if (!Number.isSafeInteger(userId) || userId !== sessionUserId) {
    return res.status(403).json({
      success: false,
      message: "You can only delete your own account."
    });
  }

  if (confirmation !== "DELETE") {
    return res.status(400).json({
      success: false,
      message: "Type DELETE to confirm account deletion."
    });
  }

  if (typeof password !== "string" || !password) {
    return res.status(400).json({
      success: false,
      message: "Current password is required."
    });
  }

  db.query(
    "SELECT Password FROM users WHERE UserID = ? LIMIT 1",
    [userId],
    async (err, results) => {
      if (err) {
        console.error("DELETE ACCOUNT LOOKUP ERROR:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to verify account."
        });
      }

      if (!results.length) {
        return res.status(404).json({
          success: false,
          message: "Account not found."
        });
      }

      try {
        const storedPassword = results[0].Password;

        if (!storedPassword) {
          return res.status(400).json({
            success: false,
            message: "This account has no password. Set a password before deleting."
          });
        }

        const matches = await bcrypt.compare(password, storedPassword);

        if (!matches) {
          return res.status(401).json({
            success: false,
            message: "Incorrect password."
          });
        }

        db.query(
          "DELETE FROM users WHERE UserID = ?",
          [userId],
          (deleteErr, result) => {
            if (deleteErr) {
              console.error("DELETE ACCOUNT ERROR:", deleteErr);
              return res.status(500).json({
                success: false,
                message: "Unable to delete account. Related records may still exist."
              });
            }

            if (!result.affectedRows) {
              return res.status(404).json({
                success: false,
                message: "Account not found."
              });
            }

            req.session.destroy((sessionErr) => {
              if (sessionErr) {
                console.error("DELETE SESSION ERROR:", sessionErr);
              }

              res.clearCookie("smartcoop.sid", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/"
              });

              return res.json({
                success: true,
                message: "Account deleted successfully."
              });
            });
          }
        );
      } catch (error) {
        console.error("DELETE ACCOUNT VERIFICATION ERROR:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to verify password."
        });
      }
    }
  );
});

module.exports = router;