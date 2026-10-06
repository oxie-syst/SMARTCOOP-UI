let activeRecordTab = "expenses";
let editRecordId = null;

let recordData = {
  expenses: [],
  eggs: [],
  mortality: [],
  chicken: [],
  meat: []
};

const urlParams =
  new URLSearchParams(window.location.search);

let selectedCoopId =
  urlParams.get("coopId");

let selectedCoop = null;

function isBroilerCoop() {
  const chickenType =
    String(selectedCoop?.ChickenType || "")
      .trim()
      .toLowerCase();

  return chickenType.includes("broiler");
}
function updateRecordFeaturesByChickenType() {
  const broiler = isBroilerCoop();

  const eggCard =
    document.getElementById("recordEggStatCard");

  const eggTab =
    document.getElementById("recordEggTab");

  if (eggCard) {
    eggCard.style.display =
      broiler ? "none" : "";
  }

  if (eggTab) {
    eggTab.style.display =
      broiler ? "none" : "";
  }

  if (
    broiler &&
    activeRecordTab === "eggs"
  ) {
    activeRecordTab = "expenses";
  }
}
function getRecordUserId() {
  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem("smartcoop_user");

  if (!storedUser) return null;

  try {
    const user = JSON.parse(storedUser);

    return (
      user.UserID ||
      user.userId ||
      user.id ||
      null
    );
  } catch (error) {
    return null;
  }
}


function formatRecordDate(value) {
  if (!value) return "-";

  if (typeof value === "string") {
    return value.split("T")[0];
  }

  return value;
}
function formatRecordDateTime(date, time) {
  if (!date) return "-";

  const cleanDate = formatRecordDate(date);

  if (!time) {
    return cleanDate;
  }

  const [year, month, day] =
    cleanDate.split("-").map(Number);

  const [hour, minute] =
    String(time).split(":").map(Number);

  const value = new Date(
    year,
    month - 1,
    day,
    hour || 0,
    minute || 0
  );

  return value.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

async function loadActiveCoopOptions() {
  const userId = getRecordUserId();
  const select =
    document.getElementById("recordCoopSelect");

  if (!userId || !select) return;

  try {
    const response =
      await fetch(`/api/coops/user/${userId}`);

    const result = await response.json();

    const coops =
      (result.coops || []).filter(
        coop =>
          String(coop.Status || "")
            .toLowerCase() === "active"
      );

    select.innerHTML = `
      <option value="">
        Select an active coop
      </option>
    `;

    coops.forEach(coop => {
      const option =
        document.createElement("option");

      option.value = coop.CoopID;
      option.textContent = coop.CoopName;

      select.appendChild(option);
    });

    if (selectedCoopId) {
      select.value = selectedCoopId;
    }
  } catch (error) {
    console.error(
      "Load Active Coops Error:",
      error
    );
  }
}

function changeRecordCoop() {
  const select =
    document.getElementById("recordCoopSelect");

  const coopId = select?.value;

  if (!coopId) return;

  window.location.href =
    `record-management.html?coopId=${coopId}`;
}

async function loadSelectedCoop() {
  const userId = getRecordUserId();

  if (!userId || !selectedCoopId) {
    return null;
  }

  try {
    const response = await fetch(
      `/api/coops/details/${selectedCoopId}/${userId}`
    );

    const result = await response.json();

    if (!response.ok || !result.success || !result.coop) {
      throw new Error(
        result.message || "Unable to load coop."
      );
    }

    selectedCoop = result.coop;

    return selectedCoop;

  } catch (error) {
    console.error("Load Selected Coop Error:", error);
    return null;
  }
}

async function loadRecordsPage() {
  const userId = getRecordUserId();

  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  if (!selectedCoopId) {
  recordData = {
    expenses: [],
    eggs: [],
    mortality: [],
    chicken: [],
    meat: []
  };

  updateRecordStats();
  renderActiveRecordTab();
  return;
}

const coop = await loadSelectedCoop();

if (!coop) {
  alert("Unable to load the selected coop.");
  window.location.href = "coop-planner.html";
  return;
}

updateRecordFeaturesByChickenType();

try {
    const response = await fetch(
      `/api/records/user/${userId}/coop/${selectedCoopId}`
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
        "Failed to load records."
      );
    }

    recordData = result.records || {
      expenses: [],
      eggs: [],
      mortality: [],
      chicken: [],
      meat: []
    };

    normalizeRecordData();

    updateRecordStats();
    renderActiveRecordTab();

  } catch (error) {
    console.error(
      "Load Record Management Error:",
      error
    );
  }
}


