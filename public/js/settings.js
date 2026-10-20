function getSettingsUser() {
  const stored =
    localStorage.getItem("user") ||
    localStorage.getItem("smartcoop_user");

  if (!stored) {
    return {};
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}


function getSettingsUserId() {
  const user = getSettingsUser();

  return (
    user.UserID ||
    user.userId ||
    user.id
  );
}


async function loadSettingsPage() {
  const userId =
    getSettingsUserId();

  if (!userId) {
    showSettingsToast(
      "User session not found.",
      "error"
    );

    return;
  }

  try {
    const response =
      await fetch(
        `/api/settings/${userId}`
      );

    const data =
      await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Failed to load settings."
      );
    }

    const user =
      data.user || {};

    const notifications =
      data.notifications || {};


    document.getElementById(
      "settingsName"
    ).value =
      user.FullName || "";


    document.getElementById(
      "settingsEmail"
    ).value =
      user.Email || "";


    document.getElementById(
      "settingsPhone"
    ).value =
      user.PhoneNumber || "";


    document.getElementById(
      "settingsFarmName"
    ).value =
      user.FarmName || "";


    document.getElementById(
      "settingsFarmLocation"
    ).value =
      user.FarmLocation || "";


    document.getElementById(
      "settingsFarmSize"
    ).value =
      user.FarmSize ?? "";


    document.getElementById(
      "settingsProfileName"
    ).textContent =
      user.FullName ||
      "SmartCoop User";


    document.getElementById(
      "settingsProfileEmail"
    ).textContent =
      user.Email ||
      "user@smartcoop.com";


    const initials =
      createSettingsInitials(
        user.FullName
      );


    document.getElementById(
      "settingsAvatar"
    ).textContent =
      initials;


    document.getElementById(
      "emailAlerts"
    ).checked =
      Boolean(
        Number(
          notifications.EmailAlerts
        )
      );


    document.getElementById(
      "smsAlerts"
    ).checked =
      Boolean(
        Number(
          notifications.SMSAlerts
        )
      );


    document.getElementById(
      "pushNotifications"
    ).checked =
      Boolean(
        Number(
          notifications.PushNotifications
        )
      );


    document.getElementById(
      "weeklyReports"
    ).checked =
      Boolean(
        Number(
          notifications.WeeklyReports
        )
      );


    document.getElementById(
      "healthAlerts"
    ).checked =
      Boolean(
        Number(
          notifications.HealthAlerts
        )
      );


    document.getElementById(
      "feedingReminders"
    ).checked =
      Boolean(
        Number(
          notifications.FeedingReminders
        )
      );


    updateLocalUserFromDatabase(
      user
    );


    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (error) {
    console.error(
      "LOAD SETTINGS ERROR:",
      error
    );

    showSettingsToast(
      error.message ||
      "Failed to load settings.",
      "error"
    );
  }
}


function showSettingsTab(
  tabId,
  button
) {
  document
    .querySelectorAll(
      ".settings-tab"
    )
    .forEach(tab => {
      tab.classList.add(
        "hidden"
      );
    });


  const selected =
    document.getElementById(
      tabId
    );


  if (selected) {
    selected.classList.remove(
      "hidden"
    );
  }


  document
    .querySelectorAll(
      ".settings-menu-btn"
    )
    .forEach(btn => {
      btn.classList.remove(
        "active"
      );
    });


  if (button) {
    button.classList.add(
      "active"
    );
  }


  if (window.lucide) {
    lucide.createIcons();
  }
}


