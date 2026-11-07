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


let cachedBreedDataset = null;

function loadBreedDataset() {
  if (cachedBreedDataset !== null) {
    return cachedBreedDataset;
  }

  const content = fs.readFileSync(
    datasetPath,
    "utf8"
  );

  cachedBreedDataset = content
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line));

  return cachedBreedDataset;
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

  try {
    const recommendations =
      targetBreeds.fallbackRecommendations;

    if (
      !Array.isArray(recommendations) ||
      recommendations.length !== 2
    ) {
      return res.status(500).json({
        success: false,
        message: "Unable to generate breed recommendations."
      });
    }

    if (!featureCheck.isPremium) {
      await logFeatureUsage(
        userId,
        "breed_recommendation"
      );
    }

    return res.json({
      success: true,
      source: "SmartCoop Curated Dataset",
      fallback: false,

      datasetRecords: dataset.length,
      relevantDatasetRecords: relevantExamples.length,

      availableBeginnerBreeds:
        breedPools.beginner.length,

      availableExperiencedBreeds:
        breedPools.experienced.length,

      recommendations: recommendations
    });

  } catch (error) {
    console.error(
      "Breed Recommendation Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to generate breed recommendations."
    });
  }
});


module.exports = router;