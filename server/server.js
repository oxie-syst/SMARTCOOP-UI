require("dotenv").config();

console.log(
  "Gemini API Key:",
  process.env.GEMINI_API_KEY
    ? "LOADED"
    : "NOT FOUND"
);

const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

const app = express();

app.use(cors());

const resendWebhookRoutes = require("./routes/resendWebhookRoutes");

app.use(
  "/api/resend/webhook",
  express.raw({ type: "application/json" }),
  resendWebhookRoutes
);

app.use(express.json());
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "SmartCoop",

  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 900000,
  expiration: 30 * 24 * 60 * 60 * 1000
});

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required.");
}

app.use(
  session({
    name: "smartcoop.sid",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  })
);
app.use(
  express.static(
    path.join(__dirname, "../public")
  )
);

const authRoutes = require("./routes/authRoutes");
const coopRoutes = require("./routes/coopRoutes");
const breedRecommendationRoutes = require("./routes/breedRecommendationRoutes");
const savedRecommendationRoutes = require("./routes/savedRecommendationRoutes");
const healthCheckerRoutes = require("./routes/healthCheckerRoutes");
const alertRoutes = require("./routes/alertRoutes");
const recordRoutes = require("./routes/recordRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const aiAssistantRoutes = require("./routes/aiAssistantRoutes");
const adminRoutes = require("./routes/adminRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/coops", coopRoutes);
app.use("/api/breed-recommendation", breedRecommendationRoutes);
app.use("/api/saved-recommendations", savedRecommendationRoutes);
app.use("/api/health-checker", healthCheckerRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/ai-assistant", aiAssistantRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/newsletter", newsletterRoutes);


app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/index.html")
  );
});

module.exports = app;

if (require.main === module) {
  app.listen(3000, () => {
    console.log(
      "Server running at http://localhost:3000"
    );
  });
}