function normalizeRecordData() {
  recordData.expenses =
    (recordData.expenses || []).map(item => ({
      ...item,
      amount: Number(item.amount) || 0,
      date: formatRecordDate(item.date)
    }));

  recordData.eggs =
    (recordData.eggs || []).map(item => ({
      ...item,
      eggs: Number(item.eggs) || 0,
      date: formatRecordDate(item.date)
    }));

  recordData.mortality =
    (recordData.mortality || []).map(item => ({
      ...item,
      deaths: Number(item.deaths) || 0,
      date: formatRecordDate(item.date)
    }));

  recordData.chicken =
    (recordData.chicken || []).map(item => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      days: Number(item.days) || 0,
      date: formatRecordDate(item.date)
    }));

  recordData.meat =
    (recordData.meat || []).map(item => ({
      ...item,
      birdsCount: Number(item.birdsCount) || 0,
      weight: Number(item.weight) || 0,
      date: formatRecordDate(item.date)
    }));
}


function updateRecordStats() {
  const totalExpenses =
    recordData.expenses.reduce(
      (sum, item) => sum + item.amount,
      0
    );

  const totalEggs =
    recordData.eggs.reduce(
      (sum, item) => sum + item.eggs,
      0
    );

  const totalDeaths =
    recordData.mortality.reduce(
      (sum, item) => sum + item.deaths,
      0
    );

  const totalChickens =
    recordData.chicken.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

  const totalMeat =
    recordData.meat.reduce(
      (sum, item) => sum + item.weight,
      0
    );

  const mortalityRate =
    totalChickens > 0
      ? (totalDeaths / totalChickens) * 100
      : 0;

  setRecordText(
    "recordTotalExpenses",
    `₱${totalExpenses.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`
  );

  setRecordText(
    "recordExpenseCount",
    `${recordData.expenses.length} ${
      recordData.expenses.length === 1
        ? "transaction"
        : "transactions"
    }`
  );

  setRecordText(
    "recordTotalEggs",
    totalEggs.toLocaleString()
  );

  setRecordText(
    "recordEggCount",
    `${recordData.eggs.length} ${
      recordData.eggs.length === 1
        ? "collection log"
        : "collection logs"
    }`
  );

  setRecordText(
    "recordMortalityRate",
    `${mortalityRate.toFixed(1)}%`
  );

  setRecordText(
    "recordDeathCount",
    `${totalDeaths} total ${
      totalDeaths === 1 ? "death" : "deaths"
    }`
  );

  setRecordText(
    "recordTotalChickens",
    totalChickens.toLocaleString()
  );

  setRecordText(
    "recordChickenCount",
    `${recordData.chicken.length} ${
      recordData.chicken.length === 1
        ? "batch log"
        : "batch logs"
    }`
  );

  setRecordText(
    "recordTotalMeat",
    `${totalMeat.toLocaleString()} kg`
  );

  setRecordText(
    "recordMeatCount",
    `${recordData.meat.length} ${
      recordData.meat.length === 1
        ? "harvest log"
        : "harvest logs"
    }`
  );
}


function switchRecordTab(tab) {
   if (tab === "eggs" && isBroilerCoop()) {
    return;
  }
  activeRecordTab = tab;

  document
    .querySelectorAll(".record-tabs button")
    .forEach(button => {
      button.classList.remove("active");
    });

  const clickedButton =
    Array.from(
      document.querySelectorAll(
        ".record-tabs button"
      )
    ).find(button =>
      button
        .getAttribute("onclick")
        ?.includes(`'${tab}'`)
    );

  if (clickedButton) {
    clickedButton.classList.add("active");
  }

  renderActiveRecordTab();
}


function renderActiveRecordTab() {
  if (activeRecordTab === "expenses") {
    loadExpenseRecords();
  }

  else if (activeRecordTab === "eggs") {
    loadEggRecords();
  }

  else if (activeRecordTab === "mortality") {
    loadMortalityRecords();
  }

  else if (activeRecordTab === "chicken") {
    loadChickenRecords();
  }

  else if (activeRecordTab === "meat") {
    loadMeatRecords();
  }

  updateRecordEmptyState();

  if (window.lucide) {
    lucide.createIcons();
  }
}


