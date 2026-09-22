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


  const email =
    document
      .getElementById(
        "settingsEmail"
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


  if (!email) {
    showSettingsToast(
      "Please enter your email address.",
      "error"
    );

    return;
  }


  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailValid.test(email)) {
    showSettingsToast(
      "Please enter a valid email address.",
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
            email,
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
    farmSize &&
    Number(farmSize) < 0
  ) {
    showSettingsToast(
      "Farm size cannot be negative.",
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
  const userId =
    getSettingsUserId();


  const confirmed =
    confirm(
      "Are you sure you want to permanently delete your SmartCoop account?"
    );


  if (!confirmed) {
    return;
  }


  const secondConfirm =
    confirm(
      "This will permanently remove your account and related records. Continue?"
    );


  if (!secondConfirm) {
    return;
  }


  try {
    const response =
      await fetch(
        `/api/settings/${userId}`,
        {
          method: "DELETE"
        }
      );


    const data =
      await response.json();


    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        "Failed to delete account."
      );
    }


    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "smartcoop_user"
    );


    sessionStorage.clear();


    alert(
      "Your account has been deleted."
    );


    window.location.href =
      "login.html";

  } catch (error) {
    console.error(
      "DELETE ACCOUNT ERROR:",
      error
    );

    showSettingsToast(
      error.message,
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