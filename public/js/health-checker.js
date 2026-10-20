const symptomLabels = {
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

let isHealthSaving = false;
let isHealthSaved = false;


const symptomLabelsFilipino = {
  sneezing: "Pagbahing",
  coughing: "Pag-ubo",
  wateryEyes: "Pagluluha ng mata",
  nasalDischarge: "Pagtulo ng sipon",
  diarrhea: "Pagtatae",
  reducedAppetite: "Kawalan ng gana sa pagkain",
  lethargy: "Panghihina",
  droppedWings: "Nakalaylay na mga pakpak",
  paleComb: "Maputlang palong at lambi",
  featherLoss: "Hindi pangkaraniwang pagkalagas ng balahibo",
  skinLesions: "Mga sugat sa balat",
  swelling: "Pamamaga ng mukha o mga paa",
  lameness: "Pagkapilay",
  eggProblems: "Problema sa pangingitlog"
};

let healthLanguage = "en";
let lastHealthResult = null;
let lastHealthHistory = null;

function healthText(en, fil) {
  return healthLanguage === "fil" ? fil : en;
}

function escapeHealthHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[character]);
}



const healthPageTranslations = {
  "Select Symptoms": "Pumili ng mga Sintomas",
  "Check all symptoms you observe in your chickens.": "Piliin ang lahat ng sintomas na napapansin mo sa iyong mga manok.",
  "Respiratory": "Paghinga",
  "Digestive": "Pagtunaw ng Pagkain",
  "General": "Pangkalahatan",
  "Skin & Feathers": "Balat at Balahibo",
  "Physical": "Pisikal",
  "Production": "Produksyon",
  "Selected Symptoms": "Mga Napiling Sintomas",
  "Analyze Symptoms": "Suriin ang mga Sintomas",
  "AI Health Analysis": "Pagsusuri ng AI sa Kalusugan",
  "Your health assessment will appear here.": "Dito lalabas ang resulta ng pagsusuri sa kalusugan.",
  "Recent Health Checks": "Mga Kamakailang Pagsusuri",
  "Your recently saved health assessments.": "Mga kamakailan mong na-save na pagsusuri sa kalusugan.",
  "AI-Powered Health Analysis": "Pagsusuri sa Kalusugan Gamit ang AI",
  "Select the symptoms you observe in your chickens and SmartCoop will analyze them to identify possible health concerns and provide care recommendations.": "Piliin ang mga sintomas na napansin sa mga manok upang masuri ng SmartCoop ang posibleng problema sa kalusugan at makapagbigay ng gabay sa pag-aalaga."

};


function translateHealthPage() {
  const elements = document.querySelectorAll(
    ".health-checker-page h2, .health-checker-page h3, .health-checker-page p, .health-selected-summary span, #analyzeHealthBtn"
  );

  elements.forEach(element => {
    if (element.children.length > 0) return;

    if (!element.dataset.originalText) {
      const text = element.textContent.trim();

      if (healthPageTranslations[text]) {
        element.dataset.originalText = text;
      } else {
        const original = Object.keys(healthPageTranslations).find(key => healthPageTranslations[key] === text);
        if (original) element.dataset.originalText = original;
      }
    }

    const original = element.dataset.originalText;

    if (!original) return;

    element.textContent =
      healthLanguage === "fil"
        ? healthPageTranslations[original] || original
        : original;
  });
}


