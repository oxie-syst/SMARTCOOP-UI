
/* SMARTCOOP - Landing Page Cost Estimator */
/* Based on the existing Coop Planner cost data */

const chickPrice = 60;

const coopData = {
  "1x1": { capacity: 4 },
  "2x2": { capacity: 12 },
  "3x3": { capacity: 25 },
  "4x4": { capacity: 40 },
  "5x5": { capacity: 60 }
};

const broilerMaterialSizes = {
  "1x1": {
    concrete: "1.00m × 1.00m × 0.55m",
    posts: "1.80m × 0.05m × 0.05m",
    ridgeBoard: "1.54m × 0.05m × 0.05m",
    frontBackPlate: "1.47m × 0.05m × 0.05m",
    sidePlate: "1.00m × 0.05m × 0.05m",
    door: "1.52m × 0.70m × 0.05m",
    riceHull: "0.90m × 0.90m × 0.075m",
    roof: "3ft × 9ft sheet divided into 3 • 0.4mm",
    wireMesh: "0.025m × 0.025m openings • 0.0016m wire",
    waterer: "0.149m × 0.149m × 0.154m",
    brooderLamp: "0.322m × 0.322m × 0.220m"
  },

  "2x2": {
    concrete: "2.00m × 2.00m × 0.55m",
    posts: "1.80m × 0.05m × 0.05m",
    ridgeBoard: "2.37m × 0.05m × 0.05m",
    frontBackPlate: "2.00m × 0.05m × 0.05m",
    sidePlate: "1.99m × 0.05m × 0.05m",
    door: "1.52m × 0.70m × 0.05m",
    riceHull: "1.89m × 1.80m × 0.075m",
    roof: "0.9m × 6m sheet divided into 4 • 0.4mm",
    wireMesh: "0.025m × 0.025m openings • 0.0016m wire",
    waterer: "0.149m × 0.149m × 0.154m",
    brooderLamp: "0.322m × 0.322m × 0.220m"
  },

  "3x3": {
    concrete: "3.00m × 3.00m × 0.55m",
    posts: "2.10m × 0.05m × 0.05m",
    ridgeBoard: "3.00m × 0.05m × 0.05m",
    frontBackPlate: "2.91m × 0.05m × 0.05m",
    sidePlate: "2.90m × 0.05m × 0.05m",
    door: "1.60m × 0.70m × 0.05m",
    riceHull: "2.90m × 2.80m × 0.075m",
    roof: "0.9m × 6m sheet divided into 3 • 0.4mm",
    wireMesh: "0.025m × 0.025m openings • 0.0016m wire",
    waterer: "0.274m × 0.274m × 0.199m",
    brooderLamp: "0.322m × 0.322m × 0.220m"
  },

  "4x4": {
    concrete: "4.00m × 4.00m × 0.55m",
    posts: "2.10m × 0.05m × 0.05m",
    ridgeBoard: "4.00m × 0.05m × 0.05m",
    frontBackPlate: "4.00m × 0.05m × 0.05m",
    sidePlate: "3.90m × 0.05m × 0.05m",
    door: "1.60m × 0.70m × 0.05m",
    riceHull: "3.87m × 3.97m × 0.075m",
    roof: "3ft × 9ft sheet • 0.4mm",
    wireMesh: "0.025m × 0.025m openings • 0.0016m wire",
    waterer: "0.274m × 0.274m × 0.199m",
    brooderLamp: "0.322m × 0.322m × 0.220m"
  },

  "5x5": {
    concrete: "5.00m × 5.00m × 0.55m",
    posts: "2.40m × 0.075m × 0.075m",
    ridgeBoard: "4.99m × 0.10m × 0.05m",
    frontBackPlate: "4.95m × 0.10m × 0.05m",
    sidePlate: "4.95m × 0.10m × 0.05m",
    door: "1.60m × 0.70m × 0.05m",
    riceHull: "4.86m × 4.90m × 0.075m",
    roof: "3ft × 10ft sheet • 0.4mm",
    wireMesh: "0.025m × 0.025m openings • 0.0016m wire",
    waterer: "0.274m × 0.274m × 0.199m",
    brooderLamp: "0.322m × 0.322m × 0.220m"
  }
};

