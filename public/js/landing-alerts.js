(() => {
  let reminders = [];
  let nextId = 1;
  let activeFilter = "all";
  let editingId = null;

  const categories = [
    "feeding", "vaccination", "weather", "health",
    "cleaning", "maintenance", "production", "other"
  ];

  const icons = {
    feeding: "🌾",
    vaccination: "💉",
    weather: "🌤️",
    health: "❤️",
    cleaning: "🧹",
    maintenance: "🔧",
    production: "🥚",
    other: "🔔"
  };

  const escapeHTML = value =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  function dateOffset(days, hour = 8) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function sampleData() {
    return [
      {
        id: 1,
        title: "Morning Feeding",
        description: "Prepare feed and check water supply.",
        category: "feeding",
        priority: "high",
        reminderDate: dateOffset(1),
        reminderTime: "08:00",
        isCompleted: false,
        createdAt: Date.now() - 4000
      },
      {
        id: 2,
        title: "Clean Chicken Coop",
        description: "Replace dirty bedding and clean feeding areas.",
        category: "cleaning",
        priority: "medium",
        reminderDate: dateOffset(2),
        reminderTime: "09:00",
        isCompleted: false,
        createdAt: Date.now() - 3000
      },
      {
        id: 3,
        title: "Health Inspection",
        description: "Check chickens for unusual behavior.",
        category: "health",
        priority: "high",
        reminderDate: dateOffset(-1),
        reminderTime: "07:00",
        isCompleted: false,
        createdAt: Date.now() - 2000
      },
      {
        id: 4,
        title: "Egg Collection",
        description: "Record collected eggs.",
        category: "production",
        priority: "low",
        reminderDate: dateOffset(-2),
        reminderTime: "15:00",
        isCompleted: true,
        createdAt: Date.now() - 1000
      }
    ];
  }

  function getStatus(reminder) {
    if (reminder.isCompleted) return "completed";

    const due = new Date(
      `${reminder.reminderDate}T${reminder.reminderTime}`
    );

    return due < new Date() ? "overdue" : "upcoming";
  }

  function formatDate(value) {
    return new Date(`${value}T00:00:00`).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" }
    );
  }

  function formatTime(value) {
    const [hour, minute] = value.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${period}`;
  }

  function root() {
    return document.querySelector(".landing-alerts-demo");
  }

  function render() {
    const app = root();
    if (!app) return;

    const counts = {
      upcoming: 0,
      completed: 0,
      overdue: 0,
      high: 0
    };

    reminders.forEach(reminder => {
      const status = getStatus(reminder);
      counts[status]++;

      if (
        reminder.priority === "high" &&
        status !== "completed"
      ) {
        counts.high++;
      }
    });

    app.querySelector("#laStats").innerHTML = `
      <div class="la-stat"><span>📅 Upcoming</span><strong>${counts.upcoming}</strong></div>
      <div class="la-stat"><span>✅ Completed</span><strong>${counts.completed}</strong></div>
      <div class="la-stat"><span>🔴 High Priority</span><strong>${counts.high}</strong></div>
      <div class="la-stat"><span>⚠️ Overdue</span><strong>${counts.overdue}</strong></div>
    `;

    const tabs = [
      ["all", "All", reminders.length],
      ["upcoming", "Upcoming", counts.upcoming],
      ["completed", "Completed", counts.completed],
      ["overdue", "Overdue", counts.overdue]
    ];

    app.querySelector("#laTabs").innerHTML = tabs.map(
      ([key, label, count]) => `
        <button type="button"
          class="la-tab ${activeFilter === key ? "active" : ""}"
          data-filter="${key}">
          ${label} (${count})
        </button>
      `
    ).join("");

    const sort = app.querySelector("#laSort").value;

    let filtered = reminders.filter(reminder =>
      activeFilter === "all" ||
      getStatus(reminder) === activeFilter
    );

    const priorityOrder = { high: 1, medium: 2, low: 3 };

    if (sort === "priority") {
      filtered.sort((a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    } else if (sort === "newest") {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      filtered.sort((a, b) =>
        new Date(`${a.reminderDate}T${a.reminderTime}`) -
        new Date(`${b.reminderDate}T${b.reminderTime}`)
      );
    }

    const list = app.querySelector("#laList");

    if (!filtered.length) {
      list.innerHTML = `
        <div class="la-empty">
          <span>🔔</span>
          <h4>No reminders found</h4>
          <p>Try another filter or add a reminder.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map(reminder => {
      const status = getStatus(reminder);

      return `
        <article class="la-item ${status}">
          <div class="la-icon">
            ${icons[reminder.category] || "🔔"}
          </div>

          <div class="la-item-main">
            <div class="la-item-top">
              <div>
                <h4>${escapeHTML(reminder.title)}</h4>
                <p>${escapeHTML(reminder.description || "No description provided.")}</p>
              </div>

              <div class="la-tags">
                <span class="la-priority ${reminder.priority}">
                  ${escapeHTML(reminder.priority)}
                </span>
                <span class="la-category">
                  ${escapeHTML(reminder.category)}
                </span>
                <span class="la-status ${status}">
                  ${status}
                </span>
              </div>
            </div>

            <div class="la-meta">
              <span>📅 ${formatDate(reminder.reminderDate)}</span>
              <span>🕒 ${formatTime(reminder.reminderTime)}</span>
            </div>

            <div class="la-actions">
              <button type="button"
                data-action="toggle" data-id="${reminder.id}">
                ${reminder.isCompleted ? "↩ Restore" : "✓ Mark Complete"}
              </button>

              <button type="button"
                data-action="edit" data-id="${reminder.id}">
                ✏️ Edit
              </button>

              <button type="button" class="la-delete"
                data-action="delete" data-id="${reminder.id}">
                🗑 Delete
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function openForm(id = null) {
    const app = root();
    if (!app) return;

    editingId = id;

    const reminder = reminders.find(item => item.id === id);

    app.querySelector("#laFormTitle").textContent =
      reminder ? "Edit Reminder" : "Add New Reminder";

    app.querySelector("#laTitle").value = reminder?.title || "";
    app.querySelector("#laDescription").value =
      reminder?.description || "";
    app.querySelector("#laCategory").value =
      reminder?.category || "feeding";
    app.querySelector("#laPriority").value =
      reminder?.priority || "medium";
    app.querySelector("#laDate").value =
      reminder?.reminderDate || dateOffset(1);
    app.querySelector("#laTime").value =
      reminder?.reminderTime || "08:00";

    app.querySelector("#laFormWrap").hidden = false;
  }

  function closeForm() {
    const app = root();
    if (!app) return;

    editingId = null;
    app.querySelector("#laFormWrap").hidden = true;
  }

  function saveForm(event) {
    event.preventDefault();

    const app = root();
    if (!app) return;

    const title = app.querySelector("#laTitle").value.trim();
    const description =
      app.querySelector("#laDescription").value.trim();
    const category = app.querySelector("#laCategory").value;
    const priority = app.querySelector("#laPriority").value;
    const reminderDate = app.querySelector("#laDate").value;
    const reminderTime = app.querySelector("#laTime").value;

    if (!title || !reminderDate || !reminderTime) return;

    if (editingId !== null) {
      const reminder = reminders.find(item =>
        item.id === editingId
      );

      if (reminder) {
        Object.assign(reminder, {
          title, description, category, priority,
          reminderDate, reminderTime
        });
      }
    } else {
      reminders.push({
        id: nextId++,
        title,
        description,
        category,
        priority,
        reminderDate,
        reminderTime,
        isCompleted: false,
        createdAt: Date.now()
      });
    }

    closeForm();
    render();
  }

  window.renderLandingSmartAlerts = function () {
    const container = document.getElementById(
      "landing-interactive-demo"
    );

    if (!container) return;

    reminders = sampleData();
    nextId = 5;
    activeFilter = "all";
    editingId = null;

    container.style.display = "block";

    container.innerHTML = `
      <section class="landing-alerts-demo">
        <div class="la-heading">
          <div>
            <h3>🔔 Smart Alerts</h3>
            <p>Manage farm reminders and important poultry activities.</p>
          </div>
          <span class="la-demo-badge">DEMO MODE</span>
        </div>

        <div class="la-stats" id="laStats"></div>

        <div class="la-toolbar">
          <div class="la-tabs" id="laTabs"></div>
          <button type="button" class="la-add" id="laAdd">
            + Add Reminder
          </button>
        </div>

        <div class="la-sort">
          <label for="laSort">Sort By</label>
          <select id="laSort">
            <option value="date">Reminder Date</option>
            <option value="priority">Priority</option>
            <option value="newest">Newest Added</option>
          </select>
        </div>

        <div class="la-list" id="laList"></div>

        <div class="la-form-wrap" id="laFormWrap" hidden>
          <form class="la-form" id="laForm">
            <div class="la-form-heading">
              <h4 id="laFormTitle">Add New Reminder</h4>
              <button type="button" id="laClose">✕</button>
            </div>

            <label>Reminder Title *
              <input id="laTitle" maxlength="100" required
                placeholder="e.g. Morning Feeding">
            </label>

            <label>Description
              <textarea id="laDescription" rows="3"
                placeholder="Enter reminder details"></textarea>
            </label>

            <div class="la-form-grid">
              <label>Category
                <select id="laCategory">
                  ${categories.map(category => `
                    <option value="${category}">
                      ${category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  `).join("")}
                </select>
              </label>

              <label>Priority
                <select id="laPriority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label>Reminder Date *
                <input type="date" id="laDate" required>
              </label>

              <label>Reminder Time *
                <input type="time" id="laTime" required>
              </label>
            </div>

            <div class="la-form-actions">
              <button type="button" id="laCancel">Cancel</button>
              <button type="submit" class="la-save">Save Reminder</button>
            </div>
          </form>
        </div>

        <p class="la-disclaimer">
          This is an interactive sample preview.
          Changes are temporary and do not affect your account
          or SmartCoop database.
        </p>
      </section>
    `;

    const app = root();

    app.querySelector("#laAdd").onclick = () => openForm();

    app.querySelector("#laSort").onchange = render;

    app.querySelector("#laTabs").onclick = event => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;

      activeFilter = button.dataset.filter;
      render();
    };

    app.querySelector("#laList").onclick = event => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const id = Number(button.dataset.id);
      const reminder = reminders.find(item => item.id === id);
      if (!reminder) return;

      if (button.dataset.action === "toggle") {
        reminder.isCompleted = !reminder.isCompleted;
        render();
      }

      if (button.dataset.action === "edit") {
        openForm(id);
      }

      if (button.dataset.action === "delete") {
        if (confirm("Delete this sample reminder?")) {
          reminders = reminders.filter(item => item.id !== id);
          render();
        }
      }
    };

    app.querySelector("#laClose").onclick = closeForm;
    app.querySelector("#laCancel").onclick = closeForm;
    app.querySelector("#laForm").onsubmit = saveForm;

    render();
  };
})();
