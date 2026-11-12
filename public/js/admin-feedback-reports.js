
(function () {
  "use strict";

  const API_URL = "/api/admin/reports";
  const STATUS_URL = "/api/admin/feedback";

  let reportData = null;
  let activeFilters = { from: "", to: "" };
  let isLoading = false;
  let requestId = 0;

  const charts = {
    users: null,
    ratings: null,
    categories: null
  };

  function getElement(id) {
    return document.getElementById(id);
  }

  function setReportText(id, value) {
    const element = getElement(id);
    if (element) element.textContent = value;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-PH");
  }

  function formatDate(value) {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function showNotice(message, isError = false) {
    const notice = getElement("feedbackReportNotice");
    if (!notice) return;

    notice.textContent = message;
    notice.style.color = isError ? "#c0392b" : "#2e7d32";
  }

  async function readResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      throw new Error("Server returned an unexpected response.");
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  function updatePeriodLabel() {
    const { from, to } = activeFilters;
    let label = "Showing: All Time";

    if (from && to) {
      label = `Showing: ${from} to ${to}`;
    } else if (from) {
      label = `Showing: From ${from}`;
    } else if (to) {
      label = `Showing: Until ${to}`;
    }

    setReportText("adminReportPeriod", label);
  }

  function updateSummaryCards(stats) {
    setReportText("reportTotalUsers", formatNumber(stats.totalUsers));
    setReportText("reportTotalFeedback", formatNumber(stats.totalFeedback));

    const average = Number(stats.averageRating || 0);
    setReportText("reportAverageRating", `${average.toFixed(2)} / 5`);

    const positive = Number(stats.positivePercentage || 0);
    setReportText(
      "reportPositiveFeedback",
      `${positive.toFixed(1).replace(/\.0$/, "")}%`
    );
  }

  function replaceChart(key, canvasId, config) {
    const canvas = getElement(canvasId);
    if (!canvas || typeof Chart === "undefined") return;

    if (charts[key]) {
      charts[key].destroy();
      charts[key] = null;
    }

    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    charts[key] = new Chart(canvas, config);
  }

  function renderUserGrowthChart(rows) {
    replaceChart("users", "adminReportUserChart", {
      type: "line",
      data: {
        labels: rows.map(row => row.month),
        datasets: [{
          label: "New Users",
          data: rows.map(row => Number(row.total || 0)),
          borderColor: "#4f7942",
          backgroundColor: "rgba(79, 121, 66, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  function renderRatingChart(rows) {
    const ratings = [1, 2, 3, 4, 5];

    replaceChart("ratings", "adminFeedbackRatingChart", {
      type: "bar",
      data: {
        labels: ratings.map(rating => `${rating} Star${rating > 1 ? "s" : ""}`),
        datasets: [{
          label: "Feedback",
          data: ratings.map(rating => {
            const match = rows.find(row => Number(row.rating) === rating);
            return Number(match?.total || 0);
          }),
          backgroundColor: [
            "#c65b52",
            "#d88c56",
            "#dfb85d",
            "#92aa67",
            "#4f7942"
          ],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  function renderCategoryChart(rows) {
    const categories = [
      "Bug Report",
      "Suggestion",
      "General Feedback",
      "Others"
    ];

    replaceChart("categories", "adminFeedbackCategoryChart", {
      type: "bar",
      data: {
        labels: categories,
        datasets: [{
          label: "Submissions",
          data: categories.map(category => {
            const match = rows.find(row => row.category === category);
            return Number(match?.total || 0);
          }),
          backgroundColor: [
            "#c65b52",
            "#d5a04d",
            "#4f7942",
            "#7896a5"
          ],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  function renderFeedbackTable(feedback) {
    const tableBody = getElement("adminFeedbackTableBody");
    if (!tableBody) return;

    if (!feedback.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:24px;">
            No feedback found for the selected date range.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = feedback.map(item => {
      const id = Number(item.id);
      const rating = Math.max(0, Math.min(5, Number(item.rating) || 0));
      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

      const statuses = ["New", "Reviewed", "Resolved"];

      const options = statuses.map(status => `
        <option value="${status}" ${item.status === status ? "selected" : ""}>
          ${status}
        </option>
      `).join("");

      return `
        <tr>
          <td>
            <strong>${escapeHTML(item.userName || "Unknown User")}</strong>
            <div style="font-size:12px;opacity:.7;overflow-wrap:anywhere;">
              ${escapeHTML(item.userEmail || "")}
            </div>
          </td>
          <td>
            <span style="color:#d5a04d;white-space:nowrap;">
              ${stars}
            </span>
            <div>${rating}/5</div>
          </td>
          <td>${escapeHTML(item.category)}</td>
          <td style="min-width:200px;max-width:350px;white-space:pre-wrap;overflow-wrap:anywhere;">${escapeHTML(item.message)}</td>
          <td>${escapeHTML(item.page || "N/A")}</td>
          <td style="white-space:nowrap;">${formatDate(item.createdAt)}</td>
          <td>
            <select
              class="feedback-status-select"
              data-feedback-id="${id}"
              data-current-status="${escapeHTML(item.status || "New")}"
              aria-label="Feedback status"
              style="padding:8px;border-radius:8px;border:1px solid #ddd;min-width:110px;"
            >
              ${options}
            </select>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function updateFeedbackStatus(select) {
    const feedbackId = Number(select.dataset.feedbackId);
    const previousStatus = select.dataset.currentStatus;
    const newStatus = select.value;

    if (!Number.isSafeInteger(feedbackId) || feedbackId <= 0) return;
    if (newStatus === previousStatus) return;

    select.disabled = true;
    showNotice("Updating feedback status...");

    try {
      const response = await fetch(
        `${STATUS_URL}/${feedbackId}/status`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      const result = await readResponse(response);

      select.dataset.currentStatus = newStatus;

      if (reportData && Array.isArray(reportData.feedback)) {
        const item = reportData.feedback.find(
          row => Number(row.id) === feedbackId
        );

        if (item) item.status = newStatus;
      }

      showNotice(
        result.message || `Feedback marked as ${newStatus}.`
      );
    } catch (error) {
      console.error("FEEDBACK STATUS UPDATE ERROR:", error);
      select.value = previousStatus;
      showNotice(error.message, true);
    } finally {
      select.disabled = false;
    }
  }

  async function loadFeedbackReports() {
    const currentRequest = ++requestId;

    isLoading = true;
    showNotice("");
    setReportText("adminReportPeriod", "Loading reports...");

    const tableBody = getElement("adminFeedbackTableBody");

    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">Loading feedback...</td>
        </tr>
      `;
    }

    try {
      const params = new URLSearchParams();

      if (activeFilters.from) params.set("from", activeFilters.from);
      if (activeFilters.to) params.set("to", activeFilters.to);

      const query = params.toString();
      const url = query ? `${API_URL}?${query}` : API_URL;

      const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });

      const data = await readResponse(response);

      if (currentRequest !== requestId) return;

      reportData = data;

      updateSummaryCards(data.stats || {});
      renderUserGrowthChart(data.userGrowth || []);
      renderRatingChart(data.ratingDistribution || []);
      renderCategoryChart(data.feedbackCategories || []);
      renderFeedbackTable(data.feedback || []);
      updatePeriodLabel();
    } catch (error) {
      if (currentRequest !== requestId) return;

      console.error("ADMIN FEEDBACK REPORT ERROR:", error);

      reportData = null;

      setReportText("reportTotalUsers", "—");
      setReportText("reportTotalFeedback", "—");
      setReportText("reportAverageRating", "—");
      setReportText("reportPositiveFeedback", "—");
      setReportText("adminReportPeriod", "Unable to load reports");

      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7">
              Unable to load feedback. Please try again.
            </td>
          </tr>
        `;
      }

      showNotice(error.message, true);
    } finally {
      if (currentRequest === requestId) {
        isLoading = false;
      }
    }
  }

  function applyAdminReportFilter() {
    const from = getElement("adminReportDateFrom")?.value || "";
    const to = getElement("adminReportDateTo")?.value || "";

    if (from && to && from > to) {
      showNotice("The From date cannot be later than the To date.", true);
      return;
    }

    activeFilters = { from, to };
    loadFeedbackReports();
  }

  function resetAdminReportFilter() {
    const fromInput = getElement("adminReportDateFrom");
    const toInput = getElement("adminReportDateTo");

    if (fromInput) fromInput.value = "";
    if (toInput) toInput.value = "";

    activeFilters = { from: "", to: "" };
    loadFeedbackReports();
  }

  function csvCell(value) {
    let text = String(value ?? "");

    if (/^[\s]*[=+\-@\t\r]/.test(text)) {
      text = "'" + text;
    }

    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportAdminReport(format = "CSV") {
    if (String(format).toUpperCase() !== "CSV") {
      showNotice("Only CSV export is supported.", true);
      return;
    }

    if (isLoading || !reportData) {
      showNotice("Please wait until reports finish loading.", true);
      return;
    }

    const stats = reportData.stats || {};
    const feedback = reportData.feedback || [];

    const rows = [
      ["SmartCoop Reports & Analytics"],
      ["Date From", activeFilters.from || "All Time"],
      ["Date To", activeFilters.to || "All Time"],
      [],
      ["Metric", "Value"],
      ["Total Users", stats.totalUsers || 0],
      ["Total Feedback", stats.totalFeedback || 0],
      ["Average Rating", stats.averageRating || 0],
      ["Positive Feedback Percentage", stats.positivePercentage || 0],
      [],
      ["User Registration Growth"],
      ["Month", "New Users"],
      ...(reportData.userGrowth || []).map(row => [
        row.month,
        row.total
      ]),
      [],
      ["Feedback Rating Distribution"],
      ["Rating", "Total"],
      ...(reportData.ratingDistribution || []).map(row => [
        row.rating,
        row.total
      ]),
      [],
      ["Feedback by Category"],
      ["Category", "Total"],
      ...(reportData.feedbackCategories || []).map(row => [
        row.category,
        row.total
      ]),
      [],
      ["User Feedback"],
      [
        "Feedback ID",
        "User ID",
        "User Name",
        "Email",
        "Rating",
        "Category",
        "Message",
        "Page",
        "Date",
        "Status"
      ],
      ...feedback.map(item => [
        item.id,
        item.userId,
        item.userName,
        item.userEmail,
        item.rating,
        item.category,
        item.message,
        item.page,
        formatDate(item.createdAt),
        item.status
      ])
    ];

    const csv = "\uFEFF" + rows.map(row =>
      row.map(csvCell).join(",")
    ).join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `SmartCoop_Reports_${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showNotice("CSV report exported successfully.");
  }

  document.addEventListener("change", event => {
    const select = event.target.closest(
      ".feedback-status-select"
    );

    if (select) {
      updateFeedbackStatus(select);
    }
  });

  window.loadFeedbackReports = loadFeedbackReports;
  window.applyAdminReportFilter = applyAdminReportFilter;
  window.resetAdminReportFilter = resetAdminReportFilter;
  window.exportAdminReport = exportAdminReport;
})();
