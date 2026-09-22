const {
  checkFeatureLimit,
  logFeatureUsage
} = require("../utils/featurelimit");

const express = require("express");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const db = require("../db");

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const datasetPath = path.join(
  __dirname,
  "../training/health-checker/health_training_data.jsonl"
);

function loadHealthDataset() {
  try {
    const file = fs.readFileSync(
      datasetPath,
      "utf8"
    );

    return file
      .split("\n")
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  } catch (error) {
    console.error(
      "Health dataset error:",
      error.message
    );

    return [];
  }
}

function findDatasetFallback(
  selectedSymptoms,
  dataset
) {
  let bestMatch = null;
  let bestScore = 0;
  let bestMatchCount = 0;

  dataset.forEach(item => {
    const matches =
      item.symptoms.filter(symptom =>
        selectedSymptoms.includes(symptom)
      );

    const matchCount =
      matches.length;

    if (matchCount === 0) {
      return;
    }

    const conditionCoverage =
      matchCount /
      item.symptoms.length;

    const selectedCoverage =
      matchCount /
      selectedSymptoms.length;

    const score =
      Math.round(
        (
          conditionCoverage * 0.5 +
          selectedCoverage * 0.5
        ) *
        100
      );

    if (
      matchCount > bestMatchCount ||
      (
        matchCount === bestMatchCount &&
        score > bestScore
      )
    ) {
      bestMatch =
        item;

      bestScore =
        score;

      bestMatchCount =
        matchCount;
    }
  });

  if (!bestMatch) {
    return {
      possibleConcern:
        "General Poultry Health Concern",

      priority:
        "medium",

      summary:
        "The selected symptoms are not specific enough to strongly match one health pattern in the SmartCoop dataset.",

      symptomMatch:
        0,

      recommendedActions: [
        "Observe affected birds closely.",
        "Provide clean drinking water and appropriate feed.",
        "Keep the coop clean, dry, and comfortable.",
        "Contact a licensed veterinarian if symptoms persist, worsen, or spread."
      ],

      prevention: [
        "Maintain good coop sanitation.",
        "Avoid overcrowding.",
        "Perform regular flock health checks.",
        "Practice good biosecurity."
      ],

      veterinaryGuidance:
        "Seek veterinary assistance if symptoms are severe, worsening, spreading through the flock, or difficult to identify."
    };
  }

  return {
    possibleConcern:
      bestMatch.condition,

    priority:
      bestMatch.priority,

    summary:
      `The selected symptoms show similarities with the ${bestMatch.condition.toLowerCase()} pattern in the SmartCoop health dataset.`,

    symptomMatch:
      Math.min(bestScore, 95),

    recommendedActions:
      bestMatch.recommendedActions,

    prevention:
      bestMatch.prevention,

    veterinaryGuidance:
      "Contact a licensed veterinarian if symptoms are severe, worsening, persistent, or spreading to other birds."
  };
}

function isTemporaryGeminiError(error) {
  const message =
    error?.message?.toLowerCase() ||
    "";

  return (
    message.includes('"code":503') ||
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("temporarily unavailable")
  );
}

function wait(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

async function generateWithRetry(prompt) {
  const models = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash"
  ];

  let lastError = null;

  for (const model of models) {
    try {
      console.log(
        `🤖 Trying Health Checker with ${model}...`
      );

      const response =
        await ai.models.generateContent({
          model,

          contents: prompt,

          config: {
            responseMimeType:
              "application/json"
          }
        });

      console.log(
        `✅ Health analysis generated using ${model}`
      );

      return {
        response,
        model
      };

    } catch (error) {
      lastError = error;

      console.error(
        `⚠️ ${model} unavailable:`,
        error.message
      );

      console.log(
        "Trying next Gemini model..."
      );

      await new Promise(resolve =>
        setTimeout(resolve, 1000)
      );
    }
  }

  throw lastError;
}

