const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "breed_training_data.jsonl"
);

const existingContent = fs.readFileSync(filePath, "utf8");

const existingLines = existingContent
  .split("\n")
  .map(line => line.trim())
  .filter(Boolean);

if (existingLines.length !== 30) {
  console.log(
    `❌ Expected 30 existing records, but found ${existingLines.length}.`
  );
  process.exit(1);
}

const breedPools = {
  eggs: {
    goal: "Egg Production",

    beginner: [
      {
        breed: "ISA Brown",
        climate: ["Warm", "Moderate"],
        why:
          "A recognized commercial laying strain suitable for raisers who want a practical egg-focused flock with manageable care requirements.",
        advantages: [
          "Focused on egg production",
          "Suitable for managed laying flocks",
          "Practical for beginner layer management"
        ],
        considerations: [
          "Requires balanced layer nutrition",
          "Clean water should always be available",
          "Housing needs good ventilation and sanitation"
        ]
      },
      {
        breed: "Hy-Line Brown",
        climate: ["Warm", "Moderate"],
        why:
          "A recognized commercial layer suitable for organized egg production when standard feeding, housing, and flock-management practices are followed.",
        advantages: [
          "Specialized for egg production",
          "Suitable for structured layer management",
          "Recognized commercial layer"
        ],
        considerations: [
          "Requires appropriate layer feed",
          "Lighting and housing require consistent management",
          "Flock performance should be monitored"
        ]
      },
      {
        breed: "Rhode Island Red",
        climate: ["Warm", "Moderate", "Cool"],
        why:
          "An established breed suitable for egg-focused backyard flocks and practical management by newer poultry raisers.",
        advantages: [
          "Useful for backyard egg production",
          "Generally hardy under proper care",
          "Suitable for diversified flock setups"
        ],
        considerations: [
          "Balanced nutrition is necessary",
          "Adequate activity space should be provided",
          "Housing requires ventilation and protection"
        ]
      }
    ],

    experienced: [
      {
        breed: "White Leghorn",
        climate: ["Warm", "Moderate", "Dry"],
        why:
          "An established laying breed suitable for experienced raisers who can manage an active flock and maintain efficient egg-production practices.",
        advantages: [
          "Strong egg-production suitability",
          "Efficient laying characteristics",
          "Well established for egg-focused production"
        ],
        considerations: [
          "Active birds require secure housing",
          "Handling may require more experience",
          "Consistent layer management is important"
        ]
      },
      {
        breed: "Hy-Line W-36",
        climate: ["Warm", "Moderate"],
        why:
          "A specialized commercial layer suited to experienced raisers capable of closely managing nutrition, housing, lighting, and flock performance.",
        advantages: [
          "Developed for commercial egg production",
          "Suitable for structured layer systems",
          "Recognized commercial layer line"
        ],
        considerations: [
          "Nutrition requires careful planning",
          "Lighting management requires attention",
          "Production performance should be monitored"
        ]
      },
      {
        breed: "Hy-Line W-80",
        climate: ["Warm", "Moderate"],
        why:
          "A commercial white-egg layer appropriate for experienced raisers who can maintain detailed layer-management practices.",
        advantages: [
          "Specialized for egg production",
          "Suitable for structured production systems",
          "Recognized commercial layer"
        ],
        considerations: [
          "Requires appropriate layer nutrition",
          "Environmental management needs attention",
          "Consistent flock monitoring is important"
        ]
      }
    ]
  },

  meat: {
    goal: "Meat Production",

    beginner: [
      {
        breed: "Cobb 500",
        climate: ["Warm", "Moderate", "Controlled Conditions"],
        why:
          "A recognized commercial broiler suitable for organized meat production when appropriate feeding, housing, sanitation, and monitoring practices are followed.",
        advantages: [
          "Developed for broiler production",
          "Recognized commercial meat strain",
          "Suitable for structured broiler management"
        ],
        considerations: [
          "Feed management requires attention",
          "Good ventilation is important",
          "Growth and welfare should be monitored"
        ]
      },
      {
        breed: "Ross 308",
        climate: ["Warm", "Moderate", "Controlled Conditions"],
        why:
          "A recognized commercial broiler that can suit raisers who follow established broiler feeding, housing, and flock-management guidance.",
        advantages: [
          "Purpose-developed for meat production",
          "Recognized commercial broiler",
          "Suitable for planned broiler systems"
        ],
        considerations: [
          "Requires suitable broiler nutrition",
          "Ventilation should be maintained",
          "Regular flock observation is necessary"
        ]
      }
    ],

    experienced: [
      {
        breed: "Ross 308",
        climate: ["Warm", "Moderate", "Controlled Conditions"],
        why:
          "A commercial broiler suited to experienced raisers who can closely manage nutrition, environmental conditions, and flock performance.",
        advantages: [
          "Strong broiler-production suitability",
          "Designed for structured meat production",
          "Supported by established management guidance"
        ],
        considerations: [
          "Nutrition needs careful management",
          "Environmental conditions affect performance",
          "Close flock monitoring is important"
        ]
      },
      {
        breed: "Arbor Acres Plus",
        climate: ["Warm", "Moderate", "Controlled Conditions"],
        why:
          "A recognized commercial broiler line suitable for experienced raisers capable of detailed feeding, housing, and environmental management.",
        advantages: [
          "Developed for broiler production",
          "Recognized commercial broiler line",
          "Suitable for structured meat-production systems"
        ],
        considerations: [
          "Broiler nutrition requires attention",
          "Environmental conditions need monitoring",
          "Housing management affects flock performance"
        ]
      },
      {
        breed: "Hubbard Flex",
        climate: ["Warm", "Moderate", "Controlled Conditions"],
        why:
          "A commercial broiler suitable for experienced poultry raisers who can carefully manage nutrition, environment, housing, and flock performance.",
        advantages: [
          "Commercial broiler production focus",
          "Suitable for structured meat systems",
          "Designed for specialized broiler management"
        ],
        considerations: [
          "Requires careful feed management",
          "Environmental conditions need monitoring",
          "Litter and ventilation should be maintained"
        ]
      }
    ]
  },

  dual: {
    goal: "Dual Purpose",

    beginner: [
      {
        breed: "Plymouth Rock",
        climate: ["Warm", "Moderate", "Cool"],
        why:
          "An established dual-purpose breed suitable for raisers who want useful egg production together with meat value in a manageable backyard flock.",
        advantages: [
          "Suitable for both eggs and meat",
          "Practical for diversified flocks",
          "Generally adaptable with proper care"
        ],
        considerations: [
          "Balanced nutrition is necessary",
          "Adequate activity space should be provided",
          "Housing must remain clean and ventilated"
        ]
      },
      {
        breed: "Australorp",
        climate: ["Warm", "Moderate", "Cool"],
        why:
          "A recognized dual-purpose breed suitable for backyard raisers seeking useful egg production together with meat utility.",
        advantages: [
          "Provides both egg and meat utility",
          "Suitable for diversified backyard flocks",
          "Adaptable under appropriate management"
        ],
        considerations: [
          "Balanced feeding should be maintained",
          "Housing needs adequate activity space",
          "Environmental conditions should be monitored"
        ]
      },
      {
        breed: "Rhode Island Red",
        climate: ["Warm", "Moderate", "Cool"],
        why:
          "An established breed suitable for raisers who want useful laying ability together with additional meat value from a diversified flock.",
        advantages: [
          "Useful for laying and meat purposes",
          "Generally hardy with proper care",
          "Suitable for diversified backyard flocks"
        ],
        considerations: [
          "Temperament can vary among individual birds",
          "Balanced feeding is important",
          "Adequate housing space should be provided"
        ]
      }
    ],

    experienced: [
      {
        breed: "Sussex",
        climate: ["Warm", "Moderate", "Cool"],
        why:
          "A traditional dual-purpose breed suited to experienced raisers balancing egg production, meat utility, and active flock management.",
        advantages: [
          "Useful for eggs and meat",
          "Suitable for diversified poultry systems",
          "Can fit managed outdoor systems"
        ],
        considerations: [
          "Requires adequate activity space",
          "Nutrition should support both purposes",
          "Consistent flock management is important"
        ]
      },
      {
        breed: "Wyandotte",
        climate: ["Moderate", "Cool"],
        why:
          "An established dual-purpose breed suitable for experienced poultry keepers managing a flock for both laying and meat utility.",
        advantages: [
          "Useful for both eggs and meat",
          "Established dual-purpose characteristics",
          "Suitable for diversified flock management"
        ],
        considerations: [
          "Hot conditions require additional management",
          "Adequate housing space is necessary",
          "Balanced feeding supports overall production"
        ]
      },
      {
        breed: "Orpington",
        climate: ["Moderate", "Cool"],
        why:
          "A traditional dual-purpose breed suitable for experienced raisers who can manage its housing and environmental requirements while maintaining egg and meat utility.",
        advantages: [
          "Provides egg and meat utility",
          "Established dual-purpose characteristics",
          "Suitable for diversified poultry keeping"
        ],
        considerations: [
          "Dense feathering requires attention in hot weather",
          "Housing should provide sufficient room",
          "Balanced nutrition remains important"
        ]
      }
    ]
  }
};

