const forgotPasswordForm =
  document.getElementById("forgotPasswordForm");

const resetPasswordForm =
  document.getElementById("resetPasswordForm");


if (forgotPasswordForm) {

  forgotPasswordForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        document
          .getElementById("resetEmail")
          .value
          .trim();

      const button =
        document.getElementById("sendCodeBtn");

      const errorElement =
        document.getElementById("forgotError");


      errorElement.classList.add("hidden");

      button.disabled = true;
      button.textContent = "Sending...";


      try {

        const response =
          await fetch(
            "/api/auth/forgot-password",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                email
              })
            }
          );


        const data =
          await response.json();


        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
            "Unable to send verification code."
          );
        }


        sessionStorage.setItem(
          "resetEmail",
          email
        );


        showToast(
          "Verification code sent!"
        );


        setTimeout(() => {
          window.location.href =
            "reset-password.html";
        }, 800);


      } catch (error) {

        errorElement.textContent =
          error.message;

        errorElement.classList.remove(
          "hidden"
        );

      } finally {

        button.disabled = false;
        button.textContent =
          "Send Verification Code";

      }

    }
  );

}


if (resetPasswordForm) {

  resetPasswordForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const email =
        sessionStorage.getItem(
          "resetEmail"
        );


      const code =
        document
          .getElementById("resetCode")
          .value
          .trim();


      const newPassword =
        document
          .getElementById("newPassword")
          .value;


      const confirmPassword =
        document
          .getElementById("confirmNewPassword")
          .value;


      const errorElement =
        document.getElementById(
          "resetError"
        );


      const button =
        document.getElementById(
          "resetPasswordBtn"
        );


      errorElement.classList.add("hidden");


      if (!email) {

        window.location.href =
          "forgot-password.html";

        return;

      }


      if (!/^\d{6}$/.test(code)) {

        showError(
          errorElement,
          "Please enter a valid 6-digit verification code."
        );

        return;

      }


      if (newPassword.length < 8) {

        showError(
          errorElement,
          "Password must be at least 8 characters."
        );

        return;

      }


      if (newPassword !== confirmPassword) {

        showError(
          errorElement,
          "Passwords do not match."
        );

        return;

      }


      button.disabled = true;
      button.textContent =
        "Resetting...";


      try {

        const verifyResponse =
          await fetch(
            "/api/auth/verify-reset-code",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                email,
                code
              })
            }
          );


        const verifyData =
          await verifyResponse.json();


        if (
          !verifyResponse.ok ||
          !verifyData.success
        ) {

          throw new Error(
            verifyData.message ||
            "Invalid verification code."
          );

        }


        const resetResponse =
          await fetch(
            "/api/auth/reset-password",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                email,
                code,
                newPassword
              })
            }
          );


        const resetData =
          await resetResponse.json();


        if (
          !resetResponse.ok ||
          !resetData.success
        ) {

          throw new Error(
            resetData.message ||
            "Unable to reset password."
          );

        }


        sessionStorage.removeItem(
          "resetEmail"
        );


        showToast(
          "Password reset successfully!"
        );


        setTimeout(() => {
          window.location.href =
            "login.html";
        }, 1000);


      } catch (error) {

        showError(
          errorElement,
          error.message
        );

      } finally {

        button.disabled = false;
        button.textContent =
          "Reset Password";

      }

    }
  );

}


function showError(element, message) {

  element.textContent = message;

  element.classList.remove(
    "hidden"
  );

}


function showToast(message) {

  const toast =
    document.getElementById("toast");


  if (!toast) {
    return;
  }


  toast.textContent = message;

  toast.classList.remove(
    "hidden"
  );


  setTimeout(() => {

    toast.classList.add(
      "hidden"
    );

  }, 2500);

}