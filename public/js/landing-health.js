const landingHealthSymptoms = {
  sneezing: "Sneezing",
  coughing: "Coughing",
  wateryEyes: "Watery eyes",
  nasalDischarge: "Nasal discharge",
  diarrhea: "Diarrhea",
  reducedAppetite: "Reduced appetite",
  lethargy: "Lethargy / Weakness",
  droppedWings: "Dropped wings",
  paleComb: "Pale comb / wattles",
  featherLoss: "Unusual feather loss",
  skinLesions: "Skin lesions / sores",
  swelling: "Swelling (face / legs)",
  lameness: "Lameness / Limping",
  eggProblems: "Egg production issues"
};

function renderLandingHealthChecker() {
  const container = document.getElementById(
    "landing-interactive-demo"
  );

  if (!container) return;

  container.style.display = "block";

  container.innerHTML = `
    <div class="landing-health-demo">
      <div class="landing-health-heading">
        <div class="landing-health-icon">♡</div>
        <div>
          <h3>Chicken Health Checker</h3>
          <p>
            Select the symptoms you observe in your chickens.
          </p>
        </div>
      </div>

      <div class="landing-health-section-title">
        <h4>Observed Symptoms</h4>
        <span id="landingHealthCount">0 selected</span>
      </div>

      <div class="landing-health-symptoms">
        ${Object.entries(landingHealthSymptoms)
          .map(([value, label]) => `
            <label class="landing-health-option">
              <input
                type="checkbox"
                value="${value}"
                class="landing-health-checkbox"
              >
              <span>${label}</span>
            </label>
          `)
          .join("")}
      </div>

      <div class="landing-health-actions">
        <button
          type="button"
          id="landingHealthAnalyze"
          class="landing-health-analyze"
          disabled
        >
          Review Selected Symptoms
        </button>

        <button
          type="button"
          id="landingHealthReset"
          class="landing-health-reset"
        >
          Clear
        </button>
      </div>

      <p id="landingHealthMessage" class="landing-health-message">
        Select at least one symptom to continue.
      </p>

      <div id="landingHealthResult" aria-live="polite"></div>

      <div class="landing-health-disclaimer">
        <strong>Important:</strong>
        This demo does not diagnose poultry diseases.
        Serious, persistent, or worsening symptoms require
        advice from a licensed veterinarian.
      </div>
    </div>
  `;

  const checkboxes = container.querySelectorAll(
    ".landing-health-checkbox"
  );

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener(
      "change",
      updateLandingHealthSelection
    );
  });

  document.getElementById(
    "landingHealthAnalyze"
  ).addEventListener(
    "click",
    reviewLandingHealthSymptoms
  );

  document.getElementById(
    "landingHealthReset"
  ).addEventListener(
    "click",
    resetLandingHealthChecker
  );

  updateLandingHealthSelection();
}

function getLandingHealthSymptoms() {
  return Array.from(
    document.querySelectorAll(
      ".landing-health-checkbox:checked"
    )
  ).map(checkbox => checkbox.value);
}

function updateLandingHealthSelection() {
  const selected = getLandingHealthSymptoms();

  const count = document.getElementById(
    "landingHealthCount"
  );

  const button = document.getElementById(
    "landingHealthAnalyze"
  );

  const message = document.getElementById(
    "landingHealthMessage"
  );

  const result = document.getElementById(
    "landingHealthResult"
  );

  if (count) {
    count.textContent =
      `${selected.length} selected`;
  }

  if (button) {
    button.disabled = selected.length === 0;
  }

  if (message) {
    message.textContent = selected.length
      ? "You can now review your selected symptoms."
      : "Select at least one symptom to continue.";
  }

  if (result) {
    result.innerHTML = "";
  }
}

function reviewLandingHealthSymptoms() {
  const selected = getLandingHealthSymptoms();

  const result = document.getElementById(
    "landingHealthResult"
  );

  if (!result || selected.length === 0) return;

  const labels = selected.map(
    symptom => landingHealthSymptoms[symptom]
  );

  const symptomTags = labels.map(label => {
    const span = document.createElement("span");
    span.className = "landing-health-tag";
    span.textContent = label;
    return span.outerHTML;
  }).join("");

  result.innerHTML = `
    <div class="landing-health-result">
      <div class="landing-health-result-header">
        <span class="landing-health-result-icon">✓</span>
        <div>
          <h4>Symptoms Recorded</h4>
          <p>
            ${selected.length} symptom(s) selected
          </p>
        </div>
      </div>

      <div class="landing-health-tags">
        ${symptomTags}
      </div>

      <div class="landing-health-guidance">
        <h4>General Health Guidance</h4>
        <ul>
          <li>
            Observe your chickens closely and
            record any changes in their condition.
          </li>
          <li>
            Provide clean drinking water,
            appropriate feed, and a clean environment.
          </li>
          <li>
            Keep chickens showing signs of illness
            separate when appropriate and practice
            good hygiene.
          </li>
          <li>
            Contact a veterinarian promptly for
            severe, persistent, or worsening symptoms.
          </li>
        </ul>
      </div>

      <div class="landing-health-full-analysis">
        <h4>Want a more detailed assessment?</h4>
        <p>
          The full SmartCoop Health Checker provides
          possible health concerns, recommended actions,
          and prevention guidance.
        </p>
        <p>
          Sign in to access the full AI-assisted
          Health Checker.
        </p>
      </div>
    </div>
  `;
}

function resetLandingHealthChecker() {
  document.querySelectorAll(
    ".landing-health-checkbox"
  ).forEach(checkbox => {
    checkbox.checked = false;
  });

  updateLandingHealthSelection();
}