function toggleHealthLanguage() {
  healthLanguage = healthLanguage === "en" ? "fil" : "en";

  const languageText = document.getElementById("healthLanguageText");

  if (languageText) {
    languageText.textContent =
      healthLanguage === "en" ? "Filipino" : "English";
  }

  document.documentElement.lang =
    healthLanguage === "fil" ? "fil" : "en";

  const labels =
    healthLanguage === "fil"
      ? symptomLabelsFilipino
      : symptomLabels;

  document.querySelectorAll(
    ".health-symptoms-panel input[type='checkbox']"
  ).forEach(input => {
    const span = input.parentElement.querySelector("span");

    if (span) {
      span.textContent = labels[input.value] || input.value;
    }
  });
  translateHealthPage();
  if (lastHealthResult && document.querySelector("#healthResult .health-result-modern")) {
    displayHealthResult(...lastHealthResult, true);
  } else {
    // Handles the initial, reset, loading, and error screens.
    translateHealthPage();
  }
  if (lastHealthHistory !== null) renderHealthHistory(lastHealthHistory);
  const overlay = document.getElementById("healthUpgradeOverlay");
  if (overlay) {
    const heading = overlay.querySelector("h2");
    const later = overlay.querySelector(".upgrade-later-btn");
    const premium = overlay.querySelector(".upgrade-premium-btn");
    if (heading) heading.textContent = healthText("Free Limit Reached", "Naabot ang Libreng Limitasyon");
    if (later) later.textContent = healthText("Maybe Later", "Sa Susunod Na Lang");
    if (premium) premium.innerHTML = `<i data-lucide="crown"></i> ${healthText("Upgrade to Premium", "Mag-upgrade sa Premium")}`;
  }

  const analyzeButton = document.getElementById("analyzeHealthBtn");

  if (analyzeButton && !analyzeButton.disabled) {
    analyzeButton.innerHTML = `
      <i data-lucide="activity"></i>
      ${healthLanguage === "fil"
        ? "Suriin ang mga Sintomas"
        : "Analyze Symptoms"}
    `;

    if (window.lucide) {
      lucide.createIcons();
    }
  }
}


document.addEventListener("DOMContentLoaded", function () {
  setupHealthChecker();
  loadHealthHistory();

  if (window.lucide) {
    lucide.createIcons();
  }
});

function setupHealthChecker() {
  const checkboxes = document.querySelectorAll(
    ".health-symptoms-panel input[type='checkbox']"
  );

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener(
      "change",
      updateSelectedSymptomCount
    );
  });

  updateSelectedSymptomCount();
}

function getSelectedSymptoms() {
  return [
    ...document.querySelectorAll(
      ".health-symptoms-panel input[type='checkbox']:checked"
    )
  ].map(input => input.value);
}

function updateSelectedSymptomCount() {
  const count =
    getSelectedSymptoms().length;

  const countElement =
    document.getElementById(
      "selectedSymptomCount"
    );

  if (countElement) {
    countElement.textContent =
      count;
  }
}

function getCurrentUserId() {
  let user = null;

  try {
    user =
      JSON.parse(
        localStorage.getItem("user") ||
        localStorage.getItem(
          "smartcoopUser"
        ) ||
        "null"
      );
  } catch (error) {
    console.error(
      "User Data Error:",
      error
    );

    return null;
  }

  if (!user) {
    return null;
  }

  return (
    user.UserID ||
    user.userId ||
    user.id ||
    null
  );
}

