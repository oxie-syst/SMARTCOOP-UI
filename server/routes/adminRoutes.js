const express = require("express");
const router = express.Router();
const db = require("../db");


function queryDatabase(
  sql,
  params = []
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {

      db.query(
        sql,
        params,
        (
          err,
          result
        ) => {

          if (err) {
            reject(err);
            return;
          }

          resolve(result);
        }
      );
    }
  );
}


async function verifyAdmin(
  req,
  res,
  next
) {
  try {

    const adminUserId =
      Number(
        req.headers[
          "x-admin-user-id"
        ]
      );


    if (!adminUserId) {

      return res
        .status(401)
        .json({
          success: false,
          message:
            "Administrator authentication is required."
        });
    }


    const result =
      await queryDatabase(
        `
          SELECT
            UserID,
            Role

          FROM users

          WHERE UserID = ?

          LIMIT 1
        `,
        [
          adminUserId
        ]
      );


    if (
      result.length === 0
    ) {

      return res
        .status(401)
        .json({
          success: false,
          message:
            "Administrator account not found."
        });
    }


    const role =
      String(
        result[0].Role ||
        ""
      ).toLowerCase();


    if (
      role !== "admin"
    ) {

      return res
        .status(403)
        .json({
          success: false,
          message:
            "Administrator access is required."
        });
    }


    req.adminUser =
      result[0];


    next();


  } catch (error) {

    console.error(
      "ADMIN AUTH ERROR:",
      error
    );


    return res
      .status(500)
      .json({
        success: false,
        message:
          "Unable to verify administrator."
      });
  }
}



