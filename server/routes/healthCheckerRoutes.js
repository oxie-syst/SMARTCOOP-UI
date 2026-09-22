const express = require("express");
const db = require("../db");
const HealthCheckerEngine = require("../health-checker-engine/healthCheckerEngine");

const router = express.Router();

// Loaded once at server startup: reads symptoms.json, diseases.json, and
// ml_weights.json into memory a single time, not on every request.
const engine = new HealthCheckerEngine();

router.post("/analyze", (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one symptom.",
      });
    }

    const result = engine.analyze(symptoms);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error("Health Checker Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to analyze symptoms at this time.",
    });
  }
});

router.post("/history", (req, res) => {
  const {
    userId,
    possibleConcern,
    priority,
    symptomMatch,
    symptoms,
    summary,
    recommendedActions,
    prevention,
    veterinaryGuidance,
    source,
    fallback
  } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required."
    });
  }

  if (!possibleConcern) {
    return res.status(400).json({
      success: false,
      message: "Health assessment is required."
    });
  }

  const sql = `
    INSERT INTO health_checks (
      UserID,
      PossibleConcern,
      PriorityLevel,
      SymptomMatch,
      Symptoms,
      Summary,
      RecommendedActions,
      Prevention,
      VeterinaryGuidance,
      Source,
      IsFallback
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    userId,
    possibleConcern,
    priority || "medium",
    symptomMatch || 0,
    JSON.stringify(
      Array.isArray(symptoms)
        ? symptoms
        : []
    ),
    summary || "",
    JSON.stringify(
      Array.isArray(recommendedActions)
        ? recommendedActions
        : []
    ),
    JSON.stringify(
      Array.isArray(prevention)
        ? prevention
        : []
    ),
    veterinaryGuidance || "",
    source || "SmartCoop",
    fallback ? 1 : 0
  ];

  db.query(
    sql,
    values,
    (error, result) => {
      if (error) {
        console.error(
          "Save Health Check Error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to save health check."
        });
      }

      return res.status(201).json({
        success: true,
        message:
          "Health check saved successfully.",

        healthCheckId:
          result.insertId
      });
    }
  );
});

router.get(
  "/history/:userId",
  (req, res) => {
    const userId =
      req.params.userId;

    const sql = `
      SELECT
        HealthCheckID,
        UserID,
        PossibleConcern,
        PriorityLevel,
        SymptomMatch,
        Symptoms,
        Summary,
        RecommendedActions,
        Prevention,
        VeterinaryGuidance,
        Source,
        IsFallback,
        CreatedAt
      FROM health_checks
      WHERE UserID = ?
      ORDER BY CreatedAt DESC, HealthCheckID DESC
    `;

    db.query(
      sql,
      [userId],
      (error, results) => {
        if (error) {
          console.error(
            "Load Health History Error:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Unable to load health history."
          });
        }

        const records =
          results.map(record => {
            let symptoms = [];
            let recommendedActions = [];
            let prevention = [];

            try {
              symptoms =
                JSON.parse(
                  record.Symptoms ||
                  "[]"
                );
            } catch {
              symptoms = [];
            }

            try {
              recommendedActions =
                JSON.parse(
                  record.RecommendedActions ||
                  "[]"
                );
            } catch {
              recommendedActions = [];
            }

            try {
              prevention =
                JSON.parse(
                  record.Prevention ||
                  "[]"
                );
            } catch {
              prevention = [];
            }

            return {
              id:
                record.HealthCheckID,

              userId:
                record.UserID,

              diagnosis:
                record.PossibleConcern,

              severity:
                record.PriorityLevel,

              confidence:
                record.SymptomMatch,

              symptoms,

              summary:
                record.Summary,

              recommendedActions,

              prevention,

              veterinaryGuidance:
                record.VeterinaryGuidance,

              source:
                record.Source,

              fallback:
                Boolean(
                  record.IsFallback
                ),

              createdAt:
                record.CreatedAt
            };
          });

        return res.json({
          success: true,
          records
        });
      }
    );
  }
);

router.delete(
  "/history/:id",
  (req, res) => {
    const healthCheckId =
      req.params.id;

    const userId =
      req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required."
      });
    }

    const sql = `
      DELETE FROM health_checks
      WHERE HealthCheckID = ?
      AND UserID = ?
    `;

    db.query(
      sql,
      [
        healthCheckId,
        userId
      ],
      (error, result) => {
        if (error) {
          console.error(
            "Delete Health Check Error:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Unable to delete health check."
          });
        }

        if (
          result.affectedRows === 0
        ) {
          return res.status(404).json({
            success: false,
            message:
              "Health check not found."
          });
        }

        return res.json({
          success: true,
          message:
            "Health check deleted successfully."
        });
      }
    );
  }
);

module.exports = router;