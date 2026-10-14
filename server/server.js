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

const app = express();

app.use(cors());

const resendWebhookRoutes = require("./routes/resendWebhookRoutes");

app.use(
  "/api/resend/webhook",
  express.raw({ type: "application/json" }),
  resendWebhookRoutes
);

app.use(express.json());
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