router.get(
  "/dashboard",
  verifyAdmin,
  async (
    req,
    res
  ) => {

    try {

      const totalUsersResult =
        await queryDatabase(
          `
            SELECT
              COUNT(*) AS total

            FROM users

            WHERE
              LOWER(Role) != 'admin'
          `
        );


        const activeUsersResult =
        await queryDatabase(
            `
            SELECT COUNT(*) AS total
            FROM users
            WHERE LOWER(Role) != 'admin'
            AND AccountStatus = 'Active'
            `
        );


      const totalProjectsResult =
        await queryDatabase(
          `
            SELECT
              COUNT(*) AS total

            FROM coops
          `
        );


      const recentUsers =
        await queryDatabase(
          `
            SELECT
            UserID,
            FullName,
            Email,
            Role,
            AccountStatus,
            OnboardingCompleted,
            IsPremium,
            AuthProvider,
            CreatedAt

            FROM users

            WHERE
              LOWER(Role) != 'admin'

            ORDER BY
              CreatedAt DESC

            LIMIT 5
          `
        );


        const userGrowthResult =
        await queryDatabase(
            `
            SELECT
                DATE_FORMAT(
                CreatedAt,
                '%Y-%m'
                ) AS monthKey,

                DATE_FORMAT(
                CreatedAt,
                '%b'
                ) AS monthLabel,

                COUNT(*) AS total

            FROM users

            WHERE
                LOWER(Role) != 'admin'
                AND CreatedAt IS NOT NULL

            GROUP BY
                DATE_FORMAT(
                CreatedAt,
                '%Y-%m'
                ),
                DATE_FORMAT(
                CreatedAt,
                '%b'
                )

            ORDER BY
                monthKey DESC

            LIMIT 6
            `
        );

      const projectGrowthResult =
        await queryDatabase(
          `
            SELECT
              DATE_FORMAT(
                CreatedAt,
                '%Y-%m'
              ) AS monthKey,

              DATE_FORMAT(
                CreatedAt,
                '%b'
              ) AS monthLabel,

              COUNT(*) AS total

            FROM coops

            WHERE
              CreatedAt IS NOT NULL

            GROUP BY
              DATE_FORMAT(
                CreatedAt,
                '%Y-%m'
              ),

              DATE_FORMAT(
                CreatedAt,
                '%b'
              )

            ORDER BY
              monthKey DESC

            LIMIT 6
          `
        );


      const plannerUsersResult =
        await queryDatabase(
          `
            SELECT
              COUNT(
                DISTINCT UserID
              ) AS total

            FROM coops

            WHERE
              UserID IS NOT NULL
          `
        );


      const recordUsersResult =
        await queryDatabase(
          `
            SELECT
              COUNT(
                DISTINCT UserID
              ) AS total

            FROM (
              SELECT
                UserID
              FROM expense_records

              UNION

              SELECT
                UserID
              FROM egg_records

              UNION

              SELECT
                UserID
              FROM mortality_records

              UNION

              SELECT
                UserID
              FROM chicken_records

              UNION

              SELECT
                UserID
              FROM meat_records

            ) AS record_users

            WHERE
              UserID IS NOT NULL
          `
        );


      const aiUsersResult =
        await queryDatabase(
          `
            SELECT
              COUNT(
                DISTINCT UserID
              ) AS total

            FROM ai_usage_logs

            WHERE
              UserID IS NOT NULL
          `
        );


      const totalUsers =
        Number(
          totalUsersResult[0]
            ?.total || 0
        );


      const activeUsers =
        Number(
          activeUsersResult[0]
            ?.total || 0
        );


      const totalProjects =
        Number(
          totalProjectsResult[0]
            ?.total || 0
        );


      const plannerUsers =
        Number(
          plannerUsersResult[0]
            ?.total || 0
        );


      const recordUsers =
        Number(
          recordUsersResult[0]
            ?.total || 0
        );


      const aiUsers =
        Number(
          aiUsersResult[0]
            ?.total || 0
        );


      const plannerUsage =
        totalUsers > 0
          ? Math.round(
              (
                plannerUsers /
                totalUsers
              ) * 100
            )
          : 0;


      const recordUsage =
        totalUsers > 0
          ? Math.round(
              (
                recordUsers /
                totalUsers
              ) * 100
            )
          : 0;


      const aiUsage =
        totalUsers > 0
          ? Math.round(
              (
                aiUsers /
                totalUsers
              ) * 100
            )
          : 0;


      return res.json({
        success: true,


        stats: {
          totalUsers,
          activeUsers,
          totalProjects
        },


        usage: {

          planner:
            Math.min(
              plannerUsage,
              100
            ),

          records:
            Math.min(
              recordUsage,
              100
            ),

          ai:
            Math.min(
              aiUsage,
              100
            )
        },


        userGrowth:
        userGrowthResult
            .slice()
            .reverse()
            .map(
            item => ({
                month:
                item.monthLabel,

                monthKey:
                item.monthKey,

                total:
                Number(
                    item.total || 0
                )
            })
            ),


        projectGrowth:
          projectGrowthResult
            .slice()
            .reverse()
            .map(
              item => ({
                month:
                  item.monthLabel,

                monthKey:
                  item.monthKey,

                total:
                  Number(
                    item.total || 0
                  )
              })
            ),


        recentUsers:
          recentUsers.map(
            user => ({

              id:
                user.UserID,

              name:
                user.FullName,

              email:
                user.Email,

              role:
                user.Role ||
                "farmer",

            status:
            user.AccountStatus ||
            "Active",

            isPremium:
              Boolean(
                Number(user.IsPremium)
              ),

              authProvider:
                user.AuthProvider ||
                "local",

              createdAt:
                user.CreatedAt
            })
          )
      });


    } catch (error) {

      console.error(
        "ADMIN DASHBOARD ERROR:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load admin dashboard."
        });
    }
  }
);