async function analyzeSymptoms() {
  const selectedSymptoms =
    getSelectedSymptoms();

  if (
    selectedSymptoms.length === 0
  ) {
    alert(
      healthText("Please select at least one symptom.", "Pumili muna ng kahit isang sintomas.")
    );

    return;
  }

  const userId =
  getCurrentUserId();

if (!userId) {
  alert(
    "User information could not be found. Please log in again."
  );

  return;
}

  const result =
    document.getElementById(
      "healthResult"
    );

  const button =
    document.getElementById(
      "analyzeHealthBtn"
    );

  if (!result) {
    return;
  }

  if (button) {
    button.disabled = true;

  button.innerHTML = `
    <i data-lucide="loader-circle"></i>
    ${healthLanguage === "fil"
      ? "Sinusuri ang mga Sintomas..."
      : "Analyzing Symptoms..."}
  `;
  }

  result.innerHTML = `
    <div class="health-analysis-heading">

      <div class="health-step">
        2
      </div>

      <div>
        <h2>
          ${healthLanguage === "fil"
            ? "Pagsusuri ng AI sa Kalusugan"
            : "AI Health Analysis"}
        </h2>
        <p>
          ${healthLanguage === "fil"
            ? "Sinusuri ng SmartCoop AI ang mga napiling sintomas."
            : "SmartCoop AI is reviewing the selected symptoms."}
        </p>
      </div>

    </div>

    <div class="health-analysis-loading">

      <div class="health-loading-icon">
        <i data-lucide="loader-circle"></i>
      </div>

      <h2>
        ${healthLanguage === "fil"
          ? "Sinusuri ang mga Sintomas"
          : "Analyzing Symptoms"}
      </h2>

      <p>
        ${healthLanguage === "fil"
          ? "Inihahambing ng SmartCoop ang mga napiling sintomas sa impormasyon tungkol sa kalusugan ng mga manok."
          : "SmartCoop is comparing the selected symptoms with poultry health reference information."}
      </p>
    </div>
  `;

  if (window.lucide) {
    lucide.createIcons();
  }

  try {
    const response =
      await fetch(
        "/api/health-checker/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            userId,
            symptoms: selectedSymptoms
          })
        }
      );

    const data =
      await response.json();

      if (response.status === 429) {
  showHealthUpgradePopup(
    data.message ||
    "You have used all 3 free Health Checker attempts. Upgrade to Premium for unlimited health analysis."
  );

  return;
}

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "Unable to analyze symptoms."
      );
    }

    displayHealthResult(
      data.analysis,
      selectedSymptoms,
      data.source,
      data.fallback
    );

  } catch (error) {
    console.error(
      "Health Checker Error:",
      error
    );

    displayHealthError(
      error.message ||
      "Unable to analyze symptoms."
    );

  } finally {
    if (button) {
      button.disabled = false;

    button.innerHTML = `
      <i data-lucide="activity"></i>
      ${healthLanguage === "fil"
        ? "Suriin ang mga Sintomas"
        : "Analyze Symptoms"}
    `;
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  }
}