router.post(
  "/analyze",
  async (req, res) => {
    try {
      const {
        symptoms,
        userId
      } = req.body;

      if (!userId) {
  return res.status(400).json({
    success: false,
    message: "User ID is required."
  });
}

const featureCheck =
  await checkFeatureLimit(
    userId,
    "health_ai"
  );

if (!featureCheck.allowed) {
  return res.status(429).json({
    success: false,

    message:
      "You have used all 3 free Health Checker attempts for today. Upgrade to Premium for unlimited health analysis.",

    usage: {
      feature: "health_ai",
      limit:
        featureCheck.limit || 3,
      remaining: 0,
      isPremium: false
    }
  });
}

      if (
        !Array.isArray(symptoms) ||
        symptoms.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Please select at least one symptom."
        });
      }

      const dataset =
        loadHealthDataset();

      if (
        dataset.length === 0
      ) {
        return res.status(500).json({
          success: false,

          message:
            "SmartCoop health dataset could not be loaded."
        });
      }

      const allowedSymptoms =
        new Set(
          dataset.flatMap(
            item =>
              item.symptoms
          )
        );

      const cleanSymptoms = [
        ...new Set(
          symptoms.filter(
            symptom =>
              typeof symptom ===
                "string" &&
              allowedSymptoms.has(
                symptom
              )
          )
        )
      ];

      if (
        cleanSymptoms.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "No valid symptoms were provided."
        });
      }

      const fallback =
        findDatasetFallback(
          cleanSymptoms,
          dataset
        );

      const relevantData =
        dataset.filter(item =>
          item.symptoms.some(
            symptom =>
              cleanSymptoms.includes(
                symptom
              )
          )
        );

