/**
 * SmartCoop Health Checker Engine
 * ---------------------------------
 * Replaces the Gemini placeholder in healthCheckerRoutes.js. Produces the
 * exact `analysis` shape the existing frontend (health-checker.js) and
 * `health_checks` table already expect:
 *   { possibleConcern, priority, summary, symptomMatch,
 *     recommendedActions[4], prevention[4], veterinaryGuidance }
 *
 * 90% Knowledge Base : weighted rule matching against diseases.json, with
 *    a specificity discount so symptoms shared by many conditions count
 *    less than symptoms unique to one or two conditions.
 * 10% Machine Learning : Multinomial Naive Bayes trained offline with
 *    scikit-learn (see ml/train_ml_model.py) on the same knowledge base,
 *    ported here as pure JS so no Python process runs at request time.
 *
 * Hard constraint: only symptom IDs present in symptoms.json are ever
 * used in scoring. Anything else passed in is silently ignored.
 */

const fs = require("fs");
const path = require("path");

const RULE_WEIGHT = 0.9;
const ML_WEIGHT = 0.1;

function loadJSON(filename) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "data", filename), "utf-8"));
}

class HealthCheckerEngine {
  constructor() {
    const symptomsFile = loadJSON("symptoms.json");
    const diseasesFile = loadJSON("diseases.json");
    const mlWeights = loadJSON("ml_weights.json");

    this.validSymptomIds = new Set(symptomsFile.symptoms.map((s) => s.id));
    this.diseases = diseasesFile.diseases;
    this.ml = mlWeights;
    this.specificity = this._computeSpecificity();
  }

  _computeSpecificity() {
    const diseaseCountBySymptom = new Map();
    for (const disease of this.diseases) {
      for (const symptomId of Object.keys(disease.symptomWeights)) {
        diseaseCountBySymptom.set(symptomId, (diseaseCountBySymptom.get(symptomId) || 0) + 1);
      }
    }
    const totalDiseases = this.diseases.length;
    const multipliers = new Map();
    for (const [symptomId, count] of diseaseCountBySymptom.entries()) {
      multipliers.set(symptomId, Math.sqrt(totalDiseases / count));
    }
    return multipliers;
  }

  _ruleBasedScore(disease, selectedSet) {
    let matchedWeighted = 0;
    let totalWeighted = 0;
    const matchedSymptoms = [];

    for (const [symptomId, weight] of Object.entries(disease.symptomWeights)) {
      const multiplier = this.specificity.get(symptomId) || 1;
      const adjustedWeight = weight * multiplier;
      totalWeighted += adjustedWeight;

      if (selectedSet.has(symptomId)) {
        matchedWeighted += adjustedWeight;
        matchedSymptoms.push(symptomId);
      }
    }

    if (matchedSymptoms.length === 0) return { score: 0, matchedSymptoms };
    return { score: (matchedWeighted / totalWeighted) * 100, matchedSymptoms };
  }

  _mlScores(selectedSet) {
    const { featureOrder, classOrder, classLogPrior, featureLogProb } = this.ml;
    const x = featureOrder.map((id) => (selectedSet.has(id) ? 1 : 0));

    const jll = classOrder.map((_, classIndex) => {
      let sum = classLogPrior[classIndex];
      for (let i = 0; i < x.length; i++) {
        if (x[i] === 1) sum += featureLogProb[classIndex][i];
      }
      return sum;
    });

    const maxLog = Math.max(...jll);
    const exps = jll.map((v) => Math.exp(v - maxLog));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    const probabilities = exps.map((v) => (v / sumExps) * 100);

    const scoreByDiseaseId = new Map();
    classOrder.forEach((id, i) => scoreByDiseaseId.set(id, probabilities[i]));
    return scoreByDiseaseId;
  }