/* Exact 1x1 cost breakdown */

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

/* Original quantities for larger Broiler coops */

const broilerCostConfig = {
  "2x2": {
    posts: 6,
    rafters: 6,
    roof: 4,
    mesh: 12,
    waterers: 1,
    lamps: 1,
    feeders: 1,
    riceHull: 5
  },
  "3x3": {
    posts: 8,
    rafters: 8,
    roof: 6,
    mesh: 18,
    waterers: 2,
    lamps: 2,
    feeders: 2,
    riceHull: 10
  },
  "4x4": {
    posts: 10,
    rafters: 10,
    roof: 8,
    mesh: 24,
    waterers: 2,
    lamps: 2,
    feeders: 2,
    riceHull: 18
  },
  "5x5": {
    posts: 12,
    rafters: 12,
    roof: 10,
    mesh: 30,
    waterers: 3,
    lamps: 3,
    feeders: 3,
    riceHull: 28
  }
};

/* Generate cost breakdown for 2x2 to 5x5 */

function buildBroilerSetupCost(sizeKey) {
  const materials = broilerMaterialSizes[sizeKey];
  const config = broilerCostConfig[sizeKey];

  if (!materials || !config) {
    return null;
  }

  const sizeNumber = Number(sizeKey.split("x")[0]);
  const area = sizeNumber * sizeNumber;

  return {
    construction: [
      {
        name: "Concrete Slab",
        specification: materials.concrete,
        quantity: area,
        unit: "m²",
        unitPrice: 1000
      },
      {
        name: "Wood Posts",
        specification: materials.posts,
        quantity: config.posts,
        unit: "pcs",
        unitPrice: sizeNumber >= 5 ? 180 : 125
      },
      {
        name: "Ridge Board",
        specification: materials.ridgeBoard,
        quantity: 1,
        unit: "pc",
        unitPrice: Math.round(110 * sizeNumber)
      },
      {
        name: "Front / Back Wall Plate",
        specification: materials.frontBackPlate,
        quantity: 2,
        unit: "pcs",
        unitPrice: Math.round(105 * sizeNumber)
      },
      {
        name: "Side Wall Plate",
        specification: materials.sidePlate,
        quantity: 2,
        unit: "pcs",
        unitPrice: Math.round(80 * sizeNumber)
      },
      {
        name: "Roof Rafters",
        specification: "Wood roof framing",
        quantity: config.rafters,
        unit: "pcs",
        unitPrice: 130
      },
      {
        name: "Roof Sheet",
        specification: materials.roof,
        quantity: config.roof,
        unit: "sheets",
        unitPrice: 535
      },
      {
        name: "Wire Mesh",
        specification: materials.wireMesh,
        quantity: config.mesh,
        unit: "m²",
        unitPrice: 135
      },
      {
        name: "Door",
        specification: materials.door,
        quantity: 1,
        unit: "set",
        unitPrice: 600
      }
    ],

    hardware: [
      {
        name: "Nails / Screws",
        quantity: Math.max(1, Math.ceil(area / 10)),
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
        specification: materials.waterer,
        quantity: config.waterers,
        unit: "set",
        unitPrice: 300
      },
      {
        name: "Brooder Lamp / Refractor",
        specification: materials.brooderLamp,
        quantity: config.lamps,
        unit: "set",
        unitPrice: 500
      },
      {
        name: "Feeder",
        quantity: config.feeders,
        unit: "set",
        unitPrice: 160
      }
    ],

    bedding: [
      {
        name: "Rice Hull",
        specification: `For ${materials.riceHull} bedding area`,
        quantity: config.riceHull,
        unit: "sacks",
        unitPrice: 100
      }
    ]
  };
}

/* Populate cost data for other sizes */

Object.keys(broilerCostConfig).forEach(sizeKey => {
  setupCostData.broiler[sizeKey] =
    buildBroilerSetupCost(sizeKey);
});