function displayHealthResult(
  analysis,
  selectedSymptoms,
  source,
  fallback,
  preserveState = false
) {
  const result =
    document.getElementById(
      "healthResult"
    );

  if (!result) {
    return;
  }
  
  if (!preserveState) {
    isHealthSaving = false;
    isHealthSaved = false;
    lastHealthResult = [analysis, selectedSymptoms, source, fallback];
  }


  const severity =
    analysis.priority ||
    "medium";

  const severityText = getSeverityText(severity);

  const selectedLabels = selectedSymptoms.map(symptom =>
    (healthLanguage === "fil" ? symptomLabelsFilipino : symptomLabels)[symptom] || symptom
  );
  const englishSelectedLabels = selectedSymptoms.map(symptom => symptomLabels[symptom] || symptom);

  const recommendedActions =
    Array.isArray(
      analysis.recommendedActions
    )
      ? analysis.recommendedActions
      : [];

  const prevention =
    Array.isArray(
      analysis.prevention
    )
      ? analysis.prevention
      : [];

  const match =
    Number(
      analysis.symptomMatch
    ) || 0;

  result.innerHTML = `
    <div class="health-analysis-heading">

      <div class="health-step">
        2
      </div>

      <div>
        <h2>
          ${healthLanguage === "fil"
            ? "Pagsusuri ng AI sa Kalusugan"
            : "AI Health Assessment"}
        </h2>
        <p>
          ${
            fallback
              ? (healthLanguage === "fil"
                  ? "Gabay sa kalusugan ng mga manok batay sa dataset ng SmartCoop."
                  : "SmartCoop dataset-based health guidance.")
              : (healthLanguage === "fil"
                  ? "Gabay sa kalusugan ng SmartCoop gamit ang knowledge-based at machine learning analysis."
                  : "SmartCoop health guidance powered by knowledge-based and machine learning analysis.")
          }
        </p>
      </div>

    </div>

    <div class="health-result-modern">

      <div class="health-result-top">

        <div class="health-result-symbol">
          <i data-lucide="heart-pulse"></i>
        </div>

        <div class="health-result-main">

          <span>
            ${healthLanguage === "fil"
              ? "Posibleng Problema sa Kalusugan"
              : "Possible Health Concern"}
          </span>

          <h2>
            ${
              escapeHealthHtml(analysis.possibleConcern || healthText("General Poultry Health Concern", "Pangkalahatang Problema sa Kalusugan ng Manok"))
            }
          </h2>

          <div class="health-result-badges">

            <span
              class="health-risk-badge ${severity}"
            >
              ${severityText}
            </span>

          <span class="health-confidence">
            <i data-lucide="scan-search"></i>

            ${healthLanguage === "fil"
              ? "Pagkakatugma ng mga Sintomas:"
              : "Symptom Match:"}
            ${match}%
          </span>

          </div>

        </div>

      </div>

        ${
          analysis.description || analysis.summary
            ? `
                <div class="health-observed">

                <h3>
                  <i data-lucide="sparkles"></i>
                  ${healthLanguage === "fil"
                    ? "Pagsusuri ng AI"
                    : "AI Assessment"}
                </h3>

                  ${
                    analysis.description
                      ? `
                          <p>         
                            <strong>
                              ${healthLanguage === "fil"
                                ? "Tungkol sa Sakit:"
                                : "About the Disease:"}
                            </strong>
                            ${escapeHealthHtml(analysis.description)}
                          </p>
                        `
                      : ""
                  }

                  ${
                    analysis.summary
                      ? `
                          <p>                           
                            <strong>
                              ${healthLanguage === "fil"
                                ? "Pagsusuri:"
                                : "Assessment:"}
                            </strong>
                            ${escapeHealthHtml(analysis.summary)}
                          </p>
                        `
                      : ""
                  }

                </div>
              `
            : ""
        }

      <div class="health-observed">


<h3>
  <i data-lucide="list-checks"></i>
  ${healthLanguage === "fil"
    ? "Mga Napansing Sintomas"
    : "Observed Symptoms"}
</h3>


        <div class="health-observed-tags">

          ${selectedLabels
            .map(
              symptom => `
                <span>
                  ${escapeHealthHtml(symptom)}
                </span>
              `
            )
            .join("")}

        </div>

      </div>

      <div class="health-result-columns">

        <div class="health-guidance-card">

          <div class="health-guidance-title">

            <div
              class="health-guidance-icon action"
            >
              <i data-lucide="clipboard-plus"></i>
            </div>

            <h3>
              ${healthText("Recommended Actions", "Mga Inirerekomendang Hakbang")}
            </h3>

          </div>

          <ul>

            ${recommendedActions
              .map(
                item => `
                  <li>
                    <i data-lucide="circle-check"></i>

                    <span>
                      ${escapeHealthHtml(item)}
                    </span>
                  </li>
                `
              )
              .join("")}

          </ul>

        </div>

        <div class="health-guidance-card">

          <div class="health-guidance-title">

            <div
              class="health-guidance-icon prevention"
            >
              <i data-lucide="shield-check"></i>
            </div>

            <h3>
              ${healthText("Prevention & Monitoring", "Pag-iwas at Pagsubaybay")}
            </h3>

          </div>

          <ul>

            ${prevention
              .map(
                item => `
                  <li>
                    <i data-lucide="circle-check"></i>

                    <span>
                      ${escapeHealthHtml(item)}
                    </span>
                  </li>
                `
              )
              .join("")}

          </ul>

        </div>

      </div>

      ${
        analysis.veterinaryGuidance
          ? `
            <div class="health-result-warning">

              <i data-lucide="stethoscope"></i>

              <p>
                <strong>
                  ${healthText("Veterinary Guidance:", "Gabay ng Beterinaryo:")}
                </strong>

                ${escapeHealthHtml(analysis.veterinaryGuidance)}
              </p>

            </div>
          `
          : ""
      }

      <div class="health-result-warning">

        <i data-lucide="triangle-alert"></i>

        <p>
          <strong>
            ${healthText("This is not a veterinary diagnosis.", "Hindi ito diagnosis ng beterinaryo.")}
          </strong>

          ${healthText(
            "SmartCoop provides AI-assisted guidance based on observable symptoms. A licensed veterinarian should evaluate serious, persistent, worsening, or uncertain conditions.",
            "Nagbibigay ang SmartCoop ng gabay gamit ang AI batay sa mga napansing sintomas. Kumonsulta sa lisensiyadong beterinaryo para sa malubha, nagpapatuloy, lumalala, o hindi tiyak na kondisyon."
          )}
        </p>

      </div>

      <div class="health-result-actions">

        <button
          type="button"
          class="health-save-btn"
          onclick="saveCurrentHealthRecord()"
        >
          <i data-lucide="save"></i>
          ${healthText("Save Health Check", "I-save ang Pagsusuri")}
        </button>

        <button
          type="button"
          class="health-reset-btn"
          onclick="resetHealthChecker()"
        >
          <i data-lucide="rotate-ccw"></i>
          ${healthText("Check Another", "Magsuri Muli")}
        </button>

      </div>

    </div>
  `;

  window.currentHealthAssessment = {
    diagnosis:
      analysis.possibleConcern ||
      "General Poultry Health Concern",

    severity,

    confidence:
      match,

    symptoms:
      englishSelectedLabels,

    summary:
      analysis.summary ||
      "",

    recommendedActions,

    prevention,

    veterinaryGuidance:
      analysis.veterinaryGuidance ||
      "",

    source:
      source ||
      "SmartCoop",

    fallback:
      Boolean(
        fallback
      )
  };

  const saveButton = result.querySelector(".health-save-btn");
  if (saveButton && (isHealthSaving || isHealthSaved)) {
    saveButton.disabled = true;
    saveButton.textContent = isHealthSaved
      ? healthText("Saved Successfully", "Matagumpay na Na-save")
      : healthText("Saving...", "Sine-save...");
  }
  if (window.lucide) lucide.createIcons();
}

