const db = require("../db");


function queryDatabase(sql, params = []) {
  return new Promise((resolve, reject) => {

    db.query(
      sql,
      params,
      (err, result) => {

        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      }
    );

  });
}


const FREE_LIMITS = {
  coop_planner: 3,
  ai_assistant: 5,
  breed_recommendation: 3,
  health_ai: 3
};


async function checkFeatureLimit(
  userId,
  featureName
) {

  const userResult =
    await queryDatabase(
      `
        SELECT
          UserID,
          IsPremium
        FROM users
        WHERE UserID = ?
        LIMIT 1
      `,
      [userId]
    );


  if (userResult.length === 0) {

    return {
      allowed: false,
      message: "User not found."
    };

  }


    const isPremium =
      Boolean(
        Number(userResult[0].IsPremium)
      );


  if (isPremium) {

    return {
      allowed: true,
      isPremium: true,
      remaining: null,
      limit: null
    };

  }


  const limit =
    FREE_LIMITS[featureName];


  if (!limit) {

    return {
      allowed: false,
      message: "Invalid feature."
    };

  }


  const usageResult =
    await queryDatabase(
      `
        SELECT
          COUNT(*) AS total
        FROM feature_usage_logs
        WHERE UserID = ?
        AND FeatureName = ?
        AND DATE(CreatedAt) = CURDATE()
      `,
      [
        userId,
        featureName
      ]
    );


  const used =
    Number(
      usageResult[0]?.total || 0
    );


  const remaining =
    Math.max(
      limit - used,
      0
    );


  if (used >= limit) {

    return {
      allowed: false,
      isPremium: false,
      used,
      limit,
      remaining: 0,
      message:
        "You have reached your daily limit for this feature."
    };

  }


  return {
    allowed: true,
    isPremium: false,
    used,
    limit,
    remaining
  };

}


async function logFeatureUsage(
  userId,
  featureName
) {

  await queryDatabase(
    `
      INSERT INTO feature_usage_logs
      (
        UserID,
        FeatureName
      )
      VALUES (?, ?)
    `,
    [
      userId,
      featureName
    ]
  );

}


module.exports = {
  checkFeatureLimit,
  logFeatureUsage,
  FREE_LIMITS
};