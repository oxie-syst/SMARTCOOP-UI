const fs = require("fs");
const path = require("path");

const outputPath = path.join(
  __dirname,
  "health_training_data.jsonl"
);

const patterns = [
  {
    condition: "Respiratory Health Concern",
    category: "respiratory",
    symptoms: [
      "sneezing",
      "coughing",
      "wateryEyes",
      "nasalDischarge",
      "reducedAppetite",
      "lethargy"
    ],
    priority: "medium",
    recommendedActions: [
      "Separate visibly unwell birds from the rest of the flock.",
      "Keep the coop clean, dry, and appropriately ventilated.",
      "Provide constant access to clean drinking water.",
      "Monitor whether symptoms worsen or spread to other birds."
    ],
    prevention: [
      "Maintain appropriate coop ventilation.",
      "Clean feeders and waterers regularly.",
      "Practice good flock biosecurity.",
      "Follow appropriate poultry health and vaccination practices."
    ]
  },

  {
    condition: "Digestive Health Concern",
    category: "digestive",
    symptoms: [
      "diarrhea",
      "lethargy",
      "reducedAppetite",
      "droppedWings",
      "paleComb"
    ],
    priority: "high",
    recommendedActions: [
      "Separate visibly unwell birds and monitor them closely.",
      "Provide constant access to clean drinking water.",
      "Replace wet or dirty bedding.",
      "Seek veterinary advice if symptoms are severe or persistent."
    ],
    prevention: [
      "Keep bedding clean and dry.",
      "Maintain clean feeders and waterers.",
      "Avoid overcrowding.",
      "Maintain good coop sanitation."
    ]
  },

  {
    condition: "Skin and Feather Health Concern",
    category: "skin",
    symptoms: [
      "skinLesions",
      "featherLoss",
      "swelling",
      "reducedAppetite",
      "lethargy"
    ],
    priority: "medium",
    recommendedActions: [
      "Inspect affected birds carefully.",
      "Keep the housing environment clean and dry.",
      "Check whether other birds show similar signs.",
      "Seek veterinary advice if skin changes worsen or spread."
    ],
    prevention: [
      "Maintain clean housing.",
      "Inspect chickens regularly.",
      "Use appropriate external-parasite prevention practices.",
      "Practice good flock biosecurity."
    ]
  },

  {
    condition: "Possible Parasite-Related Concern",
    category: "parasite",
    symptoms: [
      "featherLoss",
      "paleComb",
      "lethargy",
      "reducedAppetite",
      "eggProblems"
    ],
    priority: "medium",
    recommendedActions: [
      "Inspect birds and their environment for possible parasite signs.",
      "Monitor appetite and activity.",
      "Keep housing and bedding clean and dry.",
      "Seek professional advice for appropriate assessment."
    ],
    prevention: [
      "Inspect birds regularly.",
      "Maintain clean and dry bedding.",
      "Keep housing sanitary.",
      "Follow appropriate parasite-control practices."
    ]
  },

  {
    condition: "Mobility or Physical Health Concern",
    category: "physical",
    symptoms: [
      "swelling",
      "lameness",
      "lethargy",
      "reducedAppetite",
      "droppedWings"
    ],
    priority: "medium",
    recommendedActions: [
      "Limit unnecessary movement of visibly affected birds.",
      "Inspect the environment for possible injury hazards.",
      "Provide easy access to food and clean water.",
      "Seek veterinary advice if swelling or mobility problems continue."
    ],
    prevention: [
      "Keep walking areas free from hazards.",
      "Maintain safe and dry flooring.",
      "Avoid overcrowding.",
      "Check birds regularly for physical problems."
    ]
  },

  {
    condition: "Egg Production Health Concern",
    category: "production",
    symptoms: [
      "eggProblems",
      "reducedAppetite",
      "lethargy",
      "paleComb",
      "featherLoss"
    ],
    priority: "low",
    recommendedActions: [
      "Monitor feed and water intake.",
      "Check the coop environment for possible stress factors.",
      "Observe the flock for additional symptoms.",
      "Seek professional advice if production changes persist."
    ],
    prevention: [
      "Provide appropriate poultry nutrition.",
      "Maintain constant access to clean water.",
      "Reduce unnecessary environmental stress.",
      "Monitor flock health and production regularly."
    ]
  },

  {
    condition: "General Health Concern",
    category: "general",
    symptoms: [
      "lethargy",
      "droppedWings",
      "reducedAppetite",
      "paleComb",
      "eggProblems"
    ],
    priority: "medium",
    recommendedActions: [
      "Observe affected birds closely.",
      "Provide clean water and appropriate feed.",
      "Keep birds in a clean and comfortable environment.",
      "Seek veterinary advice if the condition worsens or persists."
    ],
    prevention: [
      "Perform regular flock health checks.",
      "Maintain good sanitation.",
      "Provide appropriate nutrition.",
      "Reduce unnecessary environmental stress."
    ]
  }
];

const targetDistribution = {
  respiratory: 15,
  digestive: 15,
  skin: 14,
  parasite: 14,
  physical: 14,
  production: 14,
  general: 14
};

function combinations(items) {
  const result = [];

  for (
    let size = 2;
    size <= items.length;
    size++
  ) {
    combine(
      items,
      size,
      0,
      [],
      result
    );
  }

  return result;
}

