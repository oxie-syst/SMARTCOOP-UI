const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SmartCoop Auth API Working"
  });
});

router.post("/signup", async (req, res) => {
  const {
    fullName,
    email,
    password,
    phoneNumber
  } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please complete all required fields."
    });
  }

  db.query(
    "SELECT UserID FROM users WHERE Email = ?",
    [email],
    async (err, result) => {
      if (err) {
        console.error("SIGNUP CHECK ERROR:", err);

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already registered."
        });
      }

      try {
        const hashedPassword = await bcrypt.hash(
          password,
          10
        );

        const query = `
          INSERT INTO users (
            FullName,
            Email,
            Password,
            PhoneNumber,
            GoogleID,
            AuthProvider
          )
          VALUES (?, ?, ?, ?, NULL, 'local')
        `;

        db.query(
          query,
          [
            fullName,
            email,
            hashedPassword,
            phoneNumber || null
          ],
          (insertErr) => {
            if (insertErr) {
              console.error(
                "SIGNUP INSERT ERROR:",
                insertErr
              );

              return res.status(500).json({
                success: false,
                message: "Database Error"
              });
            }

            return res.json({
              success: true,
              message: "Account created successfully!"
            });
          }
        );
      } catch (error) {
        console.error("HASH ERROR:", error);

        return res.status(500).json({
          success: false,
          message: "Server Error"
        });
      }
    }
  );
});

router.post("/login", (req, res) => {
  const {
    email,
    password
  } = req.body;

  console.log("\n===== LOGIN ATTEMPT =====");
  console.log("Email:", email);

  if (!email || !password) {
    console.log("Missing email or password.");

    return res.status(400).json({
      success: false,
      message: "Please enter your email and password."
    });
  }

  db.query(
    "SELECT * FROM users WHERE Email = ?",
    [email],
    async (err, result) => {

      if (err) {
        console.error(
          "LOGIN DATABASE ERROR:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      if (result.length === 0) {
        console.log("User not found.");

        return res.status(401).json({
          success: false,
          message: "Invalid email or password."
        });
      }

      const user = result[0];

      console.log("User:", {
        UserID: user.UserID,
        FullName: user.FullName,
        Email: user.Email,
        OnboardingCompleted:
          user.OnboardingCompleted
      });

      if (!user.Password) {
        console.log("Google-only account.");

        return res.status(400).json({
          success: false,
          message:
            "This account uses Google Sign-In. Please continue with Google."
        });
      }

      try {
        const match = await bcrypt.compare(
          password,
          user.Password
        );

        console.log(
          "Password Match:",
          match
        );

        console.log(
          "Onboarding Completed:",
          user.OnboardingCompleted
        );

        if (!match) {
          return res.status(401).json({
            success: false,
            message:
              "Invalid email or password."
          });
        }

        const userResponse =
          createUserResponse(user);

        console.log(
          "Login Response:",
          userResponse
        );

        console.log(
          "Redirect should go to:",
          userResponse.onboardingCompleted
            ? "user.html"
            : "onboarding.html"
        );

        console.log("=========================\n");

        return res.json({
          success: true,
          message: "Login successful.",
          user: userResponse
        });

      } catch (error) {
        console.error(
          "PASSWORD COMPARE ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message: "Server Error"
        });
      }
    }
  );
});

router.post("/admin-login", (req, res) => {
  const {
    username,
    password
  } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message:
        "Please enter your administrator username and password."
    });
  }

  db.query(
    `
      SELECT *
      FROM users
      WHERE Username = ?
      AND Role = 'admin'
      LIMIT 1
    `,
    [username],
    async (err, result) => {

      if (err) {
        console.error(
          "ADMIN LOGIN DATABASE ERROR:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      if (result.length === 0) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid administrator credentials."
        });
      }

      const user = result[0];

      if (!user.Password) {
        return res.status(400).json({
          success: false,
          message:
            "Administrator password is not configured."
        });
      }

      try {
        const match =
          await bcrypt.compare(
            password,
            user.Password
          );

        if (!match) {
          return res.status(401).json({
            success: false,
            message:
              "Invalid administrator credentials."
          });
        }

        return res.json({
          success: true,
          message:
            "Administrator login successful.",
          user:
            createUserResponse(user)
        });

      } catch (error) {
        console.error(
          "ADMIN PASSWORD ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message: "Server Error"
        });
      }
    }
  );
});

