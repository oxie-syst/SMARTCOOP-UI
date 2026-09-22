const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
  const {
    userId,
    title,
    description,
    category,
    priority,
    reminderDate,
    reminderTime
  } = req.body;

  if (!userId || !title || !reminderDate || !reminderTime) {
    return res.status(400).json({
      success: false,
      message: "Required fields are missing."
    });
  }

  const sql = `
    INSERT INTO alerts (
      UserID,
      Title,
      Description,
      Category,
      Priority,
      ReminderDate,
      ReminderTime,
      Status,
      IsCompleted
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'upcoming', 0)
  `;

  db.query(
    sql,
    [
      userId,
      title,
      description || null,
      category || "feeding",
      priority || "medium",
      reminderDate,
      reminderTime
    ],
    (err, result) => {
      if (err) {
        console.error("Add Alert Error:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to add reminder."
        });
      }

      res.json({
        success: true,
        message: "Reminder added successfully.",
        alertId: result.insertId
      });
    }
  );
});


router.get("/user/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT *
    FROM alerts
    WHERE UserID = ?
    ORDER BY
      IsCompleted ASC,
      ReminderDate ASC,
      ReminderTime ASC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("Load Alerts Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to load reminders."
      });
    }

    const now = new Date();

    const alerts = rows.map((row) => {
      const dateString =
        row.ReminderDate instanceof Date
          ? row.ReminderDate.toISOString().split("T")[0]
          : String(row.ReminderDate).split("T")[0];

      const reminderDateTime = new Date(
        `${dateString}T${row.ReminderTime}`
      );

      let status = "upcoming";

      if (row.IsCompleted) {
        status = "completed";
      } else if (reminderDateTime < now) {
        status = "overdue";
      }

      return {
        id: row.AlertID,
        userId: row.UserID,
        title: row.Title,
        description: row.Description,
        category: row.Category,
        priority: row.Priority,
        reminderDate: dateString,
        reminderTime: row.ReminderTime,
        status,
        isCompleted: Boolean(row.IsCompleted),
        createdAt: row.CreatedAt,
        updatedAt: row.UpdatedAt
      };
    });

    res.json({
      success: true,
      alerts
    });
  });
});


router.get("/stats/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT *
    FROM alerts
    WHERE UserID = ?
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("Alert Stats Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to load alert statistics."
      });
    }

    const now = new Date();

    let upcoming = 0;
    let completed = 0;
    let highPriority = 0;
    let overdue = 0;

    rows.forEach((row) => {
      const dateString =
        row.ReminderDate instanceof Date
          ? row.ReminderDate.toISOString().split("T")[0]
          : String(row.ReminderDate).split("T")[0];

      const reminderDateTime = new Date(
        `${dateString}T${row.ReminderTime}`
      );

      if (row.IsCompleted) {
        completed++;
      } else {
        if (reminderDateTime < now) {
          overdue++;
        } else {
          upcoming++;
        }

        if (row.Priority === "high") {
          highPriority++;
        }
      }
    });

    res.json({
      success: true,
      stats: {
        upcoming,
        completed,
        highPriority,
        overdue,
        total: rows.length
      }
    });
  });
});


router.put("/:id/complete", (req, res) => {
  const alertId = req.params.id;
  const { userId, isCompleted } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required."
    });
  }

  const completed = isCompleted ? 1 : 0;
  const status = completed ? "completed" : "upcoming";

  const sql = `
    UPDATE alerts
    SET
      IsCompleted = ?,
      Status = ?
    WHERE AlertID = ?
    AND UserID = ?
  `;

  db.query(
    sql,
    [completed, status, alertId, userId],
    (err, result) => {
      if (err) {
        console.error("Complete Alert Error:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to update reminder."
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Reminder not found."
        });
      }

      res.json({
        success: true,
        message: completed
          ? "Reminder completed."
          : "Reminder marked as upcoming."
      });
    }
  );
});


router.put("/:id", (req, res) => {
  const alertId = req.params.id;

  const {
    userId,
    title,
    description,
    category,
    priority,
    reminderDate,
    reminderTime
  } = req.body;

  if (!userId || !title || !reminderDate || !reminderTime) {
    return res.status(400).json({
      success: false,
      message: "Required fields are missing."
    });
  }

  const sql = `
    UPDATE alerts
    SET
      Title = ?,
      Description = ?,
      Category = ?,
      Priority = ?,
      ReminderDate = ?,
      ReminderTime = ?
    WHERE AlertID = ?
    AND UserID = ?
  `;

  db.query(
    sql,
    [
      title,
      description || null,
      category || "feeding",
      priority || "medium",
      reminderDate,
      reminderTime,
      alertId,
      userId
    ],
    (err, result) => {
      if (err) {
        console.error("Update Alert Error:", err);

        return res.status(500).json({
          success: false,
          message: "Failed to update reminder."
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Reminder not found."
        });
      }

      res.json({
        success: true,
        message: "Reminder updated successfully."
      });
    }
  );
});


router.delete("/:id", (req, res) => {
  const alertId = req.params.id;
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required."
    });
  }

  const sql = `
    DELETE FROM alerts
    WHERE AlertID = ?
    AND UserID = ?
  `;

  db.query(sql, [alertId, userId], (err, result) => {
    if (err) {
      console.error("Delete Alert Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to delete reminder."
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found."
      });
    }

    res.json({
      success: true,
      message: "Reminder deleted successfully."
    });
  });
});


module.exports = router;