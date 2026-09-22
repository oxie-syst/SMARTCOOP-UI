let eggTrendChart = null;
let expenseChart = null;
let mortalityChart = null;
let costChart = null;

let currentReportData = null;
let currentReportIsPremium = false;

function getReportsUser() {
  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem("smartcoop_user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "Invalid stored user:",
      error
    );

    return null;
  }
}

function getReportsUserId() {
  const user =
    getReportsUser();

  if (!user) {
    return null;
  }

  return (
    user.id ||
    user.userId ||
    user.UserID ||
    null
  );
}

async function loadReportsPage() {
  const userId =
    getReportsUserId();

  if (!userId) {
    alert("Please log in first.");
    return;
  }

  const periodElement =
    document.getElementById(
      "reportPeriodFilter"
    );

  const coopElement =
    document.getElementById(
      "reportCoopFilter"
    );

  const period =
    periodElement
      ? periodElement.value
      : "all";

  const coop =
    coopElement
      ? coopElement.value
      : "all";

  try {
    const response =
      await fetch(
        `/api/reports/${userId}?period=${encodeURIComponent(
          period
        )}&coop=${encodeURIComponent(
          coop
        )}`
      );

    const data =
      await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Unable to load reports."
      );
    }

    currentReportData = data;

    currentReportIsPremium =
      Boolean(data.isPremium);

    renderReportSummary(
      data.summary || {}
    );

    updateReportCoopFilter(
      data.coops || [],
      coop
    );

    updateReportsAccess(
      currentReportIsPremium
    );

    if (currentReportIsPremium) {
      renderReportCharts(data);

      renderCoopPerformance(
        data.coopPerformance || []
      );
    } else {
      destroyReportCharts();
      clearCoopPerformance();
    }

    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (error) {
    console.error(
      "REPORT LOAD ERROR:",
      error
    );

    alert(
      error.message ||
      "Unable to load reports."
    );
  }
}

function updateReportsAccess(
  isPremium
) {
  const premiumLock =
    document.getElementById(
      "reportPremiumLock"
    );

  const premiumContent =
    document.getElementById(
      "premiumReportsContent"
    );

  const reportActions =
    document.getElementById(
      "premiumReportActions"
    );

  const premiumLabels =
    document.querySelectorAll(
      ".report-premium-mini"
    );

  if (isPremium) {
    if (premiumLock) {
      premiumLock.style.display =
        "none";
    }

    if (premiumContent) {
      premiumContent.style.display =
        "block";
    }

    if (reportActions) {
      reportActions.classList.add(
        "premium-enabled"
      );
    }

    premiumLabels.forEach(
      label => {
        label.style.display =
          "none";
      }
    );

    return;
  }

  if (premiumLock) {
    premiumLock.style.display =
      "flex";
  }

  if (premiumContent) {
    premiumContent.style.display =
      "none";
  }

  if (reportActions) {
    reportActions.classList.remove(
      "premium-enabled"
    );
  }

  premiumLabels.forEach(
    label => {
      label.style.display =
        "inline-flex";
    }
  );
}

function renderReportSummary(summary) {
  setReportText(
    "reportTotalChickens",
    formatReportNumber(
      summary.totalChickens
    )
  );

  setReportText(
    "reportTotalEggs",
    formatReportNumber(
      summary.totalEggs
    )
  );

  setReportText(
    "reportTotalMeat",
    `${formatReportNumber(
      summary.totalMeat,
      2
    )} kg`
  );

  setReportText(
    "reportTotalExpenses",
    formatReportCurrency(
      summary.totalExpenses
    )
  );

  setReportText(
    "reportMortalityRate",
    `${Number(
      summary.mortalityRate || 0
    ).toFixed(2)}%`
  );

  setReportText(
    "reportChickenLogs",
    `${Number(
      summary.chickenLogs || 0
    )} batch logs`
  );

  setReportText(
    "reportEggLogs",
    `${Number(
      summary.eggLogs || 0
    )} collection logs`
  );

  setReportText(
    "reportMeatLogs",
    `${Number(
      summary.meatLogs || 0
    )} harvest logs`
  );

  setReportText(
    "reportExpenseLogs",
    `${Number(
      summary.expenseLogs || 0
    )} transactions`
  );

  setReportText(
    "reportDeathCount",
    `${Number(
      summary.totalDeaths || 0
    )} total deaths`
  );
}

function setReportText(
  id,
  value
) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function formatReportNumber(
  value,
  decimals = 0
) {
  const number =
    Number(value || 0);

  return number.toLocaleString(
    "en-US",
    {
      minimumFractionDigits:
        decimals,
      maximumFractionDigits:
        decimals
    }
  );
}

