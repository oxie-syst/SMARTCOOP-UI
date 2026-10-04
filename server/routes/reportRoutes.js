const express = require("express");
const router = express.Router();
const db = require("../db");

function queryDatabase(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(results);
    });
  });
}

function getDateCondition(period, column) {
  if (period === "7days") {
    return `
      AND ${column} >= DATE_SUB(
        CURDATE(),
        INTERVAL 7 DAY
      )
    `;
  }

  if (period === "month") {
    return `
      AND YEAR(${column}) = YEAR(CURDATE())
      AND MONTH(${column}) = MONTH(CURDATE())
    `;
  }

  if (period === "quarter") {
    return `
      AND ${column} >= DATE_SUB(
        CURDATE(),
        INTERVAL 3 MONTH
      )
    `;
  }

  if (period === "year") {
    return `
      AND YEAR(${column}) = YEAR(CURDATE())
    `;
  }

  return "";
}

function getMonthKey(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString(
    "en-US",
    {
      month: "short",
      year: "numeric"
    }
  );
}

router.get(
  "/:userId",
  async (req, res) => {

    const userId =
      Number(req.params.userId);

    const period =
      req.query.period || "all";

    const coop =
      req.query.coop || "all";

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID."
      });
    }

    try {

      const userResult =
        await queryDatabase(
          `
            SELECT IsPremium
            FROM users
            WHERE UserID = ?
            LIMIT 1
          `,
          [userId]
        );

      if (userResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found."
        });
      }

      const isPremium =
        Boolean(
          Number(
            userResult[0].IsPremium
          )
        );

  const coops =
  await queryDatabase(
    `
      SELECT *
      FROM coops
      WHERE UserID = ?
      AND Status = 'active'
    `,
    [userId]
  );      

  const activeCoopIds =
  coops.map(record =>
    Number(record.CoopID)
  );

const expenseParams = [userId];
const eggParams = [userId];
const mortalityParams = [userId];
const chickenParams = [userId];
const meatParams = [userId];

let expenseCoop = "";
let eggCoop = "";
let mortalityCoop = "";
let chickenCoop = "";
let meatCoop = "";

if (coop !== "all") {
  const coopId = Number(coop);

  if (!coopId) {
    return res.status(400).json({
      success: false,
      message: "Invalid coop ID."
    });
  }

  if (!activeCoopIds.includes(coopId)) {
    return res.status(400).json({
      success: false,
      message: "Coop is not active."
    });
  }

  expenseCoop = " AND CoopID = ?";
  eggCoop = " AND CoopID = ?";
  mortalityCoop = " AND CoopID = ?";
  chickenCoop = " AND CoopID = ?";
  meatCoop = " AND CoopID = ?";

  expenseParams.push(coopId);
  eggParams.push(coopId);
  mortalityParams.push(coopId);
  chickenParams.push(coopId);
  meatParams.push(coopId);

} else if (activeCoopIds.length > 0) {

  const placeholders =
    activeCoopIds
      .map(() => "?")
      .join(", ");

  expenseCoop =
    ` AND CoopID IN (${placeholders})`;

  eggCoop =
    ` AND CoopID IN (${placeholders})`;

  mortalityCoop =
    ` AND CoopID IN (${placeholders})`;

  chickenCoop =
    ` AND CoopID IN (${placeholders})`;

  meatCoop =
    ` AND CoopID IN (${placeholders})`;

  expenseParams.push(...activeCoopIds);
  eggParams.push(...activeCoopIds);
  mortalityParams.push(...activeCoopIds);
  chickenParams.push(...activeCoopIds);
  meatParams.push(...activeCoopIds);

} else {

  expenseCoop = " AND 1 = 0";
  eggCoop = " AND 1 = 0";
  mortalityCoop = " AND 1 = 0";
  chickenCoop = " AND 1 = 0";
  meatCoop = " AND 1 = 0";
}

      const expenses =
        await queryDatabase(
          `
          SELECT
            ExpenseID AS id,
            CoopID AS coopId,
            RecordDate AS date,
            CoopName AS coop,
            Category AS category,
            Description AS description,
            Amount AS amount
            FROM expense_records
            WHERE UserID = ?
            ${getDateCondition(
              period,
              "RecordDate"
            )}
            ${expenseCoop}
            ORDER BY RecordDate ASC
          `,
          expenseParams
        );

      const eggs =
        await queryDatabase(
          `
          SELECT
            EggRecordID AS id,
            CoopID AS coopId,
            RecordDate AS date,
            CoopName AS coop,
            EggCount AS eggs,
            Notes AS notes
            FROM egg_records
            WHERE UserID = ?
            ${getDateCondition(
              period,
              "RecordDate"
            )}
            ${eggCoop}
            ORDER BY RecordDate ASC
          `,
          eggParams
        );

      const mortality =
        await queryDatabase(
          `     
          SELECT
            MortalityID AS id,
            CoopID AS coopId,
            RecordDate AS date,
            CoopName AS coop,
            DeathCount AS deaths,
            Cause AS cause,
            Notes AS notes
            FROM mortality_records
            WHERE UserID = ?
            ${getDateCondition(
              period,
              "RecordDate"
            )}
            ${mortalityCoop}
            ORDER BY RecordDate ASC
          `,
          mortalityParams
        );

      const chickens =
        await queryDatabase(
          `
          SELECT
            ChickenRecordID AS id,
            CoopID AS coopId,
            RecordDate AS date,
            CoopName AS coop,
            Quantity AS quantity,
            Stage AS stage,
            Days AS days
            FROM chicken_records
            WHERE UserID = ?
            ${getDateCondition(
              period,
              "RecordDate"
            )}
            ${chickenCoop}
            ORDER BY RecordDate ASC
          `,
          chickenParams
        );

      const meat =
        await queryDatabase(
          `
          SELECT
            MeatRecordID AS id,
            CoopID AS coopId,
            HarvestDate AS date,
            CoopOrBatch AS coop,
            BirdsCount AS birdsCount,
            TotalWeight AS weight
            FROM meat_records
            WHERE UserID = ?
            ${getDateCondition(
              period,
              "HarvestDate"
            )}
            ${meatCoop}
            ORDER BY HarvestDate ASC
          `,
          meatParams
        );

      const totalExpenses =
        expenses.reduce(
          (total, record) =>
            total +
            Number(record.amount || 0),
          0
        );

      const totalEggs =
        eggs.reduce(
          (total, record) =>
            total +
            Number(record.eggs || 0),
          0
        );

      const totalDeaths =
        mortality.reduce(
          (total, record) =>
            total +
            Number(record.deaths || 0),
          0
        );

      const totalChickens =
        chickens.reduce(
          (total, record) =>
            total +
            Number(record.quantity || 0),
          0
        );

      const totalMeat =
        meat.reduce(
          (total, record) =>
            total +
            Number(record.weight || 0),
          0
        );

      const mortalityRate =
        totalChickens > 0
          ? (
              totalDeaths /
              totalChickens
            ) * 100
          : 0;

      const expenseBreakdown = {};

      expenses.forEach(record => {
        const category =
          record.category || "Other";

        expenseBreakdown[category] =
          (
            expenseBreakdown[category] ||
            0
          ) +
          Number(record.amount || 0);
      });

      const monthlyEggs = {};

      eggs.forEach(record => {
        const month =
          getMonthKey(record.date);

        monthlyEggs[month] =
          (
            monthlyEggs[month] ||
            0
          ) +
          Number(record.eggs || 0);
      });

      const monthlyExpenses = {};

      expenses.forEach(record => {
        const month =
          getMonthKey(record.date);

        monthlyExpenses[month] =
          (
            monthlyExpenses[month] ||
            0
          ) +
          Number(record.amount || 0);
      });

      const monthlyMortality = {};

      mortality.forEach(record => {
        const month =
          getMonthKey(record.date);

        monthlyMortality[month] =
          (
            monthlyMortality[month] ||
            0
          ) +
          Number(record.deaths || 0);
      });

