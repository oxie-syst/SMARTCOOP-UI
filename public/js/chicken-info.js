let currentChickenView = "";

const chickenInfoData = {

  breeds: {
    badge: "BREEDS GUIDE",

    title:
      "Chicken Breeds Reference Guide",

    subtitle:
      "Compare general poultry types based on their main production purpose and management characteristics.",

    headers: [
      "Poultry Type",
      "Main Purpose",
      "General Space",
      "Production Focus",
      "Best For"
    ],

    rows: [

      [
        "Layers",
        "Egg Production",
        "About 2–3 sq.ft per bird",
        "Consistent egg production",
        "Farmers focused mainly on eggs"
      ],

      [
        "Broilers",
        "Meat Production",
        "About 1.5–2 sq.ft per bird",
        "Fast growth for meat",
        "Farmers focused mainly on meat"
      ],

      [
        "Dual Purpose",
        "Eggs and Meat",
        "About 2–4 sq.ft per bird",
        "Balanced production",
        "Small farms wanting both eggs and meat"
      ]

    ]
  },


  stages: {
    badge: "GROWTH GUIDE",

    title:
      "Chicken Growth & Production Stages",

    subtitle:
      "Review the general stages of chicken development and the management focus associated with each stage.",

    headers: [
      "Stage",
      "General Age",
      "Development",
      "Management Focus",
      "Important Reminder"
    ],

    rows: [

      [
        "Chicks",
        "Day 1 – Week 4",
        "Early growth",
        "Warmth, starter feed, clean water",
        "Young chicks require close observation"
      ],

      [
        "Growers",
        "Week 5 – Week 16",
        "Body development",
        "Nutrition, ventilation, sufficient space",
        "Avoid overcrowding as birds become larger"
      ],

      [
        "Pullets",
        "Before laying maturity",
        "Preparation for egg production",
        "Balanced nutrition and suitable housing",
        "Prepare nesting and laying areas"
      ],

      [
        "Layers",
        "Mature production stage",
        "Egg production",
        "Nutrition, water, nesting, cleanliness",
        "Monitor egg production and flock condition"
      ],

      [
        "Broilers",
        "Meat production period",
        "Growth toward market size",
        "Feed, water, ventilation, space",
        "Monitor growth and general flock condition"
      ]

    ]
  },


  feeding: {
    badge: "NUTRITION GUIDE",

    title:
      "Feeding & Nutrition Guide",

    subtitle:
      "Understand the general feeding focus used during different stages and production purposes.",

    headers: [
      "Bird Group",
      "Feed Stage",
      "Main Goal",
      "Management Focus",
      "Reminder"
    ],

    rows: [

      [
        "Young Chicks",
        "Starter",
        "Support early growth",
        "Appropriate starter feed and clean water",
        "Keep feed accessible and protected from contamination"
      ],

      [
        "Growing Birds",
        "Grower",
        "Support steady development",
        "Balanced feeding and sufficient feeder space",
        "Monitor growth and avoid unnecessary feed waste"
      ],

      [
        "Layers",
        "Layer Feeding",
        "Support egg production",
        "Balanced layer nutrition and constant clean water",
        "Feed requirements change when birds enter production"
      ],

      [
        "Broilers",
        "Broiler Feeding Program",
        "Support efficient growth",
        "Appropriate feed for the bird's growth stage",
        "Observe feed intake and flock growth regularly"
      ],

      [
        "All Chickens",
        "Clean Water",
        "Hydration",
        "Continuous access to safe drinking water",
        "Clean waterers regularly"
      ]

    ]
  },


  housing: {
    badge: "HOUSING GUIDE",

    title:
      "Housing & Space Guide",

    subtitle:
      "Review general poultry housing considerations for space, airflow, protection, and flock comfort.",

    headers: [
      "Housing Factor",
      "Purpose",
      "General Guideline",
      "Why It Matters",
      "Check"
    ],

    rows: [

      [
        "Floor Space",
        "Reduce crowding",
        "Provide suitable space for bird type and size",
        "Overcrowding can affect comfort and cleanliness",
        "Check flock density"
      ],

      [
        "Ventilation",
        "Maintain airflow",
        "Allow fresh air to move through the poultry house",
        "Helps manage heat, moisture, and air quality",
        "Check airflow regularly"
      ],

      [
        "Dry Flooring",
        "Maintain cleaner housing",
        "Keep litter and floor areas reasonably dry",
        "Wet areas can create poor housing conditions",
        "Replace wet litter"
      ],

      [
        "Weather Protection",
        "Protect the flock",
        "Provide shelter from rain and extreme conditions",
        "Birds need a secure and suitable environment",
        "Inspect roofing and walls"
      ],

      [
        "Feeder Placement",
        "Improve feed access",
        "Place feeders where birds can reach them easily",
        "Helps reduce crowding around feeding areas",
        "Keep feeding area clean"
      ],

      [
        "Waterer Placement",
        "Improve water access",
        "Provide accessible drinking areas",
        "Birds require regular access to clean water",
        "Prevent spills where possible"
      ],

      [
        "Nesting Area",
        "Support laying birds",
        "Provide suitable nesting areas for layers",
        "Encourages cleaner and easier egg collection",
        "Keep nesting areas clean"
      ]

    ]
  },


  sanitation: {
    badge: "BIOSECURITY GUIDE",

    title:
      "Sanitation & Biosecurity Guide",

    subtitle:
      "Use basic cleaning and biosecurity practices to maintain a cleaner poultry environment.",

    headers: [
      "Task",
      "Suggested Frequency",
      "Purpose",
      "Priority",
      "Recommended Practice"
    ],

    rows: [

      [
        "Clean Feeders",
        "Daily",
        "Reduce contamination",
        "High",
        "Remove wet or spoiled feed and keep feeders clean"
      ],

      [
        "Clean Waterers",
        "Daily",
        "Maintain cleaner drinking water",
        "High",
        "Replace dirty water and clean containers"
      ],

      [
        "Remove Wet Litter",
        "As Needed",
        "Maintain dry flooring",
        "High",
        "Replace damp litter with clean and dry material"
      ],

      [
        "General Coop Cleaning",
        "Regularly",
        "Remove accumulated dirt and waste",
        "High",
        "Clean floors, equipment, and surrounding areas"
      ],

      [
        "Equipment Cleaning",
        "Regularly",
        "Improve hygiene",
        "Medium",
        "Keep commonly used poultry equipment clean"
      ],

      [
        "Disinfection",
        "Between Batches / As Needed",
        "Improve biosecurity",
        "High",
        "Clean surfaces before using an appropriate disinfecting process"
      ],

      [
        "Visitor Control",
        "Always",
        "Reduce outside contamination",
        "High",
        "Limit unnecessary access to poultry housing areas"
      ],

      [
        "Routine Inspection",
        "Regularly",
        "Identify sanitation issues",
        "Medium",
        "Check litter, feeders, waterers, ventilation, and housing"
      ]

    ]
  },


  production: {
    badge: "PRODUCTION GUIDE",

    title:
      "Poultry Production Guide",

    subtitle:
      "Review common production goals and useful information that can be recorded for farm monitoring.",

    headers: [
      "Production Type",
      "Primary Goal",
      "Useful Records",
      "Monitor",
      "SmartCoop Module"
    ],

    rows: [

      [
        "Egg Production",
        "Collect eggs from laying birds",
        "Egg count and collection date",
        "Changes in egg production",
        "Record Management"
      ],

      [
        "Meat Production",
        "Raise birds for meat",
        "Bird count, harvest date, total weight",
        "Growth and production output",
        "Record Management"
      ],

      [
        "Dual Purpose",
        "Produce both eggs and meat",
        "Egg records and flock records",
        "Balance between production goals",
        "Record Management"
      ],

      [
        "Mortality Monitoring",
        "Track flock losses",
        "Date, number of deaths, possible cause",
        "Changes in flock mortality",
        "Record Management"
      ],

      [
        "Farm Expenses",
        "Monitor operating costs",
        "Category, description, date, amount",
        "Changes in spending",
        "Record Management"
      ],

      [
        "Performance Review",
        "Understand farm activity",
        "Production and expense records",
        "Trends over time",
        "Reports & Analytics"
      ]

    ]
  }

};