function displayHealthError(
  message
) {
  const result =
    document.getElementById(
      "healthResult"
    );

  if (!result) {
    return;
  }

  result.innerHTML = `
    <div class="health-analysis-heading">

      <div class="health-step">
        2
      </div>

      <div>
        <h2>
          ${healthText("AI Health Analysis", "Pagsusuri ng AI sa Kalusugan")}
        </h2>

        <p>
          ${healthText("Unable to complete the health analysis.", "Hindi makumpleto ang pagsusuri sa kalusugan.")}
        </p>
      </div>

    </div>

    <div class="health-empty-state">

      <div class="health-heart-visual">
        <i data-lucide="triangle-alert"></i>
      </div>

      <h2>
        ${healthText("Analysis Unavailable", "Hindi Magagamit ang Pagsusuri")}
      </h2>

      <p>
        ${escapeHealthHtml(message)}
      </p>

      <div class="health-disclaimer-modern">

        <i data-lucide="info"></i>

        <p>
          ${healthText("Make sure the SmartCoop server is running, then try analyzing the symptoms again.", "Tiyaking gumagana ang SmartCoop server at subukang suriin muli ang mga sintomas.")}
        </p>

      </div>

    </div>
  `;

  if (window.lucide) {
    lucide.createIcons();
  }
}

function getSeverityText(
  severity
) {
  if (severity === "high") {
    return healthText("High Priority", "Mataas na Prayoridad");
  }

  if (severity === "medium") {
    return healthText("Medium Priority", "Katamtamang Prayoridad");
  }

  return healthText("Low Priority", "Mababang Prayoridad");
}