function loadExpenseRecords() {
  setRecordText(
    "recordPanelTitle",
    "Expense Records"
  );

  setRecordText(
    "recordPanelSubtitle",
    "Track all farm-related expenses"
  );

  const addButton =
    document.getElementById("recordAddBtn");

  if (addButton) {
    addButton.innerHTML = `
      <i data-lucide="plus"></i>
      Add Expense
    `;
  }

  const search =
    document
      .getElementById("recordSearchInput")
      ?.value
      .trim()
      .toLowerCase() || "";

  const categoryFilter =
    document.getElementById(
      "recordCategoryFilter"
    );

  if (categoryFilter) {
    categoryFilter.style.display = "block";
  }

  const category =
    categoryFilter?.value || "all";

  const filtered =
    recordData.expenses.filter(item => {
      const matchSearch =
        (item.description || "")
          .toLowerCase()
          .includes(search);

      const matchCategory =
        category === "all" ||
        item.category === category;

      return matchSearch && matchCategory;
    });

  setTableHeader(`
    <tr>
      <th>Date</th>
      <th>Coop</th>
      <th>Category</th>
      <th>Description</th>
      <th>Amount</th>
      <th>Actions</th>
    </tr>
  `);

  setRecordText(
    "runningTotal",
    `₱${filtered
      .reduce(
        (sum, item) =>
          sum + item.amount,
        0
      )
      .toLocaleString()}`
  );

  renderTableRows(
    filtered.map(item => `
      <tr>
        <td>
        ${escapeRecordHTML(
          formatRecordDateTime(item.date, item.time)
        )}
      </td>
        <td>${escapeRecordHTML(item.coop)}</td>

        <td>
          <span class="badge">
            ${escapeRecordHTML(item.category)}
          </span>
        </td>

        <td>
          ${escapeRecordHTML(
            item.description || "-"
          )}
        </td>

        <td>
          ₱${item.amount.toLocaleString()}
        </td>

        <td>
          ${getRecordActions(item.id)}
        </td>
      </tr>
    `).join("")
  );
}


function loadEggRecords() {
  setRecordText(
    "recordPanelTitle",
    "Egg Collection Logs"
  );

  setRecordText(
    "recordPanelSubtitle",
    "Track daily egg production"
  );

  updateAddButton("Add Egg Record");

  hideCategoryFilter();

  setTableHeader(`
    <tr>
      <th>Date</th>
      <th>Coop</th>
      <th>Number of Eggs</th>
      <th>Notes</th>
      <th>Actions</th>
    </tr>
  `);

  setRecordText(
    "runningTotal",
    `Total Eggs: ${recordData.eggs
      .reduce(
        (sum, item) =>
          sum + item.eggs,
        0
      )
      .toLocaleString()}`
  );

  renderTableRows(
    recordData.eggs.map(item => `
      <tr>
        <td>
  ${escapeRecordHTML(
    formatRecordDateTime(item.date, item.time)
  )}
</td>

        <td>
          ${escapeRecordHTML(item.coop)}
        </td>

        <td>
          ${item.eggs.toLocaleString()}
        </td>

        <td>
          ${escapeRecordHTML(
            item.notes || "-"
          )}
        </td>

        <td>
          ${getRecordActions(item.id)}
        </td>
      </tr>
    `).join("")
  );
}


function loadMortalityRecords() {
  setRecordText(
    "recordPanelTitle",
    "Mortality Records"
  );

  setRecordText(
    "recordPanelSubtitle",
    "Track chicken health and mortality"
  );

  updateAddButton(
    "Add Mortality Record"
  );

  hideCategoryFilter();

  setTableHeader(`
    <tr>
      <th>Date</th>
      <th>Coop</th>
      <th>Deaths</th>
      <th>Cause</th>
      <th>Notes</th>
      <th>Actions</th>
    </tr>
  `);

  setRecordText(
    "runningTotal",
    `Total Deaths: ${recordData.mortality
      .reduce(
        (sum, item) =>
          sum + item.deaths,
        0
      )}`
  );

  renderTableRows(
    recordData.mortality.map(item => `
      <tr>
        <td>
  ${escapeRecordHTML(
    formatRecordDateTime(item.date, item.time)
  )}
</td>
        <td>${escapeRecordHTML(item.coop)}</td>
        <td>${item.deaths}</td>

        <td>
          <span class="badge">
            ${escapeRecordHTML(
              item.cause || "-"
            )}
          </span>
        </td>

        <td>
          ${escapeRecordHTML(
            item.notes || "-"
          )}
        </td>

        <td>
          ${getRecordActions(item.id)}
        </td>
      </tr>
    `).join("")
  );
}