const prompt = `
You are SmartCoop Poultry Health Assistant, an AI-assisted decision-support system designed to provide cautious, practical, and educational poultry health guidance.
Your task is to evaluate ONLY the observable symptoms selected by the user and compare them with the provided SmartCoop poultry health reference data.
Your response is intended to support poultry health monitoring. It must NOT be presented as a confirmed veterinary diagnosis.

ASSESSMENT PRINCIPLES

1. EVIDENCE-BASED ASSESSMENT

Use only:
- the user's selected symptoms; and
- the SmartCoop health reference data provided below.

Do not invent or assume information that was not provided.

Do not assume:
- chicken age;
- breed;
- sex;
- flock size;
- vaccination history;
- disease exposure;
- mortality;
- duration of symptoms;
- feed intake beyond selected symptoms;
- water intake;
- environmental conditions;
- laboratory results;
- physical examination findings;
- previous treatments;
- geographic disease prevalence.

2. NO DEFINITIVE DIAGNOSIS

Symptoms alone may be shared by multiple poultry health conditions.

Never state that a chicken definitely has a particular disease.

Use cautious terminology such as:
- "Possible health concern"
- "Symptoms may be consistent with..."
- "The observed signs may suggest..."
- "This symptom pattern may be associated with..."

If the available symptoms are too limited or nonspecific, return a broader health concern instead of naming a specific disease.

3. DIFFERENTIAL REASONING

Consider all relevant SmartCoop reference entries that overlap with the selected symptoms.

When several health concerns have similar symptom patterns:
- do not arbitrarily choose the most serious condition;
- prefer the concern with the strongest symptom overlap;
- acknowledge uncertainty in the summary;
- use a broader concern when the evidence does not clearly distinguish between possibilities.

4. PRIORITY CLASSIFICATION

Assign exactly one priority:

"low"
Use when the selected signs appear mild or nonspecific and the reference data does not indicate an urgent pattern.

"medium"
Use when the symptoms justify closer monitoring, separation of visibly unwell birds when appropriate, or professional assessment if they continue.

"high"
Use only when the selected symptom pattern indicates that prompt professional veterinary attention would be appropriate.

Priority represents the recommended level of attention.

It does NOT represent diagnostic certainty.

5. SYMPTOM MATCH

Calculate "symptomMatch" as a conservative similarity score between the user's selected symptoms and the most relevant SmartCoop reference pattern.

The value must:
- be a whole number;
- be between 0 and 95;
- reflect symptom-pattern similarity only;
- never represent probability of disease;
- never represent diagnostic confidence.

Do not give an unusually high score when only one nonspecific symptom overlaps.

6. RECOMMENDED ACTIONS

Provide exactly 4 practical actions.

Actions should focus on safe general poultry management such as:
- observation and monitoring;
- separating visibly unwell birds when appropriate;
- maintaining clean drinking water;
- maintaining appropriate feed access;
- improving sanitation;
- keeping bedding clean and dry;
- reducing environmental stress;
- checking whether similar symptoms appear in other birds;
- seeking professional veterinary assessment when appropriate.

Do NOT:
- prescribe medication;
- recommend antibiotics;
- provide drug names;
- provide dosages;
- provide treatment schedules;
- claim that a treatment will cure a disease.

7. PREVENTION AND MONITORING

Provide exactly 4 prevention or monitoring recommendations.

Prefer practical measures involving:
- sanitation;
- biosecurity;
- clean feeders and waterers;
- appropriate ventilation;
- dry bedding;
- avoiding overcrowding;
- routine flock observation;
- appropriate nutrition;
- established poultry vaccination and health practices where relevant.

8. VETERINARY GUIDANCE

Clearly explain when professional veterinary assistance should be considered.

Recommend prompt veterinary assessment when signs are:
- severe;
- rapidly worsening;
- persistent;
- spreading through the flock;
- associated with major weakness or mobility problems;
- or cannot be reasonably distinguished using the available information.

9. COMMUNICATION STYLE

Use:
- professional language;
- clear and concise explanations;
- terminology understandable to beginner poultry raisers;
- cautious wording appropriate for an AI decision-support system.

Avoid:
- unnecessary technical jargon;
- alarming language;
- unsupported claims;
- excessive certainty.


USER OBSERVATIONS

Selected symptoms:
${JSON.stringify(cleanSymptoms)}


SMARTCOOP POULTRY HEALTH REFERENCE DATA


${JSON.stringify(relevantData)}


OUTPUT REQUIREMENTS

Return ONLY one valid JSON object.

Do not include Markdown.
Do not include code fences.
Do not include introductory or concluding text outside the JSON.

Use exactly this structure:

{
  "possibleConcern": "string",
  "priority": "low",
  "summary": "string",
  "symptomMatch": 0,
  "recommendedActions": [
    "string",
    "string",
    "string",
    "string"
  ],
  "prevention": [
    "string",
    "string",
    "string",
    "string"
  ],
  "veterinaryGuidance": "string"
}

FINAL VALIDATION

Before returning the JSON, verify that:

- possibleConcern does not claim a confirmed diagnosis;
- priority is exactly "low", "medium", or "high";
- summary explains the symptom pattern without overstating certainty;
- symptomMatch is an integer from 0 to 95;
- symptomMatch represents similarity, not disease probability;
- recommendedActions contains exactly 4 items;
- prevention contains exactly 4 items;
- no medication or dosage instructions are included;
- no unprovided facts are assumed;
- veterinaryGuidance clearly explains when professional help is appropriate;
- the response is valid JSON and contains no text outside the JSON.
`;

    try{
        const {
        response,
        model
        } = await generateWithRetry(
        prompt
        );

        const rawText =
        response.text;

        if (!rawText) {
          throw new Error(
            "Gemini returned an empty response."
          );
        }

        const parsed =
          JSON.parse(rawText);

        const validPriorities = [
          "low",
          "medium",
          "high"
        ];

        const parsedPriority =
          String(
            parsed.priority ||
            ""
          ).toLowerCase();

        const priority =
          validPriorities.includes(
            parsedPriority
          )
            ? parsedPriority
            : fallback.priority;

        const parsedMatch =
          Number(
            parsed.symptomMatch
          );

        const symptomMatch =
          Number.isFinite(
            parsedMatch
          )
            ? Math.max(
                0,
                Math.min(
                  95,
                  Math.round(
                    parsedMatch
                  )
                )
              )
            : fallback.symptomMatch;

        const recommendedActions =
          Array.isArray(
            parsed.recommendedActions
          ) &&
          parsed.recommendedActions.length >
            0
            ? parsed.recommendedActions
                .filter(
                  item =>
                    typeof item ===
                      "string" &&
                    item.trim()
                )
                .slice(0, 4)
            : fallback.recommendedActions;

        const prevention =
          Array.isArray(
            parsed.prevention
          ) &&
          parsed.prevention.length >
            0
            ? parsed.prevention
                .filter(
                  item =>
                    typeof item ===
                      "string" &&
                    item.trim()
                )
                .slice(0, 4)
            : fallback.prevention;

        console.log(
          `Gemini Health analysis successful using ${model}`
        );
        
      if (!featureCheck.isPremium) {
        await logFeatureUsage(
          userId,
          "health_ai"
        );
      }
        
        return res.json({
          success:
            true,

          source:
            `SmartCoop Health Dataset + ${model}`,

          fallback:
            false,

          selectedSymptoms:
            cleanSymptoms,

          analysis: {
            possibleConcern:
              typeof parsed.possibleConcern ===
                "string" &&
              parsed.possibleConcern.trim()
                ? parsed.possibleConcern.trim()
                : fallback.possibleConcern,

            priority,

            summary:
              typeof parsed.summary ===
                "string" &&
              parsed.summary.trim()
                ? parsed.summary.trim()
                : fallback.summary,

            symptomMatch,

            recommendedActions,

            prevention,

            veterinaryGuidance:
              typeof parsed.veterinaryGuidance ===
                "string" &&
              parsed.veterinaryGuidance.trim()
                ? parsed.veterinaryGuidance.trim()
                : fallback.veterinaryGuidance
          }
        });

      } catch (aiError) {
        console.error(
          "Gemini Health unavailable:",
          aiError.message
        );

        console.log(
          "Using SmartCoop Health Dataset Fallback"
        );

      if (!featureCheck.isPremium) {
        await logFeatureUsage(
          userId,
          "health_ai"
        );
      }

        return res.json({
          success:
            true,

          source:
            "SmartCoop Health Dataset Fallback",

          fallback:
            true,

          selectedSymptoms:
            cleanSymptoms,

          analysis:
            fallback
        });
      }

    } catch (error) {
      console.error(
        "Health Checker Error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Unable to analyze symptoms at this time."
      });
    }
  }
);