async function saveCurrentHealthRecord() {
  if (isHealthSaving || isHealthSaved) {
    return;
  }

  const assessment =
    window.currentHealthAssessment;


  if (!assessment) {
    alert(
      "Please analyze symptoms first."
    );

    return;
  }

  const userId =
    getCurrentUserId();

  if (!userId) {
    alert(
      "User information could not be found. Please log in again."
    );

    return;
  }


  isHealthSaving = true;

  const saveButton = document.querySelector(".health-save-btn");

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = healthText("Saving...", "Sine-save...");
  }

  try {
    const response =
      await fetch(
        "/api/health-checker/history",

        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            userId,

            possibleConcern:
              assessment.diagnosis,

            priority:
              assessment.severity,

            symptomMatch:
              assessment.confidence,

            symptoms:
              assessment.symptoms,

            summary:
              assessment.summary,

            recommendedActions:
              assessment.recommendedActions,

            prevention:
              assessment.prevention,

            veterinaryGuidance:
              assessment.veterinaryGuidance,

            source:
              assessment.source,

            fallback:
              assessment.fallback
          })
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "Unable to save health check."
      );
    }

isHealthSaved = true;

const updatedSaveButton = document.querySelector(".health-save-btn");
if (updatedSaveButton) {
  updatedSaveButton.disabled = true;
  updatedSaveButton.textContent = healthText("Saved Successfully", "Matagumpay na Na-save");
}

await loadHealthHistory();

alert(healthText("Health check saved successfully!", "Matagumpay na na-save ang pagsusuri!"));



  } catch (error) {
    console.error("Save Health Check Error:", error);

    const updatedSaveButton = document.querySelector(".health-save-btn");
    if (!isHealthSaved && updatedSaveButton) {
      updatedSaveButton.disabled = false;
      updatedSaveButton.textContent = healthText("Save Health Check", "I-save ang Pagsusuri");
    }

    alert(error.message || "Unable to save health check.");
  } finally {
    isHealthSaving = false;
  }
}


async function loadHealthHistory() {
  const container =
    document.getElementById(
      "healthHistory"
    );

  const count =
    document.getElementById(
      "healthHistoryCount"
    );

  if (!container) {
    return;
  }

  const userId =
    getCurrentUserId();

  if (!userId) {
    lastHealthHistory = null;
    container.innerHTML = `
      <div class="health-history-empty">

        <div>
          <i data-lucide="user-x"></i>
        </div>

        <h3>
          ${healthText("User Not Found", "Hindi Natagpuan ang User")}
        </h3>

        <p>
          ${healthText("Please log in again to view your health check history.", "Mag-log in muli upang makita ang history ng pagsusuri.")}
        </p>

      </div>
    `;

    if (count) {
      count.textContent =
        healthText("0 Records", "0 Tala");
    }

    if (window.lucide) {
      lucide.createIcons();
    }

    return;
  }

  try {
    const response =
      await fetch(
        `/api/health-checker/history/${userId}`
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "Unable to load health history."
      );
    }

    const records =
      Array.isArray(
        data.records
      )
        ? data.records
        : [];

    lastHealthHistory = records;
    renderHealthHistory(records);

  } catch (error) {
    console.error(
      "Load Health History Error:",
      error
    );

    lastHealthHistory = null;
    container.innerHTML = `
      <div class="health-history-empty">

        <div>
          <i data-lucide="triangle-alert"></i>
        </div>

        <h3>
          ${healthText("Unable to Load History", "Hindi Ma-load ang History")}
        </h3>

        <p>
          ${healthText("Please try again later.", "Subukan muli mamaya.")}
        </p>

      </div>
    `;

    if (count) {
      count.textContent =
        healthText("0 Records", "0 Tala");
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  }
}