function loadChickenRecords() {
  setRecordText(
    "recordPanelTitle",
    "Chicken Inventory Records"
  );

  setRecordText(
    "recordPanelSubtitle",
    "Manage active chicken batches, stocks, and breeds"
  );

  updateAddButton("Add Chicken");

  hideCategoryFilter();

  setTableHeader(`
    <tr>
      <th>Date</th>
      <th>Coop</th>
      <th>No. of Chicken/s</th>
      <th>Stage</th>
      <th>Days</th>
      <th>Actions</th>
    </tr>
  `);

  setRecordText(
    "runningTotal",
    `Total Active Chickens: ${recordData.chicken
      .reduce(
        (sum, item) =>
          sum + item.quantity,
        0
      )
      .toLocaleString()} heads`
  );

  renderTableRows(
    recordData.chicken.map(item => `
      <tr>
       <td>
  ${escapeRecordHTML(
    formatRecordDateTime(item.date, item.time)
  )}
</td>
        <td>${escapeRecordHTML(item.coop)}</td>

        <td>
          ${item.quantity.toLocaleString()}
        </td>

        <td>
          <span class="badge">
            ${escapeRecordHTML(item.stage)}
          </span>
        </td>

        <td>${item.days} days</td>

        <td>
          ${getRecordActions(item.id)}
        </td>
      </tr>
    `).join("")
  );
}


function loadMeatRecords() {
  setRecordText(
    "recordPanelTitle",
    "Meat Production Logs"
  );

  setRecordText(
    "recordPanelSubtitle",
    "Track broiler harvests and total weight production"
  );

  updateAddButton("Add Meat Log");

  hideCategoryFilter();

  setTableHeader(`
    <tr>
      <th>Harvest Date</th>
      <th>Coop / Batch</th>
      <th>Birds Harvested</th>
      <th>Total Weight</th>
      <th>Actions</th>
    </tr>
  `);

  setRecordText(
    "runningTotal",
    `Total Harvested: ${recordData.meat
      .reduce(
        (sum, item) =>
          sum + item.weight,
        0
      )
      .toLocaleString()} kg`
  );

  renderTableRows(
    recordData.meat.map(item => `
      <tr>
        <td>
  ${escapeRecordHTML(
    formatRecordDateTime(item.date, item.time)
  )}
</td>

        <td>
          ${escapeRecordHTML(
            item.coopOrBatch
          )}
        </td>

        <td>
          ${item.birdsCount} birds
        </td>

        <td>
          <strong>
            ${item.weight} kg
          </strong>
        </td>

        <td>
          ${getRecordActions(item.id)}
        </td>
      </tr>
    `).join("")
  );
}


function getRecordActions(id) {
  return `
    <div class="table-actions">

      <button
        type="button"
        onclick="editRecord(${id})"
        title="Edit">

        <i data-lucide="square-pen"></i>

      </button>

      <button
        type="button"
        class="delete"
        onclick="deleteRecord(${id})"
        title="Delete">

        <i data-lucide="trash-2"></i>

      </button>

    </div>
  `;
}


function updateAddButton(text) {
  const button =
    document.getElementById("recordAddBtn");

  if (!button) return;

  button.innerHTML = `
    <i data-lucide="plus"></i>
    ${text}
  `;
}


function hideCategoryFilter() {
  const filter =
    document.getElementById(
      "recordCategoryFilter"
    );

  if (filter) {
    filter.style.display = "none";
  }
}


function setTableHeader(html) {
  const head =
    document.getElementById(
      "recordTableHead"
    );

  if (head) {
    head.innerHTML = html;
  }
}


function renderTableRows(html) {
  const body =
    document.getElementById(
      "recordTableBody"
    );

  if (body) {
    body.innerHTML = html;
  }
}


