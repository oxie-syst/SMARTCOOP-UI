const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/prices", (req, res) => {
  const sql = `
    SELECT
      m.MaterialID,
      m.MaterialName,
      m.Unit,
      COALESCE(c.UnitPriceOverride, m.UnitPrice) AS UnitPrice,
      m.Specification,
      m.IsActive,
      m.Category,
      m.ChickenType,
      COALESCE(q.CoopSize, c.CoopSize) AS CoopSize,
      q.Quantity
    FROM coop_materials m
    LEFT JOIN coop_material_quantities q
      ON q.MaterialID = m.MaterialID
    LEFT JOIN coop_material_categories c
      ON c.MaterialID = m.MaterialID
      AND c.ChickenType = m.ChickenType
      AND (
        c.CoopSize = q.CoopSize
        OR (
          q.CoopSize IS NULL
          AND c.CoopSize IS NOT NULL
        )
      )
    ORDER BY m.MaterialName ASC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("GET MATERIAL PRICES ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load material prices."
      });
    }

    return res.json({
      success: true,
      materials: results
    });
  });
});

module.exports = router;