function loadChickenInfoPage() {

  currentChickenView = "";

  const main =
    document.getElementById(
      "mainChickenCards"
    );

  const sub =
    document.getElementById(
      "subViewSection"
    );

  if (main) {
    main.classList.remove("hidden");
  }

  if (sub) {
    sub.classList.add("hidden");
  }

  if (window.lucide) {
    lucide.createIcons();
  }

}


function toggleChickenView(viewType) {

  const data =
    chickenInfoData[viewType];

  if (!data) {
    return;
  }

  currentChickenView =
    viewType;


  const main =
    document.getElementById(
      "mainChickenCards"
    );

  const sub =
    document.getElementById(
      "subViewSection"
    );


  if (main) {
    main.classList.add("hidden");
  }

  if (sub) {
    sub.classList.remove("hidden");
  }


  const badge =
    document.getElementById(
      "viewSectionBadge"
    );

  const title =
    document.getElementById(
      "viewSectionTitle"
    );

  const subtitle =
    document.getElementById(
      "viewSectionSubtitle"
    );


  if (badge) {
    badge.textContent =
      data.badge;
  }

  if (title) {
    title.textContent =
      data.title;
  }

  if (subtitle) {
    subtitle.textContent =
      data.subtitle;
  }


  const search =
    document.getElementById(
      "chickenInfoSearch"
    );

  if (search) {
    search.value = "";
  }


  const noResults =
    document.getElementById(
      "chickenNoResults"
    );

  if (noResults) {
    noResults.classList.add(
      "hidden"
    );
  }


  renderChickenInfoTable(
    data
  );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  if (window.lucide) {
    lucide.createIcons();
  }

}