function formatReportCurrency(
  value
) {
  const number =
    Number(value || 0);

  return `₱${number.toLocaleString(
    "en-PH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )}`;
}

function updateReportCoopFilter(
  coops,
  selectedCoop
) {
  const select =
    document.getElementById(
      "reportCoopFilter"
    );

  if (!select) {
    return;
  }

  const currentValue =
    selectedCoop ||
    select.value ||
    "all";

  select.innerHTML = `
    <option value="all">
      All Coops
    </option>
  `;

  coops.forEach(coop => {
    const option =
      document.createElement(
        "option"
      );

    option.value = coop;
    option.textContent = coop;

    select.appendChild(option);
  });

  const optionExists =
    Array.from(
      select.options
    ).some(
      option =>
        option.value ===
        currentValue
    );

  select.value =
    optionExists
      ? currentValue
      : "all";
}

function renderReportCharts(data) {
  destroyReportCharts();

  renderEggTrendChart(
    data.monthlyEggs || {}
  );

  renderExpenseChart(
    data.expenseBreakdown || {}
  );

  renderMortalityChart(
    data.monthlyMortality || {}
  );

  renderCostChart(
    data.monthlyExpenses || {}
  );
}

function renderEggTrendChart(
  monthlyEggs
) {
  const canvas =
    document.getElementById(
      "eggTrendChart"
    );

  if (!canvas) {
    return;
  }

  const labels =
    Object.keys(monthlyEggs);

  const values =
    Object.values(monthlyEggs);

  eggTrendChart =
    new Chart(
      canvas,
      {
        type: "line",

        data: {
          labels,

          datasets: [
            {
              label:
                "Eggs Collected",

              data: values,

              borderColor:
                "#16a34a",

              backgroundColor:
                "rgba(22, 163, 74, 0.12)",

              fill: true,

              tension: 0.35
            }
          ]
        },

        options: {
          responsive: true,

          maintainAspectRatio:
            false,

          plugins: {
            legend: {
              display: true
            }
          },

          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      }
    );
}

function renderExpenseChart(
  expenseBreakdown
) {
  const canvas =
    document.getElementById(
      "expenseChart"
    );

  if (!canvas) {
    return;
  }

  const labels =
    Object.keys(
      expenseBreakdown
    );

  const values =
    Object.values(
      expenseBreakdown
    );

  expenseChart =
    new Chart(
      canvas,
      {
        type: "doughnut",

        data: {
          labels,

          datasets: [
            {
              data: values,

              backgroundColor: [
                "#16a34a",
                "#22c55e",
                "#4ade80",
                "#86efac",
                "#15803d",
                "#166534",
                "#bbf7d0"
              ]
            }
          ]
        },

        options: {
          responsive: true,

          maintainAspectRatio:
            false
        }
      }
    );
}

function renderMortalityChart(
  monthlyMortality
) {
  const canvas =
    document.getElementById(
      "mortalityChart"
    );

  if (!canvas) {
    return;
  }

  const labels =
    Object.keys(
      monthlyMortality
    );

  const values =
    Object.values(
      monthlyMortality
    );

  mortalityChart =
    new Chart(
      canvas,
      {
        type: "bar",

        data: {
          labels,

          datasets: [
            {
              label:
                "Chicken Deaths",

              data: values,

              backgroundColor:
                "#ef4444"
            }
          ]
        },

        options: {
          responsive: true,

          maintainAspectRatio:
            false,

          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      }
    );
}

function renderCostChart(
  monthlyExpenses
) {
  const canvas =
    document.getElementById(
      "costChart"
    );

  if (!canvas) {
    return;
  }

  const labels =
    Object.keys(
      monthlyExpenses
    );

  const values =
    Object.values(
      monthlyExpenses
    );

  costChart =
    new Chart(
      canvas,
      {
        type: "line",

        data: {
          labels,

          datasets: [
            {
              label:
                "Total Expenses",

              data: values,

              borderColor:
                "#2563eb",

              backgroundColor:
                "rgba(37, 99, 235, 0.10)",

              fill: true,

              tension: 0.35
            }
          ]
        },

        options: {
          responsive: true,

          maintainAspectRatio:
            false,

          scales: {
            y: {
              beginAtZero: true,

              ticks: {
                callback:
                  function(value) {
                    return `₱${value}`;
                  }
              }
            }
          }
        }
      }
    );
}

function destroyReportCharts() {
  if (eggTrendChart) {
    eggTrendChart.destroy();
    eggTrendChart = null;
  }

  if (expenseChart) {
    expenseChart.destroy();
    expenseChart = null;
  }

  if (mortalityChart) {
    mortalityChart.destroy();
    mortalityChart = null;
  }

  if (costChart) {
    costChart.destroy();
    costChart = null;
  }
}

function renderCoopPerformance(
  records
) {
  const body =
    document.getElementById(
      "coopPerformanceBody"
    );

  if (!body) {
    return;
  }

  if (
    !Array.isArray(records) ||
    records.length === 0
  ) {
    body.innerHTML = `
      <tr>
        <td colspan="7">
          No coop performance data available.
        </td>
      </tr>
    `;

    return;
  }

  body.innerHTML =
    records.map(record => {

      const coopName =
        escapeReportHTML(
          record.coopName ||
          "Unnamed Coop"
        );

      const type =
        escapeReportHTML(
          record.type ||
          "N/A"
        );

      const status =
        escapeReportHTML(
          record.status ||
          "N/A"
        );

      return `
        <tr>

          <td>
            ${coopName}
          </td>

          <td>
            ${formatReportNumber(
              record.chickens
            )}
          </td>

          <td>
            ${type}
          </td>

          <td>
            ${status}
          </td>

          <td>
            ${formatReportNumber(
              record.eggs
            )}
          </td>

          <td>
            ${formatReportCurrency(
              record.expenses
            )}
          </td>

          <td>

            <button
              type="button"
              onclick="viewCoopReport(
                '${encodeURIComponent(
                  record.coopName ||
                  ""
                )}'
              )"
            >
              View
            </button>

          </td>

        </tr>
      `;
    }).join("");
}

function clearCoopPerformance() {
  const body =
    document.getElementById(
      "coopPerformanceBody"
    );

  if (!body) {
    return;
  }

  body.innerHTML = `
    <tr>
      <td colspan="7">
        Premium feature
      </td>
    </tr>
  `;
}

function viewCoopReport(
  encodedCoopName
) {
  if (!currentReportIsPremium) {
    window.location.href =
      "subscription.html";

    return;
  }

  const coopName =
    decodeURIComponent(
      encodedCoopName
    );

  const coopFilter =
    document.getElementById(
      "reportCoopFilter"
    );

  if (!coopFilter) {
    return;
  }

  coopFilter.value =
    coopName;

  loadReportsPage();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function exportReport(
  type
) {
  if (!currentReportIsPremium) {
    window.location.href =
      "subscription.html";

    return;
  }

  if (type === "pdf") {
    window.print();
    return;
  }

  if (type === "csv") {
    await exportReportCSV();
  }
}

async function exportReportCSV() {
  if (!currentReportIsPremium) {
    window.location.href =
      "subscription.html";

    return;
  }

  const userId =
    getReportsUserId();

  if (!userId) {
    alert("Please log in first.");
    return;
  }

  const period =
    document.getElementById(
      "reportPeriodFilter"
    )?.value || "all";

  const coop =
    document.getElementById(
      "reportCoopFilter"
    )?.value || "all";

  try {
    const response =
      await fetch(
        `/api/reports/${userId}?period=${encodeURIComponent(
          period
        )}&coop=${encodeURIComponent(
          coop
        )}`
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "Unable to export report."
      );
    }

    if (!data.isPremium) {
      currentReportIsPremium =
        false;

      window.location.href =
        "subscription.html";

      return;
    }

    const rows = [
      [
        "SmartCoop Reports & Analytics"
      ],

      [],

      [
        "Metric",
        "Value"
      ],

      [
        "Total Chickens",
        data.summary
          .totalChickens
      ],

      [
        "Eggs Collected",
        data.summary
          .totalEggs
      ],

      [
        "Meat Production (kg)",
        data.summary
          .totalMeat
      ],

      [
        "Total Expenses",
        data.summary
          .totalExpenses
      ],

      [
        "Total Deaths",
        data.summary
          .totalDeaths
      ],

      [
        "Mortality Rate",
        `${Number(
          data.summary
            .mortalityRate ||
          0
        ).toFixed(2)}%`
      ],

      [],

      [
        "Coop Performance"
      ],

      [
        "Coop Name",
        "Chickens",
        "Type",
        "Status",
        "Eggs Collected",
        "Total Expenses"
      ]
    ];

    (
      data.coopPerformance ||
      []
    ).forEach(record => {
      rows.push([
        record.coopName,
        record.chickens,
        record.type,
        record.status,
        record.eggs,
        record.expenses
      ]);
    });

    const csv =
      rows.map(row =>
        row.map(value =>
          escapeCSVValue(value)
        ).join(",")
      ).join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `smartcoop-report-${Date.now()}.csv`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

  } catch (error) {
    console.error(
      "REPORT EXPORT ERROR:",
      error
    );

    alert(
      error.message ||
      "Unable to export report."
    );
  }
}

function escapeCSVValue(value) {
  const stringValue =
    String(
      value ?? ""
    );

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(
      /"/g,
      '""'
    )}"`;
  }

  return stringValue;
}

function escapeReportHTML(value) {
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