const promptTemplates = [
  goal =>
    `Primary Goal: ${goal}. Recommend exactly two suitable chickens, one for a beginner and one for an experienced raiser.`,

  goal =>
    `My main poultry goal is ${goal}. Give me one beginner-friendly recommendation and one recommendation for an experienced raiser.`,

  goal =>
    `SmartCoop selected goal: ${goal}. Recommend two appropriate breeds or recognized strains for different experience levels.`,

  goal =>
    `I want to focus on ${goal}. Which two chickens should SmartCoop recommend for beginner and experienced poultry raisers?`,

  goal =>
    `Generate two SmartCoop recommendations for ${goal}, separating the beginner-friendly option from the experienced option.`,

  goal =>
    `I selected ${goal} as my primary goal. Provide exactly two suitable poultry recommendations.`,

  goal =>
    `Recommend chickens suitable for ${goal}. I need one option for beginners and another option for experienced raisers.`,

  goal =>
    `For ${goal}, select two practical chicken recommendations with different management experience levels.`,

  goal =>
    `SmartCoop needs two recommendations for ${goal}. The first should suit beginners and the second should suit experienced raisers.`,

  goal =>
    `What are two appropriate chicken options for ${goal}? Separate the recommendations by beginner and experienced management.`
];

function createRecommendation(
  breedData,
  goal,
  experienceLevel,
  coopSpaces
) {
  return {
    breed: breedData.breed,
    bestFor: goal,
    recommendedCoopSpace: coopSpaces,
    climateSuitability: breedData.climate,
    experienceLevel,
    whyRecommended: breedData.why,
    advantages: breedData.advantages,
    thingsToConsider: breedData.considerations
  };
}