function renderChickenInfoTable(data) {

  const thead =
    document.getElementById(
      "chickenInfoTableHead"
    );

  const tbody =
    document.getElementById(
      "chickenInfoTableBody"
    );


  if (!thead || !tbody) {
    return;
  }


  thead.innerHTML = `
    <tr>

      ${data.headers
        .map(header => `
          <th>
            ${escapeChickenHTML(header)}
          </th>
        `)
        .join("")}

    </tr>
  `;


  tbody.innerHTML =
    data.rows
      .map(row => `

        <tr class="chicken-info-row">

          ${row
            .map((value, index) => {

              if (index === 0) {

                return `
                  <td>

                    <strong class="chicken-row-title">
                      ${escapeChickenHTML(value)}
                    </strong>

                  </td>
                `;

              }


              if (
                currentChickenView ===
                  "sanitation" &&
                index === 3
              ) {

                const priorityClass =
                  String(value)
                    .toLowerCase();

                return `
                  <td>

                    <span
                      class="chicken-priority-badge ${priorityClass}">

                      ${escapeChickenHTML(value)}

                    </span>

                  </td>
                `;

              }


              return `
                <td>
                  ${escapeChickenHTML(value)}
                </td>
              `;

            })
            .join("")}

        </tr>

      `)
      .join("");

}


function filterChickenInfo() {

  const search =
    document.getElementById(
      "chickenInfoSearch"
    );

  if (!search) {
    return;
  }


  const value =
    search.value
      .trim()
      .toLowerCase();


  const rows =
    document.querySelectorAll(
      "#chickenInfoTableBody .chicken-info-row"
    );


  let visibleRows = 0;


  rows.forEach(row => {

    const text =
      row.textContent
        .toLowerCase();


    const matches =
      text.includes(value);


    row.style.display =
      matches
        ? ""
        : "none";


    if (matches) {
      visibleRows++;
    }

  });


  const noResults =
    document.getElementById(
      "chickenNoResults"
    );


  const table =
    document.querySelector(
      ".chicken-modern-table"
    );


  if (noResults) {

    noResults.classList.toggle(
      "hidden",
      visibleRows > 0
    );

  }


  if (table) {

    table.style.display =
      visibleRows > 0
        ? "table"
        : "none";

  }

}


function goBackToCards() {

  currentChickenView = "";


  const main =
    document.getElementById(
      "mainChickenCards"
    );

  const sub =
    document.getElementById(
      "subViewSection"
    );


  if (main) {
    main.classList.remove(
      "hidden"
    );
  }


  if (sub) {
    sub.classList.add(
      "hidden"
    );
  }


  const search =
    document.getElementById(
      "chickenInfoSearch"
    );


  if (search) {
    search.value = "";
  }


  const table =
    document.querySelector(
      ".chicken-modern-table"
    );


  if (table) {
    table.style.display =
      "table";
  }


  if (window.lucide) {
    lucide.createIcons();
  }

}


function escapeChickenHTML(value) {

  return String(
    value ?? ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}