const SMARTCOOP_USER_KEY = "smartcoop_user";
const SMARTCOOP_USERS_KEY = "smartcoop_registered_users";

function getRegisteredUsers() {
  return JSON.parse(localStorage.getItem(SMARTCOOP_USERS_KEY) || "{}");
}

function saveRegisteredUsers(users) {
  localStorage.setItem(SMARTCOOP_USERS_KEY, JSON.stringify(users));
}

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

function setLoading(button, loading, text) {
  if (!button) return;

  button.disabled = loading;
  button.classList.toggle("loading", loading);
  button.textContent = loading ? "Please wait..." : text;
}

function showSignupError(message) {
  const errorBox = document.getElementById("signupError");

  if (!errorBox) {
    alert(message);
    return;
  }

  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function hideSignupError() {
  const errorBox = document.getElementById("signupError");

  if (!errorBox) return;

  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

async function loginUser(email, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  return await response.json();
}

function setupLoginPage() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errorBox = document.getElementById("loginError");
    const button = document.getElementById("loginBtn");

    if (errorBox) {
      errorBox.textContent = "";
      errorBox.classList.add("hidden");
    }

    setLoading(button, true, "Sign in");

    try {
      const result = await loginUser(email, password);

      setLoading(button, false, "Sign in");

if (result.success) {
  localStorage.setItem(
    "user",
    JSON.stringify(result.user)
  );

  localStorage.setItem(
    SMARTCOOP_USER_KEY,
    JSON.stringify(result.user)
  );

const userRole =
  String(
    result.user.role ||
    result.user.Role ||
    ""
  ).toLowerCase();

if (userRole === "admin") {
  localStorage.removeItem("user");
  localStorage.removeItem(
    SMARTCOOP_USER_KEY
  );

  window.location.href =
    "admin-login.html";

  return;

} else if (
  result.user.onboardingCompleted
) {
  window.location.href = "user.html";

} else {
  window.location.href = "onboarding.html";
}
}

       else {
        if (errorBox) {
          errorBox.textContent =
            result.message || "Invalid email or password.";

          errorBox.classList.remove("hidden");
        }
      }

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      setLoading(button, false, "Sign in");

      if (errorBox) {
        errorBox.textContent = "Server Error";
        errorBox.classList.remove("hidden");
      }
    }
  });
}
function setupSignupPage() {
  const form = document.getElementById("signupForm");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name =
      document.getElementById("name").value.trim();

    const email =
      document.getElementById("signupEmail").value.trim();

    const phoneNumber =
      document.getElementById("phoneNumber").value.trim();

    const password =
      document.getElementById("signupPassword").value;

    const confirmPassword =
      document.getElementById("confirmPassword").value;

    const button =
      document.getElementById("signupBtn");

    hideSignupError();

    if (password !== confirmPassword) {
      showSignupError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      showSignupError(
        "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(
      button,
      true,
      "Create Account"
    );

    try {
      const response = await fetch(
        "/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            fullName: name,
            email,
            phoneNumber,
            password
          })
        }
      );

      const result = await response.json();

      setLoading(
        button,
        false,
        "Create Account"
      );

      if (!response.ok || !result.success) {
        showSignupError(
          result.message ||
          "Unable to create account."
        );
        return;
      }

      if (result.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(result.user)
        );

        localStorage.setItem(
          SMARTCOOP_USER_KEY,
          JSON.stringify(result.user)
        );

        if (result.user.onboardingCompleted) {
          window.location.href = "user.html";
        } else {
          window.location.href = "onboarding.html";
        }

        return;
      }

      window.location.href = "login.html";

    } catch (error) {
      console.error(
        "SIGNUP ERROR:",
        error
      );

      setLoading(
        button,
        false,
        "Create Account"
      );

      showSignupError(
        "Unable to connect to the server."
      );
    }
  });
}
function setupAdminLoginPage() {
  const form =
    document.getElementById(
      "adminLoginForm"
    );

  if (!form) return;

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const username =
        document.getElementById(
          "adminUsername"
        ).value.trim();

      const password =
        document.getElementById(
          "adminPassword"
        ).value;

      const errorBox =
        document.getElementById(
          "adminLoginError"
        );

      const button =
        document.getElementById(
          "adminLoginBtn"
        );

      if (errorBox) {
        errorBox.textContent = "";
        errorBox.classList.add("hidden");
      }

      setLoading(
        button,
        true,
        "Sign in as Administrator"
      );

      try {
        const response =
          await fetch(
            "/api/auth/admin-login",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                username,
                password
              })
            }
          );

        const result =
          await response.json();

        setLoading(
          button,
          false,
          "Sign in as Administrator"
        );

        if (
          !response.ok ||
          !result.success
        ) {
          if (errorBox) {
            errorBox.textContent =
              result.message ||
              "Invalid administrator credentials.";

            errorBox.classList.remove(
              "hidden"
            );
          }

          return;
        }

        localStorage.setItem(
          "user",
          JSON.stringify(result.user)
        );

        localStorage.setItem(
          SMARTCOOP_USER_KEY,
          JSON.stringify(result.user)
        );

        window.location.href =
          "admin-dashboard.html";

      } catch (error) {
        console.error(
          "ADMIN LOGIN ERROR:",
          error
        );

        setLoading(
          button,
          false,
          "Sign in as Administrator"
        );

        if (errorBox) {
          errorBox.textContent =
            "Unable to connect to the server.";

          errorBox.classList.remove(
            "hidden"
          );
        }
      }
    }
  );
}

    function togglePassword(inputId) {
      const input = document.getElementById(inputId);
      if (!input) return;

      input.type = input.type === "password" ? "text" : "password";
    }

    function getGreeting() {
      const hour = new Date().getHours();

      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
    }

