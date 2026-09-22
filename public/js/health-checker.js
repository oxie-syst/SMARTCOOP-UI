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
      "Please select at least one symptom."
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
      Analyzing Symptoms...
    `;
  }

  result.innerHTML = `
    <div class="health-analysis-heading">

      <div class="health-step">
        2
      </div>

      <div>
        <h2>
          AI Health Analysis
        </h2>

        <p>
          SmartCoop AI is reviewing
          the selected symptoms.
        </p>
      </div>

    </div>

    <div class="health-analysis-loading">

      <div class="health-loading-icon">
        <i data-lucide="loader-circle"></i>
      </div>

      <h2>
        Analyzing Symptoms
      </h2>

      <p>
        SmartCoop is comparing the
        selected symptoms with poultry
        health reference information.
      </p>

    </div>
  `;

  if (window.lucide) {
    lucide.createIcons();
  }

  try {
    const response =
      await fetch(
        "http://localhost:3000/api/health-checker/analyze",
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
        Analyze Symptoms
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
  fallback
) {
  const result =
    document.getElementById(
      "healthResult"
    );

  if (!result) {
    return;
  }

  const severity =
    analysis.priority ||
    "medium";

  const severityText =
    getSeverityText(
      severity
    );

  const selectedLabels =
    selectedSymptoms.map(
      symptom =>
        symptomLabels[symptom] ||
        symptom
    );

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
          AI Health Assessment
        </h2>

        <p>
          ${
            fallback
              ? "SmartCoop dataset-based health guidance."
              : "SmartCoop health guidance powered by knowledge-based and machine learning analysis."
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
            Possible Health Concern
          </span>

          <h2>
            ${
              analysis.possibleConcern ||
              "General Poultry Health Concern"
            }
          </h2>

          <div class="health-result-badges">

            <span
              class="health-risk-badge ${severity}"
            >
              ${severityText}
            </span>

            <span
              class="health-confidence"
            >
              <i data-lucide="scan-search"></i>

              Symptom Match:
              ${match}%
            </span>

          </div>

        </div>

      </div>

      ${
        analysis.summary
          ? `
            <div class="health-observed">

              <h3>
                <i data-lucide="sparkles"></i>
                AI Assessment
              </h3>

              <p>
                ${analysis.summary}
              </p>

            </div>
          `
          : ""
      }

      <div class="health-observed">

        <h3>
          <i data-lucide="list-checks"></i>
          Observed Symptoms
        </h3>

        <div class="health-observed-tags">

          ${selectedLabels
            .map(
              symptom => `
                <span>
                  ${symptom}
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
              Recommended Actions
            </h3>

          </div>

          <ul>

            ${recommendedActions
              .map(
                item => `
                  <li>
                    <i data-lucide="circle-check"></i>

                    <span>
                      ${item}
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
              Prevention & Monitoring
            </h3>

          </div>

          <ul>

            ${prevention
              .map(
                item => `
                  <li>
                    <i data-lucide="circle-check"></i>

                    <span>
                      ${item}
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
                  Veterinary Guidance:
                </strong>

                ${analysis.veterinaryGuidance}
              </p>

            </div>
          `
          : ""
      }

      <div class="health-result-warning">

        <i data-lucide="triangle-alert"></i>

        <p>
          <strong>
            This is not a veterinary diagnosis.
          </strong>

          SmartCoop provides AI-assisted
          guidance based on observable
          symptoms. A licensed veterinarian
          should evaluate serious, persistent,
          worsening, or uncertain conditions.
        </p>

      </div>

      <div class="health-result-actions">

        <button
          type="button"
          class="health-save-btn"
          onclick="saveCurrentHealthRecord()"
        >
          <i data-lucide="save"></i>
          Save Health Check
        </button>

        <button
          type="button"
          class="health-reset-btn"
          onclick="resetHealthChecker()"
        >
          <i data-lucide="rotate-ccw"></i>
          Check Another
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
      selectedLabels,

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

  if (window.lucide) {
    lucide.createIcons();
  }
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
          AI Health Analysis
        </h2>

        <p>
          Unable to complete the
          health analysis.
        </p>
      </div>

    </div>

    <div class="health-empty-state">

      <div class="health-heart-visual">
        <i data-lucide="triangle-alert"></i>
      </div>

      <h2>
        Analysis Unavailable
      </h2>

      <p>
        ${message}
      </p>

      <div class="health-disclaimer-modern">

        <i data-lucide="info"></i>

        <p>
          Make sure the SmartCoop server
          is running, then try analyzing
          the symptoms again.
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
    return "High Priority";
  }

  if (severity === "medium") {
    return "Medium Priority";
  }

  return "Low Priority";
}

async function saveCurrentHealthRecord() {
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

  try {
    const response =
      await fetch(
        "http://localhost:3000/api/health-checker/history",
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

    await loadHealthHistory();

    alert(
      "Health check saved successfully!"
    );

  } catch (error) {
    console.error(
      "Save Health Check Error:",
      error
    );

    alert(
      error.message ||
      "Unable to save health check."
    );
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
    container.innerHTML = `
      <div class="health-history-empty">

        <div>
          <i data-lucide="user-x"></i>
        </div>

        <h3>
          User Not Found
        </h3>

        <p>
          Please log in again to view
          your health check history.
        </p>

      </div>
    `;

    if (count) {
      count.textContent =
        "0 Records";
    }

    if (window.lucide) {
      lucide.createIcons();
    }

    return;
  }

  try {
    const response =
      await fetch(
        `http://localhost:3000/api/health-checker/history/${userId}`
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

    if (count) {
      count.textContent =
        `${records.length} ${
          records.length === 1
            ? "Record"
            : "Records"
        }`;
    }

    if (
      records.length === 0
    ) {
      container.innerHTML = `
        <div class="health-history-empty">

          <div>
            <i data-lucide="clock-3"></i>
          </div>

          <h3>
            No Health Checks Yet
          </h3>

          <p>
            Saved health assessments
            will appear here.
          </p>

        </div>
      `;

      if (window.lucide) {
        lucide.createIcons();
      }

      return;
    }

    container.innerHTML =
      records
        .slice(0, 5)
        .map(
          record =>
            createHealthHistoryCard(
              record
            )
        )
        .join("");

    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (error) {
    console.error(
      "Load Health History Error:",
      error
    );

    container.innerHTML = `
      <div class="health-history-empty">

        <div>
          <i data-lucide="triangle-alert"></i>
        </div>

        <h3>
          Unable to Load History
        </h3>

        <p>
          Please try again later.
        </p>

      </div>
    `;

    if (count) {
      count.textContent =
        "0 Records";
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  }
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
              record.diagnosis ||
              "Health Assessment"
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
          Symptoms:
          ${
            Array.isArray(
              record.symptoms
            ) &&
            record.symptoms.length > 0
              ? record.symptoms.join(
                  ", "
                )
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
            Match:
            ${record.confidence || 0}%
          </span>

        </div>

      </div>

      <button
        type="button"
        class="health-history-delete"
        onclick="deleteHealthRecord(${record.id})"
        title="Delete health check"
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
      "Delete this health check?"
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
        `http://localhost:3000/api/health-checker/history/${id}?userId=${userId}`,
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

  window.currentHealthAssessment =
    null;

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
          AI Health Analysis
        </h2>

        <p>
          Your health assessment
          will appear here.
        </p>
      </div>

    </div>

    <div class="health-empty-state">

      <div class="health-heart-visual">
        <i data-lucide="heart-pulse"></i>
      </div>

      <h2>
        AI-Powered Health Analysis
      </h2>

      <p>
        Select the symptoms you observe
        in your chickens and SmartCoop
        will analyze them to identify
        possible health concerns and
        provide care recommendations.
      </p>

      <div class="health-disclaimer-modern">

        <i data-lucide="triangle-alert"></i>

        <p>
          <strong>
            Important:
          </strong>

          This tool provides general
          guidance only and does not
          replace professional veterinary
          consultation. Contact a licensed
          veterinarian for serious,
          worsening, or uncertain
          conditions.
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
        Free Limit Reached
      </h2>

      <p>
        ${message}
      </p>

      <div class="upgrade-actions">

        <button
          type="button"
          class="upgrade-later-btn"
          onclick="closeHealthUpgradePopup()"
        >
          Maybe Later
        </button>

        <button
          type="button"
          class="upgrade-premium-btn"
          onclick="window.location.href='subscription.html'"
        >
          <i data-lucide="crown"></i>
          Upgrade to Premium
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