  _priorityFromScore(score, override) {
    if (override) return override;
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  /**
   * @param {string[]} rawSymptomIds - symptom IDs as sent by the frontend
   *   (checkbox values, e.g. "sneezing", "wateryEyes")
   * @returns {{ success: boolean, source: string, fallback: boolean,
   *             selectedSymptoms: string[], analysis: object|null, message?: string }}
   *   Shape matches exactly what healthCheckerRoutes.js's /analyze
   *   response already sends to the frontend.
   */
  analyze(rawSymptomIds) {
    const cleanSymptoms = [...new Set((rawSymptomIds || []).filter((id) => this.validSymptomIds.has(id)))];

    if (cleanSymptoms.length === 0) {
      return {
        success: false,
        message: "No valid symptoms were provided.",
      };
    }

    const selectedSet = new Set(cleanSymptoms);
    if (cleanSymptoms.length < 2) {
  return {
    success: true,
    source: "SmartCoop Knowledge Base",
    fallback: false,
    selectedSymptoms: cleanSymptoms,
    analysis: {
      possibleConcern: "Insufficient Symptoms for Reliable Assessment",
      priority: "low",
      summary:
        "Only one symptom was selected. This is not enough to identify a specific possible health concern reliably. Please select any other symptoms you observe.",
      symptomMatch: 0,
      recommendedActions: [
        "Observe the chicken closely for additional symptoms.",
        "Check its appetite, activity level, breathing, and droppings.",
        "Keep the affected bird in a clean and comfortable environment.",
        "Consult a veterinarian if the symptom persists or becomes worse."
      ],
      prevention: [
        "Perform regular flock health checks.",
        "Maintain clean feed and drinking water.",
        "Keep the coop clean, dry, and well-ventilated.",
        "Practice proper biosecurity."
      ],
      veterinaryGuidance:
        "A single symptom may be associated with many different conditions. Seek veterinary assistance if the symptom is severe, persistent, or worsening."
    }
  };
}
    const mlScores = this._mlScores(selectedSet);

    const ranked = this.diseases
      .map((disease) => {
        const { score: ruleScore, matchedSymptoms } = this._ruleBasedScore(disease, selectedSet);
        if (matchedSymptoms.length === 0) return null;

        const mlScore = mlScores.get(disease.id) || 0;
        const finalScore = ruleScore * RULE_WEIGHT + mlScore * ML_WEIGHT;

        return { disease, finalScore, matchedSymptoms };
      })
      .filter((r) => r !== null)
      .sort((a, b) => b.finalScore - a.finalScore);

    if (ranked.length === 0) {
      return {
        success: true,
        source: "SmartCoop Knowledge Base",
        fallback: false,
        selectedSymptoms: cleanSymptoms,
        analysis: {
          possibleConcern: "General Poultry Health Concern",
          priority: "medium",
          summary:
            "The selected symptoms did not clearly match a specific condition in the SmartCoop knowledge base.",
          symptomMatch: 0,
          recommendedActions: [
            "Observe the affected bird(s) closely over the next 24-48 hours.",
            "Provide clean drinking water and normal feed access.",
            "Keep the coop clean, dry, and well-ventilated.",
            "Consult a veterinarian if symptoms persist, worsen, or spread.",
          ],
          prevention: [
            "Maintain good coop sanitation.",
            "Avoid overcrowding.",
            "Perform regular flock health checks.",
            "Practice good biosecurity.",
          ],
          veterinaryGuidance:
            "Seek veterinary assistance if symptoms are severe, worsening, spreading through the flock, or difficult to identify.",
        },
      };
    }

    const top = ranked[0];
    const confidence = Math.min(95, Math.round(top.finalScore * 10) / 10);

if (confidence < 40) {
  return {
    success: true,
    source: "SmartCoop Knowledge Base + ML (scikit-learn)",
    fallback: false,
    selectedSymptoms: cleanSymptoms,
    analysis: {
      possibleConcern:
        "Insufficient Evidence for a Specific Health Concern",

      priority: "low",

      summary:
        "The selected symptoms do not strongly match a specific health condition in the SmartCoop knowledge base. Continue observing the chicken and select any additional symptoms you notice.",

      symptomMatch: confidence,

      recommendedActions: [
        "Observe the chicken closely for additional symptoms.",
        "Monitor appetite, activity, breathing, and droppings.",
        "Provide clean drinking water and normal feed access.",
        "Consult a veterinarian if symptoms persist or worsen."
      ],

      prevention: [
        "Perform regular flock health checks.",
        "Maintain clean feed and drinking water.",
        "Keep the coop clean, dry, and well-ventilated.",
        "Practice proper biosecurity."
      ],

      veterinaryGuidance:
        "The current symptom pattern is not strong enough to suggest a specific health concern. Seek veterinary assistance if symptoms are severe, persistent, worsening, or spreading."
    }
  };
}

    return {
      success: true,
      source: "SmartCoop Knowledge Base + ML (scikit-learn)",
      fallback: false,
      selectedSymptoms: cleanSymptoms,
      analysis: {
        possibleConcern: top.disease.name,
        priority: this._priorityFromScore(top.finalScore, top.disease.priorityOverride),
        summary: `The selected symptoms show similarities with the ${top.disease.name.toLowerCase()} pattern in the SmartCoop poultry health knowledge base.`,
        symptomMatch: confidence,
        recommendedActions: top.disease.recommendedActions,
        prevention: top.disease.prevention,
        veterinaryGuidance: top.disease.veterinaryGuidance,
      },
    };
  }
}

module.exports = HealthCheckerEngine;

// ---- Self-test when run directly: `node healthCheckerEngine.js` ----
if (require.main === module) {
  const engine = new HealthCheckerEngine();

  const testCases = [
    ["sneezing", "wateryEyes", "reducedAppetite"],
    ["skinLesions", "swelling"],
    ["lameness", "swelling", "droppedWings"],
    ["diarrhea", "paleComb", "lethargy", "reducedAppetite"],
    ["swelling", "paleComb", "lethargy", "eggProblems"],
  ];

  for (const symptoms of testCases) {
    const { analysis } = engine.analyze(symptoms);
    console.log(`\n${symptoms.join(", ")}`);
    console.log(
      `  -> ${analysis.possibleConcern} (${analysis.priority}, ${analysis.symptomMatch}% match)`
    );
  }
}
