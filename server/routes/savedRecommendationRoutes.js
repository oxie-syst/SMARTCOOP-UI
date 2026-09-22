const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
  const {
    userId,
    breed,
    bestFor,
    recommendedCoopSpace,
    climateSuitability,
    experienceLevel,
    whyRecommended,
    advantages,
    thingsToConsider
  } = req.body;

  if (!userId || !breed) {
    return res.status(400).json({
      success: false,
      message: "User ID and breed are required."
    });
  }

  const sql = `
    INSERT INTO saved_recommendations (
      user_id,
      breed,
      best_for,
      recommended_coop_space,
      climate_suitability,
      experience_level,
      why_recommended,
      advantages,
      things_to_consider
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      userId,
      breed,
      bestFor || "",
      JSON.stringify(recommendedCoopSpace || []),
      JSON.stringify(climateSuitability || []),
      experienceLevel || "",
      whyRecommended || "",
      JSON.stringify(advantages || []),
      JSON.stringify(thingsToConsider || [])
    ],
    (error, result) => {
      if (error) {
        console.error(
          "Save Recommendation Error:",
          error
        );

        return res.status(500).json({
          success: false,
          message: "Unable to save recommendation."
        });
      }

      return res.json({
        success: true,
        message: "Recommendation saved successfully.",
        id: result.insertId
      });
    }
  );
});

router.get("/user/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT *
    FROM saved_recommendations
    WHERE user_id = ?
    ORDER BY saved_at DESC
  `;

  db.query(
    sql,
    [userId],
    (error, results) => {
      if (error) {
        console.error(
          "Load Saved Recommendations Error:",
          error
        );

        return res.status(500).json({
          success: false,
          message: "Unable to load saved recommendations."
        });
      }

      const recommendations =
        results.map(item => ({
          id: item.id,
          userId: item.user_id,
          breed: item.breed,
          bestFor: item.best_for,
          recommendedCoopSpace:
            parseJsonArray(
              item.recommended_coop_space
            ),
          climateSuitability:
            parseJsonArray(
              item.climate_suitability
            ),
          experienceLevel:
            item.experience_level,
          whyRecommended:
            item.why_recommended,
          advantages:
            parseJsonArray(
              item.advantages
            ),
          thingsToConsider:
            parseJsonArray(
              item.things_to_consider
            ),
          savedAt:
            item.saved_at
        }));

      return res.json({
        success: true,
        recommendations
      });
    }
  );
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required."
    });
  }

  const sql = `
    DELETE FROM saved_recommendations
    WHERE id = ?
    AND user_id = ?
  `;

  db.query(
    sql,
    [id, userId],
    (error, result) => {
      if (error) {
        console.error(
          "Delete Recommendation Error:",
          error
        );

        return res.status(500).json({
          success: false,
          message: "Unable to delete recommendation."
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Saved recommendation not found."
        });
      }

      return res.json({
        success: true,
        message: "Recommendation removed."
      });
    }
  );
});

function parseJsonArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

module.exports = router;