router.post("/google", async (req, res) => {
  const {
    credential
  } = req.body;

  if (!credential) {
    return res.status(400).json({
      success: false,
      message: "Google credential is required."
    });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error("GOOGLE_CLIENT_ID NOT FOUND");

    return res.status(500).json({
      success: false,
      message:
        "Google authentication is not configured."
    });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google account."
      });
    }

    const googleId = payload.sub;
    const email = payload.email;

    const fullName =
      payload.name ||
      email?.split("@")[0] ||
      "SmartCoop User";

    const emailVerified =
      payload.email_verified;

    if (!email || !emailVerified) {
      return res.status(401).json({
        success: false,
        message:
          "Google email could not be verified."
      });
    }

    db.query(
      `
      SELECT *
      FROM users
      WHERE GoogleID = ?
      OR Email = ?
      LIMIT 1
      `,
      [
        googleId,
        email
      ],
      (findErr, result) => {
        if (findErr) {
          console.error(
            "GOOGLE USER LOOKUP ERROR:",
            findErr
          );

          return res.status(500).json({
            success: false,
            message: "Database Error"
          });
        }

        if (result.length > 0) {
          const existingUser = result[0];

          if (
            existingUser.GoogleID &&
            existingUser.GoogleID !== googleId
          ) {
            return res.status(409).json({
              success: false,
              message:
                "This email is already linked to another Google account."
            });
          }

          let provider =
            existingUser.AuthProvider || "local";

          if (
            existingUser.Password &&
            provider === "local"
          ) {
            provider = "both";
          } else if (!existingUser.Password) {
            provider = "google";
          }

          const updateQuery = `
            UPDATE users
            SET
              GoogleID = ?,
              AuthProvider = ?
            WHERE UserID = ?
          `;

          db.query(
            updateQuery,
            [
              googleId,
              provider,
              existingUser.UserID
            ],
            (updateErr) => {
              if (updateErr) {
                console.error(
                  "GOOGLE LINK ERROR:",
                  updateErr
                );

                return res.status(500).json({
                  success: false,
                  message:
                    "Unable to link Google account."
                });
              }

              existingUser.GoogleID = googleId;
              existingUser.AuthProvider = provider;

              return res.json({
                success: true,
                message:
                  "Google login successful.",
                isNewUser: false,
                user:
                  createUserResponse(existingUser)
              });
            }
          );

          return;
        }

        const insertQuery = `
          INSERT INTO users (
            FullName,
            Email,
            Password,
            PhoneNumber,
            GoogleID,
            AuthProvider
          )
          VALUES (
            ?,
            ?,
            NULL,
            NULL,
            ?,
            'google'
          )
        `;

        db.query(
          insertQuery,
          [
            fullName,
            email,
            googleId
          ],
          (insertErr, insertResult) => {
            if (insertErr) {
              console.error(
                "GOOGLE SIGNUP ERROR:",
                insertErr
              );

              return res.status(500).json({
                success: false,
                message:
                  "Failed to create Google account."
              });
            }

            db.query(
              `
              SELECT *
              FROM users
              WHERE UserID = ?
              `,
              [insertResult.insertId],
              (loadErr, newResult) => {
                if (
                  loadErr ||
                  !newResult.length
                ) {
                  console.error(
                    "NEW GOOGLE USER LOAD ERROR:",
                    loadErr
                  );

                  return res.status(500).json({
                    success: false,
                    message:
                      "Account created but failed to load user information."
                  });
                }

                return res.json({
                  success: true,
                  message:
                    "Google account created successfully.",
                  isNewUser: true,
                  user:
                    createUserResponse(newResult[0])
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error(
      "GOOGLE AUTH ERROR:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Google authentication failed."
    });
  }
});

router.post("/forgot-password", (req, res) => {
  const {
    email
  } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Please enter your email address."
    });
  }

  db.query(
    `
    SELECT *
    FROM users
    WHERE Email = ?
    LIMIT 1
    `,
    [email],
    async (err, result) => {
      if (err) {
        console.error(
          "FORGOT PASSWORD DB ERROR:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      if (result.length === 0) {
        return res.json({
          success: true,
          message:
            "If this email is registered, a verification code has been sent."
        });
      }

      const user = result[0];

      try {
        const code = crypto
          .randomInt(100000, 1000000)
          .toString();

        const hashedCode = await bcrypt.hash(
          code,
          10
        );

        const expiresAt = new Date(
          Date.now() + 10 * 60 * 1000
        );

        db.query(
          `
          DELETE FROM password_reset_codes
          WHERE UserID = ?
          `,
          [user.UserID],
          (deleteErr) => {
            if (deleteErr) {
              console.error(
                "DELETE OLD RESET CODE ERROR:",
                deleteErr
              );

              return res.status(500).json({
                success: false,
                message: "Database Error"
              });
            }

            db.query(
              `
              INSERT INTO password_reset_codes (
                UserID,
                ResetCode,
                ExpiresAt,
                IsUsed
              )
              VALUES (?, ?, ?, 0)
              `,
              [
                user.UserID,
                hashedCode,
                expiresAt
              ],
              async (insertErr) => {
                if (insertErr) {
                  console.error(
                    "RESET CODE INSERT ERROR:",
                    insertErr
                  );

                  return res.status(500).json({
                    success: false,
                    message: "Database Error"
                  });
                }

                try {
                  await transporter.sendMail({
                    from:
                      `"SmartCoop" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject:
                      "SmartCoop Password Reset Code",
                    html: `
                      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
                        <h2>SmartCoop Password Reset</h2>

                        <p>Hello ${user.FullName},</p>

                        <p>
                          We received a request to reset your SmartCoop password.
                        </p>

                        <p>
                          Your verification code is:
                        </p>

                        <div style="
                          font-size: 32px;
                          font-weight: bold;
                          letter-spacing: 8px;
                          margin: 24px 0;
                        ">
                          ${code}
                        </div>

                        <p>
                          This code will expire in 10 minutes.
                        </p>

                        <p>
                          If you did not request a password reset,
                          you can ignore this email.
                        </p>

                        <p>SmartCoop</p>
                      </div>
                    `
                  });

                  return res.json({
                    success: true,
                    message:
                      "Verification code sent to your email."
                  });
                } catch (mailError) {
                  console.error(
                    "EMAIL SEND ERROR:",
                    mailError
                  );

                  return res.status(500).json({
                    success: false,
                    message:
                      "Unable to send verification email."
                  });
                }
              }
            );
          }
        );
      } catch (error) {
        console.error(
          "FORGOT PASSWORD ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message: "Server Error"
        });
      }
    }
  );
});

router.post("/verify-reset-code", (req, res) => {
  const {
    email,
    code
  } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      success: false,
      message:
        "Email and verification code are required."
    });
  }

  db.query(
    `
    SELECT
      prc.*,
      u.Email
    FROM password_reset_codes prc
    JOIN users u
      ON u.UserID = prc.UserID
    WHERE u.Email = ?
      AND prc.IsUsed = 0
      AND prc.ExpiresAt > NOW()
    ORDER BY prc.CreatedAt DESC
    LIMIT 1
    `,
    [email],
    async (err, result) => {
      if (err) {
        console.error(
          "VERIFY RESET CODE DB ERROR:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      if (result.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Verification code is invalid or expired."
        });
      }

      try {
        const resetRecord = result[0];

        const match = await bcrypt.compare(
          code,
          resetRecord.ResetCode
        );

        if (!match) {
          return res.status(400).json({
            success: false,
            message:
              "Incorrect verification code."
          });
        }

        return res.json({
          success: true,
          message:
            "Verification code confirmed."
        });
      } catch (error) {
        console.error(
          "VERIFY RESET CODE ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message: "Server Error"
        });
      }
    }
  );
});

router.post("/reset-password", (req, res) => {
  const {
    email,
    code,
    newPassword
  } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({
      success: false,
      message:
        "Please complete all required fields."
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters."
    });
  }

  db.query(
    `
    SELECT
      prc.*,
      u.UserID,
      u.GoogleID,
      u.AuthProvider
    FROM password_reset_codes prc
    JOIN users u
      ON u.UserID = prc.UserID
    WHERE u.Email = ?
      AND prc.IsUsed = 0
      AND prc.ExpiresAt > NOW()
    ORDER BY prc.CreatedAt DESC
    LIMIT 1
    `,
    [email],
    async (err, result) => {
      if (err) {
        console.error(
          "RESET PASSWORD DB ERROR:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      if (result.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Verification code is invalid or expired."
        });
      }

      const resetRecord = result[0];

      try {
        const match = await bcrypt.compare(
          code,
          resetRecord.ResetCode
        );

        if (!match) {
          return res.status(400).json({
            success: false,
            message:
              "Incorrect verification code."
          });
        }

        const hashedPassword = await bcrypt.hash(
          newPassword,
          10
        );

        const authProvider =
          resetRecord.GoogleID
            ? "both"
            : "local";

        db.query(
          `
          UPDATE users
          SET
            Password = ?,
            AuthProvider = ?
          WHERE UserID = ?
          `,
          [
            hashedPassword,
            authProvider,
            resetRecord.UserID
          ],
          (updateErr) => {
            if (updateErr) {
              console.error(
                "PASSWORD UPDATE ERROR:",
                updateErr
              );

              return res.status(500).json({
                success: false,
                message:
                  "Unable to update password."
              });
            }

            db.query(
              `
              UPDATE password_reset_codes
              SET IsUsed = 1
              WHERE ResetID = ?
              `,
              [resetRecord.ResetID],
              (usedErr) => {
                if (usedErr) {
                  console.error(
                    "RESET CODE UPDATE ERROR:",
                    usedErr
                  );
                }

                return res.json({
                  success: true,
                  message:
                    "Password reset successfully."
                });
              }
            );
          }
        );
      } catch (error) {
        console.error(
          "RESET PASSWORD ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message: "Server Error"
        });
      }
    }
  );
});

function createUserResponse(user) {
  return {
    id: user.UserID,
    UserID: user.UserID,

    name: user.FullName,
    FullName: user.FullName,

    email: user.Email,
    Email: user.Email,

    role:
    user.Role || "farmer",

    Role:
    user.Role || "farmer",  

    phoneNumber:
      user.PhoneNumber || "",

    PhoneNumber:
      user.PhoneNumber || "",

    farmName:
      user.FarmName || "",

    FarmName:
      user.FarmName || "",

    farmLocation:
      user.FarmLocation || "",

    FarmLocation:
      user.FarmLocation || "",

    farmSize:
      user.FarmSize ?? "",

    FarmSize:
      user.FarmSize ?? "",

    isPremium:
      Boolean(user.IsPremium),

    IsPremium:
      Boolean(user.IsPremium),

    freeTrialUsed:
      Boolean(user.FreeTrialUsed),

    FreeTrialUsed:
      Boolean(user.FreeTrialUsed),

    googleId:
      user.GoogleID || null,

    GoogleID:
      user.GoogleID || null,

    authProvider:
      user.AuthProvider || "local",

    AuthProvider:
      user.AuthProvider || "local",

    onboardingCompleted:
      Boolean(user.OnboardingCompleted),

    OnboardingCompleted:
      Boolean(user.OnboardingCompleted)
  };
}
router.put("/onboarding/:userId", (req, res) => {
  const userId = Number(req.params.userId);

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid user."
    });
  }

  const sql = `
    UPDATE users
    SET OnboardingCompleted = 1
    WHERE UserID = ?
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error(
        "ONBOARDING UPDATE ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Unable to save onboarding progress."
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    return res.json({
      success: true,
      message: "Onboarding completed successfully."
    });
  });
});

module.exports = router;