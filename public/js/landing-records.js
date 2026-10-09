(() => {
  const rootId = "landing-interactive-demo";

  const categories = {
    expenses: {
      label: "Expenses",
      title: "Expense Records",
      fields: [
        ["category", "Category", "select",
          ["Feed", "Medicine", "Labor", "Construction",
           "Utilities", "Livestock", "Harvest", "Misc"]],
        ["description", "Description", "text"],
        ["amount", "Amount (₱)", "number"]
      ]
    },
    eggs: {
      label: "Egg Collection",
      title: "Egg Collection Logs",
      fields: [
        ["eggs", "Number of Eggs", "number"],
        ["notes", "Notes", "text"]
      ]
    },
    mortality: {
      label: "Mortality",
      title: "Mortality Records",
      fields: [
        ["deaths", "Deaths", "number"],
        ["cause", "Cause", "text"],
        ["notes", "Notes", "text"]
      ]
    },
    chicken: {
      label: "Chicken Inventory",
      title: "Chicken Inventory Records",
      fields: [
        ["quantity", "No. of Chickens", "number"],
        ["stage", "Chicken Type", "select",
          ["Broiler", "Layer", "Dual Purpose"]],
        ["days", "Days", "number"]
      ]
    },
    meat: {
      label: "Meat Production",
      title: "Meat Production Logs",
      fields: [
        ["birdsCount", "Birds Harvested", "number"],
        ["weight", "Total Weight (kg)", "number"]
      ]
    }
  };

  const samples = () => ({
    expenses: [
      {
        id: 1, date: "2026-10-01", category: "Feed",
        description: "Chicken feed", amount: 850
      },
      {
        id: 2, date: "2026-10-03", category: "Utilities",
        description: "Electricity", amount: 320
      }
    ],
    eggs: [
      {
        id: 3, date: "2026-10-04",
        eggs: 18, notes: "Morning collection"
      }
    ],
    mortality: [
      {
        id: 4, date: "2026-10-05",
        deaths: 1, cause: "Unknown", notes: "Sample log"
      }
    ],
    chicken: [
      {
        id: 5, date: "2026-10-01",
        quantity: 30, stage: "Layer", days: 45
      }
    ],
    meat: [
      {
        id: 6, date: "2026-10-06",
        birdsCount: 5, weight: 9.5
      }
    ]
  });

  let data = samples();
  let activeTab = "expenses";
  let chickenType = "Layer";
  let editId = null;
  let nextId = 7;

  const $ = selector =>
    document.querySelector(`#${rootId} ${selector}`);

  const money = value =>
    `₱${Number(value || 0).toLocaleString("en-PH", {
      maximumFractionDigits: 2
    })}`;

  const escapeHTML = value =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const sum = (tab, field) =>
    data[tab].reduce(
      (total, item) => total + Number(item[field] || 0),
      0
    );

  const inventory = () => sum("chicken", "quantity");

  const used = () =>
    sum("mortality", "deaths") +
    sum("meat", "birdsCount");

  const activeChickens = () =>
    Math.max(0, inventory() - used());

  const localDate = () => {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");
  };

  function renderStats() {
    const cards = [
      ["Total Expenses", money(sum("expenses", "amount"))],
      ["Active Chickens", activeChickens().toLocaleString()],
      ["Mortality Rate",
        inventory()
          ? `${(sum("mortality", "deaths") / inventory() * 100).toFixed(1)}%`
          : "0.0%"],
      ["Meat Production", `${sum("meat", "weight")} kg`]
    ];

    if (chickenType !== "Broiler") {
      cards.splice(2, 0, [
        "Total Eggs", sum("eggs", "eggs").toLocaleString()
      ]);
    }

    $("#landingRecordsStats").innerHTML =
      cards.map(([label, value]) => `
        <div class="lr-stat">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `).join("");
  }

  function renderTabs() {
    $("#landingRecordsTabs").innerHTML =
      Object.entries(categories)
        .filter(([key]) =>
          key !== "eggs" || chickenType !== "Broiler"
        )
        .map(([key, config]) => `
          <button type="button"
            data-tab="${key}"
            class="${activeTab === key ? "active" : ""}">
            ${config.label}
          </button>
        `).join("");
  }

  function recordSummary(item) {
    switch (activeTab) {
      case "expenses":
        return [item.category, item.description, money(item.amount)];
      case "eggs":
        return [`${item.eggs} eggs`, item.notes || "-"];
      case "mortality":
        return [`${item.deaths} deaths`, item.cause, item.notes || "-"];
      case "chicken":
        return [
          `${item.quantity} chickens`,
          item.stage,
          `${item.days} days`
        ];
      case "meat":
        return [
          `${item.birdsCount} birds`,
          `${item.weight} kg`
        ];
      default:
        return [];
    }
  }

  function renderTable() {
    const search = ($("#landingRecordsSearch")?.value || "")
      .trim().toLowerCase();

    const fields = {
      expenses: ["Date", "Category", "Description", "Amount"],
      eggs: ["Date", "Number of Eggs", "Notes"],
      mortality: ["Date", "Deaths", "Cause", "Notes"],
      chicken: ["Date", "Quantity", "Type", "Days"],
      meat: ["Date", "Birds Harvested", "Weight"]
    };

    const rows = data[activeTab].filter(item =>
      JSON.stringify(item).toLowerCase().includes(search)
    );

    $("#landingRecordsTitle").textContent =
      categories[activeTab].title;

    $("#landingRecordsHead").innerHTML = `
      <tr>
        ${fields[activeTab].map(
          name => `<th>${name}</th>`
        ).join("")}
        <th>Actions</th>
      </tr>
    `;

    $("#landingRecordsBody").innerHTML = rows.length
      ? rows.map(item => `
          <tr>
            <td>${escapeHTML(item.date)}</td>
            ${recordSummary(item).map(value =>
              `<td>${escapeHTML(value)}</td>`
            ).join("")}
            <td>
              <div class="lr-actions">
                <button type="button"
                  data-edit="${item.id}">Edit</button>
                <button type="button"
                  class="lr-delete"
                  data-delete="${item.id}">Delete</button>
              </div>
            </td>
          </tr>
        `).join("")
      : `<tr><td colspan="${fields[activeTab].length + 1}"
          class="lr-empty">No matching records found.</td></tr>`;

    const totalLabels = {
      expenses: `Total: ${money(sum("expenses", "amount"))}`,
      eggs: `Total Eggs: ${sum("eggs", "eggs")}`,
      mortality: `Total Deaths: ${sum("mortality", "deaths")}`,
      chicken: `Active Chickens: ${activeChickens()}`,
      meat: `Total Harvested: ${sum("meat", "weight")} kg`
    };

    $("#landingRecordsTotal").textContent =
      totalLabels[activeTab];
  }

  function renderAll() {
    renderStats();
    renderTabs();
    renderTable();
  }

  function openForm(id = null) {
    editId = id;

    const record = id === null
      ? null
      : data[activeTab].find(item => item.id === id);

    if (id !== null && !record) return;

    if (
      ["eggs", "mortality", "meat"].includes(activeTab) &&
      activeChickens() <= 0 &&
      id === null
    ) {
      alert("No active chickens available. Add a chicken batch first.");
      return;
    }

    $("#landingRecordsFormTitle").textContent =
      `${record ? "Edit" : "Add"} ${categories[activeTab].label}`;

    $("#landingRecordsFields").innerHTML = `
      <label>
        Date
        <input name="date" type="date" required
          value="${escapeHTML(record?.date || localDate())}">
      </label>
      ${categories[activeTab].fields.map(
        ([name, label, type, options]) => {
          const value = record?.[name] ?? "";

          if (type === "select") {
            return `
              <label>
                ${label}
                <select name="${name}">
                  ${options.map(option => `
                    <option value="${escapeHTML(option)}"
                      ${option === value ? "selected" : ""}>
                      ${escapeHTML(option)}
                    </option>
                  `).join("")}
                </select>
              </label>
            `;
          }

          return `
            <label>
              ${label}
              <input name="${name}"
                type="${type}"
                ${type === "number"
                  ? 'min="0" step="any"'
                  : ""}
                value="${escapeHTML(value)}"
                ${name === "description" ? "required" : ""}>
            </label>
          `;
        }
      ).join("")}
    `;

    $("#landingRecordsFormWrap").hidden = false;
  }

  function closeForm() {
    editId = null;
    $("#landingRecordsFormWrap").hidden = true;
  }

  function saveForm(event) {
    event.preventDefault();

    const form = $("#landingRecordsForm");
    if (!form.reportValidity()) return;

    const values = Object.fromEntries(
      new FormData(form).entries()
    );

    const numericFields = [
      "amount", "eggs", "deaths", "quantity",
      "days", "birdsCount", "weight"
    ];

    for (const key of numericFields) {
      if (key in values) {
        if (values[key] === "") {
          alert("Please complete all number fields.");
          return;
        }
        values[key] = Number(values[key]);
        if (!Number.isFinite(values[key]) || values[key] < 0) {
          alert("Please enter valid non-negative numbers.");
          return;
        }
      }
    }

    const original = editId === null
      ? null
      : data[activeTab].find(item => item.id === editId);

    const wholePositive = value =>
      Number.isInteger(value) && value > 0;

    if (
      (activeTab === "chicken" && !wholePositive(values.quantity)) ||
      (activeTab === "eggs" && !wholePositive(values.eggs)) ||
      (activeTab === "mortality" && !wholePositive(values.deaths)) ||
      (activeTab === "meat" && !wholePositive(values.birdsCount))
    ) {
      alert("Please enter a positive whole number.");
      return;
    }

    if (
      activeTab === "chicken" &&
      (!Number.isInteger(values.days) || values.days < 0)
    ) {
      alert("Days must be a non-negative whole number.");
      return;
    }

    if (activeTab === "chicken") {
      const updatedInventory =
        inventory() - Number(original?.quantity || 0) +
        values.quantity;

      if (updatedInventory < used()) {
        alert("Chicken inventory cannot be less than deaths and harvests.");
        return;
      }
    }

    if (activeTab === "mortality" || activeTab === "meat") {
      const field = activeTab === "mortality"
        ? "deaths"
        : "birdsCount";

      const available =
        activeChickens() + Number(original?.[field] || 0);

      if (values[field] > available) {
        alert(`Only ${available} chickens are available.`);
        return;
      }
    }

    if (editId === null) {
      data[activeTab].push({
        id: nextId++,
        ...values
      });
    } else {
      Object.assign(original, values);
    }

    closeForm();
    renderAll();
  }

  function deleteItem(id) {
    const item = data[activeTab].find(row => row.id === id);
    if (!item) return;

    if (
      activeTab === "chicken" &&
      inventory() - Number(item.quantity) < used()
    ) {
      alert("Cannot delete this batch. Some chickens are recorded as dead or harvested.");
      return;
    }

    if (!confirm("Delete this demo record?")) return;

    data[activeTab] = data[activeTab].filter(
      row => row.id !== id
    );

    renderAll();
  }

  window.renderLandingRecordManagement = function () {
    const container = document.getElementById(rootId);
    if (!container) return;

    data = samples();
    activeTab = "expenses";
    chickenType = "Layer";
    editId = null;
    nextId = 7;

    container.style.display = "block";

    container.innerHTML = `
      <section class="landing-records-demo">
        <div class="lr-heading">
          <div>
            <h3>Farm Record Management</h3>
            <p>Explore sample farm records and track poultry activities.</p>
          </div>
          <span class="lr-demo-badge">DEMO MODE</span>
        </div>

        <div class="lr-toolbar">
          <label>
            Chicken Type
            <select id="landingRecordsChickenType">
              <option>Layer</option>
              <option>Broiler</option>
              <option>Dual Purpose</option>
            </select>
          </label>
        </div>

        <div id="landingRecordsStats" class="lr-stats"></div>

        <div id="landingRecordsTabs" class="lr-tabs"></div>

        <div class="lr-panel">
          <div class="lr-panel-top">
            <h4 id="landingRecordsTitle"></h4>
            <button id="landingRecordsAdd"
              type="button" class="lr-primary">
              + Add Record
            </button>
          </div>

          <input id="landingRecordsSearch"
            type="search" placeholder="Search records...">

          <div class="lr-table-scroll">
            <table class="lr-table">
              <thead id="landingRecordsHead"></thead>
              <tbody id="landingRecordsBody"></tbody>
            </table>
          </div>

          <div id="landingRecordsTotal" class="lr-total"></div>
        </div>

        <p class="lr-note">
          Sample data only. Changes are temporary and
          are not saved to your SmartCoop account.
        </p>

        <div id="landingRecordsFormWrap"
          class="lr-form-overlay" hidden>
          <form id="landingRecordsForm" class="lr-form">
            <div class="lr-form-top">
              <h4 id="landingRecordsFormTitle"></h4>
              <button type="button"
                id="landingRecordsClose"
                aria-label="Close form">×</button>
            </div>
            <div id="landingRecordsFields"
              class="lr-fields"></div>
            <div class="lr-form-buttons">
              <button type="button"
                id="landingRecordsCancel">Cancel</button>
              <button type="submit"
                class="lr-primary">Save Record</button>
            </div>
          </form>
        </div>
      </section>
    `;

    container.addEventListener("click", event => {
      const target = event.target.closest(
        "[data-tab], [data-edit], [data-delete]"
      );

      if (!target || !container.contains(target)) return;

      if (target.dataset.tab) {
        activeTab = target.dataset.tab;
        closeForm();
        renderAll();
      }

      if (target.dataset.edit) {
        openForm(Number(target.dataset.edit));
      }

      if (target.dataset.delete) {
        deleteItem(Number(target.dataset.delete));
      }
    }, { once: false });

    $("#landingRecordsChickenType").addEventListener(
      "change", event => {
        chickenType = event.target.value;

        if (chickenType === "Broiler" && activeTab === "eggs") {
          activeTab = "expenses";
        }

        // Update sample batch type to match the selected coop.
        data.chicken.forEach(item => {
          item.stage = chickenType;
        });

        closeForm();
        renderAll();
      }
    );

    $("#landingRecordsSearch").addEventListener(
      "input", renderTable
    );

    $("#landingRecordsAdd").addEventListener(
      "click", () => openForm()
    );

    $("#landingRecordsClose").addEventListener(
      "click", closeForm
    );

    $("#landingRecordsCancel").addEventListener(
      "click", closeForm
    );

    $("#landingRecordsForm").addEventListener(
      "submit", saveForm
    );

    renderAll();
  };
})();