function updateRecordEmptyState() {
  const emptyState =
    document.getElementById(
      "recordEmptyState"
    );

  if (!emptyState) return;

  const items =
    recordData[activeRecordTab] || [];

  if (items.length > 0) {
    emptyState.style.display = "none";
    return;
  }

  emptyState.style.display = "flex";

  const title =
    emptyState.querySelector("h3");

  const text =
    emptyState.querySelector("p");

  const button =
    emptyState.querySelector("button");

  const config = {
    expenses: {
      title: "No expense records yet",
      text: "Start tracking your farm expenses and operational records.",
      button: "Add Your First Expense"
    },

    eggs: {
      title: "No egg collection records yet",
      text: "Start recording your daily egg production.",
      button: "Add Your First Egg Record"
    },

    mortality: {
      title: "No mortality records yet",
      text: "Mortality records will appear here when added.",
      button: "Add Your First Mortality Record"
    },

    chicken: {
      title: "No chicken records yet",
      text: "Start recording your active chicken batches.",
      button: "Add Your First Chicken Batch"
    },

    meat: {
      title: "No meat production records yet",
      text: "Start recording your broiler harvests.",
      button: "Add Your First Meat Record"
    }
  };

  const selected =
    config[activeRecordTab];

  if (title) {
    title.textContent = selected.title;
  }

  if (text) {
    text.textContent = selected.text;
  }

  if (button) {
    button.innerHTML = `
      <i data-lucide="plus"></i>
      ${selected.button}
    `;
  }
}


function openRecordModal() {
  if (
    activeRecordTab === "eggs" &&
    isBroilerCoop()
  ) {
    return;
  }

  editRecordId = null;

  buildRecordForm();

  const modal =
    document.getElementById("recordModal");

  if (modal) {
    modal.classList.remove("hidden");
  }
}


function closeRecordModal() {
  const modal =
    document.getElementById("recordModal");

  if (modal) {
    modal.classList.add("hidden");
  }

  editRecordId = null;
}


