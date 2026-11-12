function openCoopModal() {
  const modal = document.getElementById("coopModal");

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeCoopModal() {
  const modal = document.getElementById("coopModal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

function setupCoopPlannerPage() {
  const form =
    document.getElementById(
      "coopPlannerForm"
    );

  if (!form) return;

  form.addEventListener(
    "submit",
    event => {
      event.preventDefault();

      const length =
        Number(
          document.getElementById(
            "coopLength"
          ).value
        );

      const width =
        Number(
          document.getElementById(
            "coopWidth"
          ).value
        );

      const chickens =
        Number(
          document.getElementById(
            "chickenCount"
          ).value
        );

      const price =
        Number(
          document.getElementById(
            "priceChicken"
          ).value
        );

      const area =
        length * width;

const sizeKey = `${length}x${width}`;

const estimatedCapacity =
  coopData[sizeKey]?.capacity ??
  Math.floor(area * 2.5);

      const usage =
        Math.round(
          (
            chickens /
            estimatedCapacity
          ) * 100
        );

      const investment =
        chickens * price;

      document.getElementById(
        "estimatedCapacity"
      ).textContent =
        `${estimatedCapacity} chickens`;

      document.getElementById(
        "spaceArea"
      ).textContent =
        `${area} m²`;

      document.getElementById(
        "capacityUsage"
      ).textContent =
        `${usage}%`;

      document.getElementById(
        "totalInvestment"
      ).textContent =
        `₱${investment.toLocaleString()}`;

      const note =
        document.getElementById(
          "plannerNote"
        );

      if (usage > 100) {
        note.textContent =
          "Warning: Your coop is over capacity. Increase space or reduce chickens.";

        note.style.background =
          "#fef2f2";

        note.style.color =
          "#dc2626";

      } else if (
        usage >= 80
      ) {
        note.textContent =
          "Good plan: Coop capacity is optimized.";

        note.style.background =
          "#ecfdf5";

        note.style.color =
          "#047857";

      } else {
        note.textContent =
          "There is still extra space available for more chickens.";

        note.style.background =
          "#eff6ff";

        note.style.color =
          "#1d4ed8";
      }
    }
  );
}

async function getPlans() {
  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  const response =
    await fetch(
      `/api/coops/user/${user.id}`
    );

  const result =
    await response.json();

  return result.coops;
}

let currentPlan = null;
let isSavingPlan = false;
let savedPlanRef = null;


async function savePlan() {
  if (!currentPlan) {
    alert("Generate a plan first.");
    return;
  }

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  if (!user || !user.id) {
    alert("Please log in first.");
    return;
  }
  
  
if (isSavingPlan) return;

if (savedPlanRef === currentPlan) {
  alert("This coop plan has already been saved.");
  return;
}

isSavingPlan = true;



  try {
    const response =
      await fetch(
        "/api/coops/save",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            userId: user.id,

            coopName:
              currentPlan.name,

            coopSize:
              `${currentPlan.length}x${currentPlan.width}`,

            chickenType:
              currentPlan.type,

            numberOfChickens:
              currentPlan.chickens,

            totalCost:
              currentPlan.total
          })
        }
      );

    const result =
      await response.json();


    if (response.status === 429) {
      showCoopUpgradePopup(
        result.message ||
        "Free accounts can save only 1 Coop Plan. Upgrade to Premium to save unlimited plans."
      );

      return;
    }


    if (!response.ok || !result.success) {
      alert(
        result.message ||
        "Unable to save your coop plan."
      );

      return;
    }



savedPlanRef = currentPlan;

alert(
  result.message ||
  "Plan saved successfully!"
);



  await loadPlans();

const coopNameInput = document.getElementById("coopName");

if (coopNameInput) {
  coopNameInput.value = await getNextCoopName();
}


} catch (error) {
  console.error(
    "SAVE PLAN ERROR:",
    error
  );

  alert(
    "Unable to connect to the server."
  );
} finally {
  isSavingPlan = false;
}
}


