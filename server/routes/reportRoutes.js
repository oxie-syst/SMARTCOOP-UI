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

        expenseCoop =
          " AND CoopName = ?";

        eggCoop =
          " AND CoopName = ?";

        mortalityCoop =
          " AND CoopName = ?";

        chickenCoop =
          " AND CoopName = ?";

        meatCoop =
          " AND CoopOrBatch = ?";

        expenseParams.push(coop);
        eggParams.push(coop);
        mortalityParams.push(coop);
        chickenParams.push(coop);
        meatParams.push(coop);
      }

      const expenses =
        await queryDatabase(
          `
            SELECT
              ExpenseID AS id,
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

      const coops =
        await queryDatabase(
          `
            SELECT *
            FROM coops
            WHERE UserID = ?
          `,
          [userId]
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

      const coopNames =
        new Set();

      coops.forEach(record => {
        if (record.CoopName) {
          coopNames.add(
            record.CoopName
          );
        }
      });

      expenses.forEach(record => {
        if (record.coop) {
          coopNames.add(
            record.coop
          );
        }
      });

      eggs.forEach(record => {
        if (record.coop) {
          coopNames.add(
            record.coop
          );
        }
      });

      mortality.forEach(record => {
        if (record.coop) {
          coopNames.add(
            record.coop
          );
        }
      });

      chickens.forEach(record => {
        if (record.coop) {
          coopNames.add(
            record.coop
          );
        }
      });

      meat.forEach(record => {
        if (record.coop) {
          coopNames.add(
            record.coop
          );
        }
      });

      const coopPerformance =
        Array.from(
          coopNames
        ).map(coopName => {

          const savedCoop =
            coops.find(
              record =>
                record.CoopName ===
                coopName
            ) || {};

          const coopChickens =
            chickens
              .filter(
                record =>
                  record.coop ===
                  coopName
              )
              .reduce(
                (total, record) =>
                  total +
                  Number(
                    record.quantity ||
                    0
                  ),
                0
              );

          const coopEggs =
            eggs
              .filter(
                record =>
                  record.coop ===
                  coopName
              )
              .reduce(
                (total, record) =>
                  total +
                  Number(
                    record.eggs ||
                    0
                  ),
                0
              );

          const coopExpenses =
            expenses
              .filter(
                record =>
                  record.coop ===
                  coopName
              )
              .reduce(
                (total, record) =>
                  total +
                  Number(
                    record.amount ||
                    0
                  ),
                0
              );

          return {
            coopName,

            chickens:
              coopChickens ||
              Number(
                savedCoop
                  .NumberOfChickens ||
                0
              ),

            type:
              savedCoop
                .ChickenType ||
              "N/A",

            status:
              savedCoop
                .Status ||
              "Active",

            eggs:
              coopEggs,

            expenses:
              coopExpenses
          };
        });

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

        coops:
          Array.from(
            coopNames
          ),

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