async function saveProfile() {
  const userId =
    getSettingsUserId();


  const fullName =
    document
      .getElementById(
        "settingsName"
      )
      .value
      .trim();

  const phoneNumber =
    document
      .getElementById(
        "settingsPhone"
      )
      .value
      .trim();


  if (!fullName) {
    showSettingsToast(
      "Please enter your full name.",
      "error"
    );

    return;
  }
  if (phoneNumber && !/^09\d{9}$/.test(phoneNumber)) {
    showSettingsToast(
      "Enter a valid 11-digit Philippine mobile number.",
      "error"
    );
    return;
  }

  const invalidPhoneNumbers = [
    "09123456789",
    "09876543210"
  ];

  if (invalidPhoneNumbers.includes(phoneNumber)) {
    showSettingsToast(
      "Please enter a valid phone number.",
      "error"
    );
    return;
  }

      try {
    const response =
      await fetch(
        `/api/settings/${userId}/profile`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            fullName,
            phoneNumber
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Failed to update profile."
      );
    }


    await loadSettingsPage();


    if (
      typeof loadUserInfo ===
      "function"
    ) {
      loadUserInfo();
    }


    showSettingsToast(
      data.message ||
      "Profile updated successfully."
    );

  } catch (error) {
    console.error(
      "SAVE PROFILE ERROR:",
      error
    );

    showSettingsToast(
      error.message,
      "error"
    );
  }
}


async function saveFarmInfo() {
  const userId =
    getSettingsUserId();


  const farmName =
    document
      .getElementById(
        "settingsFarmName"
      )
      .value
      .trim();


  const farmLocation =
    document
      .getElementById(
        "settingsFarmLocation"
      )
      .value
      .trim();


  const farmSize =
    document
      .getElementById(
        "settingsFarmSize"
      )
      .value;


  if (!farmName) {
    showSettingsToast(
      "Please enter your farm name.",
      "error"
    );

    return;
  }


if (
  farmSize !== "" &&
  (!Number.isFinite(Number(farmSize)) || Number(farmSize) <= 0)
) {
  showSettingsToast(
    "Farm size must be greater than 0 m².",
    "error"
  );

  return;
}

  try {
    const response =
      await fetch(
        `/api/settings/${userId}/farm`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },
        body: JSON.stringify({
          farmName,
          farmLocation,
          farmSize:
            farmSize === ""
              ? null
              : Number(farmSize)
        })
        }
      );


    const data =
      await response.json();


    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Failed to save farm information."
      );
    }


    await loadSettingsPage();


    showSettingsToast(
      data.message ||
      "Farm information saved successfully."
    );

  } catch (error) {
    console.error(
      "SAVE FARM ERROR:",
      error
    );

    showSettingsToast(
      error.message,
      "error"
    );
  }
}


async function saveNotifications() {
  const userId =
    getSettingsUserId();


  const payload = {
    emailAlerts:
      document.getElementById(
        "emailAlerts"
      ).checked,

    smsAlerts:
      document.getElementById(
        "smsAlerts"
      ).checked,

    pushNotifications:
      document.getElementById(
        "pushNotifications"
      ).checked,

    weeklyReports:
      document.getElementById(
        "weeklyReports"
      ).checked,

    healthAlerts:
      document.getElementById(
        "healthAlerts"
      ).checked,

    feedingReminders:
      document.getElementById(
        "feedingReminders"
      ).checked
  };


  try {
    const response =
      await fetch(
        `/api/settings/${userId}/notifications`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );


    const data =
      await response.json();


    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Failed to save notification preferences."
      );
    }


    showSettingsToast(
      data.message ||
      "Notification preferences saved."
    );

  } catch (error) {
    console.error(
      "SAVE NOTIFICATIONS ERROR:",
      error
    );

    showSettingsToast(
      error.message,
      "error"
    );
  }
}


async function updatePassword() {
  const userId =
    getSettingsUserId();


  const currentPassword =
    document.getElementById(
      "currentPassword"
    ).value;


  const newPassword =
    document.getElementById(
      "newPassword"
    ).value;


  const confirmPassword =
    document.getElementById(
      "confirmPassword"
    ).value;


  if (
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  ) {
    showSettingsToast(
      "Please complete all password fields.",
      "error"
    );

    return;
  }


  if (newPassword.length < 6) {
    showSettingsToast(
      "New password must contain at least 6 characters.",
      "error"
    );

    return;
  }


  if (
    newPassword !==
    confirmPassword
  ) {
    showSettingsToast(
      "New passwords do not match.",
      "error"
    );

    return;
  }


  if (
    currentPassword ===
    newPassword
  ) {
    showSettingsToast(
      "New password must be different from your current password.",
      "error"
    );

    return;
  }


  try {
    const response =
      await fetch(
        `/api/settings/${userId}/password`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Failed to update password."
      );
    }


    document.getElementById(
      "currentPassword"
    ).value = "";


    document.getElementById(
      "newPassword"
    ).value = "";


    document.getElementById(
      "confirmPassword"
    ).value = "";


    showSettingsToast(
      data.message ||
      "Password updated successfully."
    );

  } catch (error) {
    console.error(
      "UPDATE PASSWORD ERROR:",
      error
    );

    showSettingsToast(
      error.message,
      "error"
    );
  }
}