/* Calculation functions */

function calculateMaterialSubtotal(item) {
  const quantity = Number(item.quantity || 0);
  const unitPrice = Number(item.unitPrice || 0);

  return quantity * unitPrice;
}

function calculateCategoryTotal(items = []) {
  return items.reduce(
    (total, item) => total + calculateMaterialSubtotal(item),
    0
  );
}

/* Render landing page estimator */

function renderLandingCostEstimator() {
  const container =
    document.getElementById("landing-interactive-demo");

  if (!container) return;

  container.innerHTML = `
    <div class="landing-cost-demo">
      <h3>Estimated Setup Cost</h3>

      <p>
        Estimated expenses based on coop size and
        recommended chicken capacity.
      </p>

      <label for="landingCostSize">
        Coop Size
      </label>

      <select id="landingCostSize">
        <option value="1x1">1 × 1 meters</option>
        <option value="2x2">2 × 2 meters</option>
        <option value="3x3">3 × 3 meters</option>
        <option value="4x4">4 × 4 meters</option>
        <option value="5x5">5 × 5 meters</option>
      </select>

      <p id="landingCostCapacity"></p>

      <div style="overflow-x: auto;">
        <table class="landing-cost-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody id="landingCostRows"></tbody>
        </table>
      </div>

      <div class="landing-cost-result">
        <span>Total Setup Investment</span>
        <strong id="landingCostTotal">₱0</strong>
      </div>

      <small>
        These are estimated costs.
        Actual prices may vary.
      </small>
    </div>
  `;

  const select =
    document.getElementById("landingCostSize");

  select.addEventListener(
    "change",
    updateLandingCostTable
  );

  updateLandingCostTable();
}

/* Update table when size changes */

function updateLandingCostTable() {
  const sizeSelect =
    document.getElementById("landingCostSize");

  const tbody =
    document.getElementById("landingCostRows");

  const totalElement =
    document.getElementById("landingCostTotal");

  const capacityElement =
    document.getElementById("landingCostCapacity");

  if (!sizeSelect || !tbody || !totalElement) {
    return;
  }

  const sizeKey = sizeSelect.value;
  const data = setupCostData.broiler[sizeKey];

  if (!data) return;

  const capacity = coopData[sizeKey].capacity;

  if (capacityElement) {
    capacityElement.textContent =
      `Recommended Capacity: ${capacity} Broiler Chickens`;
  }

  const money = value =>
    `₱${Number(value).toLocaleString("en-PH")}`;

  const categories = [
    ["COOP CONSTRUCTION", data.construction],
    ["HARDWARE", data.hardware],
    ["EQUIPMENT", data.equipment],
    ["BEDDING", data.bedding],
    [
      "LIVESTOCK",
      [
        {
          name: "Broiler Chicks",
          specification: `Recommended capacity for ${sizeKey} coop`,
          quantity: capacity,
          unit: "chicks",
          unitPrice: chickPrice
        }
      ]
    ]
  ];

  let grandTotal = 0;
  let html = "";

  for (const [category, items] of categories) {
    const subtotal = calculateCategoryTotal(items);

    grandTotal += subtotal;

    html += `
      <tr class="landing-cost-category">
        <td colspan="4">${category}</td>
      </tr>
    `;

    for (const item of items) {
      const itemSubtotal =
        calculateMaterialSubtotal(item);

      html += `
        <tr>
          <td>
            <strong>${item.name}</strong>
            <small>${item.specification || ""}</small>
          </td>

          <td>${item.quantity} ${item.unit}</td>

          <td>${money(item.unitPrice)}</td>

          <td>
            <strong>${money(itemSubtotal)}</strong>
          </td>
        </tr>
      `;
    }

    if (category !== "LIVESTOCK") {
      html += `
        <tr class="landing-cost-subtotal">
          <td colspan="3">
            ${category} Subtotal
          </td>

          <td>
            <strong>${money(subtotal)}</strong>
          </td>
        </tr>
      `;
    }
  }

  tbody.innerHTML = html;

  totalElement.textContent = money(grandTotal);
}