async function loadDashboard() {

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(storedUser);
    const firstName = user.name.split(" ")[0];
    const response = await fetch(
        `/api/coops/active/${user.id}`
    );

    const data = await response.json();

const activeProject = data.coop;
if (activeProject) {

    setText("totalChickens", activeProject.NumberOfChickens);

    setText("activeCoops", 1);

    setText("activeCoopsText", "1 Active Coop");

    setText(
        "monthlyCost",
        `₱${Number(activeProject.TotalCost).toLocaleString()}`
    );

}
    document.getElementById("topUsername").textContent = user.name;
    document.getElementById("dropdownName").textContent = user.name;
    document.getElementById("dropdownEmail").textContent = user.email;

    if (document.getElementById("userAvatarTop")) {
        document.getElementById("userAvatarTop").textContent =
            firstName.charAt(0).toUpperCase();
    }

    document.getElementById("greeting").textContent =
    `${getGreeting()}, ${firstName}! 👋`;


      window.dashboardActiveProject = activeProject;

      const projectContainer = document.getElementById("projectContainer");

      if (projectContainer && activeProject) {
        projectContainer.innerHTML = `
      <div class="project-card">
        <div class="project-header">
          <div>
            <h3>${activeProject.CoopName}</h3>
            <p>${activeProject.ChickenType}${activeProject.Climate ? ` • ${activeProject.Climate} Climate` : ""}</p>
          </div>
          <span class="status-badge">Active</span>
        </div>

        <div class="project-grid">
          <div class="project-item">
            <small>Dimensions</small>
            <strong>${activeProject.CoopSize}</strong>
          </div>

          <div class="project-item">
            <small>Chickens</small>
            <strong>${activeProject.NumberOfChickens}</strong>
          </div>

          <div class="project-item">
            <small>Capacity Usage</small>
            <strong>85%</strong>
          </div>

          <div class="project-item">
            <small>Investment</small>
            <strong>₱${Number(activeProject.TotalCost || 0).toLocaleString()}</strong>
          </div>
        </div>

        <div class="project-actions">

          <button
            type="button"
            class="model-btn"
            onclick="openDashboardModel()">
            <i data-lucide="box"></i>
            View 3D Model
          </button>

          <button
            type="button"
            class="cost-btn"
            onclick="openDashboardCosts()">
            <i data-lucide="wallet"></i>
            View Costs
          </button>

        </div>
        </div>
    `;
      }


      if (window.lucide) lucide.createIcons();
    }

    function setText(id, value) {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    }

    function logout() {
      localStorage.removeItem("user");
      localStorage.removeItem(SMARTCOOP_USER_KEY); 

      window.location.href = "index.html";
    }

    function toggleSidebar() {
      const sidebar = document.getElementById("sidebar");
      if (sidebar) sidebar.classList.toggle("open");
    }

    function scrollToSection(sectionId) {
      const element = document.getElementById(sectionId);

      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }

      const mobileNav = document.getElementById("mobileNav");
      const mobileMenuBtn = document.getElementById("mobileMenuBtn");

      if (mobileNav) mobileNav.classList.add("hidden");
      if (mobileMenuBtn) mobileMenuBtn.textContent = "☰";
    }

    function toggleMobileMenu() {
      const mobileNav = document.getElementById("mobileNav");
      const mobileMenuBtn = document.getElementById("mobileMenuBtn");

      if (!mobileNav) return;

      mobileNav.classList.toggle("hidden");

      if (mobileMenuBtn) {
        mobileMenuBtn.textContent =
          mobileNav.classList.contains("hidden") ? "☰" : "×";
      }
    }

    function goSignup() {
      window.location.href = "signup.html";
    }

    function goLogin() {
      window.location.href = "login.html";
    }

    function setupLandingPage() {
      const form = document.getElementById("newsletterForm");
      if (!form) return;

      form.addEventListener("submit", event => {
        event.preventDefault();

        const emailInput = document.getElementById("newsletterEmail");

        if (emailInput && emailInput.value.trim()) {
          showToast("Successfully subscribed to newsletter!");
          emailInput.value = "";
        }
      });
    }
    
function loadUserInfo() {
  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem(SMARTCOOP_USER_KEY);

  if (!storedUser) {
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(storedUser);

  const userName =
    user.name ||
    user.fullName ||
    user.username ||
    "User";

  const firstName = userName.split(" ")[0];

  setText("topUsername", userName);
  setText(
    "userAvatarTop",
    user.avatar || firstName.charAt(0).toUpperCase()
  );

  setText("dropdownName", userName);
  setText(
    "dropdownEmail",
    user.email || "user@smartcoop.com"
  );

  setText(
    "dropdownFarm",
    user.farmName || "SmartCoop Farm"
  );

  const settingsName =
    document.getElementById("settingsName");

  if (settingsName) {
    settingsName.value = userName;
  }

  const settingsEmail =
    document.getElementById("settingsEmail");

  if (settingsEmail) {
    settingsEmail.value = user.email || "";
  }

  const settingsPhone =
    document.getElementById("settingsPhone");

  if (settingsPhone) {
    settingsPhone.value = user.phoneNumber || "";
  }

  const settingsAvatar =
    document.getElementById("settingsAvatar");

  if (settingsAvatar) {
    settingsAvatar.textContent =
      user.avatar ||
      userName.charAt(0).toUpperCase();
  }
}

    function toggleProfileMenu() {
      const dropdown = document.getElementById("profileDropdown");
      if (dropdown) dropdown.classList.toggle("hidden");
    }

document.addEventListener(
  "DOMContentLoaded",
  () => {
    setupLoginPage();
    setupAdminLoginPage();

    if (
      typeof setupSignupPage ===
      "function"
    ) {
      setupSignupPage();
    }
  }
);
   

    document.addEventListener("DOMContentLoaded", () => {
      const links = document.querySelectorAll(".sidebar nav a");
      const currentPage = window.location.pathname.split("/").pop();

      links.forEach(link => {
        const href = link.getAttribute("href");

        if (href === currentPage) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    });

    if (window.lucide) lucide.createIcons();

function checkAdmin() {
  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem(
      SMARTCOOP_USER_KEY
    );

  if (!storedUser) {
    window.location.href =
      "admin-login.html";
    return;
  }

  let user;

  try {
    user =
      JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem("user");
    localStorage.removeItem(
      SMARTCOOP_USER_KEY
    );

    window.location.href =
      "admin-login.html";

    return;
  }

  const role =
    String(
      user.role ||
      user.Role ||
      ""
    ).toLowerCase();

  if (role !== "admin") {
    window.location.href =
      "user.html";
  }
}


let adminDashboardData = {
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0
  },

  usage: {
    planner: 0,
    records: 0,
    ai: 0
  },

  userGrowth: [],
  projectGrowth: [],
  recentUsers: []
};


async function loadAdminDashboard() {
  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem(
      SMARTCOOP_USER_KEY
    );

  if (!storedUser) {
    window.location.href =
      "admin-login.html";
    return;
  }

  let adminUser;

  try {
    adminUser =
      JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem("user");
    localStorage.removeItem(
      SMARTCOOP_USER_KEY
    );

    window.location.href =
      "admin-login.html";

    return;
  }

  const adminUserId =
    adminUser.UserID ||
    adminUser.id;

  if (!adminUserId) {
    window.location.href =
      "admin-login.html";
    return;
  }

  try {
    const response =
      await fetch(
        "/api/admin/dashboard",
        {
          method: "GET",

          headers: {
            "x-admin-user-id":
              adminUserId
          }
        }
      );

    const result =
      await response.json();

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        SMARTCOOP_USER_KEY
      );

      window.location.href =
        "admin-login.html";

      return;
    }

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
        "Unable to load admin dashboard."
      );
    }

    adminDashboardData = {
      stats:
        result.stats || {
          totalUsers: 0,
          activeUsers: 0,
          totalProjects: 0
        },

      usage:
        result.usage || {
          planner: 0,
          records: 0,
          ai: 0
        },

      userGrowth:
        Array.isArray(
          result.userGrowth
        )
          ? result.userGrowth
          : [],

      projectGrowth:
        Array.isArray(
          result.projectGrowth
        )
          ? result.projectGrowth
          : [],

      recentUsers:
        Array.isArray(
          result.recentUsers
        )
          ? result.recentUsers
          : []
    };

    setText(
      "adminTotalUsers",
      adminDashboardData
        .stats
        .totalUsers || 0
    );

    setText(
      "adminActiveUsers",
      adminDashboardData
        .stats
        .activeUsers || 0
    );

    setText(
      "adminTotalProjects",
      adminDashboardData
        .stats
        .totalProjects || 0
    );

    setAdminUsage(
      "plannerUsageText",
      "plannerUsageBar",
      adminDashboardData
        .usage
        .planner
    );

    setAdminUsage(
      "recordUsageText",
      "recordUsageBar",
      adminDashboardData
        .usage
        .records
    );

    setAdminUsage(
      "aiUsageText",
      "aiUsageBar",
      adminDashboardData
        .usage
        .ai
    );

    loadAdminUsersTable();
    loadAdminCharts();

    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (error) {
    console.error(
      "ADMIN DASHBOARD LOAD ERROR:",
      error
    );

    setText(
      "adminTotalUsers",
      0
    );

    setText(
      "adminActiveUsers",
      0
    );

    setText(
      "adminTotalProjects",
      0
    );

    setAdminUsage(
      "plannerUsageText",
      "plannerUsageBar",
      0
    );

    setAdminUsage(
      "recordUsageText",
      "recordUsageBar",
      0
    );

    setAdminUsage(
      "aiUsageText",
      "aiUsageBar",
      0
    );

    const table =
      document.getElementById(
        "adminUsersTable"
      );

    if (table) {
      table.innerHTML = `
        <tr>
          <td colspan="5">
            Unable to load admin dashboard data.
          </td>
        </tr>
      `;
    }
  }
}


