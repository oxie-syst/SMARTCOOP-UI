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



async function verifyAdmin(req, res, next) {
  try {
    const adminUserId = Number(req.session?.userId);

    if (!Number.isSafeInteger(adminUserId) || adminUserId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Administrator login is required."
      });
    }

    const result = await queryDatabase(
      `SELECT UserID, Role, AccountStatus
       FROM users
       WHERE UserID = ?
       LIMIT 1`,
      [adminUserId]
    );

    if (result.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Administrator account not found."
      });
    }

    const admin = result[0];

    if (String(admin.Role || "").toLowerCase() !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator access is required."
      });
    }

    if (String(admin.AccountStatus || "").toLowerCase() !== "active") {
      return res.status(403).json({
        success: false,
        message: "Administrator account is inactive."
      });
    }

    req.adminUser = admin;
    next();
  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify administrator."
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



router.get("/reports", verifyAdmin, async (req, res) => {
  try {
    const { from, to } = req.query;

    const validDate = value =>
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value;

    if (
      (from && !validDate(from)) ||
      (to && !validDate(to)) ||
      (from && to && from > to)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range."
      });
    }

    function dateFilter(column) {
      const conditions = [];
      const params = [];

      if (from) {
        conditions.push(`${column} >= ?`);
        params.push(`${from} 00:00:00`);
      }

      if (to) {
        conditions.push(`${column} < DATE_ADD(?, INTERVAL 1 DAY)`);
        params.push(to);
      }

      return {
        sql: conditions.length
          ? ` AND ${conditions.join(" AND ")}`
          : "",
        params
      };
    }

    const userFilter = dateFilter("u.CreatedAt");
    const feedbackFilter = dateFilter("f.CreatedAt");

    const [userStats, userGrowth, feedbackStats,
      ratingRows, categoryRows, feedbackRows] =
      await Promise.all([
        queryDatabase(
          `SELECT COUNT(*) AS total
           FROM users u
           WHERE LOWER(u.Role) != 'admin'
           ${userFilter.sql}`,
          userFilter.params
        ),

        queryDatabase(
          `SELECT
             DATE_FORMAT(u.CreatedAt, '%Y-%m') AS monthKey,
             DATE_FORMAT(u.CreatedAt, '%b %Y') AS month,
             COUNT(*) AS total
           FROM users u
           WHERE LOWER(u.Role) != 'admin'
             AND u.CreatedAt IS NOT NULL
             ${userFilter.sql}
           GROUP BY monthKey, month
           ORDER BY monthKey ASC`,
          userFilter.params
        ),

        queryDatabase(
          `SELECT
             COUNT(*) AS totalFeedback,
             COALESCE(AVG(f.Rating), 0) AS averageRating,
             COALESCE(
               ROUND(
                 100 * SUM(CASE WHEN f.Rating >= 4 THEN 1 ELSE 0 END)
                 / NULLIF(COUNT(*), 0), 1
               ), 0
             ) AS positivePercentage
           FROM feedback f
           WHERE 1=1 ${feedbackFilter.sql}`,
          feedbackFilter.params
        ),

        queryDatabase(
          `SELECT f.Rating AS rating, COUNT(*) AS total
           FROM feedback f
           WHERE 1=1 ${feedbackFilter.sql}
           GROUP BY f.Rating
           ORDER BY f.Rating ASC`,
          feedbackFilter.params
        ),

        queryDatabase(
          `SELECT f.Category AS category, COUNT(*) AS total
           FROM feedback f
           WHERE 1=1 ${feedbackFilter.sql}
           GROUP BY f.Category
           ORDER BY f.Category ASC`,
          feedbackFilter.params
        ),

        queryDatabase(
          `SELECT
             f.FeedbackID AS id,
             f.UserID AS userId,
             u.FullName AS userName,
             u.Email AS userEmail,
             f.Rating AS rating,
             f.Category AS category,
             f.Message AS message,
             f.Page AS page,
             f.Status AS status,
             f.CreatedAt AS createdAt
           FROM feedback f
           INNER JOIN users u ON u.UserID = f.UserID
           WHERE 1=1 ${feedbackFilter.sql}
           ORDER BY f.CreatedAt DESC, f.FeedbackID DESC`,
          feedbackFilter.params
        )
      ]);

    const stats = feedbackStats[0];

    const ratings = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      total: Number(
        ratingRows.find(row => Number(row.rating) === rating)?.total || 0
      )
    }));

    const categories = [
      "Bug Report",
      "Suggestion",
      "General Feedback",
      "Others"
    ].map(category => ({
      category,
      total: Number(
        categoryRows.find(row => row.category === category)?.total || 0
      )
    }));

    return res.json({
      success: true,
      stats: {
        totalUsers: Number(userStats[0]?.total || 0),
        totalFeedback: Number(stats?.totalFeedback || 0),
        averageRating: Number(Number(stats?.averageRating || 0).toFixed(2)),
        positivePercentage: Number(stats?.positivePercentage || 0)
      },
      userGrowth: userGrowth.map(row => ({
        monthKey: row.monthKey,
        month: row.month,
        total: Number(row.total || 0)
      })),
      ratingDistribution: ratings,
      feedbackCategories: categories,
      feedback: feedbackRows
    });
  } catch (error) {
    console.error("ADMIN REPORTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin reports."
    });
  }
});



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