function renderHealthHistory(records) {
  const container = document.getElementById("healthHistory");
  const count = document.getElementById("healthHistoryCount");
  if (!container) return;
  if (count) count.textContent = healthLanguage === "fil"
    ? `${records.length} ${records.length === 1 ? "Tala" : "Mga Tala"}`
    : `${records.length} ${records.length === 1 ? "Record" : "Records"}`;
  if (records.length === 0) {
    container.innerHTML = `
      <div class="health-history-empty">
        <div><i data-lucide="clock-3"></i></div>
        <h3>${healthText("No Health Checks Yet", "Wala Pang Pagsusuri")}</h3>
        <p>${healthText("Saved health assessments will appear here.", "Dito lalabas ang mga na-save na pagsusuri.")}</p>
      </div>`;
  } else {
    container.innerHTML = records.slice(0, 5).map(createHealthHistoryCard).join("");
  }
  if (window.lucide) lucide.createIcons();
}

function createHealthHistoryCard(
  record
) {
  const severity =
    record.severity ||
    "low";

  const createdAt =
    record.createdAt
      ? new Date(
          record.createdAt
        )
      : null;

  const validDate =
    createdAt &&
    !Number.isNaN(
      createdAt.getTime()
    );

  const date =
    validDate
      ? createdAt.toLocaleDateString()
      : "N/A";

  const time =
    validDate
      ? createdAt.toLocaleTimeString(
          [],
          {
            hour:
              "2-digit",

            minute:
              "2-digit"
          }
        )
      : "";

  return `
    <div class="health-history-item">

      <div class="health-history-item-icon">
        <i data-lucide="bird"></i>
      </div>

      <div class="health-history-item-main">

        <div class="health-history-item-title">

          <h3>
            ${
              escapeHealthHtml(record.diagnosis || healthText("Health Assessment", "Pagsusuri sa Kalusugan"))
            }
          </h3>

          <span
            class="health-risk-badge ${severity}"
          >
            ${getSeverityText(
              severity
            )}
          </span>

        </div>

        <p>
          ${healthText("Symptoms:", "Mga Sintomas:")}
          ${
            Array.isArray(
              record.symptoms
            ) &&
            record.symptoms.length > 0
              ? record.symptoms.map(symptom => {
                  const key = Object.keys(symptomLabels).find(key => symptomLabels[key] === symptom);
                  return escapeHealthHtml(healthLanguage === "fil" && key ? symptomLabelsFilipino[key] : symptom);
                }).join(", ")
              : "N/A"
          }
        </p>

        <div class="health-history-meta">

          <span>
            <i data-lucide="calendar-days"></i>
            ${date}
          </span>

          ${
            time
              ? `
                <span>
                  <i data-lucide="clock"></i>
                  ${time}
                </span>
              `
              : ""
          }

          <span>
            <i data-lucide="scan-search"></i>
            ${healthText("Match:", "Pagkakatugma:")}
            ${record.confidence || 0}%
          </span>

        </div>

      </div>

      <button
        type="button"
        class="health-history-delete"
        onclick="deleteHealthRecord(${record.id})"
        title="${healthText("Delete health check", "Burahin ang pagsusuri")}"
      >
        <i data-lucide="trash-2"></i>
      </button>

    </div>
  `;
}

async function deleteHealthRecord(
  id
) {
  const confirmed =
    confirm(
      healthText("Delete this health check?", "Burahin ang pagsusuring ito?")
    );

  if (!confirmed) {
    return;
  }

  const userId =
    getCurrentUserId();

  if (!userId) {
    alert(
      "User information could not be found."
    );

    return;
  }

  try {
    const response =
      await fetch(
        `/api/health-checker/history/${id}?userId=${userId}`,
        {
          method: "DELETE"
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "Unable to delete health check."
      );
    }

    await loadHealthHistory();

  } catch (error) {
    console.error(
      "Delete Health Check Error:",
      error
    );

    alert(
      error.message ||
      "Unable to delete health check."
    );
  }
}