function setAdminUsage(
  textId,
  barId,
  value
) {
  const safeValue =
    Math.max(
      0,
      Math.min(
        Number(value) || 0,
        100
      )
    );

  const text =
    document.getElementById(
      textId
    );

  const bar =
    document.getElementById(
      barId
    );

  if (text) {
    text.textContent =
      `${safeValue}%`;
  }

  if (bar) {
    bar.style.width =
      `${safeValue}%`;
  }
}


function loadAdminUsersTable() {
  const table =
    document.getElementById(
      "adminUsersTable"
    );

  if (!table) return;

  const search =
    document.getElementById(
      "adminSearchUser"
    )?.value
      .trim()
      .toLowerCase() || "";

  let users =
    Array.isArray(
      adminDashboardData
        .recentUsers
    )
      ? [
          ...adminDashboardData
            .recentUsers
        ]
      : [];

  if (search) {
    users =
      users.filter(
        user => {
          const name =
            String(
              user.name || ""
            ).toLowerCase();

          const email =
            String(
              user.email || ""
            ).toLowerCase();

          return (
            name.includes(search) ||
            email.includes(search)
          );
        }
      );
  }

  if (users.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="5">
          No users found.
        </td>
      </tr>
    `;

    return;
  }

  table.innerHTML =
    users
      .map(
        user => {
          const role =
            user.role ||
            "farmer";
          
          const roleClass =
          String(role)
            .toLowerCase() === "admin"
              ? "admin"
              : "";
              
          const status =
            user.status ||
            "Active";

          const statusClass =
            status === "Active"
              ? ""
              : "inactive";

          return `
            <tr>

              <td>
                ${escapeAdminHTML(
                  user.name ||
                  "User"
                )}
              </td>

              <td>
                ${escapeAdminHTML(
                  user.email ||
                  ""
                )}
              </td>

              <td>
                <span
                  class="admin-role-badge ${roleClass}">

                  ${escapeAdminHTML(
                    role
                  )}

                </span>
              </td>

              <td>
                <span
                  class="admin-status ${statusClass}">

                  ${escapeAdminHTML(
                    status
                  )}

                </span>
              </td>

              <td>
                ${formatAdminDate(
                  user.createdAt
                )}
              </td>

            </tr>
          `;
        }
      )
      .join("");

  if (window.lucide) {
    lucide.createIcons();
  }
}


function escapeAdminHTML(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


function formatAdminDate(
  value
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );
}


let adminUserChart = null;
let adminProjectChart = null;


function loadAdminCharts() {
  const userCanvas =
    document.getElementById(
      "adminUserActivityChart"
    );

  const projectCanvas =
    document.getElementById(
      "adminProjectGrowthChart"
    );

  if (!window.Chart) {
    return;
  }

  if (userCanvas) {
    const userGrowth =
      Array.isArray(
        adminDashboardData
          .userGrowth
      )
        ? adminDashboardData
            .userGrowth
        : [];

    const userLabels =
      userGrowth.map(
        item =>
          item.month || "-"
      );

    const userValues =
      userGrowth.map(
        item =>
          Number(
            item.total
          ) || 0
      );

    if (adminUserChart) {
      adminUserChart.destroy();
    }

    adminUserChart =
      new Chart(
        userCanvas,
        {
          type: "line",

          data: {
            labels:
              userLabels,

            datasets: [
              {
                label:
                  "New Users",

                data:
                  userValues,

                borderColor:
                  "#2e7d32",

                backgroundColor:
                  "rgba(46, 125, 50, 0.10)",

                tension:
                  0.3,

                pointRadius:
                  4,

                pointHoverRadius:
                  6,

                fill:
                  true
              }
            ]
          },

          options: {
            responsive:
              true,

            maintainAspectRatio:
              false,

            plugins: {
              legend: {
                display:
                  false
              }
            },

            scales: {
              y: {
                beginAtZero:
                  true,

                ticks: {
                  precision:
                    0
                }
              }
            }
          }
        }
      );
  }

  if (projectCanvas) {
    const projectGrowth =
      Array.isArray(
        adminDashboardData
          .projectGrowth
      )
        ? adminDashboardData
            .projectGrowth
        : [];

    const projectLabels =
      projectGrowth.map(
        item =>
          item.month || "-"
      );

    const projectValues =
      projectGrowth.map(
        item =>
          Number(
            item.total
          ) || 0
      );

    if (adminProjectChart) {
      adminProjectChart.destroy();
    }

    adminProjectChart =
      new Chart(
        projectCanvas,
        {
          type: "line",

          data: {
            labels:
              projectLabels,

            datasets: [
              {
                label:
                  "Coop Projects",

                data:
                  projectValues,

                borderColor:
                  "#2e7d32",

                backgroundColor:
                  "rgba(46, 125, 50, 0.10)",

                tension:
                  0.3,

                pointRadius:
                  4,

                pointHoverRadius:
                  6,

                fill:
                  true
              }
            ]
          },

          options: {
            responsive:
              true,

            maintainAspectRatio:
              false,

            plugins: {
              legend: {
                display:
                  false
              }
            },

            scales: {
              y: {
                beginAtZero:
                  true,

                ticks: {
                  precision:
                    0
                }
              }
            }
          }
        }
      );
  }
}

let adminManageUsersData = {
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0
  },

  users: []
};

async function loadAdminUsersPage() {
  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem(
      SMARTCOOP_USER_KEY
    );

  if (!storedUser) {
    window.location.href =
      "admin-login.html";
    return;
  }

  let adminUser;

  try {
    adminUser =
      JSON.parse(storedUser);
  } catch (error) {
    window.location.href =
      "admin-login.html";
    return;
  }

  const adminUserId =
    adminUser.UserID ||
    adminUser.id;

  if (!adminUserId) {
    window.location.href =
      "admin-login.html";
    return;
  }

  try {
    const response =
      await fetch(
        "/api/admin/users",
        {
          method: "GET",

          headers: {
            "x-admin-user-id":
              adminUserId
          }
        }
      );

    const result =
      await response.json();

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        SMARTCOOP_USER_KEY
      );

      window.location.href =
        "admin-login.html";

      return;
    }

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
        "Unable to load users."
      );
    }

const loadedUsers =
  Array.isArray(result.users)
    ? result.users
    : [];

const activeUsers =
  loadedUsers.filter(
    user =>
      String(
        user.status || "Active"
      ).toLowerCase() === "active"
  ).length;

const inactiveUsers =
  loadedUsers.filter(
    user =>
      String(
        user.status || ""
      ).toLowerCase() === "inactive"
  ).length;


adminManageUsersData = {
  stats: {
    totalUsers:
      loadedUsers.length,

    activeUsers,

    inactiveUsers
  },

  users:
    loadedUsers
};


setText(
  "manageTotalUsers",
  loadedUsers.length
);

setText(
  "manageActiveUsers",
  activeUsers
);

setText(
  "manageInactiveUsers",
  inactiveUsers
);

    renderAdminManageUsers();

    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (error) {
    console.error(
      "ADMIN USERS LOAD ERROR:",
      error
    );

    const table =
      document.getElementById(
        "adminManageUsersTable"
      );

    if (table) {
      table.innerHTML = `
        <tr>
          <td colspan="7">
            Unable to load users.
          </td>
        </tr>
      `;
    }
  }
}


function renderAdminManageUsers() {
  const table =
    document.getElementById(
      "adminManageUsersTable"
    );

  if (!table) return;

  const search =
    document.getElementById(
      "adminManageSearch"
    )?.value
      .trim()
      .toLowerCase() || "";

  const statusFilter =
    document.getElementById(
      "adminManageStatusFilter"
    )?.value || "All";

  let users =
    Array.isArray(
      adminManageUsersData.users
    )
      ? [...adminManageUsersData.users]
      : [];

  if (search) {
    users = users.filter(user => {
      const name =
        String(
          user.name || ""
        ).toLowerCase();

      const email =
        String(
          user.email || ""
        ).toLowerCase();

      return (
        name.includes(search) ||
        email.includes(search)
      );
    });
  }

  if (statusFilter !== "All") {
    users = users.filter(
      user =>
        String(
          user.status || ""
        ).toLowerCase() ===
        statusFilter.toLowerCase()
    );
  }

  if (users.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="7">
          No users found.
        </td>
      </tr>
    `;

    return;
  }

  table.innerHTML =
    users.map(user => {
      const status =
        user.status || "Active";

      const statusClass =
        status === "Active"
          ? ""
          : "inactive";

      const isPremium =
        Boolean(
          Number(user.isPremium)
        );

      const plan =
        isPremium
          ? "Premium"
          : "Free";

      const subscriptionStatus =
        user.subscriptionStatus ||
        (isPremium ? "Active" : "Free");

      return `
        <tr>

          <td>
            ${escapeAdminHTML(
              user.name || "User"
            )}
          </td>

          <td>
            ${escapeAdminHTML(
              user.email || ""
            )}
          </td>

          <td>
            <span class="admin-role-badge">
              ${plan}
            </span>
          </td>

          <td>
            <span class="admin-status ${
              subscriptionStatus === "Active"
                ? ""
                : "inactive"
            }">
              ${escapeAdminHTML(
                subscriptionStatus
              )}
            </span>
          </td>

          <td>
            <span
              class="admin-status ${statusClass}">
              ${escapeAdminHTML(status)}
            </span>
          </td>

          <td>
            ${formatAdminDate(
              user.createdAt
            )}
          </td>

          <td>

            <button
              type="button"
              class="admin-action-btn"
              onclick="viewAdminUserDetails(
                ${Number(user.id)}
              )">

              <i data-lucide="eye"></i>
              View

            </button>

            <button
              type="button"
              class="admin-action-btn"
              onclick="toggleAdminUserStatus(
                ${Number(user.id)},
                '${status === "Active"
                  ? "Inactive"
                  : "Active"}'
              )">

              <i data-lucide="${
                status === "Active"
                  ? "user-x"
                  : "user-check"
              }"></i>

              ${
                status === "Active"
                  ? "Deactivate"
                  : "Activate"
              }

            </button>

          </td>

        </tr>
      `;
    }).join("");

  if (window.lucide) {
    lucide.createIcons();
  }
}

