let alertsData = [];
let activeAlertFilter = "all";
let alertEditingId = null;

function getCurrentAlertUser() {
  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem("smartcoop_user");

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    return null;
  }
}

function getCurrentAlertUserId() {
  const user = getCurrentAlertUser();

  if (!user) return null;

  return (
    user.UserID ||
    user.userId ||
    user.id ||
    null
  );
}

function getReminderIcon(category) {
  const icons = {
    feeding: "wheat",
    vaccination: "syringe",
    weather: "cloud-sun",
    health: "heart-pulse",
    cleaning: "sparkles",
    maintenance: "wrench",
    production: "package-check",
    other: "bell"
  };

  return icons[category] || "bell";
}

function formatReminderDate(dateValue) {
  if (!dateValue) return "-";

  const cleanDate =
    String(dateValue).slice(0, 10);

  const date =
    new Date(`${cleanDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatReminderTime(timeValue) {
  if (!timeValue) return "-";

  const parts =
    String(timeValue).split(":");

  let hours = Number(parts[0]);
  const minutes = parts[1] || "00";

  const period =
    hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${period}`;
}

function getAlertStatus(alert) {
  if (
    alert.isCompleted ||
    alert.status === "completed"
  ) {
    return "completed";
  }

  const reminderDate =
    String(
      alert.reminderDate ||
      alert.date ||
      ""
    ).slice(0, 10);

  const reminderTime =
    alert.reminderTime ||
    alert.time ||
    "00:00:00";

  const dueDate =
    new Date(
      `${reminderDate}T${reminderTime}`
    );

  if (
    !Number.isNaN(dueDate.getTime()) &&
    dueDate < new Date()
  ) {
    return "overdue";
  }

  return "upcoming";
}

async function loadAlertsPage() {
  const list =
    document.getElementById("alertsList");

  if (!list) return;

  const userId =
    getCurrentAlertUserId();

  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/api/alerts/user/${userId}`
    );

    const result =
      await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
        "Failed to load reminders."
      );
    }

    alertsData =
      Array.isArray(result.alerts)
        ? result.alerts
        : [];

    updateAlertStatistics();
    renderAlerts();

  } catch (error) {
    console.error(
      "Load Alerts Error:",
      error
    );

    alertsData = [];

    updateAlertStatistics();
    renderAlerts();

    alert("Unable to load reminders.");
  }
}

function updateAlertStatistics() {
  const upcoming =
    alertsData.filter(
      alert =>
        getAlertStatus(alert) ===
        "upcoming"
    ).length;

  const completed =
    alertsData.filter(
      alert =>
        getAlertStatus(alert) ===
        "completed"
    ).length;

  const overdue =
    alertsData.filter(
      alert =>
        getAlertStatus(alert) ===
        "overdue"
    ).length;

  const highPriority =
    alertsData.filter(
      alert =>
        alert.priority === "high" &&
        getAlertStatus(alert) !==
        "completed"
    ).length;

  setAlertText(
    "upcomingCount",
    upcoming
  );

  setAlertText(
    "completedCount",
    completed
  );

  setAlertText(
    "highPriorityCount",
    highPriority
  );

  setAlertText(
    "overdueCount",
    overdue
  );

  const tabButtons =
    document.querySelectorAll(
      ".alerts-tabs button"
    );

  tabButtons.forEach(button => {
    const filter =
      button.dataset.filter;

    const label =
      button.querySelector("span");

    if (!label) return;

    if (filter === "all") {
      label.textContent =
        `All (${alertsData.length})`;
    }

    if (filter === "upcoming") {
      label.textContent =
        `Upcoming (${upcoming})`;
    }

    if (filter === "completed") {
      label.textContent =
        `Completed (${completed})`;
    }

    if (filter === "overdue") {
      label.textContent =
        `Overdue (${overdue})`;
    }
  });

  updateNotificationIndicator(
    upcoming + overdue
  );
}

function updateNotificationIndicator(count) {
  const notificationBadge =
    document.querySelector(".notif");

  if (!notificationBadge) return;

  notificationBadge.style.display =
    count > 0
      ? "block"
      : "none";
}

function renderAlerts() {
  const list =
    document.getElementById("alertsList");

  const emptyState =
    document.getElementById(
      "alertsEmptyState"
    );

  if (!list) return;

  let filteredAlerts =
    [...alertsData];

  if (
    activeAlertFilter !== "all"
  ) {
    filteredAlerts =
      filteredAlerts.filter(
        alert =>
          getAlertStatus(alert) ===
          activeAlertFilter
      );
  }

  const sortSelect =
    document.getElementById(
      "reminderSort"
    );

  const sortValue =
    sortSelect
      ? sortSelect.value
      : "date";

  if (sortValue === "priority") {
    const priorityOrder = {
      high: 1,
      medium: 2,
      low: 3
    };

    filteredAlerts.sort(
      (a, b) =>
        (priorityOrder[a.priority] || 4) -
        (priorityOrder[b.priority] || 4)
    );
  }

  if (sortValue === "newest") {
    filteredAlerts.sort(
      (a, b) =>
        new Date(
          b.createdAt || 0
        ) -
        new Date(
          a.createdAt || 0
        )
    );
  }

  if (sortValue === "date") {
    filteredAlerts.sort(
      (a, b) => {
        const dateA =
          new Date(
            `${String(
              a.reminderDate
            ).slice(0, 10)}T${
              a.reminderTime
            }`
          );

        const dateB =
          new Date(
            `${String(
              b.reminderDate
            ).slice(0, 10)}T${
              b.reminderTime
            }`
          );

        return dateA - dateB;
      }
    );
  }

  if (
    filteredAlerts.length === 0
  ) {
    list.innerHTML = "";

    if (emptyState) {
      emptyState.style.display =
        "flex";
    }

    if (window.lucide) {
      lucide.createIcons();
    }

    return;
  }

  if (emptyState) {
    emptyState.style.display =
      "none";
  }

  list.innerHTML =
    filteredAlerts
      .map(alert => {
        const status =
          getAlertStatus(alert);

        const title =
          escapeAlertHTML(
            alert.title ||
            "Reminder"
          );

        const description =
          escapeAlertHTML(
            alert.description ||
            "No description provided."
          );

        const category =
          escapeAlertHTML(
            alert.category ||
            "general"
          );

        const priority =
          escapeAlertHTML(
            alert.priority ||
            "medium"
          );

        return `
          <article
            class="reminder-item ${status}">

            <div class="reminder-icon">
              <i
                data-lucide="${getReminderIcon(
                  alert.category
                )}">
              </i>
            </div>

            <div class="reminder-main">

              <div class="reminder-top">

                <div class="reminder-copy">
                  <h3>${title}</h3>
                  <p>${description}</p>
                </div>

                <div class="reminder-tags">

                  <span
                    class="priority-tag ${priority}">
                    ${priority}
                  </span>

                  <span class="category-tag">
                    ${category}
                  </span>

                  <span
                    class="status-tag ${status}">
                    ${status}
                  </span>

                </div>

              </div>

              <div class="reminder-meta">

                <span>
                  <i data-lucide="calendar-days"></i>

                  ${formatReminderDate(
                    alert.reminderDate
                  )}
                </span>

                <span>
                  <i data-lucide="clock"></i>

                  ${formatReminderTime(
                    alert.reminderTime
                  )}
                </span>

              </div>

              <div class="reminder-actions">

                ${
                  status !== "completed"
                    ? `
                      <button
                        type="button"
                        class="complete-btn"
                        onclick="completeReminder(${alert.id})">

                        <i data-lucide="check"></i>
                        <span>Mark Complete</span>

                      </button>
                    `
                    : `
                      <button
                        type="button"
                        class="complete-btn"
                        onclick="restoreReminder(${alert.id})">

                        <i data-lucide="rotate-ccw"></i>
                        <span>Restore</span>

                      </button>
                    `
                }

                <button
                  type="button"
                  class="edit-reminder-btn"
                  onclick="editReminder(${alert.id})">

                  <i data-lucide="pencil"></i>
                  <span>Edit</span>

                </button>

                <button
                  type="button"
                  class="delete-btn"
                  onclick="deleteReminder(${alert.id})">

                  <i data-lucide="trash-2"></i>
                  <span>Delete</span>

                </button>

              </div>

            </div>

          </article>
        `;
      })
      .join("");

  if (window.lucide) {
    lucide.createIcons();
  }
}

async function loadDashboardAlerts() {
  const container =
    document.getElementById(
      "alertsContainer"
    );

  const badge =
    document.getElementById(
      "alertBadgePanel"
    );

  if (!container) return;

  const userId =
    getCurrentAlertUserId();

  if (!userId) return;

  try {
    const response = await fetch(
      `http://localhost:3000/api/alerts/user/${userId}`
    );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
        "Failed to load dashboard reminders."
      );
    }

    const allAlerts =
      Array.isArray(result.alerts)
        ? result.alerts
        : [];

    const activeAlerts =
      allAlerts.filter(alert => {
        const status =
          getAlertStatus(alert);

        return (
          status === "upcoming" ||
          status === "overdue"
        );
      });

    activeAlerts.sort((a, b) => {
      const dateA =
        new Date(
          `${String(
            a.reminderDate
          ).slice(0, 10)}T${
            a.reminderTime
          }`
        );

      const dateB =
        new Date(
          `${String(
            b.reminderDate
          ).slice(0, 10)}T${
            b.reminderTime
          }`
        );

      return dateA - dateB;
    });

    if (badge) {
      badge.textContent =
        activeAlerts.length;
    }

    updateNotificationIndicator(
      activeAlerts.length
    );

    if (
      activeAlerts.length === 0
    ) {
      container.innerHTML = `
        <div class="dashboard-alert-empty">

          <i data-lucide="circle-check-big"></i>

          <p>
            No upcoming reminders.
            You're all caught up!
          </p>

        </div>
      `;

      if (window.lucide) {
        lucide.createIcons();
      }

      return;
    }

    const dashboardAlerts =
      activeAlerts.slice(0, 3);

    container.innerHTML =
      dashboardAlerts
        .map(alert => {
          const status =
            getAlertStatus(alert);

          const title =
            escapeAlertHTML(
              alert.title ||
              "Reminder"
            );

          const category =
            escapeAlertHTML(
              alert.category ||
              "general"
            );

          const priority =
            escapeAlertHTML(
              alert.priority ||
              "medium"
            );

          return `
            <div
              class="dashboard-alert-item ${status}">

              <div
                class="dashboard-alert-icon">

                <i
                  data-lucide="${getReminderIcon(
                    alert.category
                  )}">
                </i>

              </div>

              <div
                class="dashboard-alert-content">

                <div
                  class="dashboard-alert-top">

                  <strong>
                    ${title}
                  </strong>

                  <span
                    class="dashboard-alert-priority ${priority}">
                    ${priority}
                  </span>

                </div>

                <div
                  class="dashboard-alert-meta">

                  <span>
                    <i data-lucide="calendar-days"></i>

                    ${formatReminderDate(
                      alert.reminderDate
                    )}
                  </span>

                  <span>
                    <i data-lucide="clock"></i>

                    ${formatReminderTime(
                      alert.reminderTime
                    )}
                  </span>

                </div>

                <small
                  class="dashboard-alert-category">

                  ${category}

                  ${
                    status === "overdue"
                      ? " • Overdue"
                      : ""
                  }

                </small>

              </div>

            </div>
          `;
        })
        .join("");

    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (error) {
    console.error(
      "Dashboard Alerts Error:",
      error
    );

    if (badge) {
      badge.textContent = "0";
    }

    container.innerHTML = `
      <div class="dashboard-alert-empty">
        <p>
          Unable to load reminders.
        </p>
      </div>
    `;
  }
}

