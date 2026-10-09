(() => {
  const guides = {
    breeds: {
      icon: "🐔",
      badge: "BREEDS GUIDE",
      title: "Chicken Breeds Reference Guide",
      subtitle: "Compare general poultry types based on their main production purpose and management characteristics.",
      headers: ["Poultry Type", "Main Purpose", "General Space", "Production Focus", "Best For"],
      rows: [
        ["Layers", "Egg Production", "About 2–3 sq.ft per bird", "Consistent egg production", "Farmers focused mainly on eggs"],
        ["Broilers", "Meat Production", "About 1.5–2 sq.ft per bird", "Fast growth for meat", "Farmers focused mainly on meat"],
        ["Dual Purpose", "Eggs and Meat", "About 2–4 sq.ft per bird", "Balanced production", "Small farms wanting both eggs and meat"]
      ]
    },

    stages: {
      icon: "🐣",
      badge: "GROWTH GUIDE",
      title: "Chicken Growth & Production Stages",
      subtitle: "Review the general stages of chicken development and the management focus associated with each stage.",
      headers: ["Stage", "General Age", "Development", "Management Focus", "Important Reminder"],
      rows: [
        ["Chicks", "Day 1 – Week 4", "Early growth", "Warmth, starter feed, clean water", "Young chicks require close observation"],
        ["Growers", "Week 5 – Week 16", "Body development", "Nutrition, ventilation, sufficient space", "Avoid overcrowding as birds become larger"],
        ["Pullets", "Before laying maturity", "Preparation for egg production", "Balanced nutrition and suitable housing", "Prepare nesting and laying areas"],
        ["Layers", "Mature production stage", "Egg production", "Nutrition, water, nesting, cleanliness", "Monitor egg production and flock condition"],
        ["Broilers", "Meat production period", "Growth toward market size", "Feed, water, ventilation, space", "Monitor growth and general flock condition"]
      ]
    },

    feeding: {
      icon: "🌾",
      badge: "NUTRITION GUIDE",
      title: "Feeding & Nutrition Guide",
      subtitle: "Understand the general feeding focus used during different stages and production purposes.",
      headers: ["Bird Group", "Feed Stage", "Main Goal", "Management Focus", "Reminder"],
      rows: [
        ["Young Chicks", "Starter", "Support early growth", "Appropriate starter feed and clean water", "Keep feed accessible and protected from contamination"],
        ["Growing Birds", "Grower", "Support steady development", "Balanced feeding and sufficient feeder space", "Monitor growth and avoid unnecessary feed waste"],
        ["Layers", "Layer Feeding", "Support egg production", "Balanced layer nutrition and constant clean water", "Feed requirements change when birds enter production"],
        ["Broilers", "Broiler Feeding Program", "Support efficient growth", "Appropriate feed for the bird's growth stage", "Observe feed intake and flock growth regularly"],
        ["All Chickens", "Clean Water", "Hydration", "Continuous access to safe drinking water", "Clean waterers regularly"]
      ]
    },

    housing: {
      icon: "🏠",
      badge: "HOUSING GUIDE",
      title: "Housing & Space Guide",
      subtitle: "Review general poultry housing considerations for space, airflow, protection, and flock comfort.",
      headers: ["Housing Factor", "Purpose", "General Guideline", "Why It Matters", "Check"],
      rows: [
        ["Floor Space", "Reduce crowding", "Provide suitable space for bird type and size", "Overcrowding can affect comfort and cleanliness", "Check flock density"],
        ["Ventilation", "Maintain airflow", "Allow fresh air to move through the poultry house", "Helps manage heat, moisture, and air quality", "Check airflow regularly"],
        ["Dry Flooring", "Maintain cleaner housing", "Keep litter and floor areas reasonably dry", "Wet areas can create poor housing conditions", "Replace wet litter"],
        ["Weather Protection", "Protect the flock", "Provide shelter from rain and extreme conditions", "Birds need a secure and suitable environment", "Inspect roofing and walls"],
        ["Feeder Placement", "Improve feed access", "Place feeders where birds can reach them easily", "Helps reduce crowding around feeding areas", "Keep feeding area clean"],
        ["Waterer Placement", "Improve water access", "Provide accessible drinking areas", "Birds require regular access to clean water", "Prevent spills where possible"],
        ["Nesting Area", "Support laying birds", "Provide suitable nesting areas for layers", "Encourages cleaner and easier egg collection", "Keep nesting areas clean"]
      ]
    },

    sanitation: {
      icon: "🧼",
      badge: "BIOSECURITY GUIDE",
      title: "Sanitation & Biosecurity Guide",
      subtitle: "Use basic cleaning and biosecurity practices to maintain a cleaner poultry environment.",
      headers: ["Task", "Suggested Frequency", "Purpose", "Priority", "Recommended Practice"],
      rows: [
        ["Clean Feeders", "Daily", "Reduce contamination", "High", "Remove wet or spoiled feed and keep feeders clean"],
        ["Clean Waterers", "Daily", "Maintain cleaner drinking water", "High", "Replace dirty water and clean containers"],
        ["Remove Wet Litter", "As Needed", "Maintain dry flooring", "High", "Replace damp litter with clean and dry material"],
        ["General Coop Cleaning", "Regularly", "Remove accumulated dirt and waste", "High", "Clean floors, equipment, and surrounding areas"],
        ["Equipment Cleaning", "Regularly", "Improve hygiene", "Medium", "Keep commonly used poultry equipment clean"],
        ["Disinfection", "Between Batches / As Needed", "Improve biosecurity", "High", "Clean surfaces before using an appropriate disinfecting process"],
        ["Visitor Control", "Always", "Reduce outside contamination", "High", "Limit unnecessary access to poultry housing areas"],
        ["Routine Inspection", "Regularly", "Identify sanitation issues", "Medium", "Check litter, feeders, waterers, ventilation, and housing"]
      ]
    },

    production: {
      icon: "📊",
      badge: "PRODUCTION GUIDE",
      title: "Poultry Production Guide",
      subtitle: "Review common production goals and useful information that can be recorded for farm monitoring.",
      headers: ["Production Type", "Primary Goal", "Useful Records", "Monitor", "SmartCoop Module"],
      rows: [
        ["Egg Production", "Collect eggs from laying birds", "Egg count and collection date", "Changes in egg production", "Record Management"],
        ["Meat Production", "Raise birds for meat", "Bird count, harvest date, total weight", "Growth and production output", "Record Management"],
        ["Dual Purpose", "Produce both eggs and meat", "Egg records and flock records", "Balance between production goals", "Record Management"],
        ["Mortality Monitoring", "Track flock losses", "Date, number of deaths, possible cause", "Changes in flock mortality", "Record Management"],
        ["Farm Expenses", "Monitor operating costs", "Category, description, date, amount", "Changes in spending", "Record Management"],
        ["Performance Review", "Understand farm activity", "Production and expense records", "Trends over time", "Reports & Analytics"]
      ]
    }
  };

  const escapeHTML = value =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  let currentView = "";

  function root() {
    return document.querySelector(
      "#landing-interactive-demo .landing-chicken-demo"
    );
  }

  function renderCards() {
    const app = root();
    if (!app) return;

    currentView = "";

    app.querySelector("#lcMain").hidden = false;
    app.querySelector("#lcDetail").hidden = true;

    app.querySelector("#lcCards").innerHTML =
      Object.entries(guides).map(([key, guide]) => `
        <button type="button" class="lc-card" data-guide="${key}">
          <span class="lc-icon">${guide.icon}</span>
          <span class="lc-card-title">${escapeHTML(guide.title)}</span>
          <span class="lc-card-desc">${escapeHTML(guide.subtitle)}</span>
          <span class="lc-card-open">Explore Guide →</span>
        </button>
      `).join("");
  }

  function renderTable() {
    const app = root();
    if (!app || !currentView) return;

    const guide = guides[currentView];
    const search = app.querySelector("#lcSearch").value
      .trim().toLowerCase();

    const rows = guide.rows.filter(row =>
      row.some(value =>
        String(value).toLowerCase().includes(search)
      )
    );

    app.querySelector("#lcTableHead").innerHTML = `
      <tr>
        ${guide.headers.map(header =>
          `<th>${escapeHTML(header)}</th>`
        ).join("")}
      </tr>
    `;

    app.querySelector("#lcTableBody").innerHTML =
      rows.map(row => `
        <tr>
          ${row.map((value, index) => {
            if (currentView === "sanitation" && index === 3) {
              return `
                <td>
                  <span class="lc-priority ${escapeHTML(
                    value.toLowerCase()
                  )}">${escapeHTML(value)}</span>
                </td>
              `;
            }

            return `
              <td>
                ${index === 0
                  ? `<strong>${escapeHTML(value)}</strong>`
                  : escapeHTML(value)}
              </td>
            `;
          }).join("")}
        </tr>
      `).join("");

    app.querySelector("#lcTableWrap").hidden =
      rows.length === 0;

    app.querySelector("#lcNoResults").hidden =
      rows.length !== 0;

    app.querySelector("#lcResultCount").textContent =
      `${rows.length} of ${guide.rows.length} entries`;
  }

  function openGuide(key) {
    const app = root();
    const guide = guides[key];

    if (!app || !guide) return;

    currentView = key;

    app.querySelector("#lcMain").hidden = true;
    app.querySelector("#lcDetail").hidden = false;

    app.querySelector("#lcBadge").textContent = guide.badge;
    app.querySelector("#lcTitle").textContent = guide.title;
    app.querySelector("#lcSubtitle").textContent = guide.subtitle;

    app.querySelector("#lcSearch").value = "";

    renderTable();

    app.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }

  window.renderLandingChickenInfo = function () {
    const container = document.getElementById(
      "landing-interactive-demo"
    );

    if (!container) return;

    container.style.display = "block";

    container.innerHTML = `
      <section class="landing-chicken-demo">
        <div class="lc-heading">
          <div>
            <h3>🐔 Chicken Information</h3>
            <p>Explore practical poultry reference guides.</p>
          </div>
          <span class="lc-demo-badge">DEMO MODE</span>
        </div>

        <div id="lcMain">
          <div class="lc-intro">
            <h4>Poultry Knowledge Center</h4>
            <p>Select a guide to learn about chicken management.</p>
          </div>

          <div class="lc-cards" id="lcCards"></div>
        </div>

        <div id="lcDetail" hidden>
          <button type="button" class="lc-back" id="lcBack">
            ← Back to Guides
          </button>

          <div class="lc-detail-heading">
            <span class="lc-badge" id="lcBadge"></span>
            <h4 id="lcTitle"></h4>
            <p id="lcSubtitle"></p>
          </div>

          <div class="lc-search-bar">
            <input type="search" id="lcSearch"
              placeholder="Search information...">
            <span id="lcResultCount"></span>
          </div>

          <div class="lc-table-wrap" id="lcTableWrap">
            <table class="lc-table">
              <thead id="lcTableHead"></thead>
              <tbody id="lcTableBody"></tbody>
            </table>
          </div>

          <div class="lc-no-results" id="lcNoResults" hidden>
            <span>🔎</span>
            <h4>No matching information</h4>
            <p>Try a different search term.</p>
          </div>
        </div>

        <p class="lc-disclaimer">
          This guide provides general poultry information.
          Actual farm requirements depend on bird type,
          flock size, housing, and local conditions.
        </p>
      </section>
    `;

    const app = root();

    app.querySelector("#lcCards").onclick = event => {
      const card = event.target.closest("[data-guide]");
      if (card) openGuide(card.dataset.guide);
    };

    app.querySelector("#lcBack").onclick = renderCards;

    app.querySelector("#lcSearch").oninput = renderTable;

    renderCards();
  };
})();