function getSelectedCoopField() {
  const coopName =
    selectedCoop?.CoopName ||
    "Selected Coop";

  return `
    <input
      type="text"
      value="${escapeRecordHTML(coopName)}"
      readonly
    >
  `;
}
function getCurrentRecordDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentRecordTime() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function buildRecordForm(record = null) {
  const title =
    document.getElementById(
      "recordModalTitle"
    );

  const fields =
    document.getElementById(
      "recordFormFields"
    );

  if (!title || !fields) return;

  if (activeRecordTab === "expenses") {
    title.textContent =
      record
        ? "Edit Expense"
        : "Add Expense";

    fields.innerHTML = `
<div class="record-date-time-row">

  <div class="form-group">
    <label>Date</label>
    <input
      type="date"
      id="expenseDate"
      value="${getCurrentRecordDate()}"
      required>
  </div>

  <div class="form-group">
    <label>Time</label>
    <input
      type="time"
      id="expenseTime"
      value="${getCurrentRecordTime()}"
      required>
  </div>

</div>

      <div class="form-group">
        <label>Coop</label>
        ${getSelectedCoopField()}
      </div>

      <div class="form-group">
        <label>Category</label>

        <select id="expenseCategory">
          <option value="Feed">Feed</option>
          <option value="Medicine">Medicine</option>
          <option value="Labor">Labor</option>
          <option value="Construction">Construction</option>
          <option value="Utilities">Utilities</option>
          <option value="Livestock">Chicken Batches</option>
          <option value="Harvest">Meat Harvest</option>
          <option value="Misc">Miscellaneous</option>
        </select>
      </div>

      <div class="form-group">
        <label>Description</label>

        <input
          type="text"
          id="expenseDesc"
          placeholder="e.g., Bought 2 sacks of feed">
      </div>

      <div class="form-group">
        <label>Amount</label>

        <input
          type="number"
          min="0"
          step="0.01"
          id="expenseAmount"
          placeholder="0.00">
      </div>
    `;
  }

  else if (activeRecordTab === "eggs") {
    title.textContent =
      record
        ? "Edit Egg Collection"
        : "Log Egg Collection";

    fields.innerHTML = `
<div class="record-date-time-row">

  <div class="form-group">
    <label>Date</label>
    <input
      type="date"
      id="eggDate"
      value="${getCurrentRecordDate()}"
      required>
  </div>

  <div class="form-group">
    <label>Time</label>
    <input
      type="time"
      id="eggTime"
      value="${getCurrentRecordTime()}"
      required>
  </div>

</div>
      <div class="form-group">
        <label>Coop</label>
       ${getSelectedCoopField()}
      </div>

      <div class="form-group">
        <label>Number of Eggs</label>

        <input
          type="number"
          min="0"
          id="eggCount"
          placeholder="0">
      </div>

      <div class="form-group">
        <label>Notes</label>

        <input
          type="text"
          id="eggNotes"
          placeholder="Optional notes">
      </div>
    `;
  }

  else if (activeRecordTab === "mortality") {
    title.textContent =
      record
        ? "Edit Mortality Log"
        : "Log Mortality";

    fields.innerHTML = `
<div class="record-date-time-row">

  <div class="form-group">
    <label>Date</label>
    <input
      type="date"
      id="mortalityDate"
      value="${getCurrentRecordDate()}"
      required>
  </div>

  <div class="form-group">
    <label>Time</label>
    <input
      type="time"
      id="mortalityTime"
      value="${getCurrentRecordTime()}"
      required>
  </div>

</div>

      <div class="form-group">
        <label>Coop</label>
        ${getSelectedCoopField()}
      </div>

      <div class="form-group">
        <label>Deaths</label>

        <input
          type="number"
          min="0"
          id="mortalityDeaths"
          placeholder="0">
      </div>

      <div class="form-group">
        <label>Cause</label>

        <input
          type="text"
          id="mortalityCause"
          placeholder="e.g., Heat stress">
      </div>

      <div class="form-group">
        <label>Notes</label>

        <input
          type="text"
          id="mortalityNotes"
          placeholder="Optional notes">
      </div>
    `;
  }

  else if (activeRecordTab === "chicken") {
    title.textContent =
      record
        ? "Edit Chicken Batch"
        : "Add Chicken Batch";

    fields.innerHTML = `
<div class="record-date-time-row">

  <div class="form-group">
    <label>Date</label>
    <input
      type="date"
      id="chickenDate"
      value="${getCurrentRecordDate()}"
      required>
  </div>

  <div class="form-group">
    <label>Time</label>
    <input
      type="time"
      id="chickenTime"
      value="${getCurrentRecordTime()}"
      required>
  </div>

</div>

      <div class="form-group">
        <label>Coop</label>
        ${getSelectedCoopField()}
      </div>

      <div class="form-group">
        <label>No. of Chicken/s</label>

        <input
          type="number"
          min="0"
          id="chickenQty"
          placeholder="0">
      </div>

      <div class="form-group">
        <label>Chicken Type</label>

        <input
          type="text"
          id="chickenStage"
          value="${
            String(selectedCoop?.ChickenType || "")
              .toLowerCase()
              .includes("broiler")
                ? "Broiler"
                : String(selectedCoop?.ChickenType || "")
                    .toLowerCase()
                    .includes("layer")
                  ? "Layer"
                  : escapeRecordHTML(
                      selectedCoop?.ChickenType || "Not specified"
                    )
          }"
          readonly
        >
      </div>

      <div class="form-group">
        <label>Days</label>

        <input
          type="number"
          min="0"
          id="chickenDays"
          placeholder="0">
      </div>
    `;
  }

  else if (activeRecordTab === "meat") {
    title.textContent =
      record
        ? "Edit Meat Log"
        : "Add Meat Production Log";

    fields.innerHTML = `
<div class="record-date-time-row">

  <div class="form-group">
    <label>Harvest Date</label>
    <input
      type="date"
      id="meatDate"
      value="${getCurrentRecordDate()}"
      required>
  </div>

  <div class="form-group">
    <label>Time</label>
    <input
      type="time"
      id="meatTime"
      value="${getCurrentRecordTime()}"
      required>
  </div>

</div>

      <div class="form-group">
        <label>Coop / Batch Reference</label>

        ${getSelectedCoopField()}
      </div>

      <div class="form-group">
        <label>Birds Harvested</label>

        <input
          type="number"
          min="0"
          id="meatBirdsCount"
          placeholder="0">
      </div>

      <div class="form-group">
        <label>Total Weight (kg)</label>

        <input
          type="number"
          min="0"
          step="0.01"
          id="meatWeight"
          placeholder="0.00">
      </div>
    `;
  }

  if (record) {
    fillRecordForm(record);
  }
}