function viewAdminUserDetails(userId) {
  const user =
    adminManageUsersData.users.find(
      item =>
        Number(item.id) ===
        Number(userId)
    );

  if (!user) return;
  selectedAdminSubscriptionUserId =
  Number(userId);

  const modal =
    document.getElementById(
      "adminUserDetailsModal"
    );

  if (!modal) return;

  const setValue = (id, value) => {
    const element =
      document.getElementById(id);

    if (element) {
      element.value =
        value ?? "";
    }
  };

  const isPremium =
    Boolean(
      Number(user.isPremium)
    );

    const subscriptionBtn =
  document.getElementById(
    "adminSubscriptionBtn"
  );

if (subscriptionBtn) {
  subscriptionBtn.textContent =
    isPremium
      ? "Cancel Premium"
      : "Activate Premium";
}

  setValue(
    "detailsUserName",
    user.name || ""
  );

  setValue(
    "detailsUserEmail",
    user.email || ""
  );

  setValue(
    "detailsUserPhone",
    user.phoneNumber || "-"
  );

  setValue(
    "detailsUserFarmName",
    user.farmName || "-"
  );

  setValue(
    "detailsUserFarmLocation",
    user.farmLocation || "-"
  );

  setValue(
    "detailsUserFarmSize",
    user.farmSize
      ? `${user.farmSize} m²`
      : "-"
  );

  setValue(
    "detailsUserRole",
    user.role || "farmer"
  );

  setValue(
    "detailsUserStatus",
    user.status || "Active"
  );

  setValue(
    "detailsUserPlan",
    isPremium
      ? "SmartCoop Premium"
      : "Free"
  );

  setValue(
    "detailsSubscriptionStatus",
    user.subscriptionStatus ||
      (isPremium ? "Active" : "Free")
  );

  setValue(
    "detailsSubscriptionStart",
    user.subscriptionStart
      ? formatAdminDate(
          user.subscriptionStart
        )
      : "-"
  );

  setValue(
    "detailsSubscriptionEnd",
    user.subscriptionEnd
      ? formatAdminDate(
          user.subscriptionEnd
        )
      : "-"
  );

  setValue(
    "detailsSubscriptionPrice",
    user.subscriptionPrice !== null &&
    user.subscriptionPrice !== undefined
      ? `₱${Number(
          user.subscriptionPrice
        ).toLocaleString(
          "en-PH",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }
        )}`
      : "-"
  );

  setValue(
    "detailsUserProvider",
    user.authProvider || "local"
  );

  setValue(
    "detailsUserJoined",
    formatAdminDate(
      user.createdAt
    )
  );

  modal.classList.remove(
    "hidden"
  );

  if (window.lucide) {
    lucide.createIcons();
  }
}

