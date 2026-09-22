"""
SmartCoop Health Checker -- ML refinement layer (the 10%)
------------------------------------------------------------
Trains a Multinomial Naive Bayes classifier on diseases.json, the same
knowledge base the rule engine uses, so the ML layer statistically learns
which of the 14 checklist symptoms are actually distinctive for a given
condition rather than that being hand-coded. Exported to ml_weights.json
for pure-JS inference in Node -- no live Python process needed at runtime.

Re-run this script any time diseases.json or symptoms.json changes.
"""

import json
import os
import numpy as np
from sklearn.naive_bayes import MultinomialNB

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

with open(os.path.join(DATA_DIR, "symptoms.json")) as f:
    symptom_ids = [s["id"] for s in json.load(f)["symptoms"]]

with open(os.path.join(DATA_DIR, "diseases.json")) as f:
    diseases = json.load(f)["diseases"]

disease_ids = [d["id"] for d in diseases]

X = np.zeros((len(diseases), len(symptom_ids)), dtype=float)
for row, disease in enumerate(diseases):
    for symptom_id, weight in disease["symptomWeights"].items():
        col = symptom_ids.index(symptom_id)
        X[row, col] = weight

y = np.array(disease_ids)

model = MultinomialNB(alpha=1.0)
model.fit(X, y)

export = {
    "featureOrder": symptom_ids,
    "classOrder": model.classes_.tolist(),
    "classLogPrior": model.class_log_prior_.tolist(),
    "featureLogProb": model.feature_log_prob_.tolist(),
}

with open(os.path.join(DATA_DIR, "ml_weights.json"), "w") as f:
    json.dump(export, f, indent=2)

print(f"Trained on {len(diseases)} disease classes, {len(symptom_ids)} symptom features.")
print("Exported ml_weights.json")

# Sanity check against the example already shown in the system's own UI mock:
# sneezing + watery eyes + reduced appetite -> Infectious Bronchitis
sample_symptoms = ["sneezing", "wateryEyes", "reducedAppetite"]
query = np.zeros((1, len(symptom_ids)))
for s in sample_symptoms:
    query[0, symptom_ids.index(s)] = 1

proba = model.predict_proba(query)[0]
ranked = sorted(zip(model.classes_, proba), key=lambda t: -t[1])
print("\nSanity check -- symptoms:", sample_symptoms)
for disease_id, p in ranked[:3]:
    print(f"  {disease_id:30s} {p*100:.2f}%")