function createRecord(category, index) {
  const pool = breedPools[category];

  const beginner =
    pool.beginner[index % pool.beginner.length];

  let experienced =
    pool.experienced[index % pool.experienced.length];

  if (experienced.breed === beginner.breed) {
    experienced =
      pool.experienced[
        (index + 1) % pool.experienced.length
      ];
  }

  const input =
    promptTemplates[index % promptTemplates.length](
      pool.goal
    ) +
    ` Request variation ${index + 1}.`;

  const output = {
    recommendations: [
      createRecommendation(
        beginner,
        pool.goal,
        "Beginner Friendly",
        ["1x1 - 3x3", "4x4 - 6x6"]
      ),

      createRecommendation(
        experienced,
        pool.goal,
        "Experienced Raisers",
        ["4x4 - 6x6", "7x7 - 10x10"]
      )
    ]
  };

  return {
    input,
    output: JSON.stringify(output)
  };
}

const categories = [
  "eggs",
  "meat",
  "dual"
];

const newRecords = [];

let counter = 0;

while (newRecords.length < 70) {
  const category =
    categories[counter % categories.length];

  newRecords.push(
    createRecord(category, counter)
  );

  counter++;
}

const finalRecords = [
  ...existingLines,
  ...newRecords.map(record =>
    JSON.stringify(record)
  )
];

fs.writeFileSync(
  filePath,
  finalRecords.join("\n"),
  "utf8"
);

console.log("");
console.log("✅ Breed training dataset expanded.");
console.log(`Original records: ${existingLines.length}`);
console.log(`Added records: ${newRecords.length}`);
console.log(`Total records: ${finalRecords.length}`);
console.log("");
console.log("Next: run the dataset validator.");