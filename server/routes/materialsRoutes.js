const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/prices", (req, res) => {
  const sql = `
    SELECT
      m.MaterialID,
      m.MaterialName,
      m.Unit,
      m.UnitPrice,
      m.Specification,
      c.ChickenType,
      c.CoopSize
    FROM coop_materials m
    INNER JOIN coop_material_categories c
      ON m.MaterialID = c.MaterialID
    WHERE m.IsActive = 1
      AND m.ChickenType = 'Broilers'

    UNION ALL

    SELECT
      m.MaterialID,
      m.MaterialName,
      m.Unit,
      m.UnitPrice,
      m.Specification,
      m.ChickenType,
      NULL AS CoopSize
    FROM coop_materials m
    WHERE m.IsActive = 1
      AND m.ChickenType IN ('Layers (Egg Production)', 'Dual Purpose')

    ORDER BY MaterialName ASC
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