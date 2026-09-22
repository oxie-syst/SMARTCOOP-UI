const {
  checkFeatureLimit,
  logFeatureUsage
} = require("../utils/featurelimit");

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const datasetPath = path.join(
  __dirname,
  "../training/breed-recommendation/breed_training_data.jsonl"
);

const rotationState = {
  eggs: {
    beginnerIndex: 0,
    experiencedIndex: 0
  },
  meat: {
    beginnerIndex: 0,
    experiencedIndex: 0
  },
  dual: {
    beginnerIndex: 0,
    experiencedIndex: 0
  }
};

function loadBreedDataset() {
  const content = fs.readFileSync(
    datasetPath,
    "utf8"
  );

  return content
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

function getRelevantExamples(
  dataset,
  goalName
) {
  return dataset.filter(record => {
    const input = String(
      record.input || ""
    ).toLowerCase();

    return input.includes(
      goalName.toLowerCase()
    );
  });
}

function formatExamples(examples) {
  return examples
    .map((record, index) => {
      return `
REFERENCE EXAMPLE ${index + 1}

Input:
${record.input}

Output:
${record.output}
`;
    })
    .join("\n");
}

function getUniqueBreedPools(examples) {
  const beginnerMap = new Map();
  const experiencedMap = new Map();

  for (const record of examples) {
    try {
      const output =
        typeof record.output === "string"
          ? JSON.parse(record.output)
          : record.output;

      if (
        !Array.isArray(
          output.recommendations
        )
      ) {
        continue;
      }

      for (
        const recommendation
        of output.recommendations
      ) {
        if (
          !recommendation ||
          !recommendation.breed
        ) {
          continue;
        }

        if (
          recommendation.experienceLevel ===
          "Beginner Friendly"
        ) {
          if (
            !beginnerMap.has(
              recommendation.breed
            )
          ) {
            beginnerMap.set(
              recommendation.breed,
              recommendation
            );
          }
        }

        if (
          recommendation.experienceLevel ===
          "Experienced Raisers"
        ) {
          if (
            !experiencedMap.has(
              recommendation.breed
            )
          ) {
            experiencedMap.set(
              recommendation.breed,
              recommendation
            );
          }
        }
      }
    } catch {
      continue;
    }
  }

  return {
    beginner: Array.from(
      beginnerMap.values()
    ),

    experienced: Array.from(
      experiencedMap.values()
    )
  };
}

function getRotatingRecommendations(
  goal,
  breedPools
) {
  const state =
    rotationState[goal];

  if (
    !state ||
    breedPools.beginner.length === 0 ||
    breedPools.experienced.length === 0
  ) {
    return null;
  }

  let beginnerIndex =
    state.beginnerIndex %
    breedPools.beginner.length;

  let experiencedIndex =
    state.experiencedIndex %
    breedPools.experienced.length;

  let beginnerChoice =
    breedPools.beginner[
      beginnerIndex
    ];

  let experiencedChoice =
    breedPools.experienced[
      experiencedIndex
    ];

  if (
    beginnerChoice.breed ===
    experiencedChoice.breed
  ) {
    experiencedIndex =
      (experiencedIndex + 1) %
      breedPools.experienced.length;

    experiencedChoice =
      breedPools.experienced[
        experiencedIndex
      ];
  }

  state.beginnerIndex =
    (beginnerIndex + 1) %
    breedPools.beginner.length;

  state.experiencedIndex =
    (experiencedIndex + 1) %
    breedPools.experienced.length;

  return [
    beginnerChoice,
    experiencedChoice
  ];
}

function getAllowedBreedNames(
  breedPools
) {
  return {
    beginner:
      breedPools.beginner.map(
        item => item.breed
      ),

    experienced:
      breedPools.experienced.map(
        item => item.breed
      )
  };
}

function getTargetBreeds(
  goal,
  breedPools
) {
  const selected =
    getRotatingRecommendations(
      goal,
      breedPools
    );

  if (!selected) {
    return null;
  }

  return {
    beginner:
      selected[0].breed,

    experienced:
      selected[1].breed,

    fallbackRecommendations:
      selected
  };
}

router.post("/", async (req, res) => {
  const {
    goal,
    userId
  } = req.body;

  if (!userId) {
  return res.status(400).json({
    success: false,
    message: "User ID is required."
  });
}
let featureCheck;

try {

  featureCheck =
    await checkFeatureLimit(
      userId,
      "breed_recommendation"
    );

  if (!featureCheck.allowed) {

    return res.status(429).json({
      success: false,

      message:
        "You have used all 3 free Breed Recommendations for today.",

      usage: {
        feature:
          "breed_recommendation",

        limit:
          featureCheck.limit || 3,

        remaining: 0,

        isPremium: false
      }
    });
  }

} catch (error) {

  console.error(
    "BREED LIMIT CHECK ERROR:",
    error
  );

  return res.status(500).json({
    success: false,
    message:
      "Unable to check Breed Recommendation usage."
  });
}

  const goalNames = {
    eggs: "Egg Production",
    meat: "Meat Production",
    dual: "Dual Purpose"
  };

  if (!goal) {
    return res.status(400).json({
      success: false,
      message:
        "Primary goal is required."
    });
  }

  const goalName =
    goalNames[goal];

  if (!goalName) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid primary goal."
    });
  }

  let dataset;
  let relevantExamples;
  let breedPools;
  let targetBreeds;

  try {
    dataset =
      loadBreedDataset();

    relevantExamples =
      getRelevantExamples(
        dataset,
        goalName
      );

    if (
      relevantExamples.length === 0
    ) {
      return res.status(500).json({
        success: false,
        message:
          "No matching breed dataset records were found."
      });
    }

    breedPools =
      getUniqueBreedPools(
        relevantExamples
      );

    targetBreeds =
      getTargetBreeds(
        goal,
        breedPools
      );

    if (!targetBreeds) {
      return res.status(500).json({
        success: false,
        message:
          "Unable to create breed rotation."
      });
    }
  } catch (error) {
    console.error(
      "Dataset Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load the SmartCoop breed dataset."
    });
  }

  const allowedBreedNames =
    getAllowedBreedNames(
      breedPools
    );

  try {
    const datasetContext =
      formatExamples(
        relevantExamples
      );

    const { GoogleGenAI } =
      await import(
        "@google/genai"
      );

    const ai =
      new GoogleGenAI({
        apiKey:
          process.env.GEMINI_API_KEY
      });

    const prompt = `
You are SmartCoop's AI Chicken Breed Recommendation Specialist.

USER'S SELECTED PRIMARY GOAL:

${goalName}

SmartCoop has a curated local poultry dataset.

Use the supplied dataset as the grounding source for the recommendation.

ALL BEGINNER-FRIENDLY BREEDS AVAILABLE FOR THIS GOAL:

${allowedBreedNames.beginner.join(", ")}

ALL EXPERIENCED-RAISER BREEDS AVAILABLE FOR THIS GOAL:

${allowedBreedNames.experienced.join(", ")}

SMARTCOOP ROTATION HAS SELECTED THESE BREEDS FOR THIS REQUEST:

Recommendation 1:
${targetBreeds.beginner}

Recommendation 2:
${targetBreeds.experienced}

You MUST use those exact two selected breed names for this request.

Do not replace them with another breed.

SMARTCOOP DATASET REFERENCES:

${datasetContext}

END OF SMARTCOOP DATASET REFERENCES.

TASK:

Generate exactly TWO recommendations for:

${goalName}

RECOMMENDATION 1:

Breed must be exactly:

"${targetBreeds.beginner}"

Experience level must be exactly:

"Beginner Friendly"

RECOMMENDATION 2:

Breed must be exactly:

"${targetBreeds.experienced}"

Experience level must be exactly:

"Experienced Raisers"

FOR EACH RECOMMENDATION RETURN:

1. breed

Use the exact selected breed name.

2. bestFor

Must clearly match:

${goalName}

3. recommendedCoopSpace

Use SmartCoop planning ranges supported by the dataset.

Allowed dimensions are:

1x1
2x2
3x3
4x4
5x5
6x6
7x7
8x8
9x9
10x10

Examples:

"1x1 - 3x3"
"4x4 - 6x6"
"7x7 - 10x10"

4. climateSuitability

Use only climate suitability represented in the dataset for that breed.

5. experienceLevel

Recommendation 1:
"Beginner Friendly"

Recommendation 2:
"Experienced Raisers"

6. whyRecommended

Provide a concise explanation based on the SmartCoop dataset.

7. advantages

Provide exactly THREE advantages.

8. thingsToConsider

Provide exactly THREE practical considerations.

IMPORTANT RULES:

- Use only information supported by the supplied SmartCoop dataset.
- Do not invent breeds.
- Do not change the two selected breed names.
- Do not recommend the same breed twice.
- Do not fabricate precise production statistics.
- Do not assume the user's climate.
- Do not assume the user's available space.
- Do not assume the user's experience.
- Use clear professional English.
- Keep responses concise enough for SmartCoop recommendation cards.

Return only the structured data required by the response schema.
`;

    const response =
      await ai.models.generateContent({
        model:
          "gemini-3.7-flash",

        contents: prompt,

        config: {
          responseMimeType:
            "application/json",

          responseSchema: {
            type: "object",

            properties: {
              recommendations: {
                type: "array",
                minItems: 2,
                maxItems: 2,

                items: {
                  type: "object",

                  properties: {
                    breed: {
                      type: "string"
                    },

                    bestFor: {
                      type: "string"
                    },

                    recommendedCoopSpace: {
                      type: "array",

                      items: {
                        type: "string"
                      }
                    },

                    climateSuitability: {
                      type: "array",

                      items: {
                        type: "string"
                      }
                    },

                    experienceLevel: {
                      type: "string",

                      enum: [
                        "Beginner Friendly",
                        "Experienced Raisers"
                      ]
                    },

                    whyRecommended: {
                      type: "string"
                    },

                    advantages: {
                      type: "array",
                      minItems: 3,
                      maxItems: 3,

                      items: {
                        type: "string"
                      }
                    },

                    thingsToConsider: {
                      type: "array",
                      minItems: 3,
                      maxItems: 3,

                      items: {
                        type: "string"
                      }
                    }
                  },

                  required: [
                    "breed",
                    "bestFor",
                    "recommendedCoopSpace",
                    "climateSuitability",
                    "experienceLevel",
                    "whyRecommended",
                    "advantages",
                    "thingsToConsider"
                  ]
                }
              }
            },

            required: [
              "recommendations"
            ]
          }
        }
      });

    const data =
      JSON.parse(
        response.text
      );

    if (
      !Array.isArray(
        data.recommendations
      ) ||
      data.recommendations.length !== 2
    ) {
      throw new Error(
        "Gemini returned an invalid recommendation count."
      );
    }

    data.recommendations[0].breed =
      targetBreeds.beginner;

    data.recommendations[0].experienceLevel =
      "Beginner Friendly";

    data.recommendations[1].breed =
      targetBreeds.experienced;

    data.recommendations[1].experienceLevel =
      "Experienced Raisers";

if (!featureCheck.isPremium) {
  await logFeatureUsage(
    userId,
    "breed_recommendation"
  );
}

    return res.json({
      success: true,

      source:
        "SmartCoop Curated Dataset + Gemini",

      fallback: false,

      datasetRecords:
        dataset.length,

      relevantDatasetRecords:
        relevantExamples.length,

      availableBeginnerBreeds:
        breedPools.beginner.length,

      availableExperiencedBreeds:
        breedPools.experienced.length,

      recommendations:
        data.recommendations
    });

 } catch (error) {

  const errorStatus =
    error?.status ||
    error?.code ||
    error?.error?.code;

  const errorMessage =
    String(
      error?.message ||
      error ||
      ""
    );


  const shouldUseFallback =
    errorStatus === 429 ||
    errorStatus === 503 ||
    errorMessage.includes('"code":429') ||
    errorMessage.includes('"code":503') ||
    errorMessage.includes("RESOURCE_EXHAUSTED") ||
    errorMessage.includes("UNAVAILABLE") ||
    errorMessage.includes("high demand");


  if (shouldUseFallback) {

    console.log(
      "Gemini temporarily unavailable. Using SmartCoop dataset fallback."
    );


    if (!featureCheck.isPremium) {
      await logFeatureUsage(
        userId,
        "breed_recommendation"
      );
    }


    return res.json({
      success: true,

      source:
        "SmartCoop Curated Dataset Fallback",

      fallback: true,

      datasetRecords:
        dataset.length,

      relevantDatasetRecords:
        relevantExamples.length,

      availableBeginnerBreeds:
        breedPools.beginner.length,

      availableExperiencedBreeds:
        breedPools.experienced.length,

      recommendations:
        targetBreeds.fallbackRecommendations
    });

  }


  console.error(
    "Breed Recommendation Error:",
    error.message || error
  );


  return res.status(500).json({
    success: false,

    message:
      "Unable to generate breed recommendations."
  });

}
});

module.exports = router;