function showCoopUpgradePopup(message) {

  const existing =
    document.getElementById(
      "coopUpgradePopup"
    );

  if (existing) {
    existing.remove();
  }

  const overlay =
    document.createElement("div");

  overlay.id =
    "coopUpgradePopup";

  overlay.className =
    "upgrade-overlay";

  overlay.innerHTML = `
    <div class="upgrade-modal">

      <button
        type="button"
        class="upgrade-close"
        onclick="closeCoopUpgradePopup()"
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
        ${escapeCoopHTML(message)}
      </p>

      <div class="upgrade-actions">

        <button
          type="button"
          class="upgrade-later-btn"
          onclick="closeCoopUpgradePopup()"
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

function closeCoopUpgradePopup() {
  const popup =
    document.getElementById(
      "coopUpgradePopup"
    );

  if (popup) {
    popup.remove();
  }
}


function escapeCoopHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function saveCurrentPlan() {
  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  const coopName =
    document.getElementById(
      "coopName"
    ).value;

  const coopSize =
    document.getElementById(
      "coopSize"
    ).value;

  const chickenType =
    document.getElementById(
      "chickenType"
    ).value;

  const climate =
    document.getElementById(
      "climate"
    ).value;

  const numberOfChickens =
    document.getElementById(
      "numberOfChickens"
    ).value;

  const pricePerChicken =
    document.getElementById(
      "pricePerChicken"
    ).value;

  try {
    const response =
      await fetch(
        "/api/coops",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            userId:
              user.id,

            coopName,

            coopSize,

            chickenType,

            climate,

            numberOfChickens,

            pricePerChicken
          })
        }
      );

    const result =
      await response.json();

    alert(
      result.message
    );

  } catch (err) {
    console.error(err);

    alert(
      "Server Error"
    );
  }
}

const chickPrice = 60;

const coopData = {
  "1x1": {
    cost: 8000,
    capacity: 4
  },

  "2x2": {
    cost: 14000,
    capacity: 12
  },

  "3x3": {
    cost: 19000,
    capacity: 25
  },

  "4x4": {
    cost: 27000,
    capacity: 40
  },

  "5x5": {
    cost: 35000,
    capacity: 60
  },

  "6x6": {
    cost: 45000,
    capacity: 85
  },

  "7x7": {
    cost: 56000,
    capacity: 110
  },

  "8x8": {
    cost: 68000,
    capacity: 140
  },

  "9x9": {
    cost: 82000,
    capacity: 175
  },

  "10x10": {
    cost: 98000,
    capacity: 210
  }
};

const chickenCapacities = {
  "1x1":   { layers: 8, dualPurpose: 4 },
  "2x2":   { layers: 48, dualPurpose: 16 },
  "3x3":   { layers: 96, dualPurpose: 36 },
  "4x4":   { layers: 144, dualPurpose: 64 },
  "5x5":   { layers: 192, dualPurpose: 100 },
  "6x6":   { layers: 336, dualPurpose: 144 },
  "7x7":   { layers: 576, dualPurpose: 196 },
  "8x8":   { layers: 672, dualPurpose: 256 },
  "9x9":   { layers: 960, dualPurpose: 324 },
  "10x10": { layers: 1152, dualPurpose: 400 }
};

function getChickenCapacity(sizeKey, chickenType) {
  if (chickenType === "Broilers") {
    return coopData[sizeKey]?.capacity ?? null;
  }

  if (chickenType === "Layers (Egg Production)") {
    return chickenCapacities[sizeKey]?.layers ?? null;
  }

  if (chickenType === "Dual Purpose") {
    return chickenCapacities[sizeKey]?.dualPurpose ?? null;
  }

  return null;
}


const broilerMaterialSizes = {
  "1x1": {
    concrete: {
      name:
        "Concrete Slab",

      size:
        "1.00m × 1.00m",

      height:
        "0.55m"
    },

    posts: {
      name:
        "Wood Posts",

      size:
        "1.80m × 0.05m × 0.05m"
    },

    ridgeBoard: {
      name:
        "Ridge Board",

      size:
        "1.54m × 0.05m × 0.05m"
    },

    frontBackPlate: {
      name:
        "Front / Back Wall Plate",

      size:
        "1.47m × 0.05m × 0.05m"
    },

    sidePlate: {
      name:
        "Side Wall Plate",

      size:
        "1.00m × 0.05m × 0.05m"
    },

    door: {
      name:
        "Door",

      size:
        "1.52m × 0.70m × 0.05m"
    },

    riceHull: {
      name:
        "Rice Hull Area",

      size:
        "0.90m × 0.90m × 0.075m"
    },

    roof: {
      name:
        "Roof Sheet",

      size:
        "3ft × 9ft sheet divided into 3",

      thickness:
        "0.4mm"
    },

    wireMesh: {
      name:
        "Wire Mesh",

      specification:
        "0.025m × 0.025m openings, 0.0016m wire"
    },

    waterer: {
      name:
        "Bell Waterer",

      size:
        "0.149m × 0.149m × 0.154m"
    },

    brooderLamp: {
      name:
        "Brooder Lamp / Refractor",

      size:
        "0.322m × 0.322m × 0.220m"
    }
  },

  "2x2": {
    concrete: {
      name:
        "Concrete Slab",

      size:
        "2.00m × 2.00m",

      height:
        "0.55m"
    },

    posts: {
      name:
        "Wood Posts",

      size:
        "1.80m × 0.05m × 0.05m"
    },

    ridgeBoard: {
      name:
        "Ridge Board",

      size:
        "2.37m × 0.05m × 0.05m"
    },

    frontBackPlate: {
      name:
        "Front / Back Wall Plate",

      size:
        "2.00m × 0.05m × 0.05m"
    },

    sidePlate: {
      name:
        "Side Wall Plate",

      size:
        "1.99m × 0.05m × 0.05m"
    },

    door: {
      name:
        "Door",

      size:
        "1.52m × 0.70m × 0.05m"
    },

    riceHull: {
      name:
        "Rice Hull Area",

      size:
        "1.89m × 1.80m × 0.075m"
    },

    roof: {
      name:
        "Roof Sheet",

      size:
        "0.9m × 6m sheet divided into 4",

      thickness:
        "0.4mm"
    },

    wireMesh: {
      name:
        "Wire Mesh",

      specification:
        "0.025m × 0.025m openings, 0.0016m wire"
    },

    waterer: {
      name:
        "Bell Waterer",

      size:
        "0.149m × 0.149m × 0.154m"
    },

    brooderLamp: {
      name:
        "Brooder Lamp / Refractor",

      size:
        "0.322m × 0.322m × 0.220m"
    }
  },

  "3x3": {
    concrete: {
      name:
        "Concrete Slab",

      size:
        "3.00m × 3.00m",

      height:
        "0.55m"
    },

    posts: {
      name:
        "Wood Posts",

      size:
        "2.10m × 0.05m × 0.05m"
    },

    ridgeBoard: {
      name:
        "Ridge Board",

      size:
        "3.00m × 0.05m × 0.05m"
    },

    frontBackPlate: {
      name:
        "Front / Back Wall Plate",

      size:
        "2.91m × 0.05m × 0.05m"
    },

    sidePlate: {
      name:
        "Side Wall Plate",

      size:
        "2.90m × 0.05m × 0.05m"
    },

    door: {
      name:
        "Door",

      size:
        "1.60m × 0.70m × 0.05m"
    },

    riceHull: {
      name:
        "Rice Hull Area",

      size:
        "2.90m × 2.80m × 0.075m"
    },

    roof: {
      name:
        "Roof Sheet",

      size:
        "0.9m × 6m sheet divided into 3",

      thickness:
        "0.4mm"
    },

    wireMesh: {
      name:
        "Wire Mesh",

      specification:
        "0.025m × 0.025m openings, 0.0016m wire"
    },

    waterer: {
      name:
        "Bell Waterer",

      size:
        "0.274m × 0.274m × 0.199m"
    },

    brooderLamp: {
      name:
        "Brooder Lamp / Refractor",

      size:
        "0.322m × 0.322m × 0.220m"
    }
  },

  "4x4": {
    concrete: {
      name:
        "Concrete Slab",

      size:
        "4.00m × 4.00m",

      height:
        "0.55m"
    },

    posts: {
      name:
        "Wood Posts",

      size:
        "2.10m × 0.05m × 0.05m"
    },

    ridgeBoard: {
      name:
        "Ridge Board",

      size:
        "4.00m × 0.05m × 0.05m"
    },

    frontBackPlate: {
      name:
        "Front / Back Wall Plate",

      size:
        "4.00m × 0.05m × 0.05m"
    },

    sidePlate: {
      name:
        "Side Wall Plate",

      size:
        "3.90m × 0.05m × 0.05m"
    },

    door: {
      name:
        "Door",

      size:
        "1.60m × 0.70m × 0.05m"
    },

    riceHull: {
      name:
        "Rice Hull Area",

      size:
        "3.87m × 3.97m × 0.075m"
    },

    roof: {
      name:
        "Roof Sheet",

      size:
        "3ft × 9ft sheet",

      thickness:
        "0.4mm"
    },

    wireMesh: {
      name:
        "Wire Mesh",

      specification:
        "0.025m × 0.025m openings, 0.0016m wire"
    },

    waterer: {
      name:
        "Bell Waterer",

      size:
        "0.274m × 0.274m × 0.199m"
    },

    brooderLamp: {
      name:
        "Brooder Lamp / Refractor",

      size:
        "0.322m × 0.322m × 0.220m"
    }
  },
    "5x5": {
    concrete: {
      name: "Concrete Slab",
      size: "5.00m × 5.00m",
      height: "0.55m"
    },

    posts: {
      name: "Wood Posts",
      size: "2.40m × 0.075m × 0.075m"
    },

    ridgeBoard: {
      name: "Ridge Board",
      size: "4.99m × 0.10m × 0.05m"
    },

    frontBackPlate: {
      name: "Front / Back Wall Plate",
      size: "4.95m × 0.10m × 0.05m"
    },

    sidePlate: {
      name: "Side Wall Plate",
      size: "4.95m × 0.10m × 0.05m"
    },

    door: {
      name: "Door",
      size: "1.60m × 0.70m × 0.05m"
    },

    riceHull: {
      name: "Rice Hull Area",
      size: "4.86m × 4.90m × 0.075m"
    },

    roof: {
      name: "Roof Sheet",
      size: "3ft × 10ft sheet",
      thickness: "0.4mm"
    },

    wireMesh: {
      name: "Wire Mesh",
      specification:
        "0.025m × 0.025m openings, 0.0016m wire"
    },

    waterer: {
      name: "Bell Waterer",
      size: "0.274m × 0.274m × 0.199m"
    },

    brooderLamp: {
      name: "Brooder Lamp / Refractor",
      size: "0.322m × 0.322m × 0.220m"
    }
  },

  "6x6": {
    concrete: {
      name: "Concrete Slab",
      size: "6.00m × 6.00m",
      height: "0.55m"
    },

    posts: {
      name: "Wood Posts",
      size: "2.40m × 0.075m × 0.075m"
    },

    ridgeBoard: {
      name: "Ridge Board",
      size: "5.99m × 0.10m × 0.05m"
    },

    frontBackPlate: {
      name: "Front / Back Wall Plate",
      size: "5.94m × 0.10m × 0.05m"
    },

    sidePlate: {
      name: "Side Wall Plate",
      size: "5.95m × 0.10m × 0.05m"
    },

    door: {
      name: "Door",
      size: "1.60m × 0.70m × 0.05m"
    },

    riceHull: {
      name: "Rice Hull Area",
      size: "5.82m × 5.83m × 0.075m"
    },

    roof: {
      name: "Roof Sheet",
      size: "3ft × 12.60ft sheet",
      thickness: "0.4mm"
    },

    wireMesh: {
      name: "Wire Mesh",
      specification:
        "0.025m × 0.025m openings, 0.0016m wire"
    },

    waterer: {
      name: "Bell Waterer",
      size: "0.274m × 0.274m × 0.199m"
    },

    brooderLamp: {
      name: "Brooder Lamp / Refractor",
      size: "0.322m × 0.322m × 0.220m"
    }
  },

  "7x7": {
    concrete: {
      name: "Concrete Slab",
      size: "7.00m × 7.00m",
      height: "0.55m"
    },

    posts: {
      name: "Wood Posts",
      size: "2.40m × 0.075m × 0.075m"
    },

    ridgeBoard: {
      name: "Ridge Board",
      size: "6.99m × 0.10m × 0.05m"
    },

    frontBackPlate: {
      name: "Front / Back Wall Plate",
      size: "6.85m × 0.10m × 0.05m"
    },

    sidePlate: {
      name: "Side Wall Plate",
      size: "6.95m × 0.10m × 0.05m"
    },

    door: {
      name: "Door",
      size: "1.60m × 0.70m × 0.05m"
    },

    riceHull: {
      name: "Rice Hull Area",
      size: "6.79m × 6.77m × 0.075m"
    },

    roof: {
      name: "Roof Sheet",
      size: "3ft × 14.8ft sheet",
      thickness: "0.4mm"
    },

    wireMesh: {
      name: "Wire Mesh",
      specification:
        "0.025m × 0.025m openings, 0.0016m wire"
    },

    waterer: {
      name: "Bell Waterer",
      size: "0.274m × 0.274m × 0.199m"
    },

    brooderLamp: {
      name: "Brooder Lamp / Refractor",
      size: "0.322m × 0.322m × 0.220m"
    }
  },

  "8x8": {
    concrete: {
      name: "Concrete Slab",
      size: "8.00m × 8.00m",
      height: "0.55m"
    },

    posts: {
      name: "Wood Posts",
      size: "2.40m × 0.075m × 0.075m"
    },

    ridgeBoard: {
      name: "Ridge Board",
      size: "8.20m × 0.10m × 0.05m"
    },

    frontBackPlate: {
      name: "Front / Back Wall Plate",
      size: "7.96m × 0.10m × 0.05m"
    },

    sidePlate: {
      name: "Side Wall Plate",
      size: "7.86m × 0.10m × 0.05m"
    },

    door: {
      name: "Door",
      size: "1.60m × 0.70m × 0.05m"
    },

    riceHull: {
      name: "Rice Hull Area",
      size: "7.75m × 7.93m × 0.075m"
    },

    roof: {
      name: "Roof Sheet",
      size: "3ft × 14.8ft sheet",
      thickness: "0.4mm"
    },

    wireMesh: {
      name: "Wire Mesh",
      specification:
        "0.025m × 0.025m openings, 0.0016m wire"
    },

    waterer: {
      name: "Bell Waterer",
      size: "0.274m × 0.274m × 0.199m"
    },

    brooderLamp: {
      name: "Brooder Lamp / Refractor",
      size: "0.322m × 0.322m × 0.220m"
    }
  },

  "9x9": {
    concrete: {
      name: "Concrete Slab",
      size: "9.00m × 9.00m",
      height: "0.55m"
    },

    posts: {
      name: "Wood Posts",
      size: "2.40m × 0.10m × 0.10m"
    },

    ridgeBoard: {
      name: "Ridge Board",
      size: "9.02m × 0.10m × 0.05m"
    },

    frontBackPlate: {
      name: "Front / Back Wall Plate",
      size: "9.00m × 0.10m × 0.05m"
    },

    sidePlate: {
      name: "Side Wall Plate",
      size: "8.90m × 0.10m × 0.05m"
    },

    door: {
      name: "Door",
      size: "1.60m × 0.70m × 0.05m"
    },

    riceHull: {
      name: "Rice Hull Area",
      size: "8.80m × 8.87m × 0.075m"
    },

    roof: {
      name: "Roof Sheet",
      size: "3ft × 19.2ft sheet",
      thickness: "0.4mm"
    },

    wireMesh: {
      name: "Wire Mesh",
      specification:
        "0.025m × 0.025m openings, 0.0016m wire"
    },

    waterer: {
      name: "Bell Waterer",
      size: "0.274m × 0.274m × 0.199m"
    },

    brooderLamp: {
      name: "Brooder Lamp / Refractor",
      size: "0.338m × 0.338m × 0.271m"
    }
  },

  "10x10": {
    concrete: {
      name: "Concrete Slab",
      size: "10.00m × 10.00m",
      height: "0.55m"
    },

    posts: {
      name: "Wood Posts",
      size: "2.40m × 0.10m × 0.10m"
    },

    ridgeBoard: {
      name: "Ridge Board",
      size: "10.02m × 0.10m × 0.05m"
    },

    frontBackPlate: {
      name: "Front / Back Wall Plate",
      size: "10.00m × 0.10m × 0.05m"
    },

    sidePlate: {
      name: "Side Wall Plate",
      size: "9.90m × 0.10m × 0.05m"
    },

    door: {
      name: "Door",
      size: "1.60m × 0.70m × 0.05m"
    },

    riceHull: {
      name: "Rice Hull Area",
      size: "9.91m × 9.80m × 0.075m"
    },

    roof: {
      name: "Roof Sheet",
      size: "3ft × 21.7ft sheet",
      thickness: "0.4mm"
    },

    wireMesh: {
      name: "Wire Mesh",
      specification:
        "0.025m × 0.025m openings, 0.0016m wire"
    },

    waterer: {
      name: "Bell Waterer",
      size: "0.274m × 0.274m × 0.199m"
    },

    brooderLamp: {
      name: "Brooder Lamp / Refractor",
      size: "0.338m × 0.338m × 0.271m"
    }
  }
};


Object.keys(broilerMaterialSizes).forEach(sizeKey => {
  broilerMaterialSizes[sizeKey].feeder = {
    name: "Feeder",
    specification: "Poultry feeding equipment"
  };

  broilerMaterialSizes[sizeKey].broodingGuard = {
    name: "Brooding Guard (Optional)",
    specification: "Temporary enclosure for chicks during brooding"
  };
});




const dualPurposeMaterialSizes = {
  "1x1": {
    concrete: {
      name: "Concrete Slab",
      size: "1.00m × 1.00m",
      height: "0.55m"
    },

    posts: {
      name: "Wood Posts",
      size: "1.80m × 0.05m × 0.05m"
    },

    ridgeBoard: {
      name: "Ridge Board",
      size: "1.54m × 0.05m × 0.05m"
    },

    frontBackPlate: {
      name: "Front / Back Wall Plate",
      size: "1.47m × 0.05m × 0.05m"
    },

    sidePlate: {
      name: "Side Wall Plate",
      size: "1.00m × 0.05m × 0.05m"
    },

    door: {
      name: "Door",
      size: "1.52m × 0.70m × 0.05m"
    },

    riceHull: {
      name: "Rice Hull Area",
      size: "0.90m × 0.90m × 0.075m"
    },

    roof: {
      name: "Roof Sheet",
      size: "3ft × 9ft • divided into 3",
      thickness: "0.4mm"
    },

    wireMesh: {
      name: "Wire Mesh",
      specification: "0.025m × 0.025m openings • 0.0016m wire"
    },

    waterer: {
      name: "Bell Waterer",
      size: "Approx. 0.20m diameter"
    },

    brooderLamp: {
      name: "Brooder Lamp / Refractor",
      size: "Approx. 0.45m × 0.29m × 0.79m assembly"
    },

    nestingBox: {
      name: "Nesting Box",
      size: "Approx. 0.38m × 0.38m × 0.47m"
    },

    perch: {
      name: "Perch",
      size: "0.36m × 0.04m × 0.04m"
    }
  },
  "2x2": {
  concrete: {
    name: "Concrete Slab",
    size: "2.00m × 2.00m",
    height: "0.55m"
  },

  posts: {
    name: "Wood Posts",
    size: "1.80m × 0.05m × 0.05m"
  },

  ridgeBoard: {
    name: "Ridge Board",
    size: "2.37m × 0.05m × 0.05m"
  },

  frontBackPlate: {
    name: "Front / Back Wall Plate",
    size: "2.00m × 0.05m × 0.05m"
  },

  sidePlate: {
    name: "Side Wall Plate",
    size: "1.99m × 0.05m × 0.05m"
  },

  door: {
    name: "Door",
    size: "1.52m × 0.70m × 0.05m"
  },

  riceHull: {
    name: "Rice Hull Area",
    size: "1.89m × 1.80m × 0.075m"
  },

  roof: {
    name: "Roof Sheet",
    size: "0.9m × 6m • divided into 4",
    thickness: "0.4mm"
  },

  wireMesh: {
    name: "Wire Mesh",
    specification:
      "0.025m × 0.025m openings • 0.0016m wire"
  },

  waterer: {
    name: "Bell Waterer",
    size: "Approx. 0.20m diameter"
  },

  brooderLamp: {
    name: "Brooder Lamp / Refractor",
    size: "Approx. 0.45m × 0.29m × 0.79m assembly"
  },

  nestingBox: {
    name: "Nesting Box",
    size: "Approx. 0.38m × 0.38m × 0.47m"
  },

  perch: {
    name: "Perch",
    size: "Approx. 0.68m × 0.04m × 0.04m"
  }
}
};

const dualPurposeModelSpecs = {
  "3x3": {
    postHeight: 2.10,
    postThickness: 0.05,
    ridgeLength: 3.00,
    plateThickness: 0.05,
    riceHull: "2.90m × 2.80m × 0.075m",
    roof: "0.9m × 6m sheet divided into 3",
    door: "1.60m × 0.70m × 0.05m",
    perch: "2.16m × 0.04m × 0.04m"
  },

  "4x4": {
    postHeight: 2.10,
    postThickness: 0.05,
    ridgeLength: 4.00,
    plateThickness: 0.05,
    riceHull: "3.87m × 3.97m × 0.075m",
    roof: "3ft × 9ft sheet (full and half sections)",
    door: "1.60m × 0.70m × 0.05m",
    perch: "Requires Blender verification"
  },

  "5x5": {
    postHeight: 2.40,
    postThickness: 0.075,
    ridgeLength: 4.99,
    plateThickness: 0.10,
    riceHull: "4.86m × 4.90m × 0.075m",
    roof: "3ft × 10ft sheet (full and half sections)",
    door: "1.60m × 0.70m × 0.05m",
    perch: "Requires Blender verification"
  },

  "6x6": {
    postHeight: 2.40,
    postThickness: 0.075,
    ridgeLength: 5.99,
    plateThickness: 0.10,
    riceHull: "5.82m × 5.83m × 0.075m",
    roof: "3ft × 12.60ft sheet",
    door: "1.60m × 0.70m × 0.05m",
    perch: "Requires Blender verification"
  },

  "7x7": {
    postHeight: 2.40,
    postThickness: 0.075,
    ridgeLength: 6.99,
    plateThickness: 0.10,
    riceHull: "6.79m × 6.77m × 0.075m",
    roof: "3ft × 14.8ft sheet (full and half sections)",
    door: "1.60m × 0.70m × 0.05m",
    perch: "Requires Blender verification"
  },

  "8x8": {
    postHeight: 2.40,
    postThickness: 0.075,
    ridgeLength: 8.20,
    plateThickness: 0.10,
    riceHull: "7.75m × 7.93m × 0.075m",
    roof: "3ft × 14.8ft sheet",
    door: "1.60m × 0.70m × 0.05m",
    perch: "Requires Blender verification"
  },

  "9x9": {
    postHeight: 2.40,
    postThickness: 0.10,
    ridgeLength: 9.02,
    plateThickness: 0.10,
    riceHull: "8.80m × 8.87m × 0.075m",
    roof: "3ft × 19.2ft sheet",
    door: "1.60m × 0.70m × 0.05m",
    perch: "Requires Blender verification"
  },

  "10x10": {
    postHeight: 2.40,
    postThickness: 0.10,
    ridgeLength: 10.02,
    plateThickness: 0.10,
    riceHull: "9.91m × 9.80m × 0.075m",
    roof: "3ft × 21.7ft sheet",
    door: "1.60m × 0.70m × 0.05m",
    perch: "Requires Blender verification"
  }
};

Object.entries(dualPurposeModelSpecs).forEach(
  ([sizeKey, spec]) => {
    const size = Number(sizeKey.split("x")[0]);

    const format = value => Number(value).toFixed(2);

    const postSize =
      `${format(spec.postHeight)}m × ` +
      `${format(spec.postThickness)}m × ` +
      `${format(spec.postThickness)}m`;

    const ridgeSize =
      `${format(spec.ridgeLength)}m × ` +
      `${format(spec.plateThickness)}m × 0.05m`;

    const frontBackSize =
      `${format(size)}m × ` +
      `${format(spec.plateThickness)}m × 0.05m`;

    const sideSize =
      `${format(size - 0.10)}m × ` +
      `${format(spec.plateThickness)}m × 0.05m`;

    dualPurposeMaterialSizes[sizeKey] = {
      concrete: {
        name: "Concrete Slab",
        size: `${format(size)}m × ${format(size)}m`,
        height: "0.55m"
      },

      posts: {
        name: "Wood Posts",
        size: postSize
      },

      ridgeBoard: {
        name: "Ridge Board",
        size: ridgeSize
      },

      frontBackPlate: {
        name: "Front / Back Wall Plate",
        size: frontBackSize
      },

      sidePlate: {
        name: "Side Wall Plate",
        size: sideSize
      },

      door: {
        name: "Door",
        size: spec.door
      },

      riceHull: {
        name: "Rice Hull Area",
        size: spec.riceHull
      },

      roof: {
        name: "Roof Sheet",
        size: spec.roof,
        thickness: "0.4mm"
      },

      wireMesh: {
        name: "Wire Mesh",
        specification:
          "0.025m × 0.025m openings • 0.0016m wire"
      },

      waterer: {
        name: "Bell Waterer",
        size: "Approx. 0.274m × 0.274m × 0.199m"
      },

      brooderLamp: {
        name: "Brooder Lamp / Refractor",
        size: "Requires Blender verification"
      },

      nestingBox: {
        name: "Nesting Box",
        size: "Approx. 0.38m × 0.38m × 0.47m"
      },

      perch: {
        name: "Perch",
        size: spec.perch
      }
    };
  }
);

const broilerHotspotPositions = {
  "1x1": {
    concrete: "-0.45m 0.18m 0.35m",
    post: "-0.47m 1.05m 0.45m",
    door: "0.4749m 0.8733m -0.0984m",
    mesh: "0.30m 1.25m 0.48m",
    riceHull: "0m 0.40m 0m",
    roof: "0m 1.95m 0.35m",
    feeder: "0m 0.45m -0.25m",
    broodingGuard: "0m 0.35m 0m"
  },

  "2x2": {
    concrete: "0m 0.275m 0.85m",
    post: "0.9740m 0.9000m 0.9740m",
    door: "0.9742m 0.9251m -0.5497m",
    mesh: "0.9750m 1.2327m -0.0001m",
    riceHull: "0m 0.175m 0.60m",
    roof: "0.6750m 2.0689m 0.0004m",
    feeder: "0m 0.45m -0.50m",
    broodingGuard: "0m 0.35m 0m"
  },

  "3x3": {
    concrete: "0m 0.275m 1.42m",
    post: "1.4260m 1.0010m 1.4260m",
    door: "1.4254m 0.8733m -1.0507m",
    mesh: "1.4528m 1.2559m -0.0001m",
    riceHull: "0m 0.1250m 0.70m",
    roof: "0.9404m 2.3538m -0.0010m",
    feeder: "0m 0.45m -0.75m",
    broodingGuard:  "0m 0.35m -0.50m"
  },

  "4x4": {
    concrete: "0m 0.275m 1.92m",
    post: "1.9250m 1.0010m 1.9250m",
    door: "1.9263m 0.8482m -1.1513m",
    mesh: "1.9508m 1.2559m 0m",
    riceHull: "0.0168m 0.1250m 0.80m",
    roof: "1.2215m 2.4556m 0.0876m",
    feeder: "0m 0.45m -1.00m",
    broodingGuard: "0m 0.35m -0.75m"
  },

  "5x5": {
    concrete: "0m 0.275m 2.42m",
    post: "2.4385m 1.1510m 2.4385m",
    door: "2.4529m 0.8482m -2.05m",
    mesh: "2.4766m 1.4585m 0m",
    riceHull: "0.0225m 0.0875m 1.00m",
    roof: "1.5822m 2.8605m 0.2250m",
    feeder: "0m 0.45m -1.25m",
    broodingGuard: "0m 0.35m -1.00m"
  },

  "6x6": {
    concrete: "0m 0.275m 2.92m",
    post: "2.9385m 1.1510m 2.9385m",
    door: "2.9510m 0.8482m -2.55m",
    mesh: "2.9776m 1.4585m 0m",
    riceHull: "0m 0.0875m 1.20m",
    roof: "1.7355m 3.1222m 0m",
    feeder: "0m 0.45m -1.50m",
    broodingGuard: "0m 0.35m -1.25m"
  },

  "7x7": {
    concrete: "0m 0.275m 3.42m",
    post: "3.4385m 1.1510m 3.4385m",
    door: "3.4517m 0.8482m 0.0027m",
    mesh: "0m 1.4585m -3.45m",
    riceHull: "0.0151m 0.0875m 1.20m",
    roof: "2.0444m 3.1563m 0.1330m",
    feeder: "0m 0.45m -1.75m",
    broodingGuard: "0m 0.35m -1.50m"
  },

  "8x8": {
    concrete: "0m 0.275m 3.42m",
    post: "3.9425m 1.1510m 3.9425m",
    door: "3.4517m 0.8482m 0.0027m",
    mesh: "0m 1.4585m -3.95m",
    riceHull: "0.0027m 0.0875m 1.40m",
    roof: "2.3435m 3.2957m 0m",
    feeder: "0m 0.45m -2.00m",
    broodingGuard: "0m 0.35m -1.75m"
  },

  "9x9": {
    concrete: "0m 0.275m -4.35m",
    post: "4.4625m 1.1510m -4.35m",
    door: "4.4756m 0.8482m -0.40m",
    mesh: "0m 1.4720m -4.45m",
    riceHull: "-0.0004m 0.0875m 1.40m",
    roof: "2.6476m 3.3977m 0m",
    feeder: "0m 0.45m -2.25m",
    broodingGuard: "0m 0.35m -2.00m"
  },

  "10x10": {
    concrete: "0m 0.275m -4.85m",
    post: "4.9626m 1.1510m -4.85m",
    door: "4.9757m 0.8482m -0.50m",
    mesh: "0m 1.4720m -4.95m",
    riceHull: "-0.0120m 0.0875m 0.0005m",
    roof: "2.9970m 3.4778m 0m",
    feeder: "0m 0.45m -2.50m",
    broodingGuard: "0m 0.35m -2.25m"
  }
};


const dualPurposeHotspotPositions = {
  "1x1": {
    concrete: "0m 0.225m 0m",
    post: "-0.4732m 0.850m -0.4749m",
    door: "0.4750m 0.8871m 0.0984m",
    mesh: "-0.4760m 1.1513m -0.0005m",
    riceHull: "0m 0.0875m 0.0046m",
    roof: "0.4046m 1.8586m 0.0008m",
    nestingBox: "-0.2590m 0.7401m -0.2780m",
    perch: "-0.2603m 0.5700m 0.1800m",
    waterer: "0.2272m 0.2890m 0.2181m",
    brooderLamp: "0m 1.5285m -0.0019m"
  },
"2x2": {
    concrete: "0m 0.225m 0m",
    post: "-0.4732m 0.850m -0.4749m",
    door: "0.4750m 0.8871m 0.0984m",
    mesh: "-0.4760m 1.1513m -0.0005m",
    riceHull: "0m 0.0875m 0.0046m",
    roof: "0.4046m 1.8586m 0.0008m",
    nestingBox: "-0.2590m 0.7401m -0.2780m",
    perch: "-0.2603m 0.5700m 0.1800m",
    waterer: "0.2272m 0.2890m 0.2181m",
    brooderLamp: "0m 1.5285m -0.0019m"
}
};
const layersMaterialSizes = {
  "1x1": {
    concrete: {
      name: "Concrete Slab",
      size: "1.00m × 1.00m × 0.10m"
    },
    posts: {
      name: "Wood Posts",
      size: "1.80m × 0.05m × 0.05m"
    },
    roof: {
      name: "Roof Sheet",
      size: "3ft × 9ft sheet, divided into 3",
      thickness: "0.4mm"
    },
    ridgeBoard: {
      name: "Ridge Board",
      size: "1.5374m × 0.05m × 0.05m"
    },
    cage: {
      name: "Metal Cage Framework",
      size: "Steel wire and metal framing"
    },
    feeder: {
      name: "PVC Feeder Trough",
      size: "0.0989m × 0.4569m × 0.0986m"
    },
    waterer: {
      name: "PVC Water Trough",
      size: "0.0673m × 0.4576m × 0.065m"
    },
    eggCatcher: {
      name: "Egg Catcher",
      size: "0.46m component length"
    },
    tray: {
      name: "Collection Tray",
      size: "0.427m × 1.00m × 0.05m"
    },
    lamp: {
      name: "Lighting Assembly",
      size: "Bulb, socket and cord"
    }
  }
};

const layersHotspotPositions = {
  "1x1": {
    concrete: "0m 0m 0m",
    posts: "-0.4732m 0.7m 0.4749m",
    roof: "0.3364m 1.8527m -0.4752m",
    ridgeBoard: "0m 2.0074m 0m",
    cage: "-0.227m 0.3849m 0.0114m",
    feeder: "-0.0016m 0.2774m 0.4174m",
    waterer: "-0.002m 0.3849m 0.1864m",
    eggCatcher: "0.0001m 0.177m 0.6092m",
    tray: "0m 0.0741m 0m",
    lamp: "0m 1.4326m 0.0019m"
  }
};


let databaseMaterialPrices = [];

async function loadMaterialPrices() {
  try {
    const response = await fetch("/api/materials/prices", {
      credentials: "same-origin",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Failed to load material prices.");
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.materials)) {
      throw new Error("Invalid material prices response.");
    }

    databaseMaterialPrices = data.materials;

    console.log(
      "Material prices loaded:",
      databaseMaterialPrices.length
    );

    return true;

  } catch (error) {
    console.error("MATERIAL PRICES ERROR:", error);
    databaseMaterialPrices = [];

    return false;
  }
}

const setupCostData = {
  broiler: {
    "1x1": {
      construction: [
          {
            name: "Concrete Slab",
            specification: "1.00m × 1.00m × 0.55m",
            quantity: 1,
            unit: "sqm",
            unitPrice: 1000
          },
          {
            name: "Wood Posts",
            specification: "1.80m × 0.05m × 0.05m",
            quantity: 5,
            unit: "pcs",
            unitPrice: 125
          },
          {
            name: "Ridge Board",
            specification: "1.54m × 0.05m × 0.05m",
            quantity: 1,
            unit: "pc",
            unitPrice: 110
          },
          {
            name: "Front / Back Wall Plate",
            specification: "1.47m × 0.05m × 0.05m",
            quantity: 2,
            unit: "pcs",
            unitPrice: 105
          },
          {
            name: "Side Wall Plate",
            specification: "1.00m × 0.05m × 0.05m",
            quantity: 2,
            unit: "pcs",
            unitPrice: 80
          },
          {
            name: "Roof Rafters",
            specification: "Wood roof framing",
            quantity: 4,
            unit: "pcs",
            unitPrice: 100
          },
          {
            name: "Roof Sheet",
            specification: "3ft × 9ft • 0.4mm • divided into 3",
            quantity: 2,
            unit: "sections",
            unitPrice: 180
          },
          {
            name: "Wire Mesh",
            specification: "0.025m × 0.025m openings • 0.0016m wire",
            quantity: 6,
            unit: "m²",
            unitPrice: 100
          },
          {
            name: "Door",
            specification: "1.52m × 0.70m × 0.05m",
            quantity: 1,
            unit: "set",
            unitPrice: 450
          }
      ],

      hardware: [
        {
          name: "Nails / Screws",
          quantity: 1,
          unit: "kg",
          unitPrice: 150
        },
        {
          name: "Door Hinges",
          quantity: 2,
          unit: "pcs",
          unitPrice: 60
        },
        {
          name: "Door Latch",
          quantity: 1,
          unit: "set",
          unitPrice: 100
        }
      ],

      equipment: [
        {
          name: "Bell Waterer",
          quantity: 1,
          unit: "set",
          unitPrice: 300
        },
        {
          name: "Brooder Lamp / Refractor",
          quantity: 1,
          unit: "set",
          unitPrice: 500
        },
        {
          name: "Feeder",
          quantity: 1,
          unit: "set",
          unitPrice: 160
        }
      ],

      bedding: [
        {
          name: "Rice Hull",
          specification: "For 0.90m × 0.90m × 0.075m bedding area",
          quantity: 2,
          unit: "sacks",
          unitPrice: 100
        }
      ]
    }
  }
};

const broilerCostConfig = {
  "2x2":  { posts: 6,  rafters: 6,  roof: 4,  mesh: 12,  waterers: 1, lamps: 1, feeders: 1, riceHull: 5 },
  "3x3":  { posts: 8,  rafters: 8,  roof: 6,  mesh: 18,  waterers: 2, lamps: 2, feeders: 2, riceHull: 10 },
  "4x4":  { posts: 10, rafters: 10, roof: 8,  mesh: 24,  waterers: 2, lamps: 2, feeders: 2, riceHull: 18 },
  "5x5":  { posts: 12, rafters: 12, roof: 10, mesh: 30,  waterers: 3, lamps: 3, feeders: 3, riceHull: 28 },
  "6x6":  { posts: 14, rafters: 14, roof: 12, mesh: 36,  waterers: 4, lamps: 4, feeders: 4, riceHull: 40 },
  "7x7":  { posts: 16, rafters: 16, roof: 14, mesh: 42,  waterers: 5, lamps: 5, feeders: 5, riceHull: 54 },
  "8x8":  { posts: 18, rafters: 18, roof: 16, mesh: 48,  waterers: 6, lamps: 6, feeders: 6, riceHull: 70 },
  "9x9":  { posts: 20, rafters: 20, roof: 18, mesh: 54,  waterers: 7, lamps: 7, feeders: 7, riceHull: 88 },
  "10x10": { posts: 22, rafters: 22, roof: 20, mesh: 60, waterers: 8, lamps: 8, feeders: 8, riceHull: 108 }
};


function buildBroilerSetupCost(sizeKey) {

  const materials = broilerMaterialSizes[sizeKey];
  const config = broilerCostConfig[sizeKey];

  if (!materials || !config) {
    return null;
  }

  const sizeNumber =
    Number(sizeKey.split("x")[0]);

  const area =
    sizeNumber * sizeNumber;


  return {

    construction: [

      {
        name: "Concrete Slab",
        specification:
          `${materials.concrete.size} × ${materials.concrete.height}`,
        quantity: area,
        unit: "m²",
        unitPrice: 1000
      },

      {
        name: "Wood Posts",
        specification:
          materials.posts.size,
        quantity: config.posts,
        unit: "pcs",
        unitPrice:
          sizeNumber >= 9 ? 220 :
          sizeNumber >= 5 ? 180 : 125
      },

      {
        name: "Ridge Board",
        specification:
          materials.ridgeBoard.size,
        quantity: 1,
        unit: "pc",
        unitPrice:
          Math.round(110 * sizeNumber)
      },

      {
        name: "Front / Back Wall Plate",
        specification:
          materials.frontBackPlate.size,
        quantity: 2,
        unit: "pcs",
        unitPrice:
          Math.round(105 * sizeNumber)
      },

      {
        name: "Side Wall Plate",
        specification:
          materials.sidePlate.size,
        quantity: 2,
        unit: "pcs",
        unitPrice:
          Math.round(80 * sizeNumber)
      },

      {
        name: "Roof Rafters",
        specification:
          "Wood roof framing",
        quantity: config.rafters,
        unit: "pcs",
        unitPrice: 130
      },

      {
        name: "Roof Sheet",
        specification:
          `${materials.roof.size} • ${materials.roof.thickness}`,
        quantity: config.roof,
        unit: "sections",
        unitPrice: 535
      },

      {
        name: "Wire Mesh",
        specification:
          materials.wireMesh.specification,
        quantity: config.mesh,
        unit: "m²",
        unitPrice: 135
      },

      {
        name: "Door",
        specification:
          materials.door.size,
        quantity: 1,
        unit: "set",
        unitPrice: 600
      }

    ],


    hardware: [

      {
        name: "Nails / Screws",
        quantity:
          Math.max(
            1,
            Math.ceil(area / 10)
          ),
        unit: "kg",
        unitPrice: 100
      },

      {
        name: "Door Hinges",
        quantity: 2,
        unit: "pcs",
        unitPrice: 60
      },

      {
        name: "Door Latch",
        quantity: 1,
        unit: "set",
        unitPrice: 100
      }

    ],


    equipment: [

      {
        name: "Bell Waterer",
        specification:
          materials.waterer.size,
        quantity:
          config.waterers,
        unit: "set",
        unitPrice: 300
      },

      {
        name: "Brooder Lamp / Refractor",
        specification:
          materials.brooderLamp.size,
        quantity:
          config.lamps,
        unit: "set",
        unitPrice: 500
      },

      {
        name: "Feeder",
        quantity:
          config.feeders,
        unit: "set",
        unitPrice: 160
      }

    ],


    bedding: [

      {
        name: "Rice Hull",
        specification:
          `For ${materials.riceHull.size} bedding area`,
        quantity:
          config.riceHull,
        unit: "sacks",
        unitPrice: 100
      }

    ]

  };

}

Object.keys(broilerCostConfig)
  .forEach(sizeKey => {

    setupCostData.broiler[sizeKey] =
      buildBroilerSetupCost(sizeKey);

  });




function normalizeMaterialValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeMaterialUnit(value) {
  const unit = normalizeMaterialValue(value);

  const aliases = {
    pcs: "pc",
    pieces: "pc",
    piece: "pc",
    sets: "set",
    sheets: "sheet",
    "m²": "sqm",
    m2: "sqm"
  };

  return aliases[unit] || unit;
}


function getMatchingMaterialRecords(item, chickenType, sizeKey) {
  const matchingMaterials = databaseMaterialPrices.filter(material => {
    const sameName =
      normalizeMaterialValue(material.MaterialName) ===
      normalizeMaterialValue(item.name);

    const sameType =
      normalizeMaterialValue(material.ChickenType) ===
      normalizeMaterialValue(chickenType);

    return sameName && sameType;
  });


  const exactSizeRecords = matchingMaterials.filter(material =>
    material.CoopSize &&
    normalizeMaterialValue(material.CoopSize) ===
      normalizeMaterialValue(sizeKey)
  );

  if (exactSizeRecords.length > 0) {
    return exactSizeRecords;
  }

  const generalRecords = matchingMaterials.filter(material =>
    !material.CoopSize
  );

  if (generalRecords.length > 0) {
    return generalRecords;
  }

  const legacyRecords = matchingMaterials.filter(material =>
    material.Quantity === null ||
    material.Quantity === undefined
  );

  return legacyRecords;
}

function isInactiveMaterial(item, chickenType, sizeKey) {
  const records = getMatchingMaterialRecords(
    item, chickenType, sizeKey
  );

  return records.length > 0 &&
    records.every(material => Number(material.IsActive) === 0);
}

function getMaterialUnitPrice(item, chickenType, sizeKey) {
  const records = getMatchingMaterialRecords(
    item, chickenType, sizeKey
  );

  const material = records.find(record =>
    Number(record.IsActive) === 1 &&
    normalizeMaterialUnit(record.Unit) ===
      normalizeMaterialUnit(item.unit)
  );

  if (!material) return null;

  const price = Number(material.UnitPrice);

  return Number.isFinite(price) && price > 0
    ? price
    : null;
}

function getMaterialPricingIssues(sizeKey, chickenType) {
  const costData = getSetupCostData(sizeKey, chickenType);

  if (!costData) {
    return ["No material configuration for this coop size."];
  }

  const issues = [];

  for (const item of Object.values(costData).flat()) {
    if (isInactiveMaterial(item, chickenType, sizeKey)) {
      continue;
    }

    if (getMaterialUnitPrice(item, chickenType, sizeKey) !== null) {
      continue;
    }

    const records = getMatchingMaterialRecords(
      item, chickenType, sizeKey
    );

    const activeRecords = records.filter(
      material => Number(material.IsActive) === 1
    );

    if (activeRecords.length === 0) {
      issues.push(
        `${item.name}: No active material record for ${sizeKey}.`
      );
      continue;
    }

    const matchingUnit = activeRecords.find(material =>
      normalizeMaterialUnit(material.Unit) ===
      normalizeMaterialUnit(item.unit)
    );

    if (!matchingUnit) {
      const units = [
        ...new Set(activeRecords.map(material => material.Unit))
      ];

      issues.push(
        `${item.name}: Planner uses ${item.unit}, ` +
        `but database uses ${units.join(", ")}.`
      );
      continue;
    }

    issues.push(`${item.name}: Invalid or missing unit price.`);
  }

  return [...new Set(issues)];
}




function calculateMaterialSubtotal(item, chickenType, sizeKey) {
  const unitPrice = getMaterialUnitPrice(
    item, chickenType, sizeKey
  );

  if (unitPrice === null) return 0;

  return Number(item.quantity || 0) * unitPrice;
}

function calculateCategoryTotal(items = [], chickenType, sizeKey) {
  return items.reduce(
    (total, item) =>
      total + calculateMaterialSubtotal(
        item, chickenType, sizeKey
      ),
    0
  );
}

const BUDGET_ALLOWANCE = 0.10;

const estimatedChickenPrices = {
  "Broilers": 60,
  "Layers (Egg Production)": 180,
  "Dual Purpose": 120
};
function getLivestockUnitPrice(chickenType) {
  const records = databaseMaterialPrices.filter(material =>
    normalizeMaterialValue(material.Category) === "livestock" &&
    normalizeMaterialValue(material.ChickenType) ===
      normalizeMaterialValue(chickenType)
  );

  const activeRecord = records.find(material =>
    Number(material.IsActive) === 1 &&
    normalizeMaterialUnit(material.Unit) === "chick"
  );

  if (!activeRecord) {
    return null;
  }

  const price = Number(activeRecord.UnitPrice);

  return Number.isFinite(price) && price > 0
    ? price
    : null;
}

const layerSetupCosts = {};
const dualPurposeSetupCosts = {};

const COST_ESTIMATE_NOTE =
  "Estimated material quantity and price; subject to verification";

function createCostItem(
  name,
  quantity,
  unit,
  unusedPrice,
  specification = COST_ESTIMATE_NOTE
) {
  return {
    name,
    specification,
    quantity,
    unit
  };
}

function buildAlternativeSetupCost(sizeKey, chickenType) {
  const base = setupCostData.broiler[sizeKey];

  if (!base) return null;

  const capacity = getChickenCapacity(sizeKey, chickenType);
  if (!capacity) return null;

  const size = Number(sizeKey.split("x")[0]);
  const area = size * size;


const data = JSON.parse(JSON.stringify(base));
if (chickenType === "Dual Purpose") {
  const nails = data.hardware.find(
    item => item.name === "Nails / Screws"
  );

  if (nails) {
    nails.unit = "set";
  }
}

if (chickenType === "Dual Purpose") {
  const materials = dualPurposeMaterialSizes[sizeKey];

  if (!materials) return null;

  const specifications = {
    "Concrete Slab":
      `${materials.concrete.size} × ${materials.concrete.height}`,

    "Wood Posts":
      materials.posts.size,

    "Ridge Board":
      materials.ridgeBoard.size,

    "Front / Back Wall Plate":
      materials.frontBackPlate.size,

    "Side Wall Plate":
      materials.sidePlate.size,

    "Roof Sheet":
      `${materials.roof.size} • ${materials.roof.thickness}`,

    "Wire Mesh":
      materials.wireMesh.specification,

    "Door":
      materials.door.size
  };

  data.construction.forEach(item => {
    if (specifications[item.name]) {
      item.specification = specifications[item.name];
    }
  });
}


if (chickenType === "Layers (Egg Production)") {
  const cageModules = Math.max(1, Math.ceil(capacity / 8));

  const floorArea = area;
  const postCount = Math.max(4, 4 * Math.ceil(size / 2));
  const roofSheets = Math.max(2, Math.ceil((area * 1.2) / 2.5));

  data.construction = [
    createCostItem(
      "Concrete Floor",
      floorArea,
      "m²",
      1000,
      "Estimated concrete flooring; verify thickness and cost"
    ),
    createCostItem(
      "Wood Posts",
      postCount,
      "pcs",
      125,
      "Estimated structural support posts"
    ),
    createCostItem(
      "Roof Sheet",
      roofSheets,
      "sheets",
      180,
      "Estimated roofing with allowance for overhang"
    ),
    createCostItem(
      "Cage Installation Materials",
      cageModules,
      "sets",
      150,
      "Estimated installation materials for layer cage modules"
    ),
    createCostItem(
      "Cage Mounting Hardware",
      cageModules,
      "sets",
      120,
      "Estimated bolts, brackets and mounting accessories"
    )
  ];

  data.hardware = [
    createCostItem(
      "Nails / Screws / Fasteners",
      cageModules,
      "sets",
      100,
      "Estimated cage installation fasteners"
    )
  ];
}


  if (chickenType === "Dual Purpose") {

    const mesh = data.construction.find(
      item => item.name === "Wire Mesh"
    );

    if (mesh) {
      mesh.quantity = Math.ceil(
        Number(mesh.quantity) * 1.15
      );
    mesh.specification =
  `${dualPurposeMaterialSizes[sizeKey].wireMesh.specification} • Estimated enclosure mesh including nesting/perching area`;
    }
    data.hardware = data.hardware.filter(
  item => item.name !== "Door Latch"
);

data.hardware.push(
  createCostItem(
    "Door Lock",
    1,
    "set",
    150,
    "Estimated door locking hardware"
  ),
  createCostItem(
    "Electrical Switch",
    1,
    "pc",
    100,
    "Estimated switch for coop lighting"
  )
);
  }


  if (chickenType === "Layers (Egg Production)") {
    const cageModules = Math.ceil(capacity / 8);

data.equipment = [
  createCostItem("Battery Cage", cageModules, "modules", 1400),
  createCostItem("Stand / Frame", cageModules, "sets", 450),
  createCostItem("Atlanta Feeder Trough", cageModules, "sets", 220),
  createCostItem("Atlanta Water Trough", cageModules, "sets", 220),
  createCostItem("Egg Catcher / Collection Tray", cageModules, "sets", 180),
  createCostItem(
    "Lights / Lighting Assembly",
    Math.max(1, Math.ceil(area / 10)),
    "sets",
    250
  )
];

    data.bedding = [];

  } else if (chickenType === "Dual Purpose") {
    const nestingBoxes = Math.ceil(capacity / 5);
    const perches = Math.ceil(capacity / 10);
    const feeders = Math.ceil(capacity / 15);
    const waterers = Math.ceil(capacity / 20);


data.equipment = [
  createCostItem(
    "Nesting Box",
    nestingBoxes,
    "sets",
    350
  ),
  createCostItem(
    "Perch",
    perches,
    "sets",
    180
  ),
  createCostItem(
    "Feeder",
    feeders,
    "sets",
    180
  ),
  createCostItem(
    "Bell Waterer",
    waterers,
    "sets",
    300
  ),
  createCostItem(
    "Lights / Lighting Assembly",
    Math.max(1, Math.ceil(area / 10)),
    "sets",
    250
  )
];


    data.bedding = [
      createCostItem(
        "Rice Hull",
        Math.max(1, Math.ceil(area * 1.1)),
        "sacks",
        100
      )
    ];

  } else {
    return null;
  }

  return data;
}

// Populate all 10 sizes for both chicken types.
Object.keys(coopData).forEach(sizeKey => {
  layerSetupCosts[sizeKey] =
    buildAlternativeSetupCost(
      sizeKey,
      "Layers (Egg Production)"
    );

  dualPurposeSetupCosts[sizeKey] =
    buildAlternativeSetupCost(
      sizeKey,
      "Dual Purpose"
    );
});

function getSetupCostData(sizeKey, chickenType) {
  let originalData = null;

  if (chickenType === "Broilers") {
    originalData = setupCostData.broiler[sizeKey];
  } else if (chickenType === "Layers (Egg Production)") {
    originalData = layerSetupCosts[sizeKey];
  } else if (chickenType === "Dual Purpose") {
    originalData = dualPurposeSetupCosts[sizeKey];
  }

  if (!originalData) return null;

  const costData = {
    construction: [...(originalData.construction || [])],
    hardware: [...(originalData.hardware || [])],
    equipment: [...(originalData.equipment || [])],
    bedding: [...(originalData.bedding || [])]
  };

  const categoryMap = {
    construction: "construction",
    hardware: "hardware",
    equipment: "equipment",
    bedding: "bedding"
  };

  const existingMaterials = new Set(
    Object.values(costData)
      .flat()
      .map(item =>
        `${normalizeMaterialValue(item.name)}|` +
        `${normalizeMaterialUnit(item.unit)}`
      )
  );

  for (const material of databaseMaterialPrices) {

    if (Number(material.IsActive) !== 1) {
      continue;
    }


    if (
      normalizeMaterialValue(material.ChickenType) !==
      normalizeMaterialValue(chickenType)
    ) {
      continue;
    }

    if (
      material.CoopSize &&
      normalizeMaterialValue(material.CoopSize) !==
      normalizeMaterialValue(sizeKey)
    ) {
      continue;
    }

    const category = categoryMap[
      normalizeMaterialValue(material.Category)
    ];

    if (!category) {
      continue;
    }

    const key =
      `${normalizeMaterialValue(material.MaterialName)}|` +
      `${normalizeMaterialUnit(material.Unit)}`;

    if (existingMaterials.has(key)) {
      continue;
    }

    const hasSavedQuantity =
      material.Quantity !== null &&
      material.Quantity !== undefined &&
      material.Quantity !== "";

    const quantity = hasSavedQuantity
      ? Number(material.Quantity)
      : 1;

    if (
      !Number.isFinite(quantity) ||
      quantity < 0
    ) {
      continue;
    }

    if (quantity === 0) {
      continue;
    }

    const unitPrice = Number(material.UnitPrice);

    costData[category].push({
      name: material.MaterialName,
      specification: material.Specification || "",
      quantity: quantity,
      unit: material.Unit,
      unitPrice: Number.isFinite(unitPrice)
        ? unitPrice
        : 0,
      isNewMaterial: true
    });

    existingMaterials.add(key);
  }

  return costData;
}

function calculateRecommendedBudget(sizeKey, chickenType) {
  if (getMaterialPricingIssues(sizeKey, chickenType).length > 0) {
  return null;
}

  const capacity = getChickenCapacity(
    sizeKey,
    chickenType
  );

  const costData = getSetupCostData(
    sizeKey,
    chickenType
  );

  const chickenUnitPrice =
    getLivestockUnitPrice(chickenType);

    if (
      !capacity ||
      !costData ||
      chickenUnitPrice === null
    ) {
      return null;
    }
const constructionTotal =
  calculateCategoryTotal(costData.construction, chickenType, sizeKey);

const hardwareTotal =
  calculateCategoryTotal(costData.hardware, chickenType, sizeKey);

const equipmentTotal =
  calculateCategoryTotal(costData.equipment, chickenType, sizeKey);

const beddingTotal =
  calculateCategoryTotal(costData.bedding, chickenType, sizeKey);

  const coopCost =
    constructionTotal +
    hardwareTotal +
    equipmentTotal +
    beddingTotal;

  const chickenCost =
    capacity * chickenUnitPrice;

  const estimatedCost =
    coopCost + chickenCost;

  const allowance = Math.ceil(
    estimatedCost * BUDGET_ALLOWANCE
  );

  return {
    costData,
    capacity,
    chickenUnitPrice,
    constructionTotal,
    hardwareTotal,
    equipmentTotal,
    beddingTotal,
    coopCost,
    chickenCost,
    estimatedCost,
    allowance,
    recommendedBudget: estimatedCost + allowance
  };
}


const savedPlannerParams = new URLSearchParams(window.location.search);
const isFromSavedRecommendation =
  savedPlannerParams.get("fromSaved") === "1";

let savedRecommendedSizes = [];

if (isFromSavedRecommendation) {
  try {
    const rawSizes = JSON.parse(
      savedPlannerParams.get("recommendedSizes") || "[]"
    );

    const ranges = Array.isArray(rawSizes)
      ? rawSizes
      : [rawSizes];

    ranges.forEach(range => {
      const matches = String(range)
        .match(/(\d+)\s*[x×]\s*(\d+)/gi);

      if (!matches) return;

      const numbers = matches.map(size =>
        Number(size.match(/\d+/)[0])
      );

      if (numbers.length === 1) {
        savedRecommendedSizes.push(numbers[0]);
      } else {
        const start = Math.min(...numbers);
        const end = Math.max(...numbers);

        for (let i = start; i <= end; i++) {
          savedRecommendedSizes.push(i);
        }
      }
    });
  } catch (error) {
    console.error("Invalid recommended sizes:", error);
  }
}

savedRecommendedSizes = [
  ...new Set(savedRecommendedSizes)
].filter(size => size >= 1 && size <= 10);

function isRecommendedCoopSize(size) {
  if (!isFromSavedRecommendation) return true;

  return savedRecommendedSizes.includes(
    Number(String(size).split("x")[0])
  );
}



function populateSizeDropdown() {
  const sizeSelect = document.getElementById("coopSize");

  if (!sizeSelect) return;

  sizeSelect.innerHTML =
    '<option value="" disabled selected>Select Size</option>';

  for (let i = 1; i <= 10; i++) {
    const sizeKey = `${i}x${i}`;

    if (!isRecommendedCoopSize(sizeKey)) {
      continue;
    }

    const option = document.createElement("option");

    option.value = `${i},${i}`;
    option.textContent = `${i} x ${i} meters`;

    sizeSelect.appendChild(option);
  }

  if (sizeSelect.options.length === 1) {
    sizeSelect.innerHTML =
      '<option value="" disabled selected>No recommended coop sizes available</option>';
  }
}





function findSuitableSizes() {
  const budgetInput = document.getElementById("budget");
  const chickenType = document.getElementById("type").value;
  const sizeSelect = document.getElementById("coopSize");
  const capacityInput = document.getElementById("capacity");
  const message = document.getElementById("budgetMessage");

  const rawBudget = budgetInput.value.trim();
  const budget = Number(rawBudget);
  const previousSize = sizeSelect.value;

  sizeSelect.innerHTML = "";
  capacityInput.value = "";

  if (rawBudget === "") {
    sizeSelect.innerHTML =
      '<option value="" disabled selected>Enter your budget first</option>';
    message.textContent = "";
    return;
  }

  if (
    !/^\d+(\.\d{1,2})?$/.test(rawBudget) ||
    !Number.isFinite(budget)
  ) {
    sizeSelect.innerHTML =
      '<option value="" disabled selected>Invalid budget</option>';

    message.textContent =
      "Invalid Budget. Please enter a valid positive amount.";
    return;
  }

  if (budget === 0) {
    sizeSelect.innerHTML =
      '<option value="" disabled selected>No suitable coop size</option>';

    message.textContent =
      "Below Minimum Budget. No coop fits your budget.";
    return;
  }

  if (!Object.hasOwn(estimatedChickenPrices, chickenType)) {
    sizeSelect.innerHTML =
      '<option value="" disabled selected>Select Chicken Type first</option>';

    message.textContent =
      "Please select a chicken type first.";
    return;
  }

  const recommendedSizes = Object.keys(coopData)
    .filter(size => isRecommendedCoopSize(size));

  const validSizes = [];
  const pricingIssueSizes = [];

  for (const size of recommendedSizes) {
    const issues = getMaterialPricingIssues(size, chickenType);

    if (issues.length > 0) {
      pricingIssueSizes.push({ size, issues });
      continue;
    }

    const costing = calculateRecommendedBudget(
      size,
      chickenType
    );

    if (!costing || !Number.isFinite(costing.recommendedBudget)) {
      pricingIssueSizes.push({
        size,
        issues: ["Cost estimation is unavailable."]
      });
      continue;
    }

    validSizes.push({ size, costing });
  }

  const affordableSizes = validSizes.filter(
    item => item.costing.recommendedBudget <= budget
  );

  if (pricingIssueSizes.length > 0) {
    console.warn(
      "Coop sizes with pricing issues:",
      pricingIssueSizes
    );
  }

  if (affordableSizes.length === 0) {
    sizeSelect.innerHTML =
      '<option value="" disabled selected>No suitable coop size</option>';

    if (validSizes.length === 0) {
      message.textContent =
        "Material pricing is unavailable or incomplete. " +
        "Please contact the administrator.";
      return;
    }

    const minimumBudget = Math.min(
      ...validSizes.map(
        item => item.costing.recommendedBudget
      )
    );

    message.textContent =
      `Your budget is below the minimum verified ` +
      `recommended total of ₱${minimumBudget.toLocaleString()}, ` +
      `including coop setup, chickens, and budget allowance.` +
      (pricingIssueSizes.length > 0
        ? " Some coop sizes could not be evaluated due to material pricing issues."
        : "");

    return;
  }

  sizeSelect.innerHTML =
    '<option value="" disabled selected>Select your preferred coop size</option>';

  affordableSizes.forEach(({ size, costing }) => {
    const [length, width] = size.split("x");

    const option = document.createElement("option");

    option.value = `${length},${width}`;

    option.textContent =
      `${size} meters - Estimated Budget: ` +
      `₱${costing.recommendedBudget.toLocaleString()}`;

    sizeSelect.appendChild(option);
  });

  if (
    [...sizeSelect.options].some(
      option => option.value === previousSize
    )
  ) {
    sizeSelect.value = previousSize;
  }

  message.textContent =
    `${affordableSizes.length} coop size(s) fit your estimated budget.` +
    (pricingIssueSizes.length > 0
      ? ` ${pricingIssueSizes.length} coop size(s) were excluded due to material pricing issues.`
      : "");
}



function useManualPlanning() {
  document.getElementById(
    "budget"
  ).value = "";

document.getElementById(
  "budgetMessage"
).textContent =
  "Manual Planning Enabled. Budget is optional. You can select your preferred coop size and continue.";

  populateSizeDropdown();

  const capacityInput =
    document.getElementById(
      "capacity"
    );

  if (capacityInput) {
    capacityInput.value = "";
  }
}

function updateCoopSpaceGuidance() {
  const guidance = document.getElementById("coopSpaceGuidance");
  const sizeValue = document.getElementById("coopSize")?.value;

  if (!guidance) return;

  if (!sizeValue) {
    guidance.textContent = "";
    return;
  }

  const [length, width] = sizeValue.split(",").map(Number);

  if (!Number.isFinite(length) || !Number.isFinite(width)) {
    guidance.textContent = "";
    return;
  }

  const area = length * width;
  const sizeKey = `${length}x${width}`;

  const dimensionsText =
    `Selected Coop: ${length} × ${width} meters (${area} m²).`;


if (!isFromSavedRecommendation) {
  guidance.textContent = dimensionsText;
  return;
}


  if (savedRecommendedSizes.length === 0) {
    guidance.textContent =
      `${dimensionsText} No saved breed-specific space recommendation is available.`;
    return;
  }

  guidance.textContent = isRecommendedCoopSize(sizeKey)
    ? `${dimensionsText} This coop size is within the saved breed recommendation.`
    : `${dimensionsText} This coop size is outside the saved breed recommendation.`;
}


function updateCapacity() {
  updateCoopSpaceGuidance();
  const sizeSelect = document.getElementById("coopSize");
  const typeSelect = document.getElementById("type");
  const capacityInput = document.getElementById("capacity");

  if (!sizeSelect || !typeSelect || !capacityInput) return;

  const selectedSize = sizeSelect.value;
  const chickenType = typeSelect.value;

  if (!selectedSize || !chickenType) {
    capacityInput.value = "";
    return;
  }

  const sizeKey = selectedSize.replace(",", "x");
  const capacity = getChickenCapacity(sizeKey, chickenType);

  capacityInput.value = capacity === null
    ? "Capacity not available"
    : `Up to ${capacity} chickens`;
}


async function generatePlan() {
const materialsLoaded = await loadMaterialPrices();

if (!materialsLoaded) {
  alert(
    "Unable to load material prices. Please try again."
  );
  return;
}

  const sizeValue =
    document.getElementById(
      "coopSize"
    ).value;

  const type =
    document.getElementById(
      "type"
    ).value;

  const name =
    document.getElementById(
      "coopName"
    ).value.trim();
    if (name.length > 50) {
  alert("Coop name must not exceed 50 characters.");
  return;
}

  const budget =
    Number(
      document.getElementById(
        "budget"
      ).value
    ) || 0;

const budgetInput = document.getElementById("budget");
const rawBudget = budgetInput.value.trim();

if (rawBudget !== "") {
  const enteredBudget = Number(rawBudget);

  if (
  !/^\d+(\.\d{1,2})?$/.test(rawBudget) ||
  !Number.isFinite(enteredBudget) ||
  enteredBudget < 0
) {
    alert("Invalid Budget. Please enter a valid positive amount.");
    return;
  }

  if (enteredBudget === 0) {
    alert("Below Minimum Budget. No coop fits your budget.");
    return;
  }
}

  if (!name) {
    alert(
      "Please enter a coop name."
    );

    return;
  }
if (!type) {
  alert("Please select a chicken type.");
  return;
}

if (!sizeValue) {
  alert("Please choose a coop size.");
  return;
}
const user =
  JSON.parse(
    localStorage.getItem("user")
  );

if (!user || !user.id) {
  alert("Please log in first.");
  return;
}
  const [length, width] =
    sizeValue
      .split(",")
      .map(Number);


const sizeKey = `${length}x${width}`;

const pricingIssues = getMaterialPricingIssues(sizeKey, type);

if (pricingIssues.length > 0) {
  console.error(
    "Material pricing issues:",
    pricingIssues
  );

  alert(
    "Material Pricing Issue!\n\n" +
    "Some active material prices are missing, invalid, or have unit mismatches.\n\n" +
    pricingIssues.join("\n") +
    "\n\nPlease contact the administrator to correct the material pricing."
  );

  return;
}

const area = length * width;


  const selectedCoop =
    coopData[sizeKey];

  if (!selectedCoop) {
    alert(
      "Coop size data not found."
    );

    return;
  }


const costing = calculateRecommendedBudget(
  sizeKey,
  type
);

if (!costing) {
  alert("Cost estimation is unavailable.");
  return;
}

const chickens = costing.capacity;
const costData = costing.costData;

const constructionTotal = costing.constructionTotal;
const hardwareTotal = costing.hardwareTotal;
const equipmentTotal = costing.equipmentTotal;
const beddingTotal = costing.beddingTotal;

const coopCost = costing.coopCost;
const chickenCost = costing.chickenCost;
const allowance = costing.allowance;
const chickenUnitPrice = costing.chickenUnitPrice;

const total = costing.recommendedBudget;

if (rawBudget !== "" && budget < total) {
  alert(
    `Insufficient Budget!\n\n` +
    `Available Budget: ₱${budget.toLocaleString()}\n` +
    `Estimated Setup Cost: ₱${total.toLocaleString()}\n\n` +
    `Please increase your budget or choose a smaller coop size.`
  );
  return;
}

try {
  const response =
    await fetch(
      "/api/coops/generate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          userId: user.id
        })
      }
    );

  const result =
    await response.json();

  if (response.status === 429) {
    showCoopUpgradePopup(
      result.message ||
      "You have used all 3 free Coop Planner generations for today. Upgrade to Premium for unlimited coop plan generations."
    );

    return;
  }

  if (!response.ok || !result.success) {
    alert(
      result.message ||
      "Unable to generate your coop plan."
    );

    return;
  }

} catch (error) {
  console.error(
    "COOP GENERATE ERROR:",
    error
  );

  alert(
    "Unable to connect to the server."
  );

  return;
}

const spacePerChicken =
  area / chickens;

  const previewBox =
    document.querySelector(
      ".preview-box"
    );

  if (previewBox) {
    const modelFolders = {
      "Broilers": {
        folder: "Broilers",
        name: "Broiler"
      },

      "Layers (Egg Production)": {
        folder: "Layers",
        name: "Layers"
      },

      "Dual Purpose": {
        folder: "Dual Purpose",
        name: "Dual Purpose"
      }
    };

    const typeData =
      modelFolders[type];

    if (typeData) {
const modelBaseURL =
  "https://smartcoop-models.porcallaramuel179.workers.dev";

const modelFilename =
  `${sizeKey}.${typeData.name.replaceAll(" ", ".")}.glb`;

const modelPath =
  `${modelBaseURL}/${modelFilename}`;
  
let materials = null;
let positions = null;

if (type === "Broilers") {
  materials =
    broilerMaterialSizes[sizeKey];

  positions =
    broilerHotspotPositions[sizeKey];
}

else if (type === "Dual Purpose") {
  materials =
    dualPurposeMaterialSizes[sizeKey];

  positions =
    dualPurposeHotspotPositions[sizeKey];
}

else if (
  type === "Layers (Egg Production)" &&
  sizeKey === "1x1"
) {
  materials =
    layersMaterialSizes[sizeKey];

  positions =
    layersHotspotPositions[sizeKey];
}


      previewBox.innerHTML = `
        <div class="model-view-controls">
          <button
            type="button"
            id="view3DBtn"
            class="view-btn active"
          >
            View 3D
          </button>

          <button
            type="button"
            id="viewMaterialsBtn"
            class="view-btn"
          >
            View Materials
          </button>
        </div>

        <model-viewer
          id="coopModelViewer"
          src="${modelPath}"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          exposure="1"
          environment-image="neutral"
          style="width:100%;height:100%;"
        >
        ${
  type === "Layers (Egg Production)" &&
  sizeKey === "1x1" &&
  materials &&
  positions
    ? Object.entries(materials)
        .filter(([key]) => positions[key])
        .map(([key, item]) => `
          <button
            class="model-hotspot material-marker"
            slot="hotspot-layers-${key}"
            data-position="${positions[key]}"
            data-normal="0m 1m 0m"
          >
            <span class="hotspot-label">
              <strong>${item.name}</strong>
              <span>${item.size}</span>
              ${
                item.thickness
                  ? `<span>Thickness: ${item.thickness}</span>`
                  : ""
              }
            </span>
          </button>
        `)
        .join("")
    : ""
}

          ${
materials && positions &&
type !== "Layers (Egg Production)"
  ? `
          <button
            class="model-hotspot material-marker roof-marker"
            slot="hotspot-roof"
            data-position="${positions.roof}"
            data-normal="0m 1m 0m"
          >
            <span class="hotspot-label">
              <strong>
                ${materials.roof.name}
              </strong>

              <span>
                ${materials.roof.size}
              </span>

              <span>
                Thickness:
                ${materials.roof.thickness}
              </span>
            </span>
          </button>

          <button
            class="model-hotspot material-marker concrete-marker"
            slot="hotspot-concrete"
            data-position="${positions.concrete}"
            data-normal="0m 1m 0m"
          >
            <span class="hotspot-label">
              <strong>
                ${materials.concrete.name}
              </strong>

              <span>
                ${materials.concrete.size}
              </span>

              <span>
                Height:
                ${materials.concrete.height}
              </span>
            </span>
          </button>

          <button
            class="model-hotspot material-marker post-marker"
            slot="hotspot-post"
            data-position="${positions.post}"
            data-normal="0m 0m 1m"
          >
            <span class="hotspot-label">
              <strong>
                ${materials.posts.name}
              </strong>

              <span>
                ${materials.posts.size}
              </span>
            </span>
          </button>

          <button
            class="model-hotspot material-marker door-marker"
            slot="hotspot-door"
            data-position="${positions.door}"
            data-normal="1m 0m 0m"
          >
            <span class="hotspot-label">
              <strong>
                ${materials.door.name}
              </strong>

              <span>
                ${materials.door.size}
              </span>
            </span>
          </button>

          <button
            class="model-hotspot material-marker mesh-marker"
            slot="hotspot-mesh"
            data-position="${positions.mesh}"
            data-normal="1m 0m 0m"
          >
            <span class="hotspot-label">
              <strong>
                ${materials.wireMesh.name}
              </strong>

              <span>
                ${materials.wireMesh.specification}
              </span>
            </span>
          </button>

          <button
            class="model-hotspot material-marker rice-marker"
            slot="hotspot-ricehull"
            data-position="${positions.riceHull}"
            data-normal="0m 1m 0m"
          >
            <span class="hotspot-label">
              <strong>
                ${materials.riceHull.name}
              </strong>

              <span>
                ${materials.riceHull.size}
              </span>
            </span>
          </button>

          ${
  materials.nestingBox && positions.nestingBox
    ? `
      <button
        class="model-hotspot material-marker nesting-marker"
        slot="hotspot-nestingbox"
        data-position="${positions.nestingBox}"
        data-normal="0m 1m 0m"
      >
        <span class="hotspot-label">
          <strong>${materials.nestingBox.name}</strong>
          <span>${materials.nestingBox.size}</span>
        </span>
      </button>
    `
    : ""
}

${
  materials.perch && positions.perch
    ? `
      <button
        class="model-hotspot material-marker perch-marker"
        slot="hotspot-perch"
        data-position="${positions.perch}"
        data-normal="0m 1m 0m"
      >
        <span class="hotspot-label">
          <strong>${materials.perch.name}</strong>
          <span>${materials.perch.size}</span>
        </span>
      </button>
    `
    : ""
}

${
  materials.feeder && positions.feeder
    ? `
      <button
        class="model-hotspot material-marker feeder-marker"
        slot="hotspot-feeder"
        data-position="${positions.feeder}"
        data-normal="0m 1m 0m"
      >
        <span class="hotspot-label">
          <strong>${materials.feeder.name}</strong>
          <span>${materials.feeder.specification}</span>
        </span>
      </button>
    `
    : ""
}

${
  type === "Broilers" &&
  materials.broodingGuard &&
  positions.broodingGuard
    ? `
      <button
        class="model-hotspot material-marker brooding-guard-marker"
        slot="hotspot-brooding-guard"
        data-position="${positions.broodingGuard}"
        data-normal="0m 1m 0m"
      >
        <span class="hotspot-label">
          <strong>${materials.broodingGuard.name}</strong>
          <span>${materials.broodingGuard.specification}</span>
        </span>
      </button>
    `
    : ""
}



${
  materials.waterer && positions.waterer
    ? `
      <button
        class="model-hotspot material-marker waterer-marker"
        slot="hotspot-waterer"
        data-position="${positions.waterer}"
        data-normal="0m 1m 0m"
      >
        <span class="hotspot-label">
          <strong>${materials.waterer.name}</strong>
          <span>${materials.waterer.size}</span>
        </span>
      </button>
    `
    : ""
}

${
  materials.brooderLamp && positions.brooderLamp
    ? `
      <button
        class="model-hotspot material-marker lamp-marker"
        slot="hotspot-brooderlamp"
        data-position="${positions.brooderLamp}"
        data-normal="0m 1m 0m"
      >
        <span class="hotspot-label">
          <strong>${materials.brooderLamp.name}</strong>
          <span>${materials.brooderLamp.size}</span>
        </span>
      </button>
    `
    : ""
}
          `
              : ""
          }

        </model-viewer>

        <div
          class="preview-info"
          id="previewInfo"
        >
          ${length}m × ${width}m
          <br>

          <small>
            ${area.toFixed(2)}m² area
          </small>
        </div>
      `;

      const view3DBtn =
        document.getElementById(
          "view3DBtn"
        );

      const viewMaterialsBtn =
        document.getElementById(
          "viewMaterialsBtn"
        );

      const materialMarkers =
        document.querySelectorAll(
          ".material-marker"
        );

      function show3DView() {
        const modelViewer =
          document.getElementById(
            "coopModelViewer"
          );

        materialMarkers.forEach(
          marker => {
            marker.style.display =
              "none";
          }
        );

        modelViewer.classList.remove(
          "materials-mode"
        );

        modelViewer.setAttribute(
          "auto-rotate",
          ""
        );

        modelViewer.cameraOrbit =
          "45deg 75deg auto";

        modelViewer.fieldOfView =
          "30deg";

        view3DBtn.classList.add(
          "active"
        );

        viewMaterialsBtn.classList.remove(
          "active"
        );
      }

      function showMaterialsView() {
        const modelViewer =
          document.getElementById(
            "coopModelViewer"
          );

          const materialsComingSoon =
  (type === "Dual Purpose" ||
   type === "Layers (Egg Production)") &&
  sizeKey !== "1x1";

if (materialsComingSoon) {
  showMaterialsComingSoonModal();
  return;
}

        materialMarkers.forEach(
          marker => {
            marker.style.display =
              "block";
          }
        );

        modelViewer.classList.add(
          "materials-mode"
        );

        modelViewer.removeAttribute(
          "auto-rotate"
        );

        modelViewer.cameraOrbit =
          "45deg 60deg auto";

        modelViewer.fieldOfView =
          "30deg";

        viewMaterialsBtn.classList.add(
          "active"
        );

        view3DBtn.classList.remove(
          "active"
        );
      }

      view3DBtn.addEventListener(
        "click",
        show3DView
      );

      viewMaterialsBtn.addEventListener(
        "click",
        showMaterialsView
      );

      show3DView();
    }
  }

  const capacityResult =
    document.getElementById(
      "capacityResult"
    );

  if (capacityResult) {
    capacityResult.textContent =
      `${chickens} chickens`;
  }

  const capacityStatus =
    document.getElementById(
      "capacityStatus"
    );

  if (capacityStatus) {
    capacityStatus.textContent =
      "Recommended Capacity";

    capacityStatus.style.color =
      "#047857";
  }

  const spacePerChickenText =
    document.getElementById(
      "spacePerChicken"
    );

  if (spacePerChickenText) {
    spacePerChickenText.textContent =
      `${spacePerChicken.toFixed(2)}m² per chicken`;
  }

  const spaceUsageResult =
    document.getElementById(
      "spaceUsageResult"
    );

  if (spaceUsageResult) {
    spaceUsageResult.textContent =
      "100%";
  }

  const totalAreaText =
    document.getElementById(
      "totalAreaText"
    );

  if (totalAreaText) {
    totalAreaText.textContent =
      `${area}m² total area`;
  }

  const usageBarFill =
    document.getElementById(
      "usageBarFill"
    );

  if (usageBarFill) {
    usageBarFill.style.width =
      "100%";
  }

  const ventilationStatus =
    document.getElementById(
      "ventilationStatus"
    );

  if (ventilationStatus) {
    ventilationStatus.textContent =
      "Good";

    ventilationStatus.style.color =
      "#047857";
  }

  const climateText =
    document.getElementById(
      "climateText"
    );

  if (climateText) {
    climateText.textContent =
      "Based on recommended coop capacity";
  }

if (costTableBody) {
  if (costData) {
const createMaterialRows = (title, items, categoryTotal) => {
const rows = items
  .filter(item => getMaterialUnitPrice(item, type, sizeKey)!== null)
  .map(item => {
      const subtotal =
        calculateMaterialSubtotal(item, type, sizeKey);

      return `
        <tr class="cost-item-row">
          <td class="cost-item-name">
            <strong>${item.name}</strong>
            ${
              item.specification
                ? `<small>${item.specification}</small>`
                : ""
            }
          </td>

          <td class="cost-qty">
            ${item.quantity} ${item.unit}
          </td>

          <td class="cost-unit-price">
           ₱${getMaterialUnitPrice(item, type, sizeKey).toLocaleString()}
          </td>

          <td class="cost-item-subtotal">
            ₱${subtotal.toLocaleString()}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <tr class="cost-category-row">
      <td colspan="4">
        <strong>${title}</strong>
      </td>
    </tr>

    ${rows}

    <tr class="cost-subtotal-row">
      <td colspan="3">
        <strong>${title} Subtotal</strong>
      </td>

      <td>
        <strong>
          ₱${categoryTotal.toLocaleString()}
        </strong>
      </td>
    </tr>
  `;
};

    costTableBody.innerHTML = `
      ${createMaterialRows(
        "Coop Construction",
        costData.construction,
        constructionTotal
      )}

      ${createMaterialRows(
        "Hardware",
        costData.hardware,
        hardwareTotal
      )}

      ${createMaterialRows(
        "Equipment",
        costData.equipment,
        equipmentTotal
      )}

      ${createMaterialRows(
        "Bedding",
        costData.bedding,
        beddingTotal
      )}

      <tr class="cost-category-row">
        <td colspan="4">
          <strong>Livestock</strong>
        </td>
      </tr>

      <tr class="cost-item-row">
        <td class="cost-item-name">
          <strong>${type} Chickens</strong>
          <small>
            Recommended capacity for ${sizeKey} coop
          </small>
        </td>

        <td class="cost-qty">
          ${chickens} chicks
        </td>

        <td class="cost-unit-price">
          ₱${chickenUnitPrice.toLocaleString()}
        </td>

        <td class="cost-item-subtotal">
          ₱${chickenCost.toLocaleString()}
        </td>
      </tr>

      <tr class="cost-item-row">
        <td colspan="3">
          <strong>Contingency Allowance (10%)</strong>
        </td>
        <td class="cost-item-subtotal">
          ₱${allowance.toLocaleString()}
        </td>
      </tr>
    `;
  } else {
    costTableBody.innerHTML = `
      <tr>
        <td>
          Coop Construction & Equipment
        </td>

        <td>
          ₱${coopCost.toLocaleString()}
        </td>
      </tr>

      <tr>
        <td>
          Chicks (${chickens} × ₱${chickenUnitPrice})
        </td>

        <td>
          ₱${chickenCost.toLocaleString()}
        </td>
      </tr>

      <tr>
        <td>Contingency Allowance (10%)</td>
        <td>₱${allowance.toLocaleString()}</td>
      </tr>

    `;
  }
}
captureCustomMaterials();
  const totalCost =
    document.getElementById(
      "totalCost"
    );

  if (totalCost) {
    totalCost.textContent =
      `₱${total.toLocaleString()}`;
  }

  const costSection =
    document.getElementById(
      "costSection"
    );

  if (costSection) {
    costSection.classList.remove(
      "hidden"
    );
  }

  const plannerActions =
    document.getElementById(
      "plannerActions"
    );

  if (plannerActions) {
    plannerActions.classList.remove(
      "hidden"
    );
  }

  currentPlan = {
    id: Date.now(),
    name,
    length,
    width,
    chickens,
    type,
    budget,
    total,
    status: "active"
  };
}
function showMaterialsComingSoonModal() {
  const modal = document.getElementById(
    "materialsComingSoonModal"
  );

  if (!modal) return;

  modal.classList.remove("hidden");
}

function closeMaterialsComingSoonModal() {
  const modal = document.getElementById(
    "materialsComingSoonModal"
  );

  if (!modal) return;

  modal.classList.add("hidden");
}

document.getElementById("closeMaterialsSoonBtn")
  ?.addEventListener("click", closeMaterialsComingSoonModal);

document.getElementById("materialsComingSoonModal")
  ?.addEventListener("click", event => {
    if (event.target === event.currentTarget) {
      closeMaterialsComingSoonModal();
    }
  });
  async function getNextCoopName() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user?.id) return "New Coop";

  try {
    const response = await fetch(`/api/coops/user/${user.id}`);
    if (!response.ok) return "New Coop";

    const data = await response.json();
    const plans = data.coops || [];

    const existingNames = new Set(
      plans.map(plan => String(plan.CoopName || "").trim().toLowerCase())
    );

    if (!existingNames.has("new coop")) {
      return "New Coop";
    }

    let number = 1;

    while (existingNames.has(`new coop ${number}`)) {
      number++;
    }

    return `New Coop ${number}`;
  } catch (error) {
    console.error("Coop naming error:", error);
    return "New Coop";
  }
}

async function resetPlannerForm() {
  const budget =
    document.getElementById(
      "budget"
    );

  const budgetMessage =
    document.getElementById(
      "budgetMessage"
    );

  const coopName =
    document.getElementById(
      "coopName"
    );

  const coopSize =
    document.getElementById(
      "coopSize"
    );

  const capacity =
    document.getElementById(
      "capacity"
    );

  const chickenType =
    document.getElementById(
      "type"
    );

  const previewBox =
    document.querySelector(
      ".preview-box"
    );

  const costSection =
    document.getElementById(
      "costSection"
    );

  const plannerActions =
    document.getElementById(
      "plannerActions"
    );

  if (budget) {
    budget.value = "";
  }

  if (budgetMessage) {
    budgetMessage.textContent = "";
  }

if (coopName) {
  coopName.value = await getNextCoopName();
}

  if (coopSize) {
    coopSize.innerHTML = `
      <option
        value=""
        disabled
        selected
      >
        Enter your budget first
      </option>
    `;
  }

  if (capacity) {
    capacity.value = "";
  }


    if (chickenType && !chickenType.disabled) {
      chickenType.selectedIndex = 0;
    }


  if (previewBox) {
    previewBox.innerHTML = `
      <div class="cube"></div>

      <div
        class="preview-info"
        id="previewInfo"
      >
        <pre id="output"></pre>
      </div>
    `;
  }

  if (costSection) {
    costSection.classList.add(
      "hidden"
    );
  }

  if (plannerActions) {
    plannerActions.classList.add(
      "hidden"
    );
  }

  currentPlan = null;

  if (window.lucide) {
    lucide.createIcons();
  }
}

async function setActive(coopId) {
  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  const response =
    await fetch(
      `/api/coops/set-active/${coopId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          userId: user.id
        })
      }
    );

  const result =
    await response.json();

  alert(
    result.message
  );

  if (result.success) {
    loadPlans();
  }
}

