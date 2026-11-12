
const express = require("express");
const router = express.Router();
const db = require("../db");

const VALID_CHICKEN_TYPES = [
  "Broilers",
  "Layers (Egg Production)",
  "Dual Purpose"
];

const VALID_CATEGORIES = [
  "Construction",
  "Hardware",
  "Equipment",
  "Bedding",
  "Feed",
  "Livestock",
  "Uncategorized"
];

const COOP_SIZES = Array.from(
  { length: 10 },
  (_, i) => `${i + 1}x${i + 1}`
);

function queryDatabase(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

function getConnection() {
  return new Promise((resolve, reject) => {
    db.getConnection((error, connection) => {
      if (error) return reject(error);
      resolve(connection);
    });
  });
}

function connectionQuery(connection, sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

function beginTransaction(connection) {
  return new Promise((resolve, reject) => {
    connection.beginTransaction(error => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function commitTransaction(connection) {
  return new Promise((resolve, reject) => {
    connection.commit(error => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function rollbackTransaction(connection) {
  return new Promise(resolve => {
    connection.rollback(() => resolve());
  });
}

function validId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0;
}

function validPrice(value) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    typeof value === "boolean"
  ) {
    return false;
  }

  const price = Number(value);

  return (
    Number.isFinite(price) &&
    price >= 0 &&
    price <= 9999999999.99 &&
    Math.abs(price * 100 - Math.round(price * 100)) < 0.000001
  );
}

function validQuantity(value) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    typeof value === "boolean"
  ) {
    return false;
  }

  const quantity = Number(value);

  return (
    Number.isFinite(quantity) &&
    quantity >= 0 &&
    quantity <= 99999999.99 &&
    Math.abs(quantity * 100 - Math.round(quantity * 100)) < 0.000001
  );
}

function validQuantities(quantities) {
  if (
    !quantities ||
    typeof quantities !== "object" ||
    Array.isArray(quantities)
  ) {
    return false;
  }

  const keys = Object.keys(quantities);

  if (keys.length !== COOP_SIZES.length) {
    return false;
  }

  return COOP_SIZES.every(size => {
    return (
      Object.prototype.hasOwnProperty.call(quantities, size) &&
      validQuantity(quantities[size])
    );
  });
}

function normalized(value) {
  return String(value ?? "").trim().toLowerCase();
}

async function verifyAdmin(req, res, next) {
  try {
    const userId = Number(req.session?.userId);

    if (!validId(userId)) {
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

    if (
      normalized(admin.Role) !== "admin" ||
      normalized(admin.AccountStatus) !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message: "Administrator access is required."
      });
    }

    return next();

  } catch (error) {
    console.error("ADMIN MATERIALS AUTH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify administrator."
    });
  }
}

router.use(verifyAdmin);

async function getMaterialRecords(materialId) {
  const rows = await queryDatabase(
    `SELECT
       MaterialID,
       MaterialName,
       Unit,
       ChickenType,
       Category
     FROM coop_materials
     WHERE MaterialID = ?
     LIMIT 1`,
    [materialId]
  );

  if (!rows.length) {
    return null;
  }

  const material = rows[0];

  if (material.Category === "Livestock") {
    return await queryDatabase(
      `SELECT
         MaterialID,
         MaterialName,
         Unit,
         UnitPrice,
         ChickenType,
         Category,
         IsActive
       FROM coop_materials
       WHERE MaterialID = ?
       LIMIT 1`,
      [materialId]
    );
  }

  return await queryDatabase(
    `SELECT
       MaterialID,
       MaterialName,
       Unit,
       UnitPrice,
       ChickenType,
       Category,
       IsActive
     FROM coop_materials
     WHERE LOWER(TRIM(MaterialName)) = ?
       AND LOWER(TRIM(Unit)) = ?
       AND Category <> 'Livestock'
     ORDER BY MaterialID ASC`,
    [
      normalized(material.MaterialName),
      normalized(material.Unit)
    ]
  );
}

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
         Category,
         IsActive
       FROM coop_materials
       ORDER BY MaterialName ASC, ChickenType ASC`
    );

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
  const {
    materialName,
    unit,
    unitPrice,
    specification,
    chickenType,
    category,
    quantities
  } = req.body || {};

  const name = String(materialName ?? "").trim();
  const materialUnit = String(unit ?? "").trim();
  const selectedChickenType = String(chickenType ?? "").trim();
  const selectedCategory = String(category ?? "").trim();
  const materialSpecification = String(specification ?? "").trim();

  const isLivestock = selectedCategory === "Livestock";

  if (
    !name ||
    !materialUnit ||
    name.length > 150 ||
    materialUnit.length > 50 ||
    !validPrice(unitPrice) ||
    !VALID_CHICKEN_TYPES.includes(selectedChickenType) ||
    !VALID_CATEGORIES.includes(selectedCategory)
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid material details."
    });
  }

  if (isLivestock && normalized(materialUnit) !== "chick") {
    return res.status(400).json({
      success: false,
      message: "Livestock unit must be chick."
    });
  }

  if (!isLivestock && !validQuantities(quantities)) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid quantities for all coop sizes from 1x1 to 10x10."
    });
  }

  let connection;
  let transactionStarted = false;

  try {
    connection = await getConnection();

    await beginTransaction(connection);
    transactionStarted = true;

    const existing = await connectionQuery(
      connection,
      `SELECT MaterialID
       FROM coop_materials
       WHERE LOWER(TRIM(MaterialName)) = ?
         AND LOWER(TRIM(Unit)) = ?
         AND ChickenType = ?
         AND Category = ?
       LIMIT 1`,
      [
        normalized(name),
        normalized(materialUnit),
        selectedChickenType,
        selectedCategory
      ]
    );

    if (existing.length) {
      await rollbackTransaction(connection);
      transactionStarted = false;

      return res.status(409).json({
        success: false,
        message: "This material already exists for the selected chicken type."
      });
    }

    let price = Number(unitPrice);

    if (!isLivestock) {
      const shared = await connectionQuery(
        connection,
        `SELECT UnitPrice
         FROM coop_materials
         WHERE LOWER(TRIM(MaterialName)) = ?
           AND LOWER(TRIM(Unit)) = ?
           AND Category <> 'Livestock'
         ORDER BY MaterialID ASC
         LIMIT 1`,
        [
          normalized(name),
          normalized(materialUnit)
        ]
      );

      if (shared.length) {
        price = Number(shared[0].UnitPrice);
      }
    }

    const result = await connectionQuery(
      connection,
      `INSERT INTO coop_materials
       (
         MaterialName,
         Unit,
         UnitPrice,
         Specification,
         ChickenType,
         Category,
         IsActive
       )
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        name,
        materialUnit,
        price,
        materialSpecification,
        selectedChickenType,
        selectedCategory
      ]
    );

    const materialId = Number(result.insertId);

    let quantitiesSaved = 0;

    if (!isLivestock) {
      const placeholders = COOP_SIZES
        .map(() => "(?, ?, ?)")
        .join(", ");

      const quantityValues = COOP_SIZES.flatMap(size => [
        materialId,
        size,
        Number(quantities[size])
      ]);

      await connectionQuery(
        connection,
        `INSERT INTO coop_material_quantities
         (
           MaterialID,
           CoopSize,
           Quantity
         )
         VALUES ${placeholders}`,
        quantityValues
      );

      quantitiesSaved = COOP_SIZES.length;
    }

    await commitTransaction(connection);
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: isLivestock
        ? "Livestock price added successfully."
        : "Material and quantities added successfully.",
      materialId,
      quantitiesSaved
    });

  } catch (error) {
    console.error("ADD MATERIAL ERROR:", error);

    if (connection && transactionStarted) {
      await rollbackTransaction(connection);
    }

    return res.status(500).json({
      success: false,
      message: "Unable to add material."
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.put("/:id", async (req, res) => {
  try {
    const materialId = Number(req.params.id);

    const {
      materialName,
      unit,
      unitPrice,
      specification,
      chickenType,
      category
    } = req.body || {};

    const name = String(materialName ?? "").trim();
    const materialUnit = String(unit ?? "").trim();
    const selectedChickenType = String(chickenType ?? "").trim();
    const selectedCategory = String(category ?? "").trim();

    if (
      !validId(materialId) ||
      !name ||
      !materialUnit ||
      name.length > 150 ||
      materialUnit.length > 50 ||
      !validPrice(unitPrice) ||
      !VALID_CHICKEN_TYPES.includes(selectedChickenType) ||
      !VALID_CATEGORIES.includes(selectedCategory)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid material details."
      });
    }

    if (
      selectedCategory === "Livestock" &&
      normalized(materialUnit) !== "chick"
    ) {
      return res.status(400).json({
        success: false,
        message: "Livestock unit must be chick."
      });
    }

    const result = await queryDatabase(
      `UPDATE coop_materials
       SET MaterialName = ?,
           Unit = ?,
           UnitPrice = ?,
           Specification = ?,
           ChickenType = ?,
           Category = ?
       WHERE MaterialID = ?`,
      [
        name,
        materialUnit,
        Number(unitPrice),
        String(specification ?? "").trim(),
        selectedChickenType,
        selectedCategory,
        materialId
      ]
    );

    if (!result.affectedRows) {
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

    if (!validId(materialId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID."
      });
    }

    const shared = await getMaterialRecords(materialId);

    if (!shared) {
      return res.status(404).json({
        success: false,
        message: "Material not found."
      });
    }

    const material = shared[0];

    if (material.Category === "Livestock") {
      await queryDatabase(
        `UPDATE coop_materials
         SET IsActive = 0
         WHERE MaterialID = ?`,
        [materialId]
      );
    } else {
      await queryDatabase(
        `UPDATE coop_materials
         SET IsActive = 0
         WHERE LOWER(TRIM(MaterialName)) = ?
           AND LOWER(TRIM(Unit)) = ?
           AND Category <> 'Livestock'`,
        [
          normalized(material.MaterialName),
          normalized(material.Unit)
        ]
      );
    }

    return res.json({
      success: true,
      message: "Material hidden successfully.",
      affectedMaterials: shared.length
    });

  } catch (error) {
    console.error("HIDE MATERIAL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to hide material."
    });
  }
});

