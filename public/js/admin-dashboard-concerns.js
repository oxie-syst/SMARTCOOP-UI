
async function loadAdminCurrentConcerns() {
  const container = document.getElementById("adminCurrentConcerns");

  if (!container) return;

  container.textContent = "Loading current concerns...";

  try {
    const response = await fetch("/api/admin/reports", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store"
    });

    if (response.status === 401 || response.status === 403) {
      window.location.replace("admin-login.html");
      return;
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load concerns.");
    }

    const feedback = Array.isArray(result.feedback)
      ? result.feedback
      : [];

    const concerns = feedback
      .filter(item =>
        item.status !== "Resolved" &&
        (
          item.category === "Bug Report" ||
          item.category === "Suggestion" ||
          item.rating <= 2
        )
      )
      .sort((a, b) => {
        if (a.status === "New" && b.status !== "New") return -1;
        if (a.status !== "New" && b.status === "New") return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    container.replaceChildren();

    if (concerns.length === 0) {
      const empty = document.createElement("div");
      empty.className = "admin-concerns-empty";

      const title = document.createElement("strong");
      title.textContent = "No current concerns";

      const description = document.createElement("p");
      description.textContent =
        "No unresolved bug reports, suggestions, or low-rated feedback.";

      empty.append(title, description);
      container.appendChild(empty);
      return;
    }

    const summary = document.createElement("p");
    summary.className = "admin-concerns-summary";
    summary.textContent =
      `${concerns.length} concern${concerns.length === 1 ? "" : "s"} requiring attention`;

    container.appendChild(summary);

    concerns.slice(0, 5).forEach(item => {
      const card = document.createElement("div");
      card.className = "admin-concern-item";

      const header = document.createElement("div");
      header.className = "admin-concern-header";

      const category = document.createElement("strong");
      category.textContent = item.category || "Feedback";

      const status = document.createElement("span");
      status.className = "admin-concern-status";
      status.textContent = item.status || "New";

      header.append(category, status);

      const message = document.createElement("p");
      message.className = "admin-concern-message";
      message.textContent = item.message || "No message provided.";

      const details = document.createElement("small");
      details.className = "admin-concern-details";

      const user = item.userName || "Unknown User";
      const date = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric"
          })
        : "Unknown date";

      details.textContent = `${user} • ${date}`;

      card.append(header, message, details);
      container.appendChild(card);
    });

  } catch (error) {
    console.error("ADMIN CONCERNS ERROR:", error);
    container.textContent = "Unable to load current concerns.";
  }
}
