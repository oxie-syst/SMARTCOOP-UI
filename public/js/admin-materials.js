
let adminMaterials = [];
let selectedChickenType = "Broilers";

document.addEventListener("DOMContentLoaded", async () => {
  const search = document.getElementById("materialSearch");
  const filter = document.getElementById("materialStatusFilter");
  const form = document.getElementById("editMaterialPriceForm");

  search.addEventListener("input", renderAdminMaterials);
  filter.addEventListener("change", renderAdminMaterials);

  document.querySelectorAll(".material-category-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      selectedChickenType = tab.dataset.chickenType;

      document.querySelectorAll(".material-category-tab").forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.chickenType === selectedChickenType
        );
      });

      document.getElementById("materialCategoryTitle").textContent =
        `${selectedChickenType} Material Price List`;

      search.value = "";
      filter.value = "All";

      renderAdminMaterials();
    });
  });

  document.getElementById("closeMaterialPriceModal")
    .addEventListener("click", closeMaterialPriceModal);

  document.getElementById("cancelMaterialPriceBtn")
    .addEventListener("click", closeMaterialPriceModal);

  form.addEventListener("submit", saveMaterialPrice);

  if (typeof checkAdmin === "function") {
    await checkAdmin();
  }

  if (typeof loadUserInfo === "function") {
    await loadUserInfo();
  }

  await loadAdminMaterials();
});

async function loadAdminMaterials() {
  const tbody = document.getElementById("adminMaterialsTable");

  try {
    const response = await fetch("/api/admin/materials", {
      credentials: "same-origin",
      cache: "no-store"
    });

    if (response.status === 401 || response.status === 403) {
      tbody.innerHTML =
        '<tr><td colspan="5">Administrator access required.</td></tr>';
      return;
    }

    if (!response.ok) {
      throw new Error("Unable to load materials.");
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.materials)) {
      throw new Error(data.message || "Invalid materials response.");
    }

    adminMaterials = data.materials;

    renderAdminMaterials();

  } catch (error) {
    console.error("LOAD ADMIN MATERIALS ERROR:", error);
    tbody.innerHTML =
      '<tr><td colspan="5">Failed to load materials.</td></tr>';
  }
}

function escapeMaterialHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatMaterialPrice(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2
  }).format(Number(value) || 0);
}

function renderAdminMaterials() {
  const search = document.getElementById("materialSearch")
    .value.trim().toLowerCase();

  const status = document.getElementById("materialStatusFilter").value;
  const tbody = document.getElementById("adminMaterialsTable");

  const categoryMaterials = adminMaterials.filter(material =>
    String(material.ChickenType ?? "").trim().toLowerCase() ===
    selectedChickenType.toLowerCase()
  );

  document.getElementById("totalMaterials").textContent =
    categoryMaterials.length;

  document.getElementById("activeMaterials").textContent =
    categoryMaterials.filter(m => Number(m.IsActive) === 1).length;

  document.getElementById("inactiveMaterials").textContent =
    categoryMaterials.filter(m => Number(m.IsActive) !== 1).length;

  const filtered = categoryMaterials.filter(material => {
    const searchable = [
      material.MaterialName,
      material.Unit
    ].join(" ").toLowerCase();

    const active = Number(material.IsActive) === 1;

    return searchable.includes(search) &&
      (status === "All" ||
       (status === "Active" && active) ||
       (status === "Inactive" && !active));
  });

  if (!filtered.length) {
    tbody.innerHTML =
      '<tr><td colspan="5">No materials found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(material => {
    const active = Number(material.IsActive) === 1;

    return `
      <tr>
        <td>${escapeMaterialHTML(material.MaterialName)}</td>
        <td>${escapeMaterialHTML(material.Unit)}</td>
        <td>${formatMaterialPrice(material.UnitPrice)}</td>
        <td>${active ? "Active" : "Inactive"}</td>
        <td>
          ${active ? `
            <button
              type="button"
              class="admin-action-btn"
              data-material-id="${Number(material.MaterialID)}">
              Edit Price
            </button>
          ` : "—"}
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll("[data-material-id]").forEach(button => {
    button.addEventListener("click", () => {
      openMaterialPriceModal(Number(button.dataset.materialId));
    });
  });
}

function openMaterialPriceModal(id) {
  const material = adminMaterials.find(item =>
    Number(item.MaterialID) === id &&
    Number(item.IsActive) === 1 &&
    String(item.ChickenType ?? "").trim().toLowerCase() ===
      selectedChickenType.toLowerCase()
  );

  if (!material) return;

  document.getElementById("editMaterialId").value = material.MaterialID;
  document.getElementById("editMaterialName").value = material.MaterialName;
  document.getElementById("editMaterialUnit").value = material.Unit;
  document.getElementById("editMaterialPrice").value = material.UnitPrice;

  document.getElementById("editMaterialPriceModal")
    .classList.remove("hidden");
}

function closeMaterialPriceModal() {
  document.getElementById("editMaterialPriceModal")
    .classList.add("hidden");
}

async function saveMaterialPrice(event) {
  event.preventDefault();

  const id = Number(document.getElementById("editMaterialId").value);
  const input = document.getElementById("editMaterialPrice");
  const button = document.getElementById("saveMaterialPriceBtn");

  const rawPrice = input.value.trim();
  const price = Number(rawPrice);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    rawPrice === "" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 9999999999.99 ||
    Math.abs(price * 100 - Math.round(price * 100)) > 0.000001
  ) {
    alert("Please enter a valid material price.");
    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const response = await fetch(
      `/api/admin/materials/${id}/price`,
      {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ unitPrice: price })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to update price.");
    }

    closeMaterialPriceModal();
    await loadAdminMaterials();

    alert("Material price updated successfully!");

  } catch (error) {
    console.error("SAVE MATERIAL PRICE ERROR:", error);
    alert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Save Changes";
  }
}
