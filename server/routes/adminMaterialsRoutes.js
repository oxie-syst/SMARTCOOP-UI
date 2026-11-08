const express = require("express");
const router = express.Router();
const db = require("../db");

function queryDatabase(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

async function verifyAdmin(req, res, next) {
  try {
    const userId = Number(req.session?.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Administrator login is required."
      });
    }

    const users = await queryDatabase(
      `SELECT UserID, Role, AccountStatus
       FROM users
       WHERE UserID = ?
       LIMIT 1`,
      [userId]
    );

    const admin = users[0];

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Administrator account not found."
      });
    }

    if (String(admin.Role || "").toLowerCase() !== "admin" ||
        String(admin.AccountStatus || "").toLowerCase() !== "active") {
      return res.status(403).json({
        success: false,
        message: "Administrator access is required."
      });
    }

    next();
  } catch (error) {
    console.error("ADMIN MATERIALS AUTH ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Unable to verify administrator."
    });
  }
}

router.use(verifyAdmin);


router.get("/", async (req, res) => {
  try {
    const materials = await queryDatabase(
      `SELECT
          MaterialID,
          MaterialName,
          Unit,
          UnitPrice,
          Specification,
          ChickenType,
          IsActive
       FROM coop_materials
       ORDER BY ChickenType ASC, MaterialName ASC`
    );
    const [databaseInfo] = await queryDatabase(`
  SELECT
    DATABASE() AS databaseName,
    @@hostname AS serverName,
    COUNT(*) AS totalMaterials
  FROM coop_materials
`);

console.log("ADMIN MATERIALS CHECK:", {
  ...databaseInfo,
  returnedMaterials: materials.length
});

    return res.json({
      success: true,
      materials
    });

  } catch (error) {
    console.error("GET MATERIALS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load materials."
    });
  }
});


router.post("/", async (req, res) => {
  try {
    const {
      materialName,
      unit,
      unitPrice,
      specification
    } = req.body;

    const name = String(materialName || "").trim();
    const materialUnit = String(unit || "").trim();
    const price = Number(unitPrice);

    if (
      !name ||
      !materialUnit ||
      name.length > 150 ||
      materialUnit.length > 50 ||
      unitPrice === undefined ||
      unitPrice === null ||
      unitPrice === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 9999999999.99
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid material details."
      });
    }

    const result = await queryDatabase(
      `INSERT INTO coop_materials
       (MaterialName, Unit, UnitPrice, Specification)
       VALUES (?, ?, ?, ?)`,
      [
        name,
        materialUnit,
        price,
        String(specification || "").trim()
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Material added successfully.",
      materialId: result.insertId
    });

  } catch (error) {
    console.error("ADD MATERIAL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add material."
    });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const materialId = Number(req.params.id);

    const {
      materialName,
      unit,
      unitPrice,
      specification
    } = req.body;

    const name = String(materialName || "").trim();
    const materialUnit = String(unit || "").trim();
    const price = Number(unitPrice);

    if (
      !Number.isSafeInteger(materialId) ||
      materialId <= 0 ||
      !name ||
      !materialUnit ||
      name.length > 150 ||
      materialUnit.length > 50 ||
      unitPrice === undefined ||
      unitPrice === null ||
      unitPrice === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 9999999999.99
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid material details."
      });
    }

    const result = await queryDatabase(
      `UPDATE coop_materials
       SET MaterialName = ?,
           Unit = ?,
           UnitPrice = ?,
           Specification = ?
       WHERE MaterialID = ?`,
      [
        name,
        materialUnit,
        price,
        String(specification || "").trim(),
        materialId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Material not found."
      });
    }

    return res.json({
      success: true,
      message: "Material updated successfully."
    });

  } catch (error) {
    console.error("UPDATE MATERIAL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update material."
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const materialId = Number(req.params.id);

    if (
      !Number.isSafeInteger(materialId) ||
      materialId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID."
      });
    }

    const result = await queryDatabase(
      `UPDATE coop_materials
       SET IsActive = 0
       WHERE MaterialID = ?
         AND IsActive = 1`,
      [materialId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Active material not found."
      });
    }

    return res.json({
      success: true,
      message: "Material deactivated successfully."
    });

  } catch (error) {
    console.error("DELETE MATERIAL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete material."
    });
  }
});
router.patch("/:id/price", async (req, res) => {
  try {
    const materialId = Number(req.params.id);
    const { unitPrice } = req.body || {};
    const price = Number(unitPrice);

    if (
      !Number.isSafeInteger(materialId) ||
      materialId <= 0 ||
      unitPrice === undefined ||
      unitPrice === null ||
      unitPrice === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 9999999999.99
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid material price."
      });
    }

    const result = await queryDatabase(
      `UPDATE coop_materials
       SET UnitPrice = ?
       WHERE MaterialID = ?
         AND IsActive = 1`,
      [price, materialId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Active material not found."
      });
    }

    return res.json({
      success: true,
      message: "Material price updated successfully."
    });

  } catch (error) {
    console.error("UPDATE MATERIAL PRICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update material price."
    });
  }
});

module.exports = router;