(() => {
  const records = [
    { month: "May", coop: "Layer Coop", type: "Layer", chickens: 50, eggs: 980, meat: 0, expenses: 3800, deaths: 1, chickenLogs: 1, eggLogs: 12, meatLogs: 0, expenseLogs: 6 },
    { month: "Jun", coop: "Layer Coop", type: "Layer", chickens: 49, eggs: 1050, meat: 0, expenses: 4200, deaths: 0, chickenLogs: 0, eggLogs: 14, meatLogs: 0, expenseLogs: 5 },
    { month: "Jul", coop: "Layer Coop", type: "Layer", chickens: 49, eggs: 1100, meat: 0, expenses: 4000, deaths: 1, chickenLogs: 0, eggLogs: 15, meatLogs: 0, expenseLogs: 6 },
    { month: "Aug", coop: "Layer Coop", type: "Layer", chickens: 48, eggs: 1030, meat: 0, expenses: 4300, deaths: 0, chickenLogs: 0, eggLogs: 13, meatLogs: 0, expenseLogs: 5 },
    { month: "Sep", coop: "Layer Coop", type: "Layer", chickens: 48, eggs: 1080, meat: 0, expenses: 4100, deaths: 0, chickenLogs: 0, eggLogs: 14, meatLogs: 0, expenseLogs: 6 },
    { month: "Oct", coop: "Layer Coop", type: "Layer", chickens: 48, eggs: 1120, meat: 0, expenses: 4500, deaths: 0, chickenLogs: 0, eggLogs: 15, meatLogs: 0, expenseLogs: 7 },

    { month: "May", coop: "Broiler Coop", type: "Broiler", chickens: 80, eggs: 0, meat: 0, expenses: 7000, deaths: 2, chickenLogs: 1, eggLogs: 0, meatLogs: 0, expenseLogs: 5 },
    { month: "Jun", coop: "Broiler Coop", type: "Broiler", chickens: 78, eggs: 0, meat: 140, expenses: 6800, deaths: 1, chickenLogs: 1, eggLogs: 0, meatLogs: 1, expenseLogs: 6 },
    { month: "Jul", coop: "Broiler Coop", type: "Broiler", chickens: 90, eggs: 0, meat: 0, expenses: 7500, deaths: 1, chickenLogs: 1, eggLogs: 0, meatLogs: 0, expenseLogs: 6 },
    { month: "Aug", coop: "Broiler Coop", type: "Broiler", chickens: 89, eggs: 0, meat: 155, expenses: 7200, deaths: 2, chickenLogs: 1, eggLogs: 0, meatLogs: 1, expenseLogs: 6 },
    { month: "Sep", coop: "Broiler Coop", type: "Broiler", chickens: 100, eggs: 0, meat: 0, expenses: 8000, deaths: 1, chickenLogs: 1, eggLogs: 0, meatLogs: 0, expenseLogs: 7 },
    { month: "Oct", coop: "Broiler Coop", type: "Broiler", chickens: 99, eggs: 0, meat: 175, expenses: 7800, deaths: 1, chickenLogs: 1, eggLogs: 0, meatLogs: 1, expenseLogs: 6 }
  ];

  const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const charts = [];

  const money = n => "₱" + n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const sum = (rows, key) =>
    rows.reduce((total, row) => total + Number(row[key] || 0), 0);

  function destroyCharts() {
    charts.forEach(chart => chart.destroy());
    charts.length = 0;
  }

  function createChart(id, type, labels, values, label, color) {
    if (typeof Chart === "undefined") return;

    const canvas = document.getElementById(id);
    if (!canvas) return;

    charts.push(new Chart(canvas, {
      type,
      data: {
        labels,
        datasets: [{
          label,
          data: values,
          borderColor: color,
          backgroundColor: type === "doughnut"
            ? ["#16a34a", "#22c55e", "#86efac", "#166534"]
            : color,
          tension: 0.35,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: type === "doughnut" }
        },
        scales: type === "doughnut"
          ? {}
          : { y: { beginAtZero: true } }
      }
    }));
  }

  function updateDemo() {
    const container = document.getElementById("landing-interactive-demo");
    if (!container) return;

    const period = container.querySelector("#lrPeriod").value;
    const coop = container.querySelector("#lrCoop").value;

    const selectedMonths =
      period === "3" ? months.slice(-3) :
      period === "1" ? months.slice(-1) :
      months;

    const filtered = records.filter(row =>
      selectedMonths.includes(row.month) &&
      (coop === "all" || row.coop === coop)
    );

    const totalEggs = sum(filtered, "eggs");
    const totalMeat = sum(filtered, "meat");
    const expenses = sum(filtered, "expenses");
    const deaths = sum(filtered, "deaths");

    // Latest available chicken count per selected coop.
    const coopNames = [...new Set(filtered.map(row => row.coop))];
    const chickens = coopNames.reduce((total, name) => {
      const coopRows = filtered.filter(row => row.coop === name);
      return total + (coopRows.at(-1)?.chickens || 0);
    }, 0);

    const startingChickens = coopNames.reduce((total, name) => {
      const coopRows = filtered.filter(row => row.coop === name);
      return total + (coopRows[0]?.chickens || 0);
    }, 0);

    // Illustrative demo estimate, not the production backend formula.
    const mortalityRate = startingChickens > 0
      ? (deaths / startingChickens * 100).toFixed(2)
      : "0.00";

    const stats = [
      ["🐔", "Total Chickens", chickens.toLocaleString()],
      ["🥚", "Eggs Collected", totalEggs.toLocaleString()],
      ["🍗", "Meat Production", totalMeat.toFixed(2) + " kg"],
      ["💰", "Total Expenses", money(expenses)],
      ["📉", "Mortality Rate", mortalityRate + "%"],
      ["📋", "Chicken Logs", sum(filtered, "chickenLogs") + " batch logs"],
      ["🥚", "Egg Logs", sum(filtered, "eggLogs") + " collection logs"],
      ["🍗", "Meat Logs", sum(filtered, "meatLogs") + " harvest logs"],
      ["🧾", "Expense Logs", sum(filtered, "expenseLogs") + " transactions"],
      ["⚠️", "Total Deaths", deaths + " total deaths"]
    ];

    container.querySelector("#lrStats").innerHTML =
      stats.map(([icon, label, value]) => `
        <div class="lr-stat">
          <span>${icon} ${label}</span>
          <strong>${value}</strong>
        </div>
      `).join("");

    const performance = coopNames.map(name => {
      const rows = filtered.filter(row => row.coop === name);
      const latest = rows.at(-1);

      return `
        <tr>
          <td>${name}</td>
          <td>${latest.chickens}</td>
          <td>${latest.type}</td>
          <td><span class="lr-active">Active</span></td>
          <td>${sum(rows, "eggs").toLocaleString()}</td>
          <td>${money(sum(rows, "expenses"))}</td>
        </tr>
      `;
    }).join("");

    container.querySelector("#lrPerformance").innerHTML =
      performance || `<tr><td colspan="6">No data available</td></tr>`;

    destroyCharts();

    const values = key => selectedMonths.map(month =>
      sum(filtered.filter(row => row.month === month), key)
    );

    createChart("lrEggChart", "line", selectedMonths,
      values("eggs"), "Eggs Collected", "#16a34a");

    createChart("lrMortalityChart", "bar", selectedMonths,
      values("deaths"), "Chicken Deaths", "#ef4444");

    createChart("lrCostChart", "line", selectedMonths,
      values("expenses"), "Total Expenses", "#2563eb");

    // Illustrative expense categories; not from actual expense records.
    const categoryTotals = [
      expenses * 0.55,
      expenses * 0.25,
      expenses * 0.15,
      expenses * 0.05
    ];

    createChart("lrExpenseChart", "doughnut",
      ["Feed", "Supplies", "Maintenance", "Other"],
      categoryTotals, "Expenses", "#16a34a");
  }

  window.renderLandingReports = function () {
    const container = document.getElementById("landing-interactive-demo");
    if (!container) return;

    destroyCharts();
    container.style.display = "block";

    container.innerHTML = `
      <section class="landing-reports-demo">
        <div class="lr-heading">
          <div>
            <h3>📊 Reports & Analytics</h3>
            <p>Explore poultry farm performance using sample records.</p>
          </div>
          <span class="lr-demo-badge">DEMO MODE</span>
        </div>

        <div class="lr-filters">
          <label>
            Report Period
            <select id="lrPeriod">
              <option value="all">All Sample Months</option>
              <option value="3">Last 3 Sample Months</option>
              <option value="1">Last Sample Month</option>
            </select>
          </label>

          <label>
            Select Coop
            <select id="lrCoop">
              <option value="all">All Coops</option>
              <option value="Layer Coop">Layer Coop</option>
              <option value="Broiler Coop">Broiler Coop</option>
            </select>
          </label>
        </div>

        <h4>Farm Summary</h4>
        <div class="lr-stats" id="lrStats"></div>

        <div class="lr-premium-note">
          <strong>⭐ Premium Feature Preview</strong>
          <p>
            Charts, coop performance, and PDF/CSV exports
            require Premium in the actual SmartCoop system.
          </p>
        </div>

        <h4>Production & Financial Analytics</h4>

        <div class="lr-chart-grid">
          <div class="lr-chart-box">
            <h5>Egg Collection Trend</h5>
            <div class="lr-chart-area"><canvas id="lrEggChart"></canvas></div>
          </div>

          <div class="lr-chart-box">
            <h5>Expense Breakdown</h5>
            <div class="lr-chart-area"><canvas id="lrExpenseChart"></canvas></div>
          </div>

          <div class="lr-chart-box">
            <h5>Mortality Trend</h5>
            <div class="lr-chart-area"><canvas id="lrMortalityChart"></canvas></div>
          </div>

          <div class="lr-chart-box">
            <h5>Monthly Expenses</h5>
            <div class="lr-chart-area"><canvas id="lrCostChart"></canvas></div>
          </div>
        </div>

        <h4>Coop Performance</h4>
        <div class="lr-table-wrap">
          <table class="lr-table">
            <thead>
              <tr>
                <th>Coop</th>
                <th>Chickens</th>
                <th>Type</th>
                <th>Status</th>
                <th>Eggs</th>
                <th>Expenses</th>
              </tr>
            </thead>
            <tbody id="lrPerformance"></tbody>
          </table>
        </div>

        <p class="lr-footer-note">
          Sample data only. The actual Reports & Analytics
          page uses your saved farm records and account access level.
        </p>
      </section>
    `;

    container.querySelector("#lrPeriod")
      .addEventListener("change", updateDemo);

    container.querySelector("#lrCoop")
      .addEventListener("change", updateDemo);

    updateDemo();
  };
})();