function toggleNotificationMenu() {
  const dropdown =
    document.getElementById(
      "notificationDropdown"
    );

  if (!dropdown) return;

  dropdown.classList.toggle(
    "hidden"
  );

  if (
    !dropdown.classList.contains(
      "hidden"
    )
  ) {
    loadNotificationDropdown();
  }
}

async function loadNotificationDropdown() {
  const list =
    document.getElementById(
      "notificationDropdownList"
    );

  const count =
    document.getElementById(
      "notificationCount"
    );

  if (!list) return;

  const userId =
    getCurrentAlertUserId();

  if (!userId) return;

  list.innerHTML = `
    <div class="notification-loading">
      Loading notifications...
    </div>
  `;

  try {
    const response = await fetch(
      `http://localhost:3000/api/alerts/user/${userId}`
    );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
        "Unable to load notifications."
      );
    }

    const notifications =
      (Array.isArray(result.alerts)
        ? result.alerts
        : [])
        .filter(alert => {
          const status =
            getAlertStatus(alert);

          return (
            status === "upcoming" ||
            status === "overdue"
          );
        })
        .sort((a, b) => {
          const dateA =
            new Date(
              `${String(
                a.reminderDate
              ).slice(0, 10)}T${
                a.reminderTime
              }`
            );

          const dateB =
            new Date(
              `${String(
                b.reminderDate
              ).slice(0, 10)}T${
                b.reminderTime
              }`
            );

          return dateA - dateB;
        });

    if (count) {
      count.textContent =
        `${notifications.length} active`;
    }

    updateNotificationIndicator(
      notifications.length
    );

    if (
      notifications.length === 0
    ) {
      list.innerHTML = `
        <div class="notification-empty">

          <i data-lucide="bell-off"></i>

          <p>
            No new notifications
          </p>

        </div>
      `;

      if (window.lucide) {
        lucide.createIcons();
      }

      return;
    }

    list.innerHTML =
      notifications
        .slice(0, 5)
        .map(alert => {
          const status =
            getAlertStatus(alert);

          return `
            <div
              class="notification-item ${status}">

              <div
                class="notification-item-icon">

                <i
                  data-lucide="${getReminderIcon(
                    alert.category
                  )}">
                </i>

              </div>

              <div
                class="notification-item-content">

                <strong>
                  ${escapeAlertHTML(
                    alert.title ||
                    "Reminder"
                  )}
                </strong>

                <span>
                  ${formatReminderDate(
                    alert.reminderDate
                  )}

                  •

                  ${formatReminderTime(
                    alert.reminderTime
                  )}
                </span>

                ${
                  status === "overdue"
                    ? `
                      <small
                        class="notification-overdue">
                        Overdue
                      </small>
                    `
                    : ""
                }

              </div>

            </div>
          `;
        })
        .join("");

    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (error) {
    console.error(
      "Notification Error:",
      error
    );

    list.innerHTML = `
      <div class="notification-empty">
        Unable to load notifications.
      </div>
    `;
  }
}