function combine(
  items,
  size,
  start,
  current,
  result
) {
  if (
    current.length === size
  ) {
    result.push(
      [...current]
    );

    return;
  }

  for (
    let i = start;
    i < items.length;
    i++
  ) {
    current.push(
      items[i]
    );

    combine(
      items,
      size,
      i + 1,
      current,
      result
    );

    current.pop();
  }
}

function calculatePriority(
  basePriority,
  symptoms
) {
  const strongerSigns = [
    "diarrhea",
    "swelling",
    "lameness",
    "droppedWings",
    "paleComb"
  ];

  const strongerCount =
    symptoms.filter(
      symptom =>
        strongerSigns.includes(
          symptom
        )
    ).length;

  if (
    basePriority === "high" &&
    symptoms.length >= 3
  ) {
    return "high";
  }

  if (
    strongerCount >= 2
  ) {
    return "medium";
  }

  if (
    symptoms.length <= 2
  ) {
    return "low";
  }

  return basePriority;
}

function calculatePatternScore(
  symptoms
) {
  const specificSymptoms = [
    "sneezing",
    "coughing",
    "wateryEyes",
    "nasalDischarge",
    "diarrhea",
    "skinLesions",
    "featherLoss",
    "swelling",
    "lameness",
    "eggProblems"
  ];

  let score =
    symptoms.length * 10;

  for (
    const symptom
    of symptoms
  ) {
    if (
      specificSymptoms.includes(
        symptom
      )
    ) {
      score += 5;
    }
  }

  return score;
}

const records = [];

for (
  const pattern
  of patterns
) {
  const symptomSets =
    combinations(
      pattern.symptoms
    );

  for (
    const symptomSet
    of symptomSets
  ) {
    records.push({
      condition:
        pattern.condition,

      category:
        pattern.category,

      symptoms:
        symptomSet,

      priority:
        calculatePriority(
          pattern.priority,
          symptomSet
        ),

      recommendedActions:
        pattern.recommendedActions,

      prevention:
        pattern.prevention,

      score:
        calculatePatternScore(
          symptomSet
        )
    });
  }
}

const uniqueRecords = [];

const seen =
  new Set();

for (
  const record
  of records
) {
  const key =
    `${record.category}:${[
      ...record.symptoms
    ]
      .sort()
      .join("|")}`;

  if (
    seen.has(key)
  ) {
    continue;
  }

  seen.add(key);

  uniqueRecords.push(
    record
  );
}

const groupedRecords = {};

for (
  const record
  of uniqueRecords
) {
  if (
    !groupedRecords[
      record.category
    ]
  ) {
    groupedRecords[
      record.category
    ] = [];
  }

  groupedRecords[
    record.category
  ].push(
    record
  );
}

for (
  const category
  of Object.keys(
    groupedRecords
  )
) {
  groupedRecords[
    category
  ].sort(
    (a, b) => {
      if (
        b.score !==
        a.score
      ) {
        return (
          b.score -
          a.score
        );
      }

      return (
        b.symptoms.length -
        a.symptoms.length
      );
    }
  );
}

const finalRecords = [];

for (
  const [
    category,
    target
  ]
  of Object.entries(
    targetDistribution
  )
) {
  const available =
    groupedRecords[
      category
    ] || [];

  if (
    available.length <
    target
  ) {
    console.log(
      `Warning: ${category} only has ${available.length} unique records.`
    );
  }

  const selected =
    available.slice(
      0,
      target
    );

  for (
    const record
    of selected
  ) {
    finalRecords.push({
      condition:
        record.condition,

      category:
        record.category,

      symptoms:
        record.symptoms,

      priority:
        record.priority,

      recommendedActions:
        record.recommendedActions,

      prevention:
        record.prevention
    });
  }
}

finalRecords.sort(
  (a, b) => {
    if (
      a.category <
      b.category
    ) {
      return -1;
    }

    if (
      a.category >
      b.category
    ) {
      return 1;
    }

    return (
      b.symptoms.length -
      a.symptoms.length
    );
  }
);

const jsonl =
  finalRecords
    .map(
      record =>
        JSON.stringify(
          record
        )
    )
    .join("\n");

fs.writeFileSync(
  outputPath,
  jsonl,
  "utf8"
);

const categoryCounts = {};

for (
  const record
  of finalRecords
) {
  categoryCounts[
    record.category
  ] =
    (
      categoryCounts[
        record.category
      ] ||
      0
    ) + 1;
}

console.log(
  `Health dataset generated: ${finalRecords.length} records`
);

console.log(
  "Category distribution:",
  categoryCounts
);

const duplicateCheck =
  new Set();

let duplicates = 0;

for (
  const record
  of finalRecords
) {
  const key =
    `${record.category}:${[
      ...record.symptoms
    ]
      .sort()
      .join("|")}`;

  if (
    duplicateCheck.has(
      key
    )
  ) {
    duplicates++;
  }

  duplicateCheck.add(
    key
  );
}

console.log(
  `Duplicate symptom patterns: ${duplicates}`
);

if (
  finalRecords.length ===
  100 &&
  duplicates === 0
) {
  console.log(
    "Health dataset validation passed."
  );
} else {
  console.log(
    "Health dataset validation needs review."
  );
}