const coopMap = new Map();

coops.forEach(record => {
  if (record.CoopID) {
    coopMap.set(
      Number(record.CoopID),
      {
        coopId: Number(record.CoopID),
        coopName:
          record.CoopName ||
          `Coop ${record.CoopID}`
      }
    );
  }
});

const coopPerformance =
  Array.from(coopMap.values()).map(
    coopInfo => {

      const coopId =
        Number(coopInfo.coopId);

      const savedCoop =
        coops.find(
          record =>
            Number(record.CoopID) ===
            coopId
        ) || {};

      const coopChickens =
        chickens
          .filter(
            record =>
              Number(record.coopId) ===
              coopId
          )
          .reduce(
            (total, record) =>
              total +
              Number(record.quantity || 0),
            0
          );

      const coopEggs =
        eggs
          .filter(
            record =>
              Number(record.coopId) ===
              coopId
          )
          .reduce(
            (total, record) =>
              total +
              Number(record.eggs || 0),
            0
          );

      const coopExpenses =
        expenses
          .filter(
            record =>
              Number(record.coopId) ===
              coopId
          )
          .reduce(
            (total, record) =>
              total +
              Number(record.amount || 0),
            0
          );

      return {
        coopId,

        coopName:
          savedCoop.CoopName ||
          coopInfo.coopName ||
          `Coop ${coopId}`,

        chickens:
          coopChickens ||
          Number(
            savedCoop.NumberOfChickens ||
            0
          ),

        type:
          savedCoop.ChickenType ||
          "N/A",

        status:
          savedCoop.Status ||
          "Active",

        eggs:
          coopEggs,

        expenses:
          coopExpenses
      };
    }
  );

const coopOptions =
  Array.from(coopMap.values()).map(
    coopInfo => ({
      coopId: Number(coopInfo.coopId),
      coopName: coopInfo.coopName
    })
  );

      return res.json({
        success: true,

        isPremium,

        summary: {
          totalChickens,
          totalEggs,
          totalMeat,
          totalExpenses,
          totalDeaths,
          mortalityRate,

          chickenLogs:
            chickens.length,

          eggLogs:
            eggs.length,

          meatLogs:
            meat.length,

          expenseLogs:
            expenses.length,

          mortalityLogs:
            mortality.length
        },

        monthlyEggs:
          isPremium
            ? monthlyEggs
            : {},

        monthlyExpenses:
          isPremium
            ? monthlyExpenses
            : {},

        monthlyMortality:
          isPremium
            ? monthlyMortality
            : {},

        expenseBreakdown:
          isPremium
            ? expenseBreakdown
            : {},

        coops: coopOptions,

        coopPerformance:
          isPremium
            ? coopPerformance
            : []
      });

    } catch (error) {

      console.error(
        "REPORT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load report data."
      });
    }
  }
);

module.exports = router;