function openReminderModal() {
  alertEditingId = null;

  const modal =
    document.getElementById(
      "reminderModal"
    );

  if (!modal) return;

  clearReminderForm();

  const title =
    modal.querySelector("h2");

  const submitButton =
    document.querySelector(
      ".reminder-save-btn"
    );

  if (title) {
    title.textContent =
      "Add New Reminder";
  }

  if (submitButton) {
    submitButton.innerHTML =
      "Add Reminder";
  }

  modal.classList.remove(
    "hidden"
  );
}

function closeReminderModal() {
  const modal =
    document.getElementById(
      "reminderModal"
    );

  if (!modal) return;

  modal.classList.add(
    "hidden"
  );

  alertEditingId = null;

  clearReminderForm();
}

function clearReminderForm() {
  const title =
    document.getElementById(
      "reminderTitle"
    );

  const description =
    document.getElementById(
      "reminderDesc"
    );

  const category =
    document.getElementById(
      "reminderCategory"
    );

  const priority =
    document.getElementById(
      "reminderPriority"
    );

  const date =
    document.getElementById(
      "reminderDate"
    );

  const time =
    document.getElementById(
      "reminderTime"
    );

  if (title) title.value = "";
  if (description) description.value = "";
  if (category) category.value = "feeding";
  if (priority) priority.value = "medium";
  if (date) date.value = "";
  if (time) time.value = "";
}