async function deleteAccount() {
  const userId = getSettingsUserId();

  if (!userId) {
    showSettingsToast("Please log in first.", "error");
    return;
  }

  const confirmed = confirm(
    "Are you sure you want to permanently delete your SmartCoop account? All related data will be lost."
  );

  if (!confirmed) return;

  const password = prompt(
    "Enter your current password to continue:"
  );

  if (password === null) return;

  if (!password.trim()) {
    showSettingsToast("Current password is required.", "error");
    return;
  }

  const confirmation = prompt(
    "Type DELETE to permanently delete your account:"
  );

  if (confirmation === null) return;

  if (confirmation !== "DELETE") {
    showSettingsToast(
      "Account deletion cancelled.",
      "error"
    );
    return;
  }

  const finalConfirmed = confirm(
    "FINAL WARNING: This action cannot be undone. Permanently delete your account?"
  );

  if (!finalConfirmed) return;

  try {
    const response = await fetch(
      `/api/settings/${userId}`,
      {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password,
          confirmation
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Failed to delete account."
      );
    }

    localStorage.removeItem("user");
    localStorage.removeItem("smartcoop_user");

    sessionStorage.clear();

    alert("Your SmartCoop account has been deleted.");

    window.location.replace("/login.html");

  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);

    showSettingsToast(
      error.message || "Failed to delete account.",
      "error"
    );
  }
}


function updateLocalUserFromDatabase(
  dbUser
) {
  const localUser =
    getSettingsUser();


  localUser.UserID =
    dbUser.UserID;


  localUser.id =
    dbUser.UserID;


  localUser.name =
    dbUser.FullName;


  localUser.FullName =
    dbUser.FullName;


  localUser.email =
    dbUser.Email;


  localUser.Email =
    dbUser.Email;


  localUser.phoneNumber =
    dbUser.PhoneNumber || "";


  localUser.PhoneNumber =
    dbUser.PhoneNumber || "";


  localUser.farmName =
    dbUser.FarmName || "";


  localUser.FarmName =
    dbUser.FarmName || "";


  localUser.farmLocation =
    dbUser.FarmLocation || "";


  localUser.FarmLocation =
    dbUser.FarmLocation || "";


  localUser.farmSize =
    dbUser.FarmSize ?? "";


  localUser.FarmSize =
    dbUser.FarmSize ?? "";


  const value =
    JSON.stringify(
      localUser
    );


  localStorage.setItem(
    "user",
    value
  );


  localStorage.setItem(
    "smartcoop_user",
    value
  );
}


function createSettingsInitials(
  name
) {
  if (!name) {
    return "U";
  }


  const parts =
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (!parts.length) {
    return "U";
  }


  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }


  return (
    parts[0].charAt(0) +
    parts[
      parts.length - 1
    ].charAt(0)
  ).toUpperCase();
}
function toggleSettingsPassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const showPassword = input.type === "password";

  input.type = showPassword ? "text" : "password";

  button.setAttribute(
    "aria-label",
    showPassword ? "Hide password" : "Show password"
  );

  button.innerHTML = showPassword
    ? '<i data-lucide="eye-off"></i>'
    : '<i data-lucide="eye"></i>';

  if (window.lucide) {
    lucide.createIcons();
  }
}


function showSettingsToast(
  message,
  type = "success"
) {
  const toast =
    document.getElementById(
      "settingsToast"
    );


  const text =
    document.getElementById(
      "settingsToastText"
    );


  if (!toast || !text) {
    alert(message);
    return;
  }


  text.textContent =
    message;


  toast.classList.toggle(
    "error",
    type === "error"
  );


  toast.classList.remove(
    "hidden"
  );


  setTimeout(() => {
    toast.classList.add(
      "hidden"
    );
  }, 2600);
}