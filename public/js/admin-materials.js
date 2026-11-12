let adminMaterials = [];

const MATERIAL_COOP_SIZES = Array.from(
  { length: 10 },
  (_, i) => `${i + 1}x${i + 1}`
);

document.addEventListener("DOMContentLoaded", async () => {
  const search = document.getElementById("materialSearch");
  const chickenFilter = document.getElementById(
    "materialChickenTypeFilter"
  );
  const statusFilter = document.getElementById(
    "materialStatusFilter"
  );
  const categoryFilter = document.getElementById(
    "materialCategoryFilter"
  );

  search.addEventListener("input", renderAdminMaterials);
  chickenFilter.addEventListener("change", renderAdminMaterials);
  statusFilter.addEventListener("change", renderAdminMaterials);
  categoryFilter.addEventListener("change", renderAdminMaterials);

  document.getElementById("editMaterialPriceForm")
    .addEventListener("submit", saveMaterialPrice);

  document.getElementById("closeMaterialPriceModal")
    .addEventListener("click", closeMaterialPriceModal);

  document.getElementById("cancelMaterialPriceBtn")
    .addEventListener("click", closeMaterialPriceModal);

  document.getElementById("openAddMaterialBtn")
    .addEventListener("click", openAddMaterialModal);

  document.getElementById("closeAddMaterialModal")
    .addEventListener("click", closeAddMaterialModal);

  document.getElementById("cancelAddMaterialBtn")
    .addEventListener("click", closeAddMaterialModal);

  document.getElementById("addMaterialForm")
    .addEventListener("submit", saveNewMaterial);

  document.getElementById("adminMaterialsTable")
    .addEventListener("click", handleMaterialAction);

  createMaterialQuantityInputs();
  document
  .getElementById("autoFillQuantitiesBtn")
  ?.addEventListener("click", autoFillMaterialQuantities);

  if (typeof checkAdmin === "function") {
    await checkAdmin();
  }

  if (typeof loadUserInfo === "function") {
    await loadUserInfo();
  }

  await loadAdminMaterials();
});

// HTML ESCAPING
function escapeMaterialHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// PRICE FORMAT
function formatMaterialPrice(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2
  }).format(Number(value) || 0);
}

// PRICE VALIDATION
function validMaterialPrice(rawValue) {
  if (
    rawValue === "" ||
    rawValue === null ||
    rawValue === undefined
  ) {
    return false;
  }

  const price = Number(rawValue);

  return (
    Number.isFinite(price) &&
    price >= 0 &&
    price <= 9999999999.99 &&
    Math.abs(
      price * 100 - Math.round(price * 100)
    ) < 0.000001
  );
}

// QUANTITY VALIDATION
function validMaterialQuantity(rawValue) {
  if (
    rawValue === "" ||
    rawValue === null ||
    rawValue === undefined
  ) {
    return false;
  }

  const quantity = Number(rawValue);

  return (
    Number.isFinite(quantity) &&
    quantity >= 0 &&
    quantity <= 99999999.99 &&
    Math.abs(
      quantity * 100 - Math.round(quantity * 100)
    ) < 0.000001
  );
}

// GENERATE QUANTITY INPUTS
function createMaterialQuantityInputs() {
  const container = document.getElementById(
    "materialQuantityGrid"
  );

  if (!container) {
    console.error("Material quantity container not found.");
    return;
  }

  container.innerHTML = MATERIAL_COOP_SIZES.map(size => {
    const label = size.replace("x", "×");

    return `
      <div class="input-group">
        <label for="materialQuantity_${size}">
          ${label} meters
        </label>

        <input
          id="materialQuantity_${size}"
          class="material-quantity-input"
          data-coop-size="${size}"
          type="number"
          min="0"
          max="99999999.99"
          step="0.01"
          placeholder="Enter quantity"
          required>
      </div>
    `;
  }).join("");
}

// COLLECT QUANTITIES
function collectMaterialQuantities() {
  const quantities = {};

  for (const size of MATERIAL_COOP_SIZES) {
    const input = document.getElementById(
      `materialQuantity_${size}`
    );

    if (!input) {
      throw new Error(
        `Quantity input for ${size} was not found.`
      );
    }

    const rawValue = input.value.trim();

    if (!validMaterialQuantity(rawValue)) {
      input.focus();

      throw new Error(
        `Please enter a valid quantity for ${size.replace("x", "×")}.`
      );
    }

    quantities[size] = Number(rawValue);
  }

  return quantities;
}