router.patch("/:id/restore", async (req, res) => {
  try {
    const materialId = Number(req.params.id);

    if (!validId(materialId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID."
      });
    }

    const shared = await getMaterialRecords(materialId);

    if (!shared) {
      return res.status(404).json({
        success: false,
        message: "Material not found."
      });
    }

    const material = shared[0];

    if (material.Category === "Livestock") {
      await queryDatabase(
        `UPDATE coop_materials
         SET IsActive = 1
         WHERE MaterialID = ?`,
        [materialId]
      );
    } else {
      await queryDatabase(
        `UPDATE coop_materials
         SET IsActive = 1
         WHERE LOWER(TRIM(MaterialName)) = ?
           AND LOWER(TRIM(Unit)) = ?
           AND Category <> 'Livestock'`,
        [
          normalized(material.MaterialName),
          normalized(material.Unit)
        ]
      );
    }

    return res.json({
      success: true,
      message: "Material restored successfully.",
      affectedMaterials: shared.length
    });

  } catch (error) {
    console.error("RESTORE MATERIAL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to restore material."
    });
  }
});

router.patch("/:id/price", async (req, res) => {
  try {
    const materialId = Number(req.params.id);
    const { unitPrice } = req.body || {};

    if (!validId(materialId) || !validPrice(unitPrice)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid material price."
      });
    }

    const shared = await getMaterialRecords(materialId);

    if (!shared) {
      return res.status(404).json({
        success: false,
        message: "Material not found."
      });
    }

    if (!shared.some(item => Number(item.IsActive) === 1)) {
      return res.status(409).json({
        success: false,
        message: "Restore the material before editing its price."
      });
    }

    const material = shared[0];

    if (material.Category === "Livestock") {
      await queryDatabase(
        `UPDATE coop_materials
         SET UnitPrice = ?
         WHERE MaterialID = ?`,
        [
          Number(unitPrice),
          materialId
        ]
      );
    } else {
      await queryDatabase(
        `UPDATE coop_materials
         SET UnitPrice = ?
         WHERE LOWER(TRIM(MaterialName)) = ?
           AND LOWER(TRIM(Unit)) = ?
           AND Category <> 'Livestock'`,
        [
          Number(unitPrice),
          normalized(material.MaterialName),
          normalized(material.Unit)
        ]
      );
    }

    return res.json({
      success: true,
      message: "Material price updated successfully.",
      affectedMaterials: shared.length
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