async function toggleAdminUserStatus(
  userId,
  newStatus
) {
  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem(
      SMARTCOOP_USER_KEY
    );

  if (!storedUser) {
    window.location.href =
      "admin-login.html";

    return;
  }


  let adminUser;

  try {
    adminUser =
      JSON.parse(storedUser);
  } catch (error) {
    window.location.href =
      "admin-login.html";

    return;
  }


  const adminUserId =
    adminUser.UserID ||
    adminUser.id;


  if (!adminUserId) {
    window.location.href =
      "admin-login.html";

    return;
  }


  const confirmed =
    confirm(
      `Are you sure you want to ${newStatus === "Active" ? "activate" : "deactivate"} this user?`
    );


  if (!confirmed) {
    return;
  }


  try {
    const response =
      await fetch(
        `/api/admin/users/${userId}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            "x-admin-user-id":
              adminUserId
          },

          body: JSON.stringify({
            status:
              newStatus
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
        "Unable to update user status."
      );
    }


    alert(
      result.message ||
      `User is now ${newStatus}.`
    );


    await loadAdminUsersPage();


  } catch (error) {
    console.error(
      "ADMIN STATUS UPDATE ERROR:",
      error
    );


    alert(
      error.message ||
      "Unable to update user status."
    );
  }
}

let selectedAdminSubscriptionUserId = null;

async function updateAdminUserSubscription() {
  if (!selectedAdminSubscriptionUserId) {
    return;
  }

  const user =
    adminManageUsersData.users.find(
      item =>
        Number(item.id) ===
        Number(selectedAdminSubscriptionUserId)
    );

  if (!user) {
    return;
  }

  const isPremium =
    Boolean(Number(user.isPremium));

  const action =
    isPremium
      ? "cancel"
      : "activate";

  const confirmed =
    confirm(
      isPremium
        ? "Are you sure you want to cancel this user's Premium subscription?"
        : "Are you sure you want to activate Premium for this user?"
    );

  if (!confirmed) {
    return;
  }

  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem(
      SMARTCOOP_USER_KEY
    );

  if (!storedUser) {
    window.location.href =
      "admin-login.html";
    return;
  }

  const adminUser =
    JSON.parse(storedUser);

  const adminUserId =
    adminUser.UserID ||
    adminUser.id;

  try {
    const response =
      await fetch(
        `/api/admin/users/${selectedAdminSubscriptionUserId}/subscription`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            "x-admin-user-id":
              adminUserId
          },

          body: JSON.stringify({
            action
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
        "Unable to update subscription."
      );
    }

    alert(result.message);

    closeAdminUserDetails();

    await loadAdminUsersPage();

  } catch (error) {
    console.error(
      "ADMIN SUBSCRIPTION ERROR:",
      error
    );

    alert(
      error.message ||
      "Unable to update subscription."
    );
  }
}

function closeAdminUserDetails() {
  const modal =
    document.getElementById(
      "adminUserDetailsModal"
    );

  if (modal) {
    modal.classList.add(
      "hidden"
    );
  }
}

let adminReportsData = {
  stats: {
    totalUsers: 0,
    totalProjects: 0,
    totalRecords: 0,
    totalAIRequests: 0
  },

  usage: {
    planner: 0,
    records: 0,
    ai: 0
  },

  userGrowth: [],
  projectGrowth: [],
  recordBreakdown: [],
  aiGrowth: []
};


let adminReportUserChart = null;
let adminReportProjectChart = null;
let adminReportRecordChart = null;
let adminReportAIChart = null;


async function loadAdminReports() {
  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem(
      SMARTCOOP_USER_KEY
    );

  if (!storedUser) {
    window.location.href =
      "admin-login.html";

    return;
  }


  let adminUser;

  try {
    adminUser =
      JSON.parse(storedUser);
  } catch (error) {
    window.location.href =
      "admin-login.html";

    return;
  }


  const adminUserId =
    adminUser.UserID ||
    adminUser.id;


  if (!adminUserId) {
    window.location.href =
      "admin-login.html";

    return;
  }


  const dateFrom =
    document.getElementById(
      "adminReportDateFrom"
    )?.value || "";


  const dateTo =
    document.getElementById(
      "adminReportDateTo"
    )?.value || "";


  const params =
    new URLSearchParams();


  if (dateFrom) {
    params.set(
      "from",
      dateFrom
    );
  }


  if (dateTo) {
    params.set(
      "to",
      dateTo
    );
  }


  let url =
    "/api/admin/reports";


  if (params.toString()) {
    url +=
      `?${params.toString()}`;
  }


  try {
    const response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {
            "x-admin-user-id":
              adminUserId
          }
        }
      );


    const result =
      await response.json();


    if (
      response.status === 401 ||
      response.status === 403
    ) {
      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        SMARTCOOP_USER_KEY
      );

      window.location.href =
        "admin-login.html";

      return;
    }


    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
        "Unable to load reports."
      );
    }


    adminReportsData = {
      stats:
        result.stats || {
          totalUsers: 0,
          totalProjects: 0,
          totalRecords: 0,
          totalAIRequests: 0
        },

      usage:
        result.usage || {
          planner: 0,
          records: 0,
          ai: 0
        },

      userGrowth:
        Array.isArray(
          result.userGrowth
        )
          ? result.userGrowth
          : [],

      projectGrowth:
        Array.isArray(
          result.projectGrowth
        )
          ? result.projectGrowth
          : [],

      recordBreakdown:
        Array.isArray(
          result.recordBreakdown
        )
          ? result.recordBreakdown
          : [],

      aiGrowth:
        Array.isArray(
          result.aiGrowth
        )
          ? result.aiGrowth
          : []
    };


    updateAdminReportPeriod();

    renderAdminReportStats();

    renderAdminReportUsage();

    renderAdminReportCharts();


    if (window.lucide) {
      lucide.createIcons();
    }


  } catch (error) {
    console.error(
      "ADMIN REPORTS ERROR:",
      error
    );


    setText(
      "reportTotalUsers",
      0
    );

    setText(
      "reportTotalProjects",
      0
    );

    setText(
      "reportTotalRecords",
      0
    );

    setText(
      "reportTotalAIRequests",
      0
    );
  }
}


function renderAdminReportStats() {
  setText(
    "reportTotalUsers",
    adminReportsData
      .stats
      .totalUsers || 0
  );


  setText(
    "reportTotalProjects",
    adminReportsData
      .stats
      .totalProjects || 0
  );


  setText(
    "reportTotalRecords",
    adminReportsData
      .stats
      .totalRecords || 0
  );


  setText(
    "reportTotalAIRequests",
    adminReportsData
      .stats
      .totalAIRequests || 0
  );
}


function renderAdminReportUsage() {
  setAdminReportUsage(
    "reportPlannerUsageText",
    "reportPlannerUsageBar",
    adminReportsData
      .usage
      .planner
  );


  setAdminReportUsage(
    "reportRecordUsageText",
    "reportRecordUsageBar",
    adminReportsData
      .usage
      .records
  );


  setAdminReportUsage(
    "reportAIUsageText",
    "reportAIUsageBar",
    adminReportsData
      .usage
      .ai
  );
}


function setAdminReportUsage(
  textId,
  barId,
  value
) {
  const safeValue =
    Math.max(
      0,
      Math.min(
        Number(value) || 0,
        100
      )
    );


  const text =
    document.getElementById(
      textId
    );


  const bar =
    document.getElementById(
      barId
    );


  if (text) {
    text.textContent =
      `${safeValue}%`;
  }


  if (bar) {
    bar.style.width =
      `${safeValue}%`;
  }
}


function renderAdminReportCharts() {
  if (!window.Chart) {
    return;
  }


  renderAdminReportUserChart();

  renderAdminReportProjectChart();

  renderAdminRecordActivityChart();

  renderAdminAIUsageChart();
}


function renderAdminReportUserChart() {
  const canvas =
    document.getElementById(
      "adminReportUserChart"
    );


  if (!canvas) return;


  const data =
    adminReportsData.userGrowth;


  const labels =
    data.map(
      item =>
        item.month ||
        item.date ||
        "-"
    );


  const values =
    data.map(
      item =>
        Number(
          item.total
        ) || 0
    );


  if (adminReportUserChart) {
    adminReportUserChart.destroy();
  }


  adminReportUserChart =
    new Chart(
      canvas,
      {
        type: "line",

        data: {
          labels,

          datasets: [
            {
              label:
                "New Users",

              data:
                values,

              borderColor:
                "#2e7d32",

              backgroundColor:
                "rgba(46, 125, 50, 0.10)",

              tension:
                0.3,

              pointRadius:
                4,

              fill:
                true
            }
          ]
        },

        options: {
          responsive:
            true,

          maintainAspectRatio:
            false,

          plugins: {
            legend: {
              display:
                false
            }
          },

          scales: {
            y: {
              beginAtZero:
                true,

              ticks: {
                precision:
                  0
              }
            }
          }
        }
      }
    );
}


function renderAdminReportProjectChart() {
  const canvas =
    document.getElementById(
      "adminReportProjectChart"
    );


  if (!canvas) return;


  const data =
    adminReportsData.projectGrowth;


  const labels =
    data.map(
      item =>
        item.month ||
        item.date ||
        "-"
    );


  const values =
    data.map(
      item =>
        Number(
          item.total
        ) || 0
    );


  if (
    adminReportProjectChart
  ) {
    adminReportProjectChart
      .destroy();
  }


  adminReportProjectChart =
    new Chart(
      canvas,
      {
        type: "bar",

        data: {
          labels,

          datasets: [
            {
              label:
                "Coop Projects",

              data:
                values,

              backgroundColor:
                "#2e7d32"
            }
          ]
        },

        options: {
          responsive:
            true,

          maintainAspectRatio:
            false,

          plugins: {
            legend: {
              display:
                false
            }
          },

          scales: {
            y: {
              beginAtZero:
                true,

              ticks: {
                precision:
                  0
              }
            }
          }
        }
      }
    );
}


function renderAdminRecordActivityChart() {
  const canvas =
    document.getElementById(
      "adminRecordActivityChart"
    );


  if (!canvas) return;


  const data =
    adminReportsData
      .recordBreakdown;


  const labels =
    data.map(
      item =>
        item.label ||
        item.type ||
        "-"
    );


  const values =
    data.map(
      item =>
        Number(
          item.total
        ) || 0
    );


  if (
    adminReportRecordChart
  ) {
    adminReportRecordChart
      .destroy();
  }


  adminReportRecordChart =
    new Chart(
      canvas,
      {
        type: "bar",

        data: {
          labels,

          datasets: [
            {
              label:
                "Records",

              data:
                values,

              backgroundColor:
                "#2e7d32"
            }
          ]
        },

        options: {
          responsive:
            true,

          maintainAspectRatio:
            false,

          plugins: {
            legend: {
              display:
                false
            }
          },

          scales: {
            y: {
              beginAtZero:
                true,

              ticks: {
                precision:
                  0
              }
            }
          }
        }
      }
    );
}


function renderAdminAIUsageChart() {
  const canvas =
    document.getElementById(
      "adminAIUsageChart"
    );


  if (!canvas) return;


  const data =
    adminReportsData.aiGrowth;


  const labels =
    data.map(
      item =>
        item.month ||
        item.date ||
        "-"
    );


  const values =
    data.map(
      item =>
        Number(
          item.total
        ) || 0
    );


  if (
    adminReportAIChart
  ) {
    adminReportAIChart
      .destroy();
  }


  adminReportAIChart =
    new Chart(
      canvas,
      {
        type: "line",

        data: {
          labels,

          datasets: [
            {
              label:
                "AI Requests",

              data:
                values,

              borderColor:
                "#2e7d32",

              backgroundColor:
                "rgba(46, 125, 50, 0.10)",

              tension:
                0.3,

              pointRadius:
                4,

              fill:
                true
            }
          ]
        },

        options: {
          responsive:
            true,

          maintainAspectRatio:
            false,

          plugins: {
            legend: {
              display:
                false
            }
          },

          scales: {
            y: {
              beginAtZero:
                true,

              ticks: {
                precision:
                  0
              }
            }
          }
        }
      }
    );
}


function applyAdminReportFilter() {
  const from =
    document.getElementById(
      "adminReportDateFrom"
    )?.value;


  const to =
    document.getElementById(
      "adminReportDateTo"
    )?.value;


  if (
    from &&
    to &&
    from > to
  ) {
    alert(
      "The From date cannot be later than the To date."
    );

    return;
  }


  loadAdminReports();
}


function resetAdminReportFilter() {
  const from =
    document.getElementById(
      "adminReportDateFrom"
    );


  const to =
    document.getElementById(
      "adminReportDateTo"
    );


  if (from) {
    from.value = "";
  }


  if (to) {
    to.value = "";
  }


  loadAdminReports();
}

function updateAdminReportPeriod() {
  const period =
    document.getElementById(
      "adminReportPeriod"
    );

  if (!period) {
    return;
  }

  const from =
    document.getElementById(
      "adminReportDateFrom"
    )?.value || "";

  const to =
    document.getElementById(
      "adminReportDateTo"
    )?.value || "";

  if (!from && !to) {
    period.textContent =
      "Showing: All Time";

    return;
  }

  if (from && to) {
    period.textContent =
      `Showing: ${formatAdminDate(from)} - ${formatAdminDate(to)}`;

    return;
  }

  if (from) {
    period.textContent =
      `Showing: From ${formatAdminDate(from)}`;

    return;
  }

  period.textContent =
    `Showing: Until ${formatAdminDate(to)}`;
}

function exportAdminReport(type) {
  if (
    String(type).toUpperCase() !== "CSV"
  ) {
    return;
  }

  const from =
    document.getElementById(
      "adminReportDateFrom"
    )?.value || "All Time";

  const to =
    document.getElementById(
      "adminReportDateTo"
    )?.value || "All Time";


  const rows = [
    ["SmartCoop Reports & Analytics"],

    [],

    [
      "Date From",
      from
    ],

    [
      "Date To",
      to
    ],

    [],

    [
      "SUMMARY"
    ],

    [
      "Metric",
      "Value"
    ],

    [
      "Total Users",
      adminReportsData.stats.totalUsers || 0
    ],

    [
      "Total Coop Projects",
      adminReportsData.stats.totalProjects || 0
    ],

    [
      "Total Farm Records",
      adminReportsData.stats.totalRecords || 0
    ],

    [
      "Total AI Requests",
      adminReportsData.stats.totalAIRequests || 0
    ],

    [],

    [
      "FEATURE USAGE"
    ],

    [
      "Feature",
      "Usage"
    ],

    [
      "Coop Planner",
      `${adminReportsData.usage.planner || 0}%`
    ],

    [
      "Record Management",
      `${adminReportsData.usage.records || 0}%`
    ],

    [
      "AI Features",
      `${adminReportsData.usage.ai || 0}%`
    ],

    [],

    [
      "RECORD ACTIVITY"
    ],

    [
      "Record Type",
      "Total"
    ]
  ];


  adminReportsData
    .recordBreakdown
    .forEach(item => {
      rows.push([
        item.label || "-",
        item.total || 0
      ]);
    });


  rows.push(
    [],
    ["USER REGISTRATION GROWTH"],
    ["Month", "New Users"]
  );


  adminReportsData
    .userGrowth
    .forEach(item => {
      rows.push([
        item.month || "-",
        item.total || 0
      ]);
    });


  rows.push(
    [],
    ["PROJECT GROWTH"],
    ["Month", "Projects Created"]
  );


  adminReportsData
    .projectGrowth
    .forEach(item => {
      rows.push([
        item.month || "-",
        item.total || 0
      ]);
    });


  rows.push(
    [],
    ["AI USAGE TREND"],
    ["Month", "AI Requests"]
  );


  adminReportsData
    .aiGrowth
    .forEach(item => {
      rows.push([
        item.month || "-",
        item.total || 0
      ]);
    });


  const csv =
    rows
      .map(row =>
        row
          .map(value =>
            `"${String(
              value ?? ""
            ).replaceAll(
              '"',
              '""'
            )}"`
          )
          .join(",")
      )
      .join("\n");


  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;


  link.download =
    `SmartCoop-Report-${
      new Date()
        .toISOString()
        .slice(0, 10)
    }.csv`;


  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
}
    
    function setTopbarText() {
      const el = document.getElementById("topbarText");
      if (!el) return;

      const path = window.location.pathname;
      const isAdmin = path.includes("admin");

      if (isAdmin) {
        if (path.includes("dashboard")) el.textContent = "Dashboard";
        else if (path.includes("users")) el.textContent = "Manage Users";
        else if (path.includes("reports")) el.textContent = "Reports & Analytics";
        else el.textContent = "Admin Panel";
      } else {
        el.textContent = "Smart Poultry Planning and Management System";
      }
    }
    function setGreeting() {
      const el = document.getElementById("greetingText");
      if (!el) return;

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const hour = new Date().getHours();
      let greeting = "Hello";

      if (hour < 12) greeting = "Good morning";
      else if (hour < 18) greeting = "Good afternoon";
      else greeting = "Good evening";

      el.textContent = `${greeting}, ${user.name || "User"}!`;
    }

    document.addEventListener("DOMContentLoaded", setGreeting);

    document.addEventListener("DOMContentLoaded", setTopbarText);

    setupLandingPage();

    if (window.lucide) {
      lucide.createIcons();
    }

    const featureInfo = {
      'coop': {
        title: '3D Coop Planner',
        desc: 'Experience our interactive 3D Decision Support tool. It helps you design your poultry house with precision, ensuring the right dimensions and housing density for a healthier flock.',
        img: 'img/1x1.png'
      },
      'estimator': {
        title: 'Cost Estimator',
        desc: 'Avoid financial surprises. Our system automatically calculates the estimated budget for materials, bird stocks, and initial feed requirements based on your plan.',
        img: 'img/Cost Estimator.png'
      },
      'health': {
        title: 'AI Health Checker',
        desc: 'Keep your flock safe with AI-powered guidance. Input symptoms and receive instant preliminary health advice and management tips to prevent disease spread.',
        img: 'img/AI Health Checker.png'
      },
      'breed': {
        title: 'Breed Recommendation',
        desc: 'Not sure which chicken to raise? Our system suggests the best breeds based on your climate, available space, and production goals—whether for eggs or meat.',
        img: 'img/Breed Recommendation.png'
      },
      'reports': {
        title: 'Reports & Analytics',
        desc: 'Make data-driven decisions. Monitor your farm performance through visual reports on mortality rates, egg production, and overall expenses.',
        img: 'img/Reports.png'
      },
      'alerts': {
        title: 'Smart Alerts',
        desc: 'Stay on top of your farm tasks. Receive real-time reminders for feeding schedules, coop cleaning, and vital vaccination dates to ensure zero missed tasks.',
        img: 'img/Alerts.png'
      }
    };

    function showFeature(key) {
      const display = document.getElementById('feature-display');
      const title = document.getElementById('feat-title');
      const desc = document.getElementById('feat-desc');
      const img = document.getElementById('feat-img');

      if (featureInfo[key]) {
        title.innerText = featureInfo[key].title;
        desc.innerText = featureInfo[key].desc;
        img.src = featureInfo[key].img;

        display.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    }

    function closeFeature() {
      const display = document.getElementById('feature-display');
      display.style.display = 'none';
      document.body.style.overflow = 'auto';
    }


    window.onclick = function (event) {
      const display = document.getElementById('feature-display');
      if (event.target == display) {
        closeFeature();
      }
    }

    document.addEventListener("DOMContentLoaded", function () {
      if (typeof lucide !== 'undefined') { lucide.createIcons(); }

    });

function openDashboardModel() {
  const plan = window.dashboardActiveProject;

  if (!plan) {
    alert("No active coop project found.");
    return;
  }

  const sizeKey = String(plan.CoopSize || "")
    .trim()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/meters?/g, "")
    .replace(/m/g, "");

  const chickenType = String(plan.ChickenType || "")
    .trim()
    .toLowerCase();

  let typeData = null;

  if (chickenType.includes("broiler")) {
    typeData = {
      folder: "Broilers",
      name: "Broiler"
    };
  } else if (chickenType.includes("layer")) {
    typeData = {
      folder: "Layers",
      name: "Layer"
    };
  } else if (chickenType.includes("dual")) {
    typeData = {
      folder: "Dual Purpose",
      name: "Dual Purpose"
    };
  }

  if (!typeData) {
    alert(`3D model not available for ${plan.ChickenType}.`);
    return;
  }

  if (!sizeKey) {
    alert("Coop size not found.");
    return;
  }

  const modelPath =
    `${typeData.folder}/${sizeKey} ${typeData.name}.glb`;

  let modal =
    document.getElementById("dashboardModelModal");

  if (!modal) {
    modal = document.createElement("div");

    modal.id = "dashboardModelModal";
    modal.className = "dashboard-view-modal hidden";

    modal.innerHTML = `
      <div class="dashboard-view-modal-card dashboard-model-card">

        <div class="dashboard-modal-header">

          <div>
            <span class="dashboard-modal-eyebrow">
              3D COOP MODEL
            </span>

            <h2 id="dashboardModelTitle">
              Coop Model
            </h2>

            <p id="dashboardModelSubtitle"></p>
          </div>

          <button
            type="button"
            class="dashboard-modal-close"
            onclick="closeDashboardModel()">
            <i data-lucide="x"></i>
          </button>

        </div>

        <div
          id="dashboardModelContainer"
          class="dashboard-model-container">
        </div>

        <div class="dashboard-model-hints">

          <span>
            <i data-lucide="rotate-3d"></i>
            Drag to rotate
          </span>

          <span>
            <i data-lucide="zoom-in"></i>
            Scroll to zoom
          </span>

        </div>

      </div>
    `;

    document.body.appendChild(modal);
  }

  document.getElementById(
    "dashboardModelTitle"
  ).textContent =
    plan.CoopName || "Coop Model";

  document.getElementById(
    "dashboardModelSubtitle"
  ).textContent =
    `${plan.ChickenType} • ${sizeKey} Coop`;

  document.getElementById(
    "dashboardModelContainer"
  ).innerHTML = `
    <model-viewer
      src="${modelPath}"
      camera-controls
      auto-rotate
      shadow-intensity="1"
      exposure="1"
      environment-image="neutral"
      style="width:100%;height:100%;">
    </model-viewer>
  `;

  modal.classList.remove("hidden");

  console.log("ACTIVE PROJECT:", plan);
  console.log("MODEL PATH:", modelPath);

  if (window.lucide) {
    lucide.createIcons();
  }

  console.log("Dashboard model:", modelPath);
}

