const {
  checkFeatureLimit,
  logFeatureUsage
} = require("../utils/featurelimit");

const express = require("express");
const router = express.Router();
const db = require("../db");

router.post(
  "/generate",
  async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required."
        });
      }

      const featureCheck =
        await checkFeatureLimit(
          userId,
          "coop_planner"
        );

      if (!featureCheck.allowed) {
        return res.status(429).json({
          success: false,
          message:
            "You have used all 3 free Coop Planner generations for today.",
          usage: {
            feature: "coop_planner",
            limit: featureCheck.limit || 3,
            remaining: 0,
            isPremium: false
          }
        });
      }

      if (!featureCheck.isPremium) {
        await logFeatureUsage(
          userId,
          "coop_planner"
        );
      }

      return res.json({
        success: true,
        usage: {
          feature: "coop_planner",
          limit: featureCheck.limit,
          used: featureCheck.isPremium
            ? null
            : Number(featureCheck.used || 0) + 1,
          remaining: featureCheck.isPremium
            ? null
            : Math.max(
                Number(featureCheck.remaining || 0) - 1,
                0
              ),
          isPremium: featureCheck.isPremium
        }
      });

    } catch (error) {
      console.error(
        "COOP GENERATE LIMIT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to check Coop Planner usage."
      });
    }
  }
);

router.post("/save", (req, res) => {

  const {
    userId,
    coopName,
    coopSize,
    chickenType,
    numberOfChickens,
    totalCost
  } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required."
    });
  }


  // Check if user is Free or Premium
  db.query(
    `
      SELECT
        UserID,
        IsPremium
      FROM users
      WHERE UserID = ?
      LIMIT 1
    `,
    [userId],
    (userError, userResults) => {

      if (userError) {
        console.error(
          "USER CHECK ERROR:",
          userError
        );

        return res.status(500).json({
          success: false,
          message: "Unable to check subscription."
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


      if (isPremium) {
        return saveCoopPlan();
      }

       db.query(
        `
          SELECT COUNT(*) AS total
          FROM coops
          WHERE UserID = ?
        `,
        [userId],
        (countError, countResults) => {

          if (countError) {
            console.error(
              "COOP COUNT ERROR:",
              countError
            );

            return res.status(500).json({
              success: false,
              message:
                "Unable to check saved plans."
            });
          }


          const savedPlans =
            Number(
              countResults[0]?.total || 0
            );


          if (savedPlans >= 1) {
            return res.status(429).json({
              success: false,

              message:
                "Free accounts can save only 1 Coop Plan. Upgrade to Premium to save unlimited plans.",

              subscriptionRequired: true,

              limit: 1,

              savedPlans: savedPlans
            });
          }


          saveCoopPlan();
        }
      );


      function saveCoopPlan() {

        db.query(
          `
            INSERT INTO coops
            (
              UserID,
              CoopName,
              CoopSize,
              ChickenType,
              NumberOfChickens,
              TotalCost
            )
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            userId,
            coopName,
            coopSize,
            chickenType,
            numberOfChickens,
            totalCost
          ],
          (saveError) => {

            if (saveError) {
              console.error(
                "COOP SAVE ERROR:",
                saveError
              );

              return res.status(500).json({
                success: false,
                message: "Database Error"
              });
            }


            return res.json({
              success: true,
              message:
                "Plan saved successfully!"
            });
          }
        );
      }

    }
  );
});

router.get(
  "/user/:userId",
  (req, res) => {

    db.query(
      `
        SELECT *
        FROM coops
        WHERE UserID = ?
        ORDER BY CoopID DESC
      `,
      [
        req.params.userId
      ],
      (err, results) => {

        if (err) {

          console.log(err);

          return res.json({
            success: false,
            coops: []
          });

        }


        res.json({
          success: true,
          coops: results
        });

      }
    );

  }
);


router.get(
  "/latest/:userId",
  (req, res) => {

    db.query(
      `
        SELECT *
        FROM coops
        WHERE UserID = ?
        ORDER BY CoopID DESC
        LIMIT 1
      `,
      [
        req.params.userId
      ],
      (err, results) => {

        if (err) {

          return res.json({
            success: false
          });

        }


        res.json({
          success: true,
          coop:
            results[0] || null
        });

      }
    );

  }
);


router.put(
  "/set-active/:coopId",
  (req, res) => {

    console.log(
      "===== SET ACTIVE ====="
    );

    console.log(
      "Params:",
      req.params
    );

    console.log(
      "Body:",
      req.body
    );


    const {
      coopId
    } = req.params;

    const {
      userId
    } = req.body;


    db.query(
      `
        UPDATE coops
        SET Status = 'inactive'
        WHERE UserID = ?
      `,
      [
        userId
      ],
      (err) => {

        console.log(
          "First update error:",
          err
        );


        if (err) {

          return res.json({
            success: false,
            message:
              err.message
          });

        }


        db.query(
          `
            UPDATE coops
            SET Status = 'active'
            WHERE CoopID = ?
          `,
          [
            coopId
          ],
          (err2) => {

            console.log(
              "Second update error:",
              err2
            );


            if (err2) {

              return res.json({
                success: false,
                message:
                  err2.message
              });

            }


            res.json({
              success: true,
              message:
                "Active coop updated!"
            });

          }
        );

      }
    );

  }
);


router.get(
  "/active/:userId",
  (req, res) => {

    db.query(
      `
        SELECT *
        FROM coops
        WHERE UserID = ?
        AND Status = 'active'
        LIMIT 1
      `,
      [
        req.params.userId
      ],
      (err, results) => {

        if (err) {

          console.log(err);

          return res.json({
            success: false,
            coop: null
          });

        }


        res.json({
          success: true,
          coop:
            results[0] || null
        });

      }
    );

  }
);


router.put(
  "/set-inactive/:coopId",
  (req, res) => {

    const {
      coopId
    } = req.params;


    db.query(
      `
        UPDATE coops
        SET Status = 'inactive'
        WHERE CoopID = ?
      `,
      [
        coopId
      ],
      (err) => {

        if (err) {

          return res.json({
            success: false,
            message:
              "Database Error"
          });

        }


        res.json({
          success: true,
          message:
            "Coop is now inactive."
        });

      }
    );

  }
);


router.delete(
  "/:coopId",
  (req, res) => {

    const {
      coopId
    } = req.params;

    const {
      userId
    } = req.body;


    console.log(
      "===== DELETE COOP ====="
    );

    console.log(
      "CoopID:",
      coopId
    );

    console.log(
      "UserID:",
      userId
    );


    db.query(
      `
        DELETE FROM coops
        WHERE CoopID = ?
        AND UserID = ?
      `,
      [
        coopId,
        userId
      ],
      (err, result) => {

        if (err) {

          console.log(
            "DELETE ERROR:",
            err
          );


          return res.json({
            success: false,
            message:
              err.message
          });

        }


        console.log(
          "Affected rows:",
          result.affectedRows
        );


        if (
          result.affectedRows === 0
        ) {

          return res.json({
            success: false,
            message:
              "No coop was deleted."
          });

        }


        res.json({
          success: true,
          message:
            "Coop deleted successfully!"
        });

      }
    );

  }
);


module.exports = router;