router.get(
  "/reports",
  verifyAdmin,
  async (req, res) => {
    try {
      const from =
        req.query.from || null;

      const to =
        req.query.to || null;


      function makeDateCondition(
        column
      ) {
        const conditions = [];
        const params = [];

        if (from) {
          conditions.push(
            `DATE(${column}) >= ?`
          );

          params.push(from);
        }

        if (to) {
          conditions.push(
            `DATE(${column}) <= ?`
          );

          params.push(to);
        }

        return {
          sql:
            conditions.length > 0
              ? `WHERE ${conditions.join(
                  " AND "
                )}`
              : "",

          params
        };
      }


      const userDate =
        makeDateCondition(
          "CreatedAt"
        );

      const coopDate =
        makeDateCondition(
          "CreatedAt"
        );

      const aiDate =
        makeDateCondition(
          "CreatedAt"
        );


      const expenseDate =
        makeDateCondition(
          "RecordDate"
        );

      const eggDate =
        makeDateCondition(
          "RecordDate"
        );

      const mortalityDate =
        makeDateCondition(
          "RecordDate"
        );

      const chickenDate =
        makeDateCondition(
          "RecordDate"
        );

      const meatDate =
        makeDateCondition(
          "HarvestDate"
        );


      const userRoleCondition =
        userDate.sql
          ? `${userDate.sql}
             AND LOWER(Role) != 'admin'`
          : `WHERE LOWER(Role) != 'admin'`;


      const totalUsersResult =
        await queryDatabase(
          `
            SELECT
              COUNT(*) AS total

            FROM users

            ${userRoleCondition}
          `,
          userDate.params
        );


      const totalProjectsResult =
        await queryDatabase(
          `
            SELECT
              COUNT(*) AS total

            FROM coops

            ${coopDate.sql}
          `,
          coopDate.params
        );


      const aiRequestsResult =
        await queryDatabase(
          `
            SELECT
              COUNT(*) AS total

            FROM ai_usage_logs

            ${aiDate.sql}
          `,
          aiDate.params
        );


      const expenseCountResult =
        await queryDatabase(
          `
            SELECT
              COUNT(*) AS total

            FROM expense_records

            ${expenseDate.sql}
          `,
          expenseDate.params
        );


      const eggCountResult =
        await queryDatabase(
          `
            SELECT
              COUNT(*) AS total

            FROM egg_records

            ${eggDate.sql}
          `,
          eggDate.params
        );


      const mortalityCountResult =
        await queryDatabase(
          `
            SELECT
              COUNT(*) AS total

            FROM mortality_records

            ${mortalityDate.sql}
          `,
          mortalityDate.params
        );


      const chickenCountResult =
        await queryDatabase(
          `
            SELECT
              COUNT(*) AS total

            FROM chicken_records

            ${chickenDate.sql}
          `,
          chickenDate.params
        );


      const meatCountResult =
        await queryDatabase(
          `
            SELECT
              COUNT(*) AS total

            FROM meat_records

            ${meatDate.sql}
          `,
          meatDate.params
        );


      const expenseTotal =
        Number(
          expenseCountResult[0]
            ?.total || 0
        );

      const eggTotal =
        Number(
          eggCountResult[0]
            ?.total || 0
        );

      const mortalityTotal =
        Number(
          mortalityCountResult[0]
            ?.total || 0
        );

      const chickenTotal =
        Number(
          chickenCountResult[0]
            ?.total || 0
        );

      const meatTotal =
        Number(
          meatCountResult[0]
            ?.total || 0
        );


      const totalRecords =
        expenseTotal +
        eggTotal +
        mortalityTotal +
        chickenTotal +
        meatTotal;


      const recordBreakdown = [
        {
          label:
            "Expenses",

          total:
            expenseTotal
        },

        {
          label:
            "Eggs",

          total:
            eggTotal
        },

        {
          label:
            "Mortality",

          total:
            mortalityTotal
        },

        {
          label:
            "Chickens",

          total:
            chickenTotal
        },

        {
          label:
            "Meat",

          total:
            meatTotal
        }
      ];


      const userGrowthResult =
        await queryDatabase(
          `
            SELECT
              DATE_FORMAT(
                CreatedAt,
                '%Y-%m'
              ) AS monthKey,

              DATE_FORMAT(
                CreatedAt,
                '%b'
              ) AS monthLabel,

              COUNT(*) AS total

            FROM users

            ${userRoleCondition}

            GROUP BY
              DATE_FORMAT(
                CreatedAt,
                '%Y-%m'
              ),

              DATE_FORMAT(
                CreatedAt,
                '%b'
              )

            ORDER BY
              monthKey ASC
          `,
          userDate.params
        );


      const projectGrowthResult =
        await queryDatabase(
          `
            SELECT
              DATE_FORMAT(
                CreatedAt,
                '%Y-%m'
              ) AS monthKey,

              DATE_FORMAT(
                CreatedAt,
                '%b'
              ) AS monthLabel,

              COUNT(*) AS total

            FROM coops

            ${coopDate.sql}

            GROUP BY
              DATE_FORMAT(
                CreatedAt,
                '%Y-%m'
              ),

              DATE_FORMAT(
                CreatedAt,
                '%b'
              )

            ORDER BY
              monthKey ASC
          `,
          coopDate.params
        );


      const aiGrowthResult =
        await queryDatabase(
          `
            SELECT
              DATE_FORMAT(
                CreatedAt,
                '%Y-%m'
              ) AS monthKey,

              DATE_FORMAT(
                CreatedAt,
                '%b'
              ) AS monthLabel,

              COUNT(*) AS total

            FROM ai_usage_logs

            ${aiDate.sql}

            GROUP BY
              DATE_FORMAT(
                CreatedAt,
                '%Y-%m'
              ),

              DATE_FORMAT(
                CreatedAt,
                '%b'
              )

            ORDER BY
              monthKey ASC
          `,
          aiDate.params
        );


      const plannerUsersResult =
        await queryDatabase(
          `
            SELECT
              COUNT(
                DISTINCT UserID
              ) AS total

            FROM coops

            ${
              coopDate.sql
                ? `${coopDate.sql}
                   AND UserID IS NOT NULL`
                : `WHERE UserID IS NOT NULL`
            }
          `,
          coopDate.params
        );


      const expenseUsersResult =
        await queryDatabase(
          `
            SELECT
              DISTINCT UserID

            FROM expense_records

            ${
              expenseDate.sql
                ? `${expenseDate.sql}
                   AND UserID IS NOT NULL`
                : `WHERE UserID IS NOT NULL`
            }
          `,
          expenseDate.params
        );


      const eggUsersResult =
        await queryDatabase(
          `
            SELECT
              DISTINCT UserID

            FROM egg_records

            ${
              eggDate.sql
                ? `${eggDate.sql}
                   AND UserID IS NOT NULL`
                : `WHERE UserID IS NOT NULL`
            }
          `,
          eggDate.params
        );


      const mortalityUsersResult =
        await queryDatabase(
          `
            SELECT
              DISTINCT UserID

            FROM mortality_records

            ${
              mortalityDate.sql
                ? `${mortalityDate.sql}
                   AND UserID IS NOT NULL`
                : `WHERE UserID IS NOT NULL`
            }
          `,
          mortalityDate.params
        );


      const chickenUsersResult =
        await queryDatabase(
          `
            SELECT
              DISTINCT UserID

            FROM chicken_records

            ${
              chickenDate.sql
                ? `${chickenDate.sql}
                   AND UserID IS NOT NULL`
                : `WHERE UserID IS NOT NULL`
            }
          `,
          chickenDate.params
        );


      const meatUsersResult =
        await queryDatabase(
          `
            SELECT
              DISTINCT UserID

            FROM meat_records

            ${
              meatDate.sql
                ? `${meatDate.sql}
                   AND UserID IS NOT NULL`
                : `WHERE UserID IS NOT NULL`
            }
          `,
          meatDate.params
        );


      const recordUserIds =
        new Set([
          ...expenseUsersResult.map(
            item =>
              Number(item.UserID)
          ),

          ...eggUsersResult.map(
            item =>
              Number(item.UserID)
          ),

          ...mortalityUsersResult.map(
            item =>
              Number(item.UserID)
          ),

          ...chickenUsersResult.map(
            item =>
              Number(item.UserID)
          ),

          ...meatUsersResult.map(
            item =>
              Number(item.UserID)
          )
        ]);


      const aiUsersResult =
        await queryDatabase(
          `
            SELECT
              COUNT(
                DISTINCT UserID
              ) AS total

            FROM ai_usage_logs

            ${
              aiDate.sql
                ? `${aiDate.sql}
                   AND UserID IS NOT NULL`
                : `WHERE UserID IS NOT NULL`
            }
          `,
          aiDate.params
        );


      const totalUsers =
        Number(
          totalUsersResult[0]
            ?.total || 0
        );


      const totalProjects =
        Number(
          totalProjectsResult[0]
            ?.total || 0
        );


      const totalAIRequests =
        Number(
          aiRequestsResult[0]
            ?.total || 0
        );


      const plannerUsers =
        Number(
          plannerUsersResult[0]
            ?.total || 0
        );


      const recordUsers =
        recordUserIds.size;


      const aiUsers =
        Number(
          aiUsersResult[0]
            ?.total || 0
        );


      const calculateUsage =
        users =>
          totalUsers > 0
            ? Math.min(
                Math.round(
                  (
                    users /
                    totalUsers
                  ) * 100
                ),
                100
              )
            : 0;


      return res.json({
        success: true,


        stats: {
          totalUsers,
          totalProjects,
          totalRecords,
          totalAIRequests
        },


        usage: {
          planner:
            calculateUsage(
              plannerUsers
            ),

          records:
            calculateUsage(
              recordUsers
            ),

          ai:
            calculateUsage(
              aiUsers
            )
        },


        userGrowth:
          userGrowthResult.map(
            item => ({
              month:
                item.monthLabel,

              monthKey:
                item.monthKey,

              total:
                Number(
                  item.total || 0
                )
            })
          ),


        projectGrowth:
          projectGrowthResult.map(
            item => ({
              month:
                item.monthLabel,

              monthKey:
                item.monthKey,

              total:
                Number(
                  item.total || 0
                )
            })
          ),


        recordBreakdown,


        aiGrowth:
          aiGrowthResult.map(
            item => ({
              month:
                item.monthLabel,

              monthKey:
                item.monthKey,

              total:
                Number(
                  item.total || 0
                )
            })
          )
      });


    } catch (error) {

      console.error(
        "ADMIN REPORTS ERROR:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load admin reports."
        });
    }
  }
);