function fillRecordForm(record) {
  if (activeRecordTab === "expenses") {
    setInputValue(
      "expenseDate",
      record.date
    );
    setInputValue(
    "expenseTime",
    record.time
  );

    setInputValue(
      "expenseCategory",
      record.category
    );

    setInputValue(
      "expenseDesc",
      record.description
    );

    setInputValue(
      "expenseAmount",
      record.amount
    );
  }

  else if (activeRecordTab === "eggs") {
    setInputValue(
      "eggDate",
      record.date
    );
    setInputValue(
  "eggTime",
  record.time
);

    setInputValue(
      "eggCount",
      record.eggs
    );

    setInputValue(
      "eggNotes",
      record.notes
    );
  }

  else if (activeRecordTab === "mortality") {
    setInputValue(
      "mortalityDate",
      record.date
    );
    setInputValue(
  "mortalityTime",
  record.time
);

    setInputValue(
      "mortalityDeaths",
      record.deaths
    );

    setInputValue(
      "mortalityCause",
      record.cause
    );

    setInputValue(
      "mortalityNotes",
      record.notes
    );
  }

  else if (activeRecordTab === "chicken") {
    setInputValue(
      "chickenDate",
      record.date
    );
    setInputValue(
  "chickenTime",
  record.time
);

    setInputValue(
      "chickenQty",
      record.quantity
    );

    setInputValue(
      "chickenStage",
      record.stage
    );

    setInputValue(
      "chickenDays",
      record.days
    );
  }

  else if (activeRecordTab === "meat") {
    setInputValue(
      "meatDate",
      record.date
    );
    setInputValue(
  "meatTime",
  record.time
);

    setInputValue(
      "meatBirdsCount",
      record.birdsCount
    );

    setInputValue(
      "meatWeight",
      record.weight
    );
  }
}


function setInputValue(id, value) {
  const input =
    document.getElementById(id);

  if (input) {
    input.value =
      value ?? "";
  }
}


function editRecord(id) {
  const record =
    (recordData[activeRecordTab] || [])
      .find(item =>
        Number(item.id) === Number(id)
      );

  if (!record) return;

  editRecordId = id;

  buildRecordForm(record);

  const modal =
    document.getElementById(
      "recordModal"
    );

  if (modal) {
    modal.classList.remove("hidden");
  }
}


function getRecordFormData() {
  if (activeRecordTab === "expenses") {
    return {
      date:
        document.getElementById(
          "expenseDate"
        )?.value,

        time:
        document.getElementById(
          "expenseTime"
        )?.value,

      coop: selectedCoop?.CoopName || "",

      category:
        document.getElementById(
          "expenseCategory"
        )?.value,

      description:
        document.getElementById(
          "expenseDesc"
        )?.value.trim(),

      amount:
        Number(
          document.getElementById(
            "expenseAmount"
          )?.value
        ) || 0
    };
  }

  if (activeRecordTab === "eggs") {
    return {
      date:
        document.getElementById(
          "eggDate"
        )?.value,

        time:
        document.getElementById(
          "eggTime"
        )?.value,

      coop: selectedCoop?.CoopName || "",

      eggs:
        Number(
          document.getElementById(
            "eggCount"
          )?.value
        ) || 0,

      notes:
        document.getElementById(
          "eggNotes"
        )?.value.trim()
    };
  }

  if (activeRecordTab === "mortality") {
    return {
      date:
        document.getElementById(
          "mortalityDate"
        )?.value,

        time:
        document.getElementById(
          "mortalityTime"
        )?.value,

      coop: selectedCoop?.CoopName || "",

      deaths:
        Number(
          document.getElementById(
            "mortalityDeaths"
          )?.value
        ) || 0,

      cause:
        document.getElementById(
          "mortalityCause"
        )?.value.trim(),

      notes:
        document.getElementById(
          "mortalityNotes"
        )?.value.trim()
    };
  }

  if (activeRecordTab === "chicken") {
    return {
      date:
        document.getElementById(
          "chickenDate"
        )?.value,

        time:
        document.getElementById(
          "chickenTime"
        )?.value,

      coop: selectedCoop?.CoopName || "",

      quantity:
        Number(
          document.getElementById(
            "chickenQty"
          )?.value
        ) || 0,

      stage:
        document.getElementById(
          "chickenStage"
        )?.value,

      days:
        Number(
          document.getElementById(
            "chickenDays"
          )?.value
        ) || 0
    };
  }

  if (activeRecordTab === "meat") {
    return {
      date:
        document.getElementById(
          "meatDate"
        )?.value,

        time:
        document.getElementById(
          "meatTime"
        )?.value,

      coopOrBatch: selectedCoop?.CoopName || "",

      birdsCount:
        Number(
          document.getElementById(
            "meatBirdsCount"
          )?.value
        ) || 0,

      weight:
        Number(
          document.getElementById(
            "meatWeight"
          )?.value
        ) || 0
    };
  }

  return {};
}


