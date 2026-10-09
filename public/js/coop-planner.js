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

      const estimatedCapacity =
        Math.floor(
          area * 2.5
        );

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


    alert(
      result.message ||
      "Plan saved successfully!"
    );


    loadPlans();

  } catch (error) {
    console.error(
      "SAVE PLAN ERROR:",
      error
    );

    alert(
      "Unable to connect to the server."
    );
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

const broilerHotspotPositions = {
  "1x1": {
    concrete: "-0.45m 0.18m 0.35m",
    post: "-0.47m 1.05m 0.45m",
    door: "0.4749m 0.8733m -0.0984m",
    mesh: "0.30m 1.25m 0.48m",
    riceHull: "0m 0.40m 0m",
    roof: "0m 1.95m 0.35m"
  },

  "2x2": {
    concrete: "0m 0.275m 0.85m",
    post: "0.9740m 0.9000m 0.9740m",
    door: "0.9742m 0.9251m -0.5497m",
    mesh: "0.9750m 1.2327m -0.0001m",
    riceHull: "0m 0.175m 0.60m",
    roof: "0.6750m 2.0689m 0.0004m"
  },

  "3x3": {
    concrete: "0m 0.275m 1.42m",
    post: "1.4260m 1.0010m 1.4260m",
    door: "1.4254m 0.8733m -1.0507m",
    mesh: "1.4528m 1.2559m -0.0001m",
    riceHull: "0m 0.1250m 0.70m",
    roof: "0.9404m 2.3538m -0.0010m"
  },

  "4x4": {
    concrete: "0m 0.275m 1.92m",
    post: "1.9250m 1.0010m 1.9250m",
    door: "1.9263m 0.8482m -1.1513m",
    mesh: "1.9508m 1.2559m 0m",
    riceHull: "0.0168m 0.1250m 0.80m",
    roof: "1.2215m 2.4556m 0.0876m"
  },

  "5x5": {
    concrete: "0m 0.275m 2.42m",
    post: "2.4385m 1.1510m 2.4385m",
    door: "2.4529m 0.8482m -2.05m",
    mesh: "2.4766m 1.4585m 0m",
    riceHull: "0.0225m 0.0875m 1.00m",
    roof: "1.5822m 2.8605m 0.2250m"
  },

  "6x6": {
    concrete: "0m 0.275m 2.92m",
    post: "2.9385m 1.1510m 2.9385m",
    door: "2.9510m 0.8482m -2.55m",
    mesh: "2.9776m 1.4585m 0m",
    riceHull: "0m 0.0875m 1.20m",
    roof: "1.7355m 3.1222m 0m"
  },

  "7x7": {
    concrete: "0m 0.275m 3.42m",
    post: "3.4385m 1.1510m 3.4385m",
    door: "3.4517m 0.8482m 0.0027m",
    mesh: "0m 1.4585m -3.45m",
    riceHull: "0.0151m 0.0875m 1.20m",
    roof: "2.0444m 3.1563m 0.1330m"
  },

  "8x8": {
    concrete: "0m 0.275m 3.42m",
    post: "3.9425m 1.1510m 3.9425m",
    door: "3.4517m 0.8482m 0.0027m",
    mesh: "0m 1.4585m -3.95m",
    riceHull: "0.0027m 0.0875m 1.40m",
    roof: "2.3435m 3.2957m 0m"
  },

  "9x9": {
    concrete: "0m 0.275m -4.35m",
    post: "4.4625m 1.1510m -4.35m",
    door: "4.4756m 0.8482m -0.40m",
    mesh: "0m 1.4720m -4.45m",
    riceHull: "-0.0004m 0.0875m 1.40m",
    roof: "2.6476m 3.3977m 0m"
  },

  "10x10": {
    concrete: "0m 0.275m -4.85m",
    post: "4.9626m 1.1510m -4.85m",
    door: "4.9757m 0.8482m -0.50m",
    mesh: "0m 1.4720m -4.95m",
    riceHull: "-0.0120m 0.0875m 0.0005m",
    roof: "2.9970m 3.4778m 0m"
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
const setupCostData = {
  broiler: {
    "1x1": {
      construction: [
          {
            name: "Concrete Slab",
            specification: "1.00m × 1.00m × 0.55m",
            quantity: 1,
            unit: "set",
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
          unit: "set",
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
        unit: "sheets",
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


function calculateMaterialSubtotal(item) {
  const quantity = Number(item.quantity || 0);
  const unitPrice = Number(item.unitPrice || 0);

  return quantity * unitPrice;
}

function calculateCategoryTotal(items = []) {
  return items.reduce(
    (total, item) =>
      total + calculateMaterialSubtotal(item),
    0
  );
}

function populateSizeDropdown() {
  const sizeSelect = document.getElementById("coopSize");

  if (!sizeSelect) return;

  sizeSelect.innerHTML =
    '<option value="" disabled selected>Select Size</option>';

  for (let i = 1; i <= 10; i++) {
    let option = document.createElement("option");

    option.value = i + "," + i;
    option.text = i + " x " + i + " meters";

    sizeSelect.appendChild(option);
  }
}

function findSuitableSizes() {
  const budget = Number(
    document.getElementById("budget").value
  );

  const sizeSelect =
    document.getElementById("coopSize");

  const capacityInput =
    document.getElementById("capacity");

  const message =
    document.getElementById("budgetMessage");

  sizeSelect.innerHTML = "";
  capacityInput.value = "";

  if (!budget || budget <= 0) {
    sizeSelect.innerHTML =
      '<option value="" disabled selected>Enter your budget first</option>';

    message.textContent = "";

    return;
  }

  let bestSize = null;
  let bestTotal = 0;

  for (const size in coopData) {
    const data = coopData[size];

    const chickenCost =
      data.capacity * chickPrice;

    const totalCost =
      data.cost + chickenCost;

    if (totalCost <= budget) {
      bestSize = size;
      bestTotal = totalCost;
    }
  }

  if (!bestSize) {
    sizeSelect.innerHTML =
      '<option value="" disabled selected>No suitable coop size</option>';

    capacityInput.value =
      "No available capacity";

    message.textContent =
      "Your budget is below the minimum estimated setup cost.";

    return;
  }

  const [length, width] =
    bestSize.split("x");

  const data =
    coopData[bestSize];

  const option =
    document.createElement("option");

  option.value =
    `${length},${width}`;

  option.textContent =
    `${bestSize} meters`;

  option.selected = true;

  sizeSelect.appendChild(option);

  capacityInput.value =
    `Up to ${data.capacity} chickens`;

  message.textContent =
    `Recommended: ${bestSize} coop • ${data.capacity} chicks • Estimated Total: ₱${bestTotal.toLocaleString()}`;
}

function useManualPlanning() {
  document.getElementById(
    "budget"
  ).value = "";

  document.getElementById(
    "budgetMessage"
  ).textContent =
    "Manual planning enabled.";

  populateSizeDropdown();

  const capacityInput =
    document.getElementById(
      "capacity"
    );

  if (capacityInput) {
    capacityInput.value = "";
  }
}

function updateCapacity() {
  const sizeSelect =
    document.getElementById(
      "coopSize"
    );

  const capacityInput =
    document.getElementById(
      "capacity"
    );

  if (
    !sizeSelect ||
    !capacityInput
  ) {
    return;
  }

  const selectedValue =
    sizeSelect.value;

  if (!selectedValue) {
    capacityInput.value = "";
    return;
  }

  const [length, width] =
    selectedValue.split(",");

  const sizeKey =
    `${length}x${width}`;

  const data =
    coopData[sizeKey];

  if (data) {
    capacityInput.value =
      `Up to ${data.capacity} chickens`;
  } else {
    capacityInput.value = "";
  }
}

async function generatePlan() {
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

  const budget =
    Number(
      document.getElementById(
        "budget"
      ).value
    ) || 0;

  if (!name) {
    alert(
      "Please enter a coop name."
    );

    return;
  }

  if (!sizeValue) {
    alert(
      "Please enter your budget or choose a coop size."
    );

    return;
  }

  if (!type) {
    alert(
      "Please select a chicken type."
    );

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

  const [length, width] =
    sizeValue
      .split(",")
      .map(Number);

  const sizeKey =
    `${length}x${width}`;

  const area =
    length * width;

  const selectedCoop =
    coopData[sizeKey];

  if (!selectedCoop) {
    alert(
      "Coop size data not found."
    );

    return;
  }

const chickens =
  selectedCoop.capacity;

const costData =
  setupCostData.broiler?.[sizeKey];

// Detailed costing is currently available for 1x1 Broiler
let constructionTotal = 0;
let hardwareTotal = 0;
let equipmentTotal = 0;
let beddingTotal = 0;

if (costData) {
  constructionTotal =
    calculateCategoryTotal(
      costData.construction
    );

  hardwareTotal =
    calculateCategoryTotal(
      costData.hardware
    );

  equipmentTotal =
    calculateCategoryTotal(
      costData.equipment
    );

  beddingTotal =
    calculateCategoryTotal(
      costData.bedding
    );
}

const coopCost =
  costData
    ? constructionTotal +
      hardwareTotal +
      equipmentTotal +
      beddingTotal
    : selectedCoop.cost;

const chickenCost =
  chickens * chickPrice;

const total =
  coopCost + chickenCost;

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
            materials && positions
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
    .map(item => {
      const subtotal =
        calculateMaterialSubtotal(item);

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
            ₱${item.unitPrice.toLocaleString()}
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
          <strong>Broiler Chicks</strong>
          <small>
            Recommended capacity for ${sizeKey} coop
          </small>
        </td>

        <td class="cost-qty">
          ${chickens} chicks
        </td>

        <td class="cost-unit-price">
          ₱${chickPrice.toLocaleString()}
        </td>

        <td class="cost-item-subtotal">
          ₱${chickenCost.toLocaleString()}
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
          Chicks (${chickens} × ₱${chickPrice})
        </td>

        <td>
          ₱${chickenCost.toLocaleString()}
        </td>
      </tr>
    `;
  }
}

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

function resetPlannerForm() {
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
    coopName.value = "New Coop";
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

            <h3>
              ${plan.CoopName}
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

document.addEventListener("DOMContentLoaded", function () {
  populateSizeDropdown();
  loadPlans();

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
});