async function setInactive(
  coopId
) {
  console.log(
    "SET INACTIVE:",
    coopId
  );

  const response =
    await fetch(
      `/api/coops/set-inactive/${coopId}`,
      {
        method: "PUT"
      }
    );

  const result =
    await response.json();

  alert(
    result.message
  );

  if (result.success) {
    loadPlans();
  }
}

let loadedPlans = [];

async function loadPlans() {
  const container =
    document.getElementById(
      "savedPlans"
    );

  if (!container) {
    return;
  }

  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  try {
    const response =
      await fetch(
        `/api/coops/user/${user.id}`
      );

    const data =
      await response.json();

    const plans =
      data.coops || [];

    loadedPlans = plans;

    container.innerHTML =
      plans
        .map(
          plan => `
        <div class="saved-card">

          <div class="saved-header">

          <h3 class="saved-coop-name" title="${escapeCoopHTML(plan.CoopName)}">
            ${escapeCoopHTML(plan.CoopName)}
          </h3>

            <span class="status-badge">
              ${plan.Status}
            </span>

          </div>

          <p>
            ${plan.ChickenType}
          </p>

          <div class="saved-body">

            <div>
              <p>Size</p>

              <strong>
                ${plan.CoopSize}
              </strong>
            </div>

            <div>
              <p>Chickens</p>

              <strong>
                ${plan.NumberOfChickens}
              </strong>
            </div>

          </div>

          <div class="saved-actions">

            ${
              plan.Status ===
              "active"
                ? `
                  <button
                    class="plan-action-btn"
                    onclick="setInactive(${plan.CoopID})"
                  >
                    <i data-lucide="pause-circle"></i>
                    Set Inactive
                  </button>
                `
                : `
                  <button
                    class="plan-action-btn"
                    onclick="setActive(${plan.CoopID})"
                  >
                    <i data-lucide="play-circle"></i>
                    Set Active
                  </button>
                `
            }

            <button
              class="plan-action-btn"
              onclick="viewPlan(${plan.CoopID})"
            >
              <i data-lucide="eye"></i>
              View
            </button>

            <button
              class="plan-action-btn delete-btn"
              onclick="deletePlan(${plan.CoopID})"
            >
              <i data-lucide="trash-2"></i>
              Delete
            </button>

          </div>

        </div>
      `
        )
        .join("");

    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (error) {
    console.error(
      "Error loading plans:",
      error
    );
  }
}

function viewPlan(id) {
  const plan =
    loadedPlans.find(
      p =>
        Number(p.CoopID) ===
        Number(id)
    );

  if (!plan) {
    return;
  }

  const modal =
    document.getElementById(
      "viewPlanModal"
    );

  document.getElementById(
    "modalPlanName"
  ).textContent =
    plan.CoopName;

  document.getElementById(
    "modalChickenType"
  ).textContent =
    plan.ChickenType;

  document.getElementById(
    "modalPlanSize"
  ).textContent =
    plan.CoopSize;

  document.getElementById(
    "modalPlanChickens"
  ).textContent =
    plan.NumberOfChickens;

  document.getElementById(
    "modalPlanStatus"
  ).textContent =
    plan.Status;

  const sizeKey =
    String(plan.CoopSize)
      .toLowerCase()
      .replaceAll("m", "")
      .replaceAll(" ", "")
      .replace("×", "x");

  const modelContainer =
    document.getElementById(
      "modalModelContainer"
    );

  const modelFolders = {
    "Broilers": {
      folder: "Broilers",
      name: "Broiler"
    },

    "Layers (Egg Production)": {
      folder: "Layers",
      name: "Layers"
    },

    "Dual Purpose": {
      folder: "Dual Purpose",
      name: "Dual Purpose"
    }
  };

  const typeData =
    modelFolders[
      plan.ChickenType
    ];

  if (typeData) {
const modelBaseURL =
  "https://smartcoop-models.porcallaramuel179.workers.dev";

const modelFilename =
  `${sizeKey}.${typeData.name.replaceAll(" ", ".")}.glb`;

const modelPath =
  `${modelBaseURL}/${modelFilename}`;

    modelContainer.innerHTML = `
      <model-viewer
        src="${modelPath}"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        exposure="1"
        environment-image="neutral"
        style="
          width:100%;
          height:100%;
          display:block;
        "
      >
      </model-viewer>
    `;

  } else {
    modelContainer.innerHTML = `
      <div
        style="
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#6b7280;
        "
      >
        No 3D model available
      </div>
    `;
  }

  modal.classList.remove(
    "hidden"
  );

  if (window.lucide) {
    lucide.createIcons();
  }
}

function closeViewPlanModal() {
  const modal =
    document.getElementById(
      "viewPlanModal"
    );

  if (modal) {
    modal.classList.add(
      "hidden"
    );
  }
}

async function deletePlan(id) {
  const confirmed =
    confirm(
      "Are you sure you want to delete this coop plan?"
    );

  if (!confirmed) {
    return;
  }

  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  try {
    const response =
      await fetch(
        `/api/coops/${id}`,
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            userId: user.id
          })
        }
      );

    const result =
      await response.json();

    console.log(
      "Delete result:",
      result
    );

    alert(
      result.message
    );

    if (result.success) {
      await loadPlans();
    }

  } catch (error) {
    console.error(
      "Delete error:",
      error
    );

    alert(
      "Delete request failed."
    );
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  if (!document.getElementById("coopSize")) {
    return;
  }

  populateSizeDropdown();
  loadPlans();

  const coopNameInput = document.getElementById("coopName");

if (coopNameInput) {
  getNextCoopName().then(name => {
    if (coopNameInput.value === "New Coop") {
      coopNameInput.value = name;
    }
  });
}

  
const budgetInput = document.getElementById("budget");
const chickenTypeSelect = document.getElementById("type");
const coopSizeSelect = document.getElementById("coopSize");

function refreshBudgetAndCapacity() {
  if (budgetInput?.value.trim() !== "") {
    findSuitableSizes();
  } else {
    populateSizeDropdown();
    document.getElementById("budgetMessage").textContent = "";
  }

  updateCapacity();
}

budgetInput?.addEventListener("input", refreshBudgetAndCapacity);

chickenTypeSelect?.addEventListener("change", refreshBudgetAndCapacity);

coopSizeSelect?.addEventListener("change", updateCapacity);

const params = new URLSearchParams(window.location.search);

const recommendedType = (params.get("type") || "").toLowerCase();
const recommendedBreed = params.get("breed") || "";
const fromSaved = params.get("fromSaved") === "1";

const typeSelect = document.getElementById("type");

if (typeSelect && recommendedType) {
  let selectedType = "";

  if (recommendedType.includes("dual")) {
    selectedType = "Dual Purpose";
  } else if (
    recommendedType.includes("meat") ||
    recommendedType.includes("broiler")
  ) {
    selectedType = "Broilers";
  } else if (
    recommendedType.includes("egg") ||
    recommendedType.includes("layer")
  ) {
    selectedType = "Layers (Egg Production)";
  }

  if (selectedType) {
    typeSelect.value = selectedType;

    if (typeSelect?.value && Number(budgetInput?.value) > 0) {
      refreshBudgetAndCapacity();
    }

    if (fromSaved) {
      typeSelect.disabled = true;
      typeSelect.title = recommendedBreed
        ? `Recommended breed: ${recommendedBreed}`
        : "Selected from Saved Recommendations";
    }
  }
}

if (window.lucide) {
  lucide.createIcons();
}

await loadMaterialPrices();

});