async function addReminder() {
  const userId =
    getCurrentAlertUserId();

  if (!userId) {
    alert("Please sign in again.");
    return;
  }

  const title =
    document.getElementById(
      "reminderTitle"
    )?.value.trim();

  const description =
    document.getElementById(
      "reminderDesc"
    )?.value.trim();

  const category =
    document.getElementById(
      "reminderCategory"
    )?.value;

  const priority =
    document.getElementById(
      "reminderPriority"
    )?.value;

  const reminderDate =
    document.getElementById(
      "reminderDate"
    )?.value;

  const reminderTime =
    document.getElementById(
      "reminderTime"
    )?.value;

  if (
    !title ||
    !reminderDate ||
    !reminderTime
  ) {
    alert(
      "Please fill in the title, date, and time."
    );
    return;
  }

  const payload = {
    userId,
    title,
    description,
    category,
    priority,
    reminderDate,
    reminderTime
  };

  try {
    let url =
      "http://localhost:3000/api/alerts";

    let method = "POST";

    if (alertEditingId) {
      url += `/${alertEditingId}`;
      method = "PUT";
    }

    const response = await fetch(
      url,
      {
        method,

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify(
          payload
        )
      }
    );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
        "Failed to save reminder."
      );
    }

    closeReminderModal();

    await loadAlertsPage();

  } catch (error) {
    console.error(
      "Save Reminder Error:",
      error
    );

    alert(
      error.message ||
      "Failed to save reminder."
    );
  }
}

