
(function () {
  let selectedRating = 0;
  let previousFocus = null;
  let isSubmitting = false;
  let isSubmitted = false;

  const ratingLabels = [
    "",
    "Poor",
    "Fair",
    "Good",
    "Very Good",
    "Excellent"
  ];

  function initializeFeedback() {
    if (document.getElementById("feedbackFab")) return;

    const container = document.createElement("div");

    container.innerHTML = `
      <button
        type="button"
        class="feedback-fab"
        id="feedbackFab"
        aria-label="Send Feedback"
        title="Share your feedback"
      >
        <i data-lucide="message-square-plus"></i>
      </button>

      <div
        class="feedback-overlay"
        id="feedbackOverlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedbackTitle"
        aria-hidden="true"
      >
        <div class="feedback-panel">

          <div class="feedback-header">
            <div class="feedback-heading">
              <div class="feedback-heading-icon">
                <i data-lucide="message-circle-heart"></i>
              </div>

              <div>
                <h2 id="feedbackTitle">Share Your Feedback</h2>
                <p>Your opinion helps us make SmartCoop better.</p>
              </div>
            </div>

            <button
              type="button"
              class="feedback-close"
              id="feedbackClose"
              aria-label="Close feedback"
            >×</button>
          </div>

          <form id="feedbackForm" novalidate>

            <div class="feedback-rating-section">
              <label class="feedback-label">
                How was your experience?
              </label>

              <p class="feedback-helper">
                Rate your overall experience using SmartCoop.
              </p>

              <div
                class="feedback-rating"
                id="feedbackRating"
                role="group"
                aria-label="Experience rating"
              >
                ${[1, 2, 3, 4, 5].map(value => `
                  <button
                    type="button"
                    class="feedback-star"
                    data-rating="${value}"
                    aria-label="${value} star${value > 1 ? "s" : ""}"
                    aria-pressed="false"
                  >★</button>
                `).join("")}
              </div>

              <p
                class="feedback-rating-label"
                id="feedbackRatingLabel"
                aria-live="polite"
              >
                Select your rating
              </p>
            </div>

            <div class="feedback-field">
              <label
                class="feedback-label"
                for="feedbackCategory"
              >
                Feedback Category
              </label>

              <select
                id="feedbackCategory"
                class="feedback-select"
                required
              >
                <option value="" disabled selected>
                  Select a category
                </option>
                <option value="Bug Report">Bug Report</option>
                <option value="Suggestion">Suggestion</option>
                <option value="General Feedback">General Feedback</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div class="feedback-field">
              <div class="feedback-message-heading">
                <label
                  class="feedback-label"
                  for="feedbackMessage"
                >
                  Your Feedback
                </label>

                <span
                  class="feedback-counter"
                  id="feedbackCounter"
                >
                  0 / 2000
                </span>
              </div>

              <textarea
                id="feedbackMessage"
                class="feedback-textarea"
                placeholder="Tell us about your experience, suggestions, or issues..."
                maxlength="2000"
                required
              ></textarea>
            </div>

            <div class="feedback-page-info">
              <i data-lucide="info"></i>
              <span id="feedbackPageInfo"></span>
            </div>

            <button
              type="submit"
              class="feedback-submit"
              id="feedbackSubmit"
            >
              <i data-lucide="send"></i>
              <span id="feedbackSubmitText">Submit Feedback</span>
            </button>

            <p
              class="feedback-status"
              id="feedbackStatus"
              role="status"
              aria-live="polite"
            ></p>

          </form>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const fab = document.getElementById("feedbackFab");
    const overlay = document.getElementById("feedbackOverlay");
    const closeButton = document.getElementById("feedbackClose");
    const form = document.getElementById("feedbackForm");
    const status = document.getElementById("feedbackStatus");
    const stars = Array.from(
      container.querySelectorAll(".feedback-star")
    );
    const category = document.getElementById("feedbackCategory");
    const message = document.getElementById("feedbackMessage");
    const counter = document.getElementById("feedbackCounter");
    const ratingLabel = document.getElementById("feedbackRatingLabel");
    const pageInfo = document.getElementById("feedbackPageInfo");
    const submitButton = document.getElementById("feedbackSubmit");
    const submitText = document.getElementById("feedbackSubmitText");

    const pageName =
      document.title.split("|")[0].trim() || "SmartCoop";

    pageInfo.textContent = `Feedback from: ${pageName}`;

    function updateStars() {
      stars.forEach(star => {
        const value = Number(star.dataset.rating);
        const active = value <= selectedRating;

        star.classList.toggle("selected", active);
        star.setAttribute(
          "aria-pressed",
          String(value === selectedRating)
        );
      });

      ratingLabel.textContent = selectedRating
        ? `${ratingLabels[selectedRating]} · ${selectedRating}/5`
        : "Select your rating";
    }

    function hasUnsavedFeedback() {
      if (isSubmitted) return false;

      return (
        selectedRating > 0 ||
        category.value !== "" ||
        message.value.trim() !== ""
      );
    }

    function clearStatus() {
      if (isSubmitting) return;

      status.textContent = "";
      status.className = "feedback-status";
    }

    function showError(text) {
      status.textContent = text;
      status.className = "feedback-status error";
    }

    function showSuccess(text) {
      status.textContent = text;
      status.className = "feedback-status success";
    }

    function setSubmitting(loading) {
      isSubmitting = loading;

      submitButton.disabled = loading;
      submitText.textContent = loading
        ? "Submitting..."
        : "Submit Feedback";

      submitButton.classList.toggle("loading", loading);

      stars.forEach(star => {
        star.disabled = loading;
      });

      category.disabled = loading;
      message.disabled = loading;
      closeButton.disabled = loading;
    }

    function resetFeedback() {
      form.reset();

      selectedRating = 0;
      isSubmitted = false;

      updateStars();

      counter.textContent = "0 / 2000";

      status.textContent = "";
      status.className = "feedback-status";
    }

    function openFeedback() {
      if (isSubmitting) return;

      previousFocus = document.activeElement;

      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");

      document.body.style.overflow = "hidden";

      closeButton.focus();
    }

    function closeFeedback(force = false) {
      if (isSubmitting) return;

      if (!force && hasUnsavedFeedback()) {
        const discard = window.confirm(
          "You have unsent feedback. Do you want to discard it?"
        );

        if (!discard) return;
      }

      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");

      document.body.style.overflow = "";

      resetFeedback();

      if (previousFocus && previousFocus.isConnected) {
        previousFocus.focus();
      } else {
        fab.focus();
      }
    }

    fab.addEventListener("click", openFeedback);

    closeButton.addEventListener("click", () => {
      closeFeedback();
    });

    overlay.addEventListener("click", event => {
      if (event.target === overlay) {
        closeFeedback();
      }
    });

    document.addEventListener("keydown", event => {
      if (!overlay.classList.contains("open")) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeFeedback();
        return;
      }

      if (event.key === "Tab") {
        const focusable = Array.from(
          overlay.querySelectorAll(
            'button:not(:disabled), select:not(:disabled), textarea:not(:disabled)'
          )
        );

        if (!focusable.length) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (
          event.shiftKey &&
          document.activeElement === first
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    stars.forEach(star => {
      star.addEventListener("click", () => {
        if (isSubmitting) return;

        selectedRating = Number(star.dataset.rating);
        isSubmitted = false;

        updateStars();
        clearStatus();
      });
    });

    message.addEventListener("input", () => {
      counter.textContent =
        `${message.value.length} / 2000`;

      isSubmitted = false;
      clearStatus();
    });

    category.addEventListener("change", () => {
      isSubmitted = false;
      clearStatus();
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (isSubmitting) return;

      if (!selectedRating) {
        showError("Please select a star rating.");
        stars[0].focus();
        return;
      }

      if (!category.value) {
        showError("Please select a feedback category.");
        category.focus();
        return;
      }

      const feedbackMessage = message.value.trim();

      if (!feedbackMessage) {
        showError("Please enter your feedback message.");
        message.focus();
        return;
      }

      if (feedbackMessage.length > 2000) {
        showError("Feedback cannot exceed 2000 characters.");
        message.focus();
        return;
      }

      const feedbackData = {
        rating: selectedRating,
        category: category.value,
        message: feedbackMessage,
        page: pageName
      };

      clearStatus();
      setSubmitting(true);

      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(feedbackData)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
            "Unable to submit feedback. Please try again."
          );
        }

        isSubmitted = true;

        // Clear the saved form only after a successful response.
        form.reset();
        selectedRating = 0;
        updateStars();
        counter.textContent = "0 / 2000";

        showSuccess(
          result.message ||
          "Thank you! Your feedback has been submitted."
        );

      } catch (error) {
        console.error("FEEDBACK SUBMISSION ERROR:", error);

        showError(
          error.message ||
          "Unable to submit feedback. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeFeedback
    );
  } else {
    initializeFeedback();
  }
})();