let customMaterialsEntries = [];
let customMaterialsDraft = [];

function customMaterialsMoney(value) {
  return `₱${Math.round(value).toLocaleString("en-PH")}`;
}

function captureCustomMaterials() {
  const tbody = document.getElementById("costTableBody");

  customMaterialsEntries = [];
  customMaterialsDraft = [];

  if (!tbody) return;

  let category = "";

  for (const row of tbody.querySelectorAll("tr")) {
    if (row.classList.contains("cost-category-row")) {
      category = row.textContent.trim();
      continue;
    }

    if (!row.classList.contains("cost-item-row")) continue;
    if (row.textContent.includes("Contingency Allowance")) continue;

    const cells = row.querySelectorAll("td");

    if (cells.length !== 4) continue;

    const name = cells[0].querySelector("strong")?.textContent.trim();
    const price = Number(
      cells[3].textContent.replace(/[^0-9.]/g, "")
    );

    if (!name || !Number.isFinite(price)) continue;

    customMaterialsEntries.push({
      name,
      category,
      price,
      selected: true,
      row
    });
  }
}

function openCustomizeMaterials() {
  const modal = document.getElementById("customMaterialsModal");

  if (!modal || !customMaterialsEntries.length) return;

  customMaterialsDraft = customMaterialsEntries.map(
    item => item.selected
  );

  const list = document.getElementById("customMaterialsList");

  list.innerHTML = customMaterialsEntries.map((item, i) => `
    <label style="display:flex;align-items:center;gap:12px;padding:12px 2px;border-bottom:1px solid #edf2f7;cursor:pointer">

      <input
        type="checkbox"
        data-material-index="${i}"
        ${item.selected ? "checked" : ""}
        style="width:18px;height:18px;accent-color:#047857"
      >

      <span style="flex:1;min-width:0">
        <strong style="display:block;color:#0f172a">
          ${escapeCoopHTML(item.name)}
        </strong>
        <small style="color:#64748b">
          ${escapeCoopHTML(item.category)}
        </small>
      </span>

      <strong>${customMaterialsMoney(item.price)}</strong>

    </label>
  `).join("");

  list.onchange = event => {
    const checkbox = event.target.closest(
      "input[data-material-index]"
    );

    if (!checkbox) return;

    customMaterialsDraft[
      Number(checkbox.dataset.materialIndex)
    ] = checkbox.checked;

    updateCustomMaterialsPreview();
  };

  modal.classList.remove("hidden");
  modal.style.display = "flex";

  updateCustomMaterialsPreview();
}