router.get("/materials", verifyAdmin, async (req, res) => {
  try {
    const materials = await queryDatabase(`
      SELECT
        m.MaterialID,
        m.MaterialName,
        m.Specification,
        m.Unit,
        m.UnitPrice,
        m.IsActive,
        c.ChickenType
      FROM coop_materials m
      INNER JOIN coop_material_categories c
        ON m.MaterialID = c.MaterialID
      WHERE c.ChickenType = 'Broilers'
      ORDER BY m.MaterialName ASC
    `);

    return res.json({
      success: true,
      stats: {
        totalMaterials: materials.length,
        activeMaterials: materials.filter(
          m => Number(m.IsActive) === 1
        ).length,
        inactiveMaterials: materials.filter(
          m => Number(m.IsActive) === 0
        ).length
      },
      materials
    });

  } catch (error) {
    console.error("ADMIN MATERIALS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load materials."
    });
  }
});

router.patch("/materials/:id/price", verifyAdmin, async (req, res) => {
  try {
    const materialId = Number(req.params.id);
    const price = Number(req.body?.unitPrice);

    if (
      !Number.isSafeInteger(materialId) ||
      materialId <= 0 ||
      req.body?.unitPrice === undefined ||
      req.body?.unitPrice === null ||
      req.body?.unitPrice === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 9999999999.99 ||
      !Number.isInteger(Math.round(price * 100)) ||
      Math.abs(price * 100 - Math.round(price * 100)) > 0.000001
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID or unit price."
      });
    }

    const result = await queryDatabase(`
      UPDATE coop_materials
      SET UnitPrice = ?
      WHERE MaterialID = ?
      AND IsActive = 1
        AND EXISTS (
          SELECT 1
          FROM coop_material_categories
          WHERE MaterialID = ?
            AND ChickenType = 'Broilers'
        )
    `, [price, materialId, materialId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Broilers material not found."
      });
    }

    return res.json({
      success: true,
      message: "Material price updated successfully.",
      materialId,
      unitPrice: price
    });

  } catch (error) {
    console.error("UPDATE MATERIAL PRICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update material price."
    });
  }
});


router.patch("/feedback/:id/status", verifyAdmin, async (req, res) => {
  try {
    const feedbackId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isSafeInteger(feedbackId) || feedbackId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID."
      });
    }

    const allowedStatuses = ["New", "Reviewed", "Resolved"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback status."
      });
    }

    const result = await queryDatabase(
      `UPDATE feedback
       SET Status = ?
       WHERE FeedbackID = ?`,
      [status, feedbackId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found."
      });
    }

    return res.json({
      success: true,
      message: `Feedback marked as ${status}.`,
      feedback: {
        id: feedbackId,
        status
      }
    });
  } catch (error) {
    console.error("FEEDBACK STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update feedback status."
    });
  }
});


module.exports = router;