function closeDashboardModel() {
  const modal =
    document.getElementById("dashboardModelModal");

  if (modal) {
    modal.classList.add("hidden");
  }
}


function openDashboardCosts() {
  const plan = window.dashboardActiveProject;

  if (!plan) {
    alert("No active coop project found.");
    return;
  }

  const sizeKey = String(plan.CoopSize || "")
    .trim()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/meters?/g, "")
    .replace(/m/g, "");

  const chickens =
    Number(plan.NumberOfChickens) || 0;

  const coopCosts = {
    "1x1": 8000,
    "2x2": 14000,
    "3x3": 19000,
    "4x4": 27000,
    "5x5": 35000,
    "6x6": 45000,
    "7x7": 56000,
    "8x8": 68000,
    "9x9": 82000,
    "10x10": 98000
  };

  const coopCost = coopCosts[sizeKey];

  if (!coopCost) {
    alert(
      `Cost information not available for ${sizeKey}.`
    );
    return;
  }

  const chickPrice = 60;

  const construction =
    Math.round(coopCost * 0.55);

  const feeders =
    Math.round(coopCost * 0.10);

  const waterers =
    Math.round(coopCost * 0.08);

  const perches =
    Math.round(coopCost * 0.07);

  const lighting =
    Math.round(coopCost * 0.08);

  const ventilation =
    Math.round(coopCost * 0.12);

  const chickenCost =
    chickens * chickPrice;

  const total =
    coopCost + chickenCost;

  let modal =
    document.getElementById("dashboardCostModal");

  if (!modal) {
    modal = document.createElement("div");

    modal.id = "dashboardCostModal";
    modal.className = "dashboard-view-modal hidden";

    modal.innerHTML = `
      <div class="dashboard-view-modal-card dashboard-cost-card">

        <div class="dashboard-modal-header">

          <div>
            <span class="dashboard-modal-eyebrow">
              COST ESTIMATOR
            </span>

            <h2>Estimated Setup Cost</h2>

            <p id="dashboardCostSubtitle"></p>
          </div>

          <button
            type="button"
            class="dashboard-modal-close"
            onclick="closeDashboardCosts()">
            <i data-lucide="x"></i>
          </button>

        </div>

        <div class="dashboard-cost-table-wrap">

          <table class="dashboard-cost-table">

            <thead>
              <tr>
                <th>Item</th>
                <th>Estimated Cost</th>
              </tr>
            </thead>

            <tbody id="dashboardCostTableBody"></tbody>

          </table>

        </div>

        <div class="dashboard-cost-total">

          <div>
            <small>TOTAL ESTIMATED COST</small>
            <strong>Total Setup Investment</strong>
          </div>

          <strong id="dashboardTotalCost">
            ₱0
          </strong>

        </div>

      </div>
    `;

    document.body.appendChild(modal);
  }

  document.getElementById(
    "dashboardCostSubtitle"
  ).textContent =
    `${sizeKey} Coop • ${chickens} chickens`;

  document.getElementById(
    "dashboardCostTableBody"
  ).innerHTML = `
    <tr>
      <td>Coop Construction</td>
      <td>₱${construction.toLocaleString()}</td>
    </tr>

    <tr>
      <td>Feeders</td>
      <td>₱${feeders.toLocaleString()}</td>
    </tr>

    <tr>
      <td>Waterers</td>
      <td>₱${waterers.toLocaleString()}</td>
    </tr>

    <tr>
      <td>Perches & Interior Setup</td>
      <td>₱${perches.toLocaleString()}</td>
    </tr>

    <tr>
      <td>Lighting System</td>
      <td>₱${lighting.toLocaleString()}</td>
    </tr>

    <tr>
      <td>Ventilation System</td>
      <td>₱${ventilation.toLocaleString()}</td>
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

  document.getElementById(
    "dashboardTotalCost"
  ).textContent =
    `₱${total.toLocaleString()}`;

  modal.classList.remove("hidden");

  if (window.lucide) {
    lucide.createIcons();
  }

  console.log("Dashboard cost size:", sizeKey);
}

function closeDashboardCosts() {
  const modal =
    document.getElementById("dashboardCostModal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

async function handleGoogleCredential(response) {
  if (!response || !response.credential) {
    showGoogleAuthError(
      "Google did not return a valid credential."
    );

    return;
  }


  try {
    const result =
      await fetch(
        "/api/auth/google",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            credential:
              response.credential
          })
        }
      );


    const data =
      await result.json();


    if (
      !result.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
        "Google authentication failed."
      );
    }


    localStorage.setItem(
      "user",
      JSON.stringify(
        data.user
      )
    );


    localStorage.setItem(
      "smartcoop_user",
      JSON.stringify(
        data.user
      )
    );

const userRole =
  String(
    data.user.role ||
    data.user.Role ||
    ""
  ).toLowerCase();

if (userRole === "admin") {
  localStorage.removeItem("user");
  localStorage.removeItem(
    SMARTCOOP_USER_KEY
  );

  window.location.href =
    "admin-login.html";

  return;

} else if (
  data.user.onboardingCompleted
) {
  window.location.href =
    "user.html";

} else {
  window.location.href =
    "onboarding.html";
}

  } catch (error) {
    console.error(
      "GOOGLE LOGIN ERROR:",
      error
    );


    showGoogleAuthError(
      error.message ||
      "Google authentication failed."
    );
  }
}


function showGoogleAuthError(message) {
  const loginError =
    document.getElementById(
      "loginError"
    );


  const signupError =
    document.getElementById(
      "signupError"
    );


  const target =
    loginError ||
    signupError;


  if (target) {
    target.textContent =
      message;

    target.classList.remove(
      "hidden"
    );

    return;
  }


  alert(message);
}