function calculateCustomMaterialsTotal(selection) {
  const subtotal = customMaterialsEntries.reduce(
    (sum, item, i) => sum + (selection[i] ? item.price : 0),
    0
  );

  return subtotal + Math.ceil(subtotal * 0.1);
}

function updateCustomMaterialsPreview() {
  const label = document.getElementById(
    "customMaterialsPreviewTotal"
  );

  if (label) {
    label.textContent = customMaterialsMoney(
      calculateCustomMaterialsTotal(customMaterialsDraft)
    );
  }
}

function closeCustomizeMaterials() {
  const modal = document.getElementById("customMaterialsModal");

  if (modal) {
    modal.style.display = "none";
    modal.classList.add("hidden");
  }
}

function resetCustomizeMaterials() {
  customMaterialsDraft = customMaterialsEntries.map(() => true);

  document.querySelectorAll(
    "#customMaterialsList input[data-material-index]"
  ).forEach(input => {
    input.checked = true;
  });

  updateCustomMaterialsPreview();
}

function applyCustomizeMaterials() {
  if (!customMaterialsEntries.length) return;

  customMaterialsEntries.forEach((item, i) => {
    item.selected = customMaterialsDraft[i];

    const subtotal = item.row.querySelector(
      ".cost-item-subtotal"
    );

    if (subtotal) {
      subtotal.textContent = customMaterialsMoney(
        item.selected ? item.price : 0
      );
    }

    item.row.style.opacity = item.selected ? "1" : "0.55";

    const description = item.row.querySelector(
      ".cost-item-name small"
    );

    if (description) {
      if (item.originalDescription === undefined) {
        item.originalDescription = description.textContent;
      }

      description.textContent = item.selected
        ? item.originalDescription
        : "Already available — no purchase needed";
    }
  });

  const tbody = document.getElementById("costTableBody");

  let category = "";

  for (const row of tbody.querySelectorAll("tr")) {
    if (row.classList.contains("cost-category-row")) {
      category = row.textContent.trim();
    }

    if (row.classList.contains("cost-subtotal-row")) {
      const sum = customMaterialsEntries
        .filter(item => item.category === category && item.selected)
        .reduce((total, item) => total + item.price, 0);

      const cell = row.querySelector("td:last-child strong");

      if (cell) {
        cell.textContent = customMaterialsMoney(sum);
      }
    }
  }

  const subtotal = customMaterialsEntries.reduce(
    (sum, item) => sum + (item.selected ? item.price : 0),
    0
  );

const allowance = Math.ceil(subtotal * 0.1);
const total = subtotal + allowance;

const contingency = [...tbody.querySelectorAll("tr")]
  .find(row =>
    row.querySelector("td:first-child")?.textContent
      .includes("Contingency Allowance")
  );

  if (contingency) {
    const cell = contingency.querySelector("td:last-child");

    if (cell) {
      cell.textContent = customMaterialsMoney(allowance);
    }
  }

  const totalEl = document.getElementById("totalCost");

  if (totalEl) {
    totalEl.textContent = customMaterialsMoney(total);
  }

  if (currentPlan) {
    currentPlan.total = total;

    currentPlan.materialSelections = customMaterialsEntries.map(
      ({ name, category, selected }) => ({
        name,
        category,
        selected
      })
    );
  }

  closeCustomizeMaterials();
}