router.get(
  "/users",
  verifyAdmin,
  async (req, res) => {
    try {

      const users =
        await queryDatabase(
          `
        SELECT
        UserID,
        FullName,
        Email,
        PhoneNumber,
        FarmName,
        FarmLocation,
        FarmSize,
        Role,
        AccountStatus,
        OnboardingCompleted,
        IsPremium,
        SubscriptionStatus,
        SubscriptionStart,
        SubscriptionEnd,
        SubscriptionPrice,
        IsFirstPremium,
        AuthProvider,
        CreatedAt

            FROM users

            WHERE
              LOWER(Role) != 'admin'

            ORDER BY
              CreatedAt DESC
          `
        );

      const totalUsers =
        users.length;

      return res.json({
        success: true,

        stats: {
          totalUsers,
          activeUsers:
            users.filter(
              user =>
                user.AccountStatus === "Active"
            ).length,
          inactiveUsers:
            users.filter(
              user =>
                user.AccountStatus === "Inactive"
            ).length
        },

        users:
          users.map(
            user => ({
              id:
                user.UserID,

              name:
                user.FullName ||
                "User",

              email:
                user.Email ||
                "",

              phoneNumber:
                user.PhoneNumber ||
                "",

              role:
                user.Role ||
                "farmer",

              status:
                user.AccountStatus ||
                "Active",

              isPremium:
                Boolean(
                  Number(user.IsPremium)
                ),

                subscriptionStatus:
                user.SubscriptionStatus ||
                "Inactive",

              subscriptionStart:
                user.SubscriptionStart ||
                null,

              subscriptionEnd:
                user.SubscriptionEnd ||
                null,

              subscriptionPrice:
                user.SubscriptionPrice !== null
                  ? Number(user.SubscriptionPrice)
                  : null,

              isFirstPremium:
                Boolean(
                  Number(user.IsFirstPremium)
                ),

              farmName:
                user.FarmName || "",

              farmLocation:
                user.FarmLocation || "",

              farmSize:
                user.FarmSize || "",

              authProvider:
                user.AuthProvider ||
                "local",

              createdAt:
                user.CreatedAt
            })
          )
      });

    } catch (error) {

      console.error(
        "ADMIN USERS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load users."
        });
    }
  }
);

