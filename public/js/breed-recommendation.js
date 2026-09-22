let currentRecommendations = [];

async function getBreedRecommendation() {
  const primaryGoal =
    document.getElementById("primaryGoal");

  const result =
    document.getElementById("breedResult");

  const button =
    document.querySelector(".breed-main-btn");

  if (!primaryGoal) {
    console.error("primaryGoal element not found.");
    return;
  }

  if (!result) {
    console.error("breedResult element not found.");
    return;
  }

  const goal = primaryGoal.value;

  if (!goal) {
    alert("Please select your primary goal.");
    return;
  }

  if (button) {
    button.disabled = true;

    button.innerHTML = `
      <i data-lucide="loader-circle"></i>
      Generating Recommendations...
    `;
  }

  result.innerHTML = `
    <div class="breed-result-header">

      <div>
        <h2>
          <i data-lucide="bird"></i>
          2. Your Recommended Breeds
        </h2>

        <p>
          SmartCoop is analyzing your selected poultry goal.
        </p>
      </div>

      <span class="breed-result-status">
        AI Powered
      </span>

    </div>

    <div class="recommendation-loading">

      <div class="empty-recommendation-icon">
        <i data-lucide="loader-circle"></i>
      </div>

      <h2>
        Finding Suitable Breeds...
      </h2>

      <p>
        SmartCoop is generating your AI breed recommendations.
      </p>

    </div>
  `;

  if (window.lucide) {
    lucide.createIcons();
  }

  try {

    const storedUser =
  localStorage.getItem("user") ||
  localStorage.getItem("smartcoop_user");

if (!storedUser) {
  throw new Error(
    "Please log in first."
  );
}

const user =
  JSON.parse(storedUser);

const userId =
  user.id ||
  user.userId ||
  user.UserID;

if (!userId) {
  throw new Error(
    "User ID not found."
  );
}

    const response = await fetch(
      "http://localhost:3000/api/breed-recommendation",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          goal: goal,
          userId: userId
        })
      }
    );

    const data = await response.json();

    if (response.status === 429) {
      showBreedUpgradePopup(
        data.message ||
        "You have used all 3 free Breed Recommendation attempts for today. Upgrade to Premium for unlimited breed recommendations."
      );

      return;
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Unable to generate recommendations."
      );
    }

    if (
      !Array.isArray(data.recommendations) ||
      data.recommendations.length === 0
    ) {
      throw new Error(
        "No recommendations were returned."
      );
    }

    currentRecommendations =
      data.recommendations;

    displayBreedRecommendations(
      currentRecommendations
    );

  } catch (error) {
    console.error(
      "Breed Recommendation Error:",
      error
    );

    result.innerHTML = `
      <div class="breed-result-header">

        <div>
          <h2>
            <i data-lucide="bird"></i>
            2. Your Recommended Breeds
          </h2>

          <p>
            Unable to complete the recommendation.
          </p>
        </div>

        <span class="breed-result-status">
          AI Powered
        </span>

      </div>

      <div class="empty-recommendation">

        <div class="empty-recommendation-icon">
          <i data-lucide="circle-alert"></i>
        </div>

        <h2>
          Unable to Generate Recommendations
        </h2>

        <p>
          ${error.message || "Please try again."}
        </p>

      </div>
    `;

    if (window.lucide) {
      lucide.createIcons();
    }

  } finally {
    if (button) {
      button.disabled = false;

      button.innerHTML = `
        <i data-lucide="sparkles"></i>
        Get AI Recommendations
      `;
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  }
}

