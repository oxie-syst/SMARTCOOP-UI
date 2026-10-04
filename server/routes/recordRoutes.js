const express = require("express");
const router = express.Router();
const db = require("../db");

const FREE_RECORD_LIMIT = 10;

const recordConfig = {
  expenses: {
    table: "expense_records",
    idColumn: "ExpenseID"
  },
  eggs: {
    table: "egg_records",
    idColumn: "EggRecordID"
  },
  mortality: {
    table: "mortality_records",
    idColumn: "MortalityID"
  },
  chicken: {
    table: "chicken_records",
    idColumn: "ChickenRecordID"
  },
  meat: {
    table: "meat_records",
    idColumn: "MeatRecordID"
  }
};

router.get("/user/:userId/coop/:coopId", (req, res) => {
  const userId = req.params.userId;
  const coopId = req.params.coopId;

  const queries = {
    expenses: `
      SELECT
        ExpenseID AS id,
        RecordDate AS date,
        RecordTime AS time,
        CoopName AS coop,
        Category AS category,
        Description AS description,
        Amount AS amount,
        CreatedAt AS createdAt
      FROM expense_records
      WHERE UserID = ? AND CoopID = ?
      ORDER BY RecordDate DESC, RecordTime DESC, ExpenseID DESC
    `,

    eggs: `
      SELECT
        EggRecordID AS id,
        RecordDate AS date,
        RecordTime AS time,
        CoopName AS coop,
        EggCount AS eggs,
        Notes AS notes,
        CreatedAt AS createdAt
      FROM egg_records
      WHERE UserID = ? AND CoopID = ?
      ORDER BY RecordDate DESC, RecordTime DESC, EggRecordID DESC
    `,

    mortality: `
      SELECT
        MortalityID AS id,
        RecordDate AS date,
        RecordTime AS time,
        CoopName AS coop,
        DeathCount AS deaths,
        Cause AS cause,
        Notes AS notes,
        CreatedAt AS createdAt
      FROM mortality_records
      WHERE UserID = ? AND CoopID = ?
      ORDER BY RecordDate DESC, RecordTime DESC, MortalityID DESC
    `,

    chicken: `
      SELECT
        ChickenRecordID AS id,
        RecordDate AS date,
        RecordTime AS time,
        CoopName AS coop,
        Quantity AS quantity,
        Stage AS stage,
        Days AS days,
        CreatedAt AS createdAt
      FROM chicken_records
      WHERE UserID = ? AND CoopID = ?
      ORDER BY RecordDate DESC, RecordTime DESC, ChickenRecordID DESC
    `,

    meat: `
      SELECT
        MeatRecordID AS id,
        HarvestDate AS date,
        RecordTime AS time,
        CoopOrBatch AS coopOrBatch,
        BirdsCount AS birdsCount,
        TotalWeight AS weight,
        CreatedAt AS createdAt
      FROM meat_records
      WHERE UserID = ? AND CoopID = ?
      ORDER BY HarvestDate DESC, RecordTime DESC, MeatRecordID DESC
    `
  };

  const result = {
    expenses: [],
    eggs: [],
    mortality: [],
    chicken: [],
    meat: []
  };

  db.query(
    "SELECT IsPremium FROM users WHERE UserID = ? LIMIT 1",
    [userId],
    (userError, userResults) => {

      if (userError) {
        console.error(
          "Load User Premium Status Error:",
          userError
        );

        return res.status(500).json({
          success: false,
          message: "Failed to load user."
        });
      }

      if (userResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found."
        });
      }

      const isPremium =
        Boolean(
          Number(
            userResults[0].IsPremium
          )
        );

      db.query(
        queries.expenses,
        [userId, coopId],
        (err, expenses) => {

          if (err) {
            console.error(
              "Load Expense Records Error:",
              err
            );

            return res.status(500).json({
              success: false,
              message:
                "Failed to load expense records."
            });
          }

          result.expenses = expenses;

          db.query(
            queries.eggs,
            [userId, coopId],
            (err, eggs) => {

              if (err) {
                console.error(
                  "Load Egg Records Error:",
                  err
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Failed to load egg records."
                });
              }

              result.eggs = eggs;

              db.query(
                queries.mortality,
                [userId, coopId],
                (err, mortality) => {

                  if (err) {
                    console.error(
                      "Load Mortality Records Error:",
                      err
                    );

                    return res.status(500).json({
                      success: false,
                      message:
                        "Failed to load mortality records."
                    });
                  }

                  result.mortality =
                    mortality;

                  db.query(
                    queries.chicken,
                    [userId, coopId],
                    (err, chicken) => {

                      if (err) {
                        console.error(
                          "Load Chicken Records Error:",
                          err
                        );

                        return res.status(500).json({
                          success: false,
                          message:
                            "Failed to load chicken records."
                        });
                      }

                      result.chicken =
                        chicken;

                      db.query(
                        queries.meat,
                        [userId, coopId],
                        (err, meat) => {

                          if (err) {
                            console.error(
                              "Load Meat Records Error:",
                              err
                            );

                            return res.status(500).json({
                              success: false,
                              message:
                                "Failed to load meat records."
                            });
                          }

                          result.meat =
                            meat;

                          res.json({
                            success: true,
                            isPremium,
                            limit:
                              isPremium
                                ? null
                                : FREE_RECORD_LIMIT,
                            usage: {
                              expenses:
                                expenses.length,
                              eggs:
                                eggs.length,
                              mortality:
                                mortality.length,
                              chicken:
                                chicken.length,
                              meat:
                                meat.length
                            },
                            records: result
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

router.post("/:type", (req, res) => {
  const type = req.params.type;

const {
  userId,
  coopId,
  date,
  time,
  coop,
  category,
  description,
  amount,
  eggs,
  notes,
  deaths,
  cause,
  quantity,
  stage,
  days,
  coopOrBatch,
  birdsCount,
  weight
} = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required."
    });
  }
  if (!coopId) {
  return res.status(400).json({
    success: false,
    message: "Coop ID is required."
  });
}

  const selected =
    recordConfig[type];

  if (!selected) {
    return res.status(400).json({
      success: false,
      message: "Invalid record type."
    });
  }

  db.query(
    `
      SELECT IsPremium
      FROM users
      WHERE UserID = ?
      LIMIT 1
    `,
    [userId],
    (userError, userResults) => {

      if (userError) {
        console.error(
          "Record Premium Check Error:",
          userError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to check subscription."
        });
      }

      if (userResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found."
        });
      }

      const isPremium =
        Boolean(
          Number(
            userResults[0].IsPremium
          )
        );

      const continueAddRecord = () => {

        let sql = "";
        let values = [];

        if (type === "expenses") {

          if (
            !date ||
            !coop ||
            !category ||
            amount === undefined
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Missing required expense fields."
            });
          }

          sql = `
            INSERT INTO expense_records (
              UserID,
              CoopID,
              RecordDate,
              RecordTime,
              CoopName,
              Category,
              Description,
              Amount
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          values = [
            userId,
            coopId,
            date,
            time || null,
            coop,
            category,
            description || null,
            Number(amount) || 0
          ];
        }

        else if (type === "eggs") {

          if (!date || !coop) {
            return res.status(400).json({
              success: false,
              message:
                "Missing required egg record fields."
            });
          }

          sql = `
            INSERT INTO egg_records (
              UserID,
              CoopID,
              RecordDate,
              RecordTime,
              CoopName,
              EggCount,
              Notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          values = [
            userId,
            coopId,
            date,
            time || null,
            coop,
            Number(eggs) || 0,
            notes || null
          ];
        }

        else if (type === "mortality") {

          if (!date || !coop) {
            return res.status(400).json({
              success: false,
              message:
                "Missing required mortality fields."
            });
          }

          sql = `
            INSERT INTO mortality_records (
              UserID,
              CoopID,
              RecordDate,
              RecordTime,
              CoopName,
              DeathCount,
              Cause,
              Notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          values = [
            userId,
            coopId,
            date,
            time || null,
            coop,
            Number(deaths) || 0,
            cause || null,
            notes || null
          ];
        }

        else if (type === "chicken") {

          if (
            !date ||
            !coop ||
            !stage
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Missing required chicken record fields."
            });
          }

          sql = `
            INSERT INTO chicken_records (
              UserID,
              CoopID,
              RecordDate,
              RecordTime,
              CoopName,
              Quantity,
              Stage,
              Days
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          values = [
            userId,
            coopId,
            date,
            time || null,
            coop,
            Number(quantity) || 0,
            stage,
            Number(days) || 0
          ];
        }

        else if (type === "meat") {

          if (
            !date ||
            !coopOrBatch
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Missing required meat record fields."
            });
          }

          sql = `
            INSERT INTO meat_records (
              UserID,
              CoopID,
              HarvestDate,
              RecordTime,
              CoopOrBatch,
              BirdsCount,
              TotalWeight
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          values = [
            userId,
            coopId,
            date,
            time || null,
            coopOrBatch,
            Number(birdsCount) || 0,
            Number(weight) || 0
          ];
        }

        db.query(
          sql,
          values,
          (err, result) => {

            if (err) {
              console.error(
                "Add Record Error:",
                err
              );

              return res.status(500).json({
                success: false,
                message:
                  "Failed to add record."
              });
            }

            res.json({
              success: true,
              message:
                "Record added successfully.",
              id: result.insertId,
              isPremium,
              limit:
                isPremium
                  ? null
                  : FREE_RECORD_LIMIT
            });
          }
        );
      };

      if (isPremium) {
        continueAddRecord();
        return;
      }

      db.query(
        `
          SELECT COUNT(*) AS total
          FROM ${selected.table}
          WHERE UserID = ?
        `,
        [userId],
        (countError, countResults) => {

          if (countError) {
            console.error(
              "Record Limit Check Error:",
              countError
            );

            return res.status(500).json({
              success: false,
              message:
                "Unable to check record limit."
            });
          }

          const used =
            Number(
              countResults[0]?.total ||
              0
            );

          if (
            used >=
            FREE_RECORD_LIMIT
          ) {
            return res.status(429).json({
              success: false,
              limitReached: true,
              isPremium: false,
              type,
              used,
              limit:
                FREE_RECORD_LIMIT,
              remaining: 0,
              message:
                "You have reached the 10-record free limit for this category. Upgrade to Premium for unlimited Record Management."
            });
          }

          continueAddRecord();
        }
      );
    }
  );
});

router.put("/:type/:id", (req, res) => {
  const type = req.params.type;
  const id = req.params.id;

  const {
    userId,
    coopId,
    date,
    time,
    coop,
    category,
    description,
    amount,
    eggs,
    notes,
    deaths,
    cause,
    quantity,
    stage,
    days,
    coopOrBatch,
    birdsCount,
    weight
  } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required."
    });
  }
  if (!coopId) {
  return res.status(400).json({
    success: false,
    message: "Coop ID is required."
  });
}

  let sql = "";
  let values = [];

  if (type === "expenses") {

    sql = `
      UPDATE expense_records
      SET
        RecordDate = ?,
        RecordTime = ?,
        CoopName = ?,
        Category = ?,
        Description = ?,
        Amount = ?
        WHERE ExpenseID = ?
        AND UserID = ?
        AND CoopID = ?
    `;

    values = [
      date,
      time || null,
      coop,
      category,
      description || null,
      Number(amount) || 0,
      id,
      userId,
      coopId
    ];
  }

  else if (type === "eggs") {

    sql = `
      UPDATE egg_records
      SET
        RecordDate = ?,
        RecordTime = ?,
        CoopName = ?,
        EggCount = ?,
        Notes = ?
      WHERE EggRecordID = ?
      AND UserID = ?
      AND CoopID = ?
    `;

    values = [
      date,
      time || null,
      coop,
      Number(eggs) || 0,
      notes || null,
      id,
      userId,
      coopId
    ];
  }

  else if (type === "mortality") {

    sql = `
      UPDATE mortality_records
      SET
        RecordDate = ?,
        RecordTime = ?,
        CoopName = ?,
        DeathCount = ?,
        Cause = ?,
        Notes = ?
      WHERE MortalityID = ?
      AND UserID = ?
      AND CoopID = ?
    `;

    values = [
      date,
      time || null,
      coop,
      Number(deaths) || 0,
      cause || null,
      notes || null,
      id,
      userId,
      coopId
    ];
  }

  else if (type === "chicken") {

    sql = `
      UPDATE chicken_records
      SET
        RecordDate = ?,
        RecordTime = ?,
        CoopName = ?,
        Quantity = ?,
        Stage = ?,
        Days = ?
      WHERE ChickenRecordID = ?
      AND UserID = ?
      AND CoopID = ?
    `;

    values = [
      date,
      time || null,
      coop,
      Number(quantity) || 0,
      stage,
      Number(days) || 0,
      id,
      userId,
      coopId
    ];
  }

  else if (type === "meat") {

    sql = `
      UPDATE meat_records
      SET
        HarvestDate = ?,
        RecordTime = ?,
        CoopOrBatch = ?,
        BirdsCount = ?,
        TotalWeight = ?
      WHERE MeatRecordID = ?
      AND UserID = ?
      AND CoopID = ?
    `;

    values = [
      date,
      time || null,
      coopOrBatch,
      Number(birdsCount) || 0,
      Number(weight) || 0,
      id,
      userId,
      coopId
    ];
  }

  else {
    return res.status(400).json({
      success: false,
      message: "Invalid record type."
    });
  }

  db.query(
    sql,
    values,
    (err, result) => {

      if (err) {
        console.error(
          "Update Record Error:",
          err
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to update record."
        });
      }

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          success: false,
          message: "Record not found."
        });
      }

      res.json({
        success: true,
        message:
          "Record updated successfully."
      });
    }
  );
});

router.delete("/:type/:id", (req, res) => {
  const type = req.params.type;
  const id = req.params.id;
  const userId = req.query.userId;
  const coopId = req.query.coopId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required."
    });
  }

  if (!coopId) {
  return res.status(400).json({
    success: false,
    message: "Coop ID is required."
  });
}

  const selected =
    recordConfig[type];

  if (!selected) {
    return res.status(400).json({
      success: false,
      message: "Invalid record type."
    });
  }

  const sql = `
    DELETE FROM ${selected.table}
    WHERE ${selected.idColumn} = ?
    AND UserID = ?
    AND CoopID = ?
  `;

  db.query(
    sql,
    [id, userId, coopId],
    (err, result) => {

      if (err) {
        console.error(
          "Delete Record Error:",
          err
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to delete record."
        });
      }

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          success: false,
          message: "Record not found."
        });
      }

      res.json({
        success: true,
        message:
          "Record deleted successfully."
      });
    }
  );
});

module.exports = router;