router.post("/history", (req, res) => {
  const {
    userId,
    possibleConcern,
    priority,
    symptomMatch,
    symptoms,
    summary,
    recommendedActions,
    prevention,
    veterinaryGuidance,
    source,
    fallback
  } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required."
    });
  }

  if (!possibleConcern) {
    return res.status(400).json({
      success: false,
      message: "Health assessment is required."
    });
  }

  const sql = `
    INSERT INTO health_checks (
      UserID,
      PossibleConcern,
      PriorityLevel,
      SymptomMatch,
      Symptoms,
      Summary,
      RecommendedActions,
      Prevention,
      VeterinaryGuidance,
      Source,
      IsFallback
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    userId,
    possibleConcern,
    priority || "medium",
    symptomMatch || 0,
    JSON.stringify(
      Array.isArray(symptoms)
        ? symptoms
        : []
    ),
    summary || "",
    JSON.stringify(
      Array.isArray(recommendedActions)
        ? recommendedActions
        : []
    ),
    JSON.stringify(
      Array.isArray(prevention)
        ? prevention
        : []
    ),
    veterinaryGuidance || "",
    source || "SmartCoop",
    fallback ? 1 : 0
  ];

  db.query(
    sql,
    values,
    (error, result) => {
      if (error) {
        console.error(
          "Save Health Check Error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to save health check."
        });
      }

      return res.status(201).json({
        success: true,
        message:
          "Health check saved successfully.",

        healthCheckId:
          result.insertId
      });
    }
  );
});

router.get(
  "/history/:userId",
  (req, res) => {
    const userId =
      req.params.userId;

    const sql = `
      SELECT
        HealthCheckID,
        UserID,
        PossibleConcern,
        PriorityLevel,
        SymptomMatch,
        Symptoms,
        Summary,
        RecommendedActions,
        Prevention,
        VeterinaryGuidance,
        Source,
        IsFallback,
        CreatedAt
      FROM health_checks
      WHERE UserID = ?
      ORDER BY CreatedAt DESC, HealthCheckID DESC
    `;

    db.query(
      sql,
      [userId],
      (error, results) => {
        if (error) {
          console.error(
            "Load Health History Error:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Unable to load health history."
          });
        }

        const records =
          results.map(record => {
            let symptoms = [];
            let recommendedActions = [];
            let prevention = [];

            try {
              symptoms =
                JSON.parse(
                  record.Symptoms ||
                  "[]"
                );
            } catch {
              symptoms = [];
            }

            try {
              recommendedActions =
                JSON.parse(
                  record.RecommendedActions ||
                  "[]"
                );
            } catch {
              recommendedActions = [];
            }

            try {
              prevention =
                JSON.parse(
                  record.Prevention ||
                  "[]"
                );
            } catch {
              prevention = [];
            }

            return {
              id:
                record.HealthCheckID,

              userId:
                record.UserID,

              diagnosis:
                record.PossibleConcern,

              severity:
                record.PriorityLevel,

              confidence:
                record.SymptomMatch,

              symptoms,

              summary:
                record.Summary,

              recommendedActions,

              prevention,

              veterinaryGuidance:
                record.VeterinaryGuidance,

              source:
                record.Source,

              fallback:
                Boolean(
                  record.IsFallback
                ),

              createdAt:
                record.CreatedAt
            };
          });

        return res.json({
          success: true,
          records
        });
      }
    );
  }
);

router.delete(
  "/history/:id",
  (req, res) => {
    const healthCheckId =
      req.params.id;

    const userId =
      req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required."
      });
    }

    const sql = `
      DELETE FROM health_checks
      WHERE HealthCheckID = ?
      AND UserID = ?
    `;

    db.query(
      sql,
      [
        healthCheckId,
        userId
      ],
      (error, result) => {
        if (error) {
          console.error(
            "Delete Health Check Error:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Unable to delete health check."
          });
        }

        if (
          result.affectedRows === 0
        ) {
          return res.status(404).json({
            success: false,
            message:
              "Health check not found."
          });
        }

        return res.json({
          success: true,
          message:
            "Health check deleted successfully."
        });
      }
    );
  }
);

module.exports = router;