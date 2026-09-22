document.addEventListener(
  "DOMContentLoaded",
  loadSavedRecommendations
);

function getLoggedInUser() {
  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem("smartcoop_user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

async function loadSavedRecommendations() {
  const user = getLoggedInUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userId =
    user.id ||
    user.userId;

  if (!userId) {
    console.error("User ID not found.");
    return;
  }

  const savedGrid =
    document.getElementById("savedBreedGrid");

  const savedCount =
    document.getElementById("savedCount");

  const eggCount =
    document.getElementById("eggSavedCount");

  const meatCount =
    document.getElementById("meatSavedCount");

  const dualCount =
    document.getElementById("dualSavedCount");

  const loading =
    document.getElementById("savedLoading");

  const emptyState =
    document.getElementById("emptySavedState");

  if (!savedGrid) {
    return;
  }

  try {
    const response = await fetch(
      `/api/saved-recommendations/user/${userId}`
    );

    const data =
      await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Unable to load saved recommendations."
      );
    }

    const recommendations =
      Array.isArray(data.recommendations)
        ? data.recommendations
        : [];

    if (loading) {
      loading.style.display = "none";
    }

    if (savedCount) {
      savedCount.textContent =
        recommendations.length;
    }

    const eggs =
      recommendations.filter(item =>
        String(item.bestFor || "")
          .toLowerCase()
          .includes("egg")
      ).length;

    const meat =
      recommendations.filter(item =>
        String(item.bestFor || "")
          .toLowerCase()
          .includes("meat") &&
        !String(item.bestFor || "")
          .toLowerCase()
          .includes("dual")
      ).length;

    const dual =
      recommendations.filter(item =>
        String(item.bestFor || "")
          .toLowerCase()
          .includes("dual")
      ).length;

    if (eggCount) {
      eggCount.textContent = eggs;
    }

    if (meatCount) {
      meatCount.textContent = meat;
    }

    if (dualCount) {
      dualCount.textContent = dual;
    }

    if (recommendations.length === 0) {
      savedGrid.innerHTML = "";

      if (emptyState) {
        emptyState.style.display = "flex";
      }

      if (window.lucide) {
        lucide.createIcons();
      }

      return;
    }

    if (emptyState) {
      emptyState.style.display = "none";
    }

    savedGrid.innerHTML =
      recommendations
        .map(
          recommendation =>
            createSavedBreedCard(
              recommendation
            )
        )
        .join("");

    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (error) {
    console.error(
      "Load Saved Recommendations Error:",
      error
    );

    if (loading) {
      loading.style.display = "none";
    }

    savedGrid.innerHTML = `
      <div class="saved-load-error">
        <div class="saved-empty-icon">
          <i data-lucide="circle-alert"></i>
        </div>

        <h2>Unable to Load Recommendations</h2>

        <p>
          ${
            error.message ||
            "Please try again."
          }
        </p>
      </div>
    `;

    if (window.lucide) {
      lucide.createIcons();
    }
  }
}

function createSavedBreedCard(data) {
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

  const goal =
    String(data.bestFor || "")
      .toLowerCase();

  let goalClass =
    "saved-goal-dual";

  let goalIcon =
    "scale";

  if (goal.includes("egg")) {
    goalClass =
      "saved-goal-egg";

    goalIcon =
      "egg";
  } else if (
    goal.includes("meat")
  ) {
    goalClass =
      "saved-goal-meat";

    goalIcon =
      "drumstick";
  }

  const experienceClass =
    data.experienceLevel ===
    "Beginner Friendly"
      ? "saved-exp-beginner"
      : "saved-exp-experienced";

  return `
    <article class="saved-card ${goalClass}">

      <div class="saved-card-top">

        <div class="saved-breed-main">

          <div class="saved-breed-avatar">
            <i data-lucide="bird"></i>
          </div>

          <div class="saved-breed-title">

            <div class="saved-breed-title-row">
              <h2>
                ${
                  data.breed ||
                  "Unknown Breed"
                }
              </h2>

              <i
                data-lucide="star"
                class="saved-star"
              ></i>
            </div>

            <div class="saved-card-badges">

              <span class="saved-goal-badge">
                <i data-lucide="${goalIcon}"></i>

                ${
                  data.bestFor ||
                  "N/A"
                }
              </span>

              <span class="${experienceClass}">
                <i data-lucide="bar-chart-3"></i>

                ${
                  data.experienceLevel ||
                  "N/A"
                }
              </span>

            </div>

          </div>

        </div>

      </div>

      <div class="saved-card-details">

        <div class="saved-mini-detail">

          <div class="saved-mini-icon">
            <i data-lucide="house"></i>
          </div>

          <div>
            <span>Coop Space</span>

            <div class="saved-tags">
              ${
                coopSpaces.length
                  ? coopSpaces
                      .map(
                        item =>
                          `<small>${item}</small>`
                      )
                      .join("")
                  : "<small>N/A</small>"
              }
            </div>
          </div>

        </div>

        <div class="saved-mini-detail">

          <div class="saved-mini-icon">
            <i data-lucide="sun-cloud"></i>
          </div>

          <div>
            <span>Climate</span>

            <div class="saved-tags">
              ${
                climates.length
                  ? climates
                      .map(
                        item =>
                          `<small>${item}</small>`
                      )
                      .join("")
                  : "<small>N/A</small>"
              }
            </div>
          </div>

        </div>

      </div>

      <div class="saved-why">

        <h3>Why Recommended</h3>

        <p>
          ${
            data.whyRecommended ||
            "No explanation available."
          }
        </p>

      </div>

      <div class="saved-bottom-info">

        <div class="saved-list-block">

          <h3>
            Advantages
          </h3>

          <ul>
            ${
              advantages.length
                ? advantages
                    .map(
                      item => `
                        <li>
                          <i data-lucide="circle-check"></i>
                          <span>${item}</span>
                        </li>
                      `
                    )
                    .join("")
                : `
                  <li>
                    <span>N/A</span>
                  </li>
                `
            }
          </ul>

        </div>

        <div class="saved-list-block saved-consider">

          <h3>
            Things to Consider
          </h3>

          <ul>
            ${
              considerations.length
                ? considerations
                    .map(
                      item => `
                        <li>
                          <i data-lucide="circle-alert"></i>
                          <span>${item}</span>
                        </li>
                      `
                    )
                    .join("")
                : `
                  <li>
                    <span>N/A</span>
                  </li>
                `
            }
          </ul>

        </div>

      </div>

      <div class="saved-card-actions">

        <a
          href="coop-planner.html"
          class="saved-use-btn"
        >
          <i data-lucide="box"></i>
          Use in Planner
        </a>

        <button
          type="button"
          class="saved-delete-btn"
          onclick="deleteSavedRecommendation(${data.id})"
        >
          <i data-lucide="trash-2"></i>
          Delete
        </button>

      </div>

    </article>
  `;
}

async function deleteSavedRecommendation(id) {
  const confirmed =
    confirm(
      "Remove this saved recommendation?"
    );

  if (!confirmed) {
    return;
  }

  const user =
    getLoggedInUser();

  if (!user) {
    return;
  }

  const userId =
    user.id ||
    user.userId;

  if (!userId) {
    alert("User ID not found.");
    return;
  }

  try {
    const response = await fetch(
      `/api/saved-recommendations/${id}`,
      {
        method: "DELETE",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          userId
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Unable to remove recommendation."
      );
    }

    await loadSavedRecommendations();

  } catch (error) {
    console.error(
      "Delete Saved Recommendation Error:",
      error
    );

    alert(
      error.message ||
      "Unable to remove recommendation."
    );
  }
}

if (window.lucide) {
  lucide.createIcons();
}