function resetHealthChecker() {
  document
    .querySelectorAll(
      ".health-symptoms-panel input[type='checkbox']"
    )
    .forEach(input => {
      input.checked = false;
    });

  window.currentHealthAssessment = null;
  lastHealthResult = null;
  isHealthSaving = false;
  isHealthSaved = false;

  updateSelectedSymptomCount();

  const result =
    document.getElementById(
      "healthResult"
    );

  if (!result) {
    return;
  }

  result.innerHTML = `
    <div class="health-analysis-heading">

      <div class="health-step">
        2
      </div>

      <div>
        <h2>
          ${healthText("AI Health Analysis", "Pagsusuri ng AI sa Kalusugan")}
        </h2>

        <p>
          ${healthText("Your health assessment will appear here.", "Dito lalabas ang resulta ng pagsusuri sa kalusugan.")}
        </p>
      </div>

    </div>

    <div class="health-empty-state">

      <div class="health-heart-visual">
        <i data-lucide="heart-pulse"></i>
      </div>

      <h2>
        ${healthText("AI-Powered Health Analysis", "Pagsusuri sa Kalusugan Gamit ang AI")}
      </h2>

      <p>
        ${healthText("Select the symptoms you observe in your chickens and SmartCoop will analyze them to identify possible health concerns and provide care recommendations.", "Piliin ang mga sintomas na napansin sa mga manok upang masuri ng SmartCoop ang posibleng problema sa kalusugan at makapagbigay ng gabay sa pag-aalaga.")}
      </p>

      <div class="health-disclaimer-modern">

        <i data-lucide="triangle-alert"></i>

        <p>
          <strong>
            ${healthText("Important:", "Mahalaga:")}
          </strong>

          ${healthText("This tool provides general guidance only and does not replace professional veterinary consultation. Contact a licensed veterinarian for serious, worsening, or uncertain conditions.", "Ang tool na ito ay nagbibigay lamang ng pangkalahatang gabay at hindi kapalit ng konsultasyon sa beterinaryo. Kumonsulta sa lisensiyadong beterinaryo para sa malubha, lumalala, o hindi tiyak na kondisyon.")}
        </p>

      </div>

    </div>
  `;

  if (window.lucide) {
    lucide.createIcons();
  }
}

function showHealthUpgradePopup(message) {

  const existing =
    document.getElementById(
      "healthUpgradeOverlay"
    );

  if (existing) {
    existing.remove();
  }

  const overlay =
    document.createElement("div");

  overlay.id =
    "healthUpgradeOverlay";

  overlay.className =
    "upgrade-overlay";

  overlay.innerHTML = `
    <div class="upgrade-modal">

      <button
        type="button"
        class="upgrade-close"
        onclick="closeHealthUpgradePopup()"
      >
        ×
      </button>

      <div class="upgrade-icon">
        <i data-lucide="crown"></i>
      </div>

      <h2>
        ${healthText("Free Limit Reached", "Naabot ang Libreng Limitasyon")}
      </h2>

      <p>
        ${escapeHealthHtml(message)}
      </p>

      <div class="upgrade-actions">

        <button
          type="button"
          class="upgrade-later-btn"
          onclick="closeHealthUpgradePopup()"
        >
          ${healthText("Maybe Later", "Sa Susunod Na Lang")}
        </button>

        <button
          type="button"
          class="upgrade-premium-btn"
          onclick="window.location.href='subscription.html'"
        >
          <i data-lucide="crown"></i>
          ${healthText("Upgrade to Premium", "Mag-upgrade sa Premium")}
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );

  if (window.lucide) {
    lucide.createIcons();
  }
}


function closeHealthUpgradePopup() {

  const overlay =
    document.getElementById(
      "healthUpgradeOverlay"
    );

  if (overlay) {
    overlay.remove();
  }
}