// API REQUEST
async function materialRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...options
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response from the server.");
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || `Request failed (${response.status}).`
    );
  }

  return data;
}

// LOAD ADMIN MATERIALS
async function loadAdminMaterials() {
  const tbody = document.getElementById(
    "adminMaterialsTable"
  );

  try {
    const data = await materialRequest(
      "/api/admin/materials"
    );

    if (!Array.isArray(data.materials)) {
      throw new Error("Invalid materials response.");
    }

    adminMaterials = data.materials;

    renderAdminMaterials();

    return true;

  } catch (error) {
    console.error("LOAD ADMIN MATERIALS ERROR:", error);

    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          ${escapeMaterialHTML(error.message)}
        </td>
      </tr>
    `;

    return false;
  }
}

// GROUP MATERIALS
function groupAdminMaterials() {
  const groups = new Map();

  for (const material of adminMaterials) {
    const name = String(
      material.MaterialName ?? ""
    ).trim();

    const unit = String(
      material.Unit ?? ""
    ).trim();

    const key = JSON.stringify([
      name.toLowerCase(),
      unit.toLowerCase()
    ]);

    if (!groups.has(key)) {
      groups.set(key, {
        MaterialID: Number(material.MaterialID),
        MaterialName: name,
        Unit: unit,
        records: [],
        chickenTypes: new Set(),
        categories: new Set(),
        prices: new Set()
      });
    }

    const group = groups.get(key);

    group.records.push(material);

    group.chickenTypes.add(
      String(material.ChickenType ?? "")
    );

    group.categories.add(
      String(material.Category ?? "Uncategorized")
    );

    group.prices.add(
      Number(material.UnitPrice).toFixed(2)
    );
  }

  return [...groups.values()].map(group => {
    group.IsActive = group.records.some(
      item => Number(item.IsActive) === 1
    ) ? 1 : 0;

    const representative =
      group.records.find(
        item => Number(item.IsActive) === 1
      ) || group.records[0];

    group.MaterialID = Number(
      representative.MaterialID
    );

    group.UnitPrice = Number(
      representative.UnitPrice
    );

    group.hasPriceConflict =
      group.prices.size > 1;

    group.hasStatusConflict =
      group.records.some(
        item => Number(item.IsActive) !== group.IsActive
      );

    return group;

  }).sort((a, b) =>
    a.MaterialName.localeCompare(b.MaterialName)
  );
}

// RENDER MATERIAL INVENTORY
function renderAdminMaterials() {
  const search = document.getElementById(
    "materialSearch"
  ).value.trim().toLowerCase();

  const chickenType = document.getElementById(
    "materialChickenTypeFilter"
  ).value;

  const category = document.getElementById(
    "materialCategoryFilter"
  ).value;

  const status = document.getElementById(
    "materialStatusFilter"
  ).value;

  const tbody = document.getElementById(
    "adminMaterialsTable"
  );

  const groups = groupAdminMaterials();

  document.getElementById(
    "totalMaterials"
  ).textContent = groups.length;

  document.getElementById(
    "activeMaterials"
  ).textContent = groups.filter(
    group => group.IsActive === 1
  ).length;

  document.getElementById(
    "inactiveMaterials"
  ).textContent = groups.filter(
    group => group.IsActive === 0
  ).length;

  const filtered = groups.filter(group => {
    const searchable = [
      group.MaterialName,
      group.Unit,
      ...group.chickenTypes,
      ...group.categories
    ].join(" ").toLowerCase();

    return (
      searchable.includes(search) &&
      (
        chickenType === "All" ||
        group.chickenTypes.has(chickenType)
      ) &&
      (
        category === "All" ||
        group.categories.has(category)
      ) &&
      (
        status === "All" ||
        (status === "Active" && group.IsActive === 1) ||
        (status === "Inactive" && group.IsActive === 0)
      )
    );
  });

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">No materials found.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(group => {
    const active = group.IsActive === 1;

    const usedFor = [...group.chickenTypes].map(
      type => type === "Layers (Egg Production)"
        ? "Layers"
        : type
    ).join(", ");

    const categories = [
      ...group.categories
    ].join(", ");

    const price = group.hasPriceConflict
      ? [...group.prices]
          .map(value => formatMaterialPrice(value))
          .join(" / ")
      : formatMaterialPrice(group.UnitPrice);

    const statusText = group.hasStatusConflict
      ? "Mixed"
      : active
        ? "Available"
        : "Unavailable";

    return `
      <tr>
        <td>
          ${escapeMaterialHTML(group.MaterialName)}
        </td>

        <td>
          ${escapeMaterialHTML(usedFor)}
        </td>

        <td>
          ${escapeMaterialHTML(categories)}
        </td>

        <td>
          ${escapeMaterialHTML(group.Unit)}
        </td>

        <td>
          ${escapeMaterialHTML(price)}

          ${group.hasPriceConflict
            ? '<small style="display:block">Different existing prices</small>'
            : ""}
        </td>

        <td>
          <span class="materials-status ${
            active ? "available" : "unavailable"
          }">
            ${statusText}
          </span>
        </td>

        <td>
          <div class="materials-action-group">
            ${active ? `
              <button
                type="button"
                class="admin-action-btn"
                data-action="edit"
                data-material-id="${group.MaterialID}">
                Edit Price
              </button>

              <button
                type="button"
                class="materials-toggle-btn"
                data-action="hide"
                data-material-id="${group.MaterialID}">
                Hide
              </button>
            ` : `
              <button
                type="button"
                class="materials-toggle-btn materials-restore-btn"
                data-action="restore"
                data-material-id="${group.MaterialID}">
                Restore
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// HANDLE TABLE ACTIONS
async function handleMaterialAction(event) {
  const button = event.target.closest(
    "button[data-action][data-material-id]"
  );

  if (!button || button.disabled) {
    return;
  }

  const id = Number(button.dataset.materialId);
  const action = button.dataset.action;

  if (!Number.isSafeInteger(id) || id <= 0) {
    return;
  }

  if (action === "edit") {
    openMaterialPriceModal(id);
    return;
  }

  if (action === "hide" || action === "restore") {
    button.disabled = true;

    try {
      await changeMaterialAvailability(
        id,
        action === "restore"
      );
    } finally {
      button.disabled = false;
    }
  }
}

// OPEN EDIT PRICE MODAL
function openMaterialPriceModal(id) {
  const material = groupAdminMaterials().find(
    item =>
      item.MaterialID === id &&
      item.IsActive === 1
  );

  if (!material) {
    return;
  }

  document.getElementById(
    "editMaterialId"
  ).value = material.MaterialID;

  document.getElementById(
    "editMaterialName"
  ).value = material.MaterialName;

  document.getElementById(
    "editMaterialUnit"
  ).value = material.Unit;

  document.getElementById(
    "editMaterialPrice"
  ).value = material.UnitPrice;

  document.getElementById(
    "editMaterialPriceModal"
  ).classList.remove("hidden");
}

function closeMaterialPriceModal() {
  document.getElementById(
    "editMaterialPriceModal"
  ).classList.add("hidden");
}

// OPEN ADD MATERIAL MODAL
function openAddMaterialModal() {
  document.getElementById(
    "addMaterialForm"
  ).reset();

  const selectedChicken = document.getElementById(
    "materialChickenTypeFilter"
  ).value;

  if (selectedChicken !== "All") {
    document.getElementById(
      "addMaterialChickenType"
    ).value = selectedChicken;
  }

  document.getElementById(
    "addMaterialModal"
  ).classList.remove("hidden");
}

function closeAddMaterialModal() {
  document.getElementById(
    "addMaterialModal"
  ).classList.add("hidden");
}

// SAVE NEW MATERIAL WITH QUANTITIES
async function saveNewMaterial(event) {
  event.preventDefault();

  const materialName = document.getElementById(
    "addMaterialName"
  ).value.trim();

  const chickenType = document.getElementById(
    "addMaterialChickenType"
  ).value;

  const category = document.getElementById(
    "addMaterialCategory"
  ).value;

  const unit = document.getElementById(
    "addMaterialUnit"
  ).value.trim();

  const rawPrice = document.getElementById(
    "addMaterialPrice"
  ).value.trim();

  const specification = document.getElementById(
    "addMaterialSpecification"
  ).value.trim();

  if (
    !materialName ||
    !unit ||
    materialName.length > 150 ||
    unit.length > 50 ||
    !validMaterialPrice(rawPrice)
  ) {
    alert("Please provide valid material details.");
    return;
  }

  let quantities;

  try {
    quantities = collectMaterialQuantities();
  } catch (error) {
    alert(error.message);
    return;
  }

  const button = document.getElementById(
    "saveAddMaterialBtn"
  );

  button.disabled = true;
  button.textContent = "Adding...";

  try {
    await materialRequest("/api/admin/materials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        materialName,
        chickenType,
        category,
        unit,
        unitPrice: Number(rawPrice),
        specification,
        quantities
      })
    });

    document.getElementById(
      "materialSearch"
    ).value = "";

    document.getElementById(
      "materialChickenTypeFilter"
    ).value = chickenType;

    document.getElementById(
      "materialCategoryFilter"
    ).value = "All";

    document.getElementById(
      "materialStatusFilter"
    ).value = "All";

    closeAddMaterialModal();

    const loaded = await loadAdminMaterials();

    if (loaded) {
      alert(
        "Material and quantities added successfully!"
      );
    } else {
      alert(
        "Material added, but the list could not be refreshed."
      );
    }

  } catch (error) {
    console.error("ADD MATERIAL ERROR:", error);
    alert(error.message);

  } finally {
    button.disabled = false;
    button.textContent = "Add Material";
  }
}

// HIDE OR RESTORE MATERIAL
async function changeMaterialAvailability(id, restore) {
  const material = adminMaterials.find(
    item => Number(item.MaterialID) === id
  );

  if (!material) {
    return;
  }

  const action = restore ? "restore" : "hide";

  if (!confirm(
    `Are you sure you want to ${action} "${material.MaterialName}"?`
  )) {
    return;
  }

  try {
    await materialRequest(
      restore
        ? `/api/admin/materials/${id}/restore`
        : `/api/admin/materials/${id}`,
      {
        method: restore ? "PATCH" : "DELETE"
      }
    );

    const loaded = await loadAdminMaterials();

    if (loaded) {
      alert(
        restore
          ? "Material restored successfully!"
          : "Material hidden successfully!"
      );
    } else {
      alert(
        "Availability updated, but the list could not be refreshed."
      );
    }

  } catch (error) {
    console.error(
      "CHANGE MATERIAL AVAILABILITY ERROR:",
      error
    );

    alert(error.message);
  }
}

// SAVE MATERIAL PRICE
async function saveMaterialPrice(event) {
  event.preventDefault();

  const id = Number(
    document.getElementById(
      "editMaterialId"
    ).value
  );

  const input = document.getElementById(
    "editMaterialPrice"
  );

  const button = document.getElementById(
    "saveMaterialPriceBtn"
  );

  const rawPrice = input.value.trim();

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    !validMaterialPrice(rawPrice)
  ) {
    alert("Please enter a valid material price.");
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    await materialRequest(
      `/api/admin/materials/${id}/price`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          unitPrice: Number(rawPrice)
        })
      }
    );

    closeMaterialPriceModal();

    const loaded = await loadAdminMaterials();

    if (loaded) {
      alert("Material price updated successfully!");
    } else {
      alert(
        "Price updated, but the list could not be refreshed."
      );
    }

  } catch (error) {
    console.error(
      "SAVE MATERIAL PRICE ERROR:",
      error
    );

    alert(error.message);

  } finally {
    button.disabled = false;
    button.textContent = "Save Changes";
  }
}
function autoFillMaterialQuantities() {
  const baseInput = document.getElementById(
    "materialQuantity_1x1"
  );

  const methodSelect = document.getElementById(
    "quantityAutoFillMethod"
  );

  if (!baseInput || !methodSelect) {
    return;
  }

  const baseValue = baseInput.value.trim();
  const baseQuantity = Number(baseValue);

  if (
    baseValue === "" ||
    !Number.isFinite(baseQuantity) ||
    baseQuantity < 0 ||
   baseQuantity > 99999999.99 ||
Math.abs(
  baseQuantity * 100 - Math.round(baseQuantity * 100)
) > 0.000001
  ) {
    alert("Please enter a valid quantity for 1×1 first.");
    baseInput.focus();
    return;
  }

  const method = methodSelect.value;

  for (let size = 2; size <= 10; size++) {
    const input = document.getElementById(
      `materialQuantity_${size}x${size}`
    );

    if (!input) continue;

    let quantity;

    if (method === "area") {
      quantity = baseQuantity * size * size;
    } else if (method === "linear") {
      quantity = baseQuantity * size;
    } else {
      quantity = baseQuantity;
    }

    quantity = Math.round(quantity * 100) / 100;

    if (quantity > 99999999.99) {
      alert("Calculated quantity exceeds the allowed maximum.");
      return;
    }

    input.value = quantity.toFixed(2);
  }
}