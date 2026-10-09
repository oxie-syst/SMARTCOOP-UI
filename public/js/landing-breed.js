(() => {
  const sampleBreeds = {
    eggs: [
      {
        breed: "ISA Brown",
        bestFor: "Egg Production",
        experienceLevel: "Beginner Friendly",
        recommendedCoopSpace: [
          "Plan enough space for flock size",
          "Provide nesting boxes"
        ],
        climateSuitability: [
          "Suitable with proper ventilation",
          "Protect from extreme heat"
        ],
        whyRecommended:
          "ISA Brown is a commercial laying hybrid known for strong egg production when properly managed.",
        advantages: [
          "Developed for egg production",
          "Suitable for organized egg collection"
        ],
        thingsToConsider: [
          "Requires balanced layer feed",
          "Provide clean water and nesting areas"
        ]
      },
      {
        breed: "White Leghorn",
        bestFor: "Egg Production",
        experienceLevel: "Experienced Raisers",
        recommendedCoopSpace: [
          "Provide adequate movement space",
          "Secure housing"
        ],
        climateSuitability: [
          "Adaptable with appropriate management"
        ],
        whyRecommended:
          "White Leghorns are recognized as productive egg-laying chickens.",
        advantages: [
          "Good egg-laying potential",
          "Relatively light-bodied"
        ],
        thingsToConsider: [
          "Can be active and alert",
          "Requires secure housing"
        ]
      }
    ],

    meat: [
      {
        breed: "Cobb 500",
        bestFor: "Meat Production",
        experienceLevel: "Beginner Friendly",
        recommendedCoopSpace: [
          "Allow adequate floor space",
          "Keep bedding clean and dry"
        ],
        climateSuitability: [
          "Needs effective temperature management",
          "Good ventilation is important"
        ],
        whyRecommended:
          "Cobb 500 is a commercial broiler strain developed for meat production.",
        advantages: [
          "Selected for meat production",
          "Commonly used in broiler farming"
        ],
        thingsToConsider: [
          "Careful feeding and daily monitoring",
          "Avoid overcrowding and heat stress"
        ]
      },
      {
        breed: "Ross 308",
        bestFor: "Meat Production",
        experienceLevel: "Experienced Raisers",
        recommendedCoopSpace: [
          "Provide sufficient floor space",
          "Maintain dry litter"
        ],
        climateSuitability: [
          "Requires suitable temperature control"
        ],
        whyRecommended:
          "Ross 308 is another commercial broiler strain commonly used for meat production.",
        advantages: [
          "Developed for broiler production",
          "Widely used in commercial poultry systems"
        ],
        thingsToConsider: [
          "Monitor growth and flock health",
          "Maintain proper housing conditions"
        ]
      }
    ],

    dual: [
      {
        breed: "Rhode Island Red",
        bestFor: "Egg and Meat Production",
        experienceLevel: "Beginner Friendly",
        recommendedCoopSpace: [
          "Provide appropriate coop and run space",
          "Include nesting boxes"
        ],
        climateSuitability: [
          "Adaptable with proper housing",
          "Provide shade in hot weather"
        ],
        whyRecommended:
          "Rhode Island Red is a traditional dual-purpose breed raised for eggs and meat.",
        advantages: [
          "Can produce eggs and meat",
          "Useful for small poultry farms"
        ],
        thingsToConsider: [
          "Production varies by individual and line",
          "Provide suitable nutrition"
        ]
      },
      {
        breed: "Plymouth Rock",
        bestFor: "Egg and Meat Production",
        experienceLevel: "Beginner Friendly",
        recommendedCoopSpace: [
          "Provide room for movement",
          "Include nesting and resting areas"
        ],
        climateSuitability: [
          "Adaptable with appropriate care"
        ],
        whyRecommended:
          "Plymouth Rock is a well-known dual-purpose breed used for both egg and meat production.",
        advantages: [
          "Versatile production purpose",
          "Suitable for backyard flock planning"
        ],
        thingsToConsider: [
          "Generally slower-growing than commercial broilers",
          "Egg output varies by flock"
        ]
      }
    ]
  };

  const labels = {
    eggs: "Egg Production",
    meat: "Meat Production",
    dual: "Dual Purpose"
  };

  const escapeHTML = value =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const tags = values =>
    values.map(value =>
      `<span class="lb-tag">${escapeHTML(value)}</span>`
    ).join("");

  const list = values =>
    values.map(value =>
      `<li>${escapeHTML(value)}</li>`
    ).join("");

  function breedCard(breed, index) {
    const beginner =
      breed.experienceLevel === "Beginner Friendly";

    return `
      <article class="lb-card">
        <div class="lb-card-header">
          <div>
            <span class="lb-level">
              ${beginner ? "🌱" : "🏅"}
              ${escapeHTML(breed.experienceLevel)}
            </span>
            <h4>${index + 1}. ${escapeHTML(breed.breed)}</h4>
            <p>${escapeHTML(breed.bestFor)}</p>
          </div>
          <span class="lb-bird">🐔</span>
        </div>

        <div class="lb-details">
          <div>
            <span>Best For</span>
            <strong>${escapeHTML(breed.bestFor)}</strong>
          </div>
          <div>
            <span>Experience Level</span>
            <strong>${escapeHTML(breed.experienceLevel)}</strong>
          </div>
          <div>
            <span>Recommended Coop Space</span>
            <div class="lb-tags">
              ${tags(breed.recommendedCoopSpace)}
            </div>
          </div>
          <div>
            <span>Climate Suitability</span>
            <div class="lb-tags">
              ${tags(breed.climateSuitability)}
            </div>
          </div>
        </div>

        <div class="lb-why">
          <h5>Why Recommended</h5>
          <p>${escapeHTML(breed.whyRecommended)}</p>
        </div>

        <div class="lb-columns">
          <div class="lb-info lb-advantages">
            <h5>✓ Advantages</h5>
            <ul>${list(breed.advantages)}</ul>
          </div>
          <div class="lb-info lb-considerations">
            <h5>Things to Consider</h5>
            <ul>${list(breed.thingsToConsider)}</ul>
          </div>
        </div>
      </article>
    `;
  }

  window.renderLandingBreedRecommendation = function () {
    const container = document.getElementById(
      "landing-interactive-demo"
    );

    if (!container) return;

    container.style.display = "block";

    container.innerHTML = `
      <section class="landing-breed-demo">
        <div class="lb-top">
          <div>
            <h3>🐔 AI Breed Recommendation</h3>
            <p>
              Explore how SmartCoop helps you choose
              chickens based on your production goal.
            </p>
          </div>
          <span class="lb-badge">DEMO MODE</span>
        </div>

        <div class="lb-selection">
          <h4>1. Select Your Poultry Goal</h4>
          <label for="landingBreedGoal">
            What is your primary goal?
          </label>

          <select id="landingBreedGoal">
            <option value="">Select a production goal</option>
            <option value="eggs">Egg Production</option>
            <option value="meat">Meat Production</option>
            <option value="dual">Dual Purpose</option>
          </select>

          <button
            type="button"
            id="landingBreedGenerate"
            class="lb-generate">
            ✨ Get Sample Recommendations
          </button>
        </div>

        <div id="landingBreedResult" class="lb-results">
          <div class="lb-empty">
            <span>🐣</span>
            <h4>Your Recommended Breeds</h4>
            <p>
              Select a production goal and click the button
              to view sample recommendations.
            </p>
          </div>
        </div>

        <p class="lb-disclaimer">
          This is a sample preview, not a live AI result.
          Actual recommendations are generated after login.
          Coop space and climate requirements should be
          verified for your specific flock and location.
        </p>
      </section>
    `;

    const goalSelect =
      container.querySelector("#landingBreedGoal");

    const result =
      container.querySelector("#landingBreedResult");

    const button =
      container.querySelector("#landingBreedGenerate");

    button.addEventListener("click", () => {
      const goal = goalSelect.value;

      if (!goal) {
        result.innerHTML = `
          <p class="lb-error">
            Please select your primary goal first.
          </p>
        `;
        goalSelect.focus();
        return;
      }

      const recommendations = sampleBreeds[goal];

      result.innerHTML = `
        <div class="lb-results-heading">
          <div>
            <h4>2. Your Recommended Breeds</h4>
            <p>
              Based on your goal:
              <strong>${escapeHTML(labels[goal])}</strong>
            </p>
          </div>
          <span class="lb-sample">Sample Results</span>
        </div>

        <div class="lb-card-list">
          ${recommendations.map(breedCard).join("")}
        </div>
      `;
    });
  };
})();