async function saveRecord() {
  const userId =
    getRecordUserId();

  if (!userId) {
    alert("Please sign in again.");
    return;
  }

  const formData =
    getRecordFormData();

  if (!formData.date) {
    alert("Please select a date.");
    return;
  }

  const payload = {
    userId,
    coopId: selectedCoopId,
    ...formData
  };

  try {
    let url =
      `/api/records/${activeRecordTab}`;

    let method = "POST";

    if (editRecordId) {
      url += `/${editRecordId}`;
      method = "PUT";
    }

    const response =
      await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json"
        },
        body:
          JSON.stringify(payload)
      });

    const result =
      await response.json();

      console.log("RECORD SAVE RESPONSE:", result);

      if (!response.ok || !result.success) {

        if (result.limitReached) {
          closeRecordModal();

          showRecordUpgradePopup(
            result.message ||
            "You have used all 10 free records for this category. Upgrade to Premium for unlimited Record Management."
          );

          return;
        }

  throw new Error(
    result.message ||
    "Failed to save record."
  );
}

    closeRecordModal();

    await loadRecordsPage();

  } catch (error) {
    console.error(
      "Save Record Error:",
      error
    );

    alert(
      error.message ||
      "Failed to save record."
    );
  }
}


async function deleteRecord(id) {
  const userId = getRecordUserId();

  if (!userId) return;

  if (!selectedCoopId) {
    alert("No coop selected.");
    return;
  }

  const confirmed = confirm(
    "Are you sure you want to delete this record?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `/api/records/${activeRecordTab}/${id}?userId=${userId}&coopId=${selectedCoopId}`,
      {
        method: "DELETE"
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
        "Failed to delete record."
      );
    }

    await loadRecordsPage();

  } catch (error) {
    console.error(
      "Delete Record Error:",
      error
    );

    alert(
      error.message ||
      "Failed to delete record."
    );
  }
}


function setRecordText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}


function escapeRecordHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


document.addEventListener(
  "DOMContentLoaded",
  async function () {
    const searchInput =
      document.getElementById(
        "recordSearchInput"
      );

    const categoryFilter =
      document.getElementById(
        "recordCategoryFilter"
      );

    if (searchInput) {
      searchInput.oninput =
        renderActiveRecordTab;
    }

    if (categoryFilter) {
      categoryFilter.onchange =
        renderActiveRecordTab;
    }

    await loadActiveCoopOptions();
    await loadRecordsPage();

    if (window.lucide) {
      lucide.createIcons();
    }
  }
);
function showRecordUpgradePopup(message) {
  const existing =
    document.getElementById(
      "recordUpgradeOverlay"
    );

  if (existing) {
    existing.remove();
  }

  const overlay =
    document.createElement("div");

  overlay.id =
    "recordUpgradeOverlay";

  overlay.className =
    "upgrade-overlay";

  overlay.innerHTML = `
    <div class="upgrade-modal">

      <button
        type="button"
        class="upgrade-close"
        onclick="closeRecordUpgradePopup()"
      >
        ×
      </button>

      <div class="upgrade-icon">
        <i data-lucide="crown"></i>
      </div>

      <h2>Free Limit Reached</h2>

      <p>${message}</p>

      <div class="upgrade-actions">

        <button
          type="button"
          class="upgrade-later-btn"
          onclick="closeRecordUpgradePopup()"
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

  document.body.appendChild(overlay);

  if (window.lucide) {
    lucide.createIcons();
  }
}

function closeRecordUpgradePopup() {
  const overlay =
    document.getElementById(
      "recordUpgradeOverlay"
    );

  if (overlay) {
    overlay.remove();
  }
}