function editReminder(id) {
  const alertItem =
    alertsData.find(
      alert =>
        Number(alert.id) ===
        Number(id)
    );

  if (!alertItem) return;

  alertEditingId = id;

  const modal =
    document.getElementById(
      "reminderModal"
    );

  if (!modal) return;

  document.getElementById(
    "reminderTitle"
  ).value =
    alertItem.title || "";

  document.getElementById(
    "reminderDesc"
  ).value =
    alertItem.description || "";

  document.getElementById(
    "reminderCategory"
  ).value =
    alertItem.category ||
    "feeding";

  document.getElementById(
    "reminderPriority"
  ).value =
    alertItem.priority ||
    "medium";

  document.getElementById(
    "reminderDate"
  ).value =
    String(
      alertItem.reminderDate || ""
    ).slice(0, 10);

  document.getElementById(
    "reminderTime"
  ).value =
    String(
      alertItem.reminderTime || ""
    ).slice(0, 5);

  const title =
    modal.querySelector("h2");

  const submitButton =
    document.querySelector(
      ".reminder-save-btn"
    );

  if (title) {
    title.textContent =
      "Edit Reminder";
  }

  if (submitButton) {
    submitButton.textContent =
      "Save Changes";
  }

  modal.classList.remove(
    "hidden"
  );
}

async function completeReminder(id) {
  await updateReminderCompletion(
    id,
    true
  );
}

async function restoreReminder(id) {
  await updateReminderCompletion(
    id,
    false
  );
}

async function updateReminderCompletion(
  id,
  isCompleted
) {
  const userId =
    getCurrentAlertUserId();

  if (!userId) return;

  try {
    const response = await fetch(
      `http://localhost:3000/api/alerts/${id}/complete`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          userId,
          isCompleted
        })
      }
    );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
        "Failed to update reminder."
      );
    }

    await loadAlertsPage();

  } catch (error) {
    console.error(
      "Complete Reminder Error:",
      error
    );

    alert(
      error.message ||
      "Failed to update reminder."
    );
  }
}

async function deleteReminder(id) {
  const userId =
    getCurrentAlertUserId();

  if (!userId) return;

  const confirmed =
    confirm(
      "Are you sure you want to delete this reminder?"
    );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `http://localhost:3000/api/alerts/${id}?userId=${userId}`,
      {
        method: "DELETE"
      }
    );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
        "Failed to delete reminder."
      );
    }

    await loadAlertsPage();

  } catch (error) {
    console.error(
      "Delete Reminder Error:",
      error
    );

    alert(
      error.message ||
      "Failed to delete reminder."
    );
  }
}

function setupAlertFilters() {
  const buttons =
    document.querySelectorAll(
      ".alerts-tabs button"
    );

  buttons.forEach(button => {
    button.addEventListener(
      "click",
      function () {
        buttons.forEach(btn => {
          btn.classList.remove(
            "active"
          );
        });

        this.classList.add(
          "active"
        );

        activeAlertFilter =
          this.dataset.filter ||
          "all";

        renderAlerts();
      }
    );
  });

  const sort =
    document.getElementById(
      "reminderSort"
    );

  if (sort) {
    sort.addEventListener(
      "change",
      renderAlerts
    );
  }
}

function setAlertText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function escapeAlertHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener(
  "click",
  function (event) {
    const dropdown =
      document.getElementById(
        "notificationDropdown"
      );

    const button =
      document.querySelector(
        ".notif-btn"
      );

    if (
      !dropdown ||
      !button
    ) {
      return;
    }

    if (
      !dropdown.contains(
        event.target
      ) &&
      !button.contains(
        event.target
      )
    ) {
      dropdown.classList.add(
        "hidden"
      );
    }
  }
);

document.addEventListener(
  "DOMContentLoaded",
  function () {
    setupAlertFilters();

    loadDashboardAlerts();

    loadNotificationDropdown();

    if (window.lucide) {
      lucide.createIcons();
    }
  }
);