router.patch(
  "/users/:id/status",
  verifyAdmin,
  async (req, res) => {
    try {
      const userId =
        Number(req.params.id);

      const {
        status
      } = req.body;


      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID."
        });
      }


      const allowedStatuses = [
        "Active",
        "Inactive"
      ];


      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid account status."
        });
      }


      const userResult =
        await queryDatabase(
          `
            SELECT
              UserID,
              Role,
              AccountStatus

            FROM users

            WHERE UserID = ?

            LIMIT 1
          `,
          [
            userId
          ]
        );


      if (
        userResult.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found."
        });
      }


      const role =
        String(
          userResult[0].Role || ""
        ).toLowerCase();


      if (role === "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Administrator accounts cannot be changed here."
        });
      }


      await queryDatabase(
        `
          UPDATE users

          SET AccountStatus = ?

          WHERE UserID = ?
        `,
        [
          status,
          userId
        ]
      );


      return res.json({
        success: true,
        message:
          `User account is now ${status}.`,

        user: {
          id:
            userId,

          status
        }
      });


    } catch (error) {
      console.error(
        "ADMIN USER STATUS ERROR:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update user status."
        });
    }
  }
);

router.patch(
  "/users/:id/subscription",
  verifyAdmin,
  async (req, res) => {
    try {
      const userId =
        Number(req.params.id);

      const {
        action
      } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID."
        });
      }

      if (
        ![
          "activate",
          "cancel"
        ].includes(action)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid subscription action."
        });
      }

      const userResult =
        await queryDatabase(
          `
            SELECT
              UserID,
              Role,
              IsPremium,
              IsFirstPremium,
              SubscriptionStatus

            FROM users

            WHERE UserID = ?

            LIMIT 1
          `,
          [userId]
        );

      if (
        userResult.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found."
        });
      }

      const user =
        userResult[0];

      if (
        String(
          user.Role || ""
        ).toLowerCase() === "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Administrator subscriptions cannot be changed."
        });
      }

      if (action === "activate") {

        if (
          Number(user.IsPremium)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "This user already has an active Premium subscription."
          });
        }

        const price =
          Number(
            user.IsFirstPremium
          )
            ? 649
            : 1299;

        await queryDatabase(
          `
            UPDATE users

            SET
              IsPremium = 1,
              SubscriptionStatus = 'Active',
              SubscriptionStart = NOW(),
              SubscriptionEnd =
                DATE_ADD(
                  NOW(),
                  INTERVAL 1 MONTH
                ),
              SubscriptionPrice = ?,
              IsFirstPremium = 0

            WHERE UserID = ?
          `,
          [
            price,
            userId
          ]
        );

        return res.json({
          success: true,

          message:
            "Premium subscription activated successfully.",

          subscription: {
            isPremium: true,
            status: "Active",
            price
          }
        });
      }

      if (action === "cancel") {

        if (
          !Number(user.IsPremium)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "This user does not have an active Premium subscription."
          });
        }

        await queryDatabase(
          `
            UPDATE users

            SET
              IsPremium = 0,
              SubscriptionStatus = 'Cancelled',
              SubscriptionEnd = NOW()

            WHERE UserID = ?
          `,
          [userId]
        );

        return res.json({
          success: true,

          message:
            "Premium subscription cancelled successfully.",

          subscription: {
            isPremium: false,
            status: "Cancelled"
          }
        });
      }

    } catch (error) {
      console.error(
        "ADMIN SUBSCRIPTION ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update subscription."
        });
    }
  }
);

module.exports = router;