function displayBreedRecommendations(recommendations) {
  const result =
    document.getElementById("breedResult");

  if (!result) {
    console.error("breedResult element not found.");
    return;
  }

  if (
    !Array.isArray(recommendations) ||
    recommendations.length === 0
  ) {
    result.innerHTML = `
      <div class="breed-result-header">

        <div>
          <h2>
            <i data-lucide="bird"></i>
            2. Your Recommended Breeds
          </h2>

          <p>
            No suitable breeds were returned.
          </p>
        </div>

        <span class="breed-result-status">
          AI Powered
        </span>

      </div>

      <div class="empty-recommendation">

        <div class="empty-recommendation-icon">
          <i data-lucide="circle-alert"></i>
        </div>

        <h2>
          No Recommendations Found
        </h2>

        <p>
          Try selecting another production goal.
        </p>

      </div>
    `;

    if (window.lucide) {
      lucide.createIcons();
    }

    return;
  }

  const primaryGoal =
    document.getElementById("primaryGoal");

  const goalLabels = {
    eggs: "Egg Production",
    meat: "Meat Production",
    dual: "Dual Purpose"
  };

  const selectedGoal =
    primaryGoal
      ? goalLabels[primaryGoal.value] ||
        primaryGoal.value
      : "";

  result.innerHTML = `
    <div class="breed-result-header">

      <div>

        <h2>
          <i data-lucide="bird"></i>
          2. Your Recommended Breeds
        </h2>

        <p>
          Based on your goal:
          <strong>${selectedGoal}</strong>
        </p>

      </div>

      <span class="breed-result-status">
        AI Powered
      </span>

    </div>

    <div class="ai-breed-list">

      ${recommendations
        .map(
          (recommendation, index) =>
            createBreedCard(
              recommendation,
              index
            )
        )
        .join("")}

    </div>
  `;

  if (window.lucide) {
    lucide.createIcons();
  }

  result.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function createBreedCard(data, index) {
  const coopSpaces =
    Array.isArray(data.recommendedCoopSpace)
      ? data.recommendedCoopSpace
      : [];

  const climates =
    Array.isArray(data.climateSuitability)
      ? data.climateSuitability
      : [];

  const advantages =
    Array.isArray(data.advantages)
      ? data.advantages
      : [];

  const considerations =
    Array.isArray(data.thingsToConsider)
      ? data.thingsToConsider
      : [];

  const isBeginner =
    data.experienceLevel ===
    "Beginner Friendly";

  const experienceClass =
    isBeginner
      ? "beginner-friendly"
      : "experienced-raiser";

  const recommendationLabel =
    isBeginner
      ? "Beginner Friendly"
      : "Experienced Raisers";

  const recommendationIcon =
    isBeginner
      ? "sprout"
      : "award";

  return `
    <div class="breed-result-card ${experienceClass}">

      <div class="breed-card-top">

        <div>

          <span
            class="breed-experience-badge ${experienceClass}"
          >
            <i data-lucide="${recommendationIcon}"></i>
            ${recommendationLabel}
          </span>

          <h2>
            ${data.breed || "Chicken Breed"}
          </h2>

          <p>
            ${data.bestFor || ""}
          </p>

        </div>

        <div class="breed-result-icon">
          <i data-lucide="bird"></i>
        </div>

      </div>

      <div class="breed-details-grid">

        <div class="breed-detail">

          <span>
            <i data-lucide="target"></i>
            Best For
          </span>

          <strong>
            ${data.bestFor || "N/A"}
          </strong>

        </div>

        <div class="breed-detail">

          <span>
            <i data-lucide="user-check"></i>
            Experience Level
          </span>

          <strong>
            ${data.experienceLevel || "N/A"}
          </strong>

        </div>

        <div class="breed-detail">

          <span>
            <i data-lucide="warehouse"></i>
            Recommended Coop Space
          </span>

          <div class="breed-tags">

            ${
              coopSpaces.length
                ? coopSpaces
                    .map(
                      space =>
                        `<span>${space}</span>`
                    )
                    .join("")
                : "<span>N/A</span>"
            }

          </div>

        </div>

        <div class="breed-detail">

          <span>
            <i data-lucide="cloud-sun"></i>
            Climate Suitability
          </span>

          <div class="breed-tags">

            ${
              climates.length
                ? climates
                    .map(
                      climate =>
                        `<span>${climate}</span>`
                    )
                    .join("")
                : "<span>N/A</span>"
            }

          </div>

        </div>

      </div>

      <div class="breed-explanation">

        <h3>
          <i data-lucide="circle-help"></i>
          Why Recommended
        </h3>

        <p>
          ${
            data.whyRecommended ||
            "No explanation available."
          }
        </p>

      </div>

      <div class="breed-info-columns">

        <div class="breed-info-box advantages">

          <h3>
            <i data-lucide="circle-check"></i>
            Advantages
          </h3>

          <ul>

            ${
              advantages.length
                ? advantages
                    .map(
                      advantage =>
                        `<li>${advantage}</li>`
                    )
                    .join("")
                : "<li>N/A</li>"
            }

          </ul>

        </div>

        <div class="breed-info-box considerations">

          <h3>
            <i data-lucide="triangle-alert"></i>
            Things to Consider
          </h3>

          <ul>

            ${
              considerations.length
                ? considerations
                    .map(
                      consideration =>
                        `<li>${consideration}</li>`
                    )
                    .join("")
                : "<li>N/A</li>"
            }

          </ul>

        </div>

      </div>

      <div class="breed-save-action">

        <button
          type="button"
          class="save-recommendation-btn"
          id="saveRecommendationBtn${index}"
          onclick="saveBreedRecommendation(${index})"
        >

          <i data-lucide="star"></i>
          Save Recommendation

        </button>

      </div>

    </div>
  `;
}

async function saveBreedRecommendation(index) {
  const recommendation =
    currentRecommendations[index];

  if (!recommendation) {
    alert("Recommendation not found.");
    return;
  }

  const button =
    document.getElementById(
      `saveRecommendationBtn${index}`
    );

  if (button) {
    button.disabled = true;

    button.innerHTML = `
      <i data-lucide="loader-circle"></i>
      Saving...
    `;

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  try {
    const storedUser =
      localStorage.getItem("user") ||
      localStorage.getItem("smartcoop_user");

    if (!storedUser) {
      throw new Error(
        "User is not logged in."
      );
    }

    const user =
      JSON.parse(storedUser);

    const userId =
      user.id ||
      user.userId;

    if (!userId) {
      throw new Error(
        "User ID not found."
      );
    }

    const response = await fetch(
      "http://localhost:3000/api/saved-recommendations",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          userId: userId,

          breed:
            recommendation.breed,

          bestFor:
            recommendation.bestFor,

          recommendedCoopSpace:
            recommendation.recommendedCoopSpace,

          climateSuitability:
            recommendation.climateSuitability,

          experienceLevel:
            recommendation.experienceLevel,

          whyRecommended:
            recommendation.whyRecommended,

          advantages:
            recommendation.advantages,

          thingsToConsider:
            recommendation.thingsToConsider
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
        "Unable to save recommendation."
      );
    }

    if (button) {
      button.innerHTML = `
        <i data-lucide="check"></i>
        Saved
      `;

      button.classList.add("saved");
      button.disabled = true;
    }

    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (error) {
    console.error(
      "Save Recommendation Error:",
      error
    );

    if (button) {
      button.disabled = false;

      button.innerHTML = `
        <i data-lucide="star"></i>
        Save Recommendation
      `;
    }

    if (window.lucide) {
      lucide.createIcons();
    }

    alert(
      error.message ||
      "Unable to save recommendation."
    );
  }
}

function showBreedUpgradePopup(message) {

  const existing =
    document.getElementById(
      "breedUpgradePopup"
    );

  if (existing) {
    existing.remove();
  }

  const overlay =
    document.createElement("div");

  overlay.id =
    "breedUpgradePopup";

  overlay.className =
    "upgrade-overlay";

  overlay.innerHTML = `
    <div class="upgrade-modal">

      <button
        type="button"
        class="upgrade-close"
        onclick="closeBreedUpgradePopup()"
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
        ${escapeBreedHTML(message)}
      </p>

      <div class="upgrade-actions">

        <button
          type="button"
          class="upgrade-later-btn"
          onclick="closeBreedUpgradePopup()"
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

function closeBreedUpgradePopup() {
  const popup =
    document.getElementById(
      "breedUpgradePopup"
    );

  if (popup) {
    popup.remove();
  }
}


function escapeBreedHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener(
  "DOMContentLoaded",
  function () {
    if (window.lucide) {
      lucide.createIcons();
    }
  }
);