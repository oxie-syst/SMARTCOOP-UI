const onboardingSlides = [
  {
    icon: "sprout",
    step: "01 — Welcome",
    title: "Welcome to SmartCoop",
    tagline: "Smarter Poultry Management Starts Here",
    description:
      "SmartCoop provides an integrated platform for planning, managing, and monitoring poultry operations.",
    benefit:
      "Explore the key features designed to support informed decisions throughout your poultry management journey.",
    connection:
      "Begin by building a strong foundation with Chicken Information."
  },

  {
    icon: "book-open",
    step: "02 — Learn",
    title: "Chicken Information",
    tagline: "Build a Strong Foundation",
    description:
      "Access essential information about chicken breeds, growth stages, nutrition, housing, sanitation, biosecurity, and production.",
    benefit:
      "Understanding these fundamentals helps you make better decisions before planning your poultry setup.",
    connection:
      "Next, use Breed Recommendation to identify breeds suited to your goals and farm conditions."
  },

  {
    icon: "search",
    step: "03 — Choose",
    title: "Breed Recommendation",
    tagline: "Choose with Confidence",
    description:
      "Receive breed recommendations based on your production goals, available space, and farm conditions.",
    benefit:
      "Use these recommendations as a starting point when selecting breeds suitable for your planned poultry operation.",
    connection:
      "Save promising options so you can review and compare them before making a decision."
  },

  {
    icon: "bookmark",
    step: "04 — Save",
    title: "Saved Recommendations",
    tagline: "Keep Important Options Within Reach",
    description:
      "Store selected breed recommendations in one place for easy access whenever you need to review them.",
    benefit:
      "Saved recommendations make it easier to compare your options and continue planning without repeating previous steps.",
    connection:
      "Once you have a suitable breed in mind, continue to Coop Planner to prepare your setup."
  },

  {
    icon: "house",
    step: "05 — Plan",
    title: "Coop Planner",
    tagline: "Plan Before You Build",
    description:
      "Plan your coop based on flock size and available space, review estimated costs, and visualize supported layouts using the 3D preview.",
    benefit:
      "A well-planned setup provides a more organized foundation for managing your poultry operation.",
    connection:
      "After planning your setup, use Record Management to keep track of your farm activities."
  },

  {
    icon: "clipboard-list",
    step: "06 — Record",
    title: "Record Management",
    tagline: "Keep Your Farm Data Organized",
    description:
      "Maintain records for chicken inventory, egg production, meat production, expenses, and mortality in one centralized location.",
    benefit:
      "Consistent record keeping gives you reliable information that can support monitoring and future decisions.",
    connection:
      "Your recorded data will also serve as the foundation for Reports and Analytics."
  },

  {
    icon: "bot",
    step: "07 — Ask",
    title: "AI Assistant",
    tagline: "Guidance When You Need It",
    description:
      "Use the AI Assistant to ask poultry-related questions and receive clear, beginner-friendly information.",
    benefit:
      "It provides additional guidance while you explore SmartCoop and manage common poultry-related concerns.",
    connection:
      "For concerns involving observed health signs, continue to the Health Checker."
  },

  {
    icon: "stethoscope",
    step: "08 — Monitor",
    title: "Health Checker",
    tagline: "Support Early Health Monitoring",
    description:
      "Enter observed symptoms to receive AI-supported preliminary guidance and possible health considerations.",
    benefit:
      "The Health Checker can support early awareness, but serious, worsening, or uncertain conditions should be evaluated by a qualified poultry professional.",
    connection:
      "Stay consistent with important activities using Alerts and Reminders."
  },

  {
    icon: "bell-ring",
    step: "09 — Stay Updated",
    title: "Alerts & Reminders",
    tagline: "Stay on Schedule",
    description:
      "Organize reminders for feeding, cleaning, health checks, and other important poultry management activities.",
    benefit:
      "Scheduled reminders help maintain a consistent routine and reduce the chance of overlooking important tasks.",
    connection:
      "As your farm records grow, use Reports and Analytics to review overall performance."
  },

  {
    icon: "bar-chart-3",
    step: "10 — Analyze",
    title: "Reports & Analytics",
    tagline: "Turn Records Into Useful Insights",
    description:
      "View organized summaries of important farm data including chicken inventory, egg production, expenses, and mortality.",
    benefit:
      "Reports make it easier to understand recorded information and review the overall performance of your poultry operation.",
    connection:
      "You have now explored the complete SmartCoop management workflow."
  },

  {
    icon: "check-circle",
    step: "11 — Get Started",
    title: "You're Ready to Begin",
    tagline: "Learn. Plan. Manage. Monitor. Improve.",
    description:
      "You now understand how SmartCoop's core features work together to support your poultry management journey.",
    benefit:
      "Start with the information you need, plan your setup, maintain accurate records, monitor your flock, and use your data to support better decisions.",
    connection:
      "Your SmartCoop dashboard is ready."
  }
];

let currentSlide = 0;

const slideIcon =
  document.getElementById("slideIcon");

const slideStep =
  document.getElementById("slideStep");

const slideTitle =
  document.getElementById("slideTitle");

const slideTagline =
  document.getElementById("slideTagline");

const slideDescription =
  document.getElementById("slideDescription");

const slideBenefit =
  document.getElementById("slideBenefit");

const slideConnection =
  document.getElementById("slideConnection");

const slideCounter =
  document.getElementById("slideCounter");

const progressContainer =
  document.getElementById("onboardingProgress");

const backButton =
  document.getElementById("backSlideBtn");

const nextButton =
  document.getElementById("nextSlideBtn");

const skipButton =
  document.getElementById("skipOnboardingBtn");

const skipModal =
  document.getElementById("skipOnboardingModal");

const cancelSkipButton =
  document.getElementById("cancelSkipBtn");

const confirmSkipButton =
  document.getElementById("confirmSkipBtn");


function getCurrentUser() {
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
      "Unable to read current user:",
      error
    );

    return null;
  }
}


function createProgressDots() {
  progressContainer.innerHTML = "";

  onboardingSlides.forEach(
    (_, index) => {
      const dot =
        document.createElement("span");

      dot.classList.add(
        "onboarding-progress-dot"
      );

      if (index < currentSlide) {
        dot.classList.add("completed");
      }

      if (index === currentSlide) {
        dot.classList.add("active");
      }

      progressContainer.appendChild(dot);
    }
  );
}


function renderSlide() {
  const slide =
    onboardingSlides[currentSlide];

  slideIcon.setAttribute(
    "data-lucide",
    slide.icon
  );

  slideStep.textContent =
    slide.step;

  slideTitle.textContent =
    slide.title;

  slideTagline.textContent =
    slide.tagline;

  slideDescription.textContent =
    slide.description;

  slideBenefit.textContent =
    slide.benefit;

  slideConnection.textContent =
    slide.connection;

  slideCounter.textContent =
    `${currentSlide + 1} of ${onboardingSlides.length}`;

  if (currentSlide === 0) {
    backButton.classList.add("hidden");
  } else {
    backButton.classList.remove("hidden");
  }

  const isLastSlide =
    currentSlide ===
    onboardingSlides.length - 1;

  if (isLastSlide) {
    nextButton.innerHTML = `
      Go to Dashboard
      <i data-lucide="arrow-right"></i>
    `;

    skipButton.classList.add("hidden");
  } else {
    nextButton.innerHTML = `
      Next
      <i data-lucide="arrow-right"></i>
    `;

    skipButton.classList.remove("hidden");
  }

  createProgressDots();

  if (window.lucide) {
    lucide.createIcons();
  }
}


async function completeOnboarding() {
  const user = getCurrentUser();

  if (!user) {
    window.location.href =
      "login.html";

    return;
  }

  const userId =
    user.id || user.UserID;

  if (!userId) {
    window.location.href =
      "login.html";

    return;
  }

  nextButton.disabled = true;
  confirmSkipButton.disabled = true;

  const originalNextContent =
    nextButton.innerHTML;

  nextButton.innerHTML = `
    Please wait...
  `;

  try {
    const response = await fetch(
      `/api/auth/onboarding/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        }
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
        "Unable to complete onboarding."
      );
    }

    user.onboardingCompleted = true;
    user.OnboardingCompleted = true;

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    localStorage.setItem(
      "smartcoop_user",
      JSON.stringify(user)
    );

    window.location.href =
      "user.html";

  } catch (error) {
    console.error(
      "ONBOARDING ERROR:",
      error
    );

    alert(
      "We couldn't save your onboarding progress. Please try again."
    );

    nextButton.disabled = false;
    confirmSkipButton.disabled = false;

    nextButton.innerHTML =
      originalNextContent;

    if (window.lucide) {
      lucide.createIcons();
    }
  }
}


function nextSlide() {
  if (
    currentSlide <
    onboardingSlides.length - 1
  ) {
    currentSlide++;
    renderSlide();
    return;
  }

  completeOnboarding();
}


function previousSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    renderSlide();
  }
}


nextButton.addEventListener(
  "click",
  nextSlide
);


backButton.addEventListener(
  "click",
  previousSlide
);


skipButton.addEventListener(
  "click",
  () => {
    skipModal.classList.remove("hidden");
  }
);


cancelSkipButton.addEventListener(
  "click",
  () => {
    skipModal.classList.add("hidden");
  }
);


confirmSkipButton.addEventListener(
  "click",
  () => {
    skipModal.classList.add("hidden");

    completeOnboarding();
  }
);


skipModal.addEventListener(
  "click",
  (event) => {
    if (event.target === skipModal) {
      skipModal.classList.add("hidden");
    }
  }
);


document.addEventListener(
  "keydown",
  (event) => {
    const modalOpen =
      !skipModal.classList.contains(
        "hidden"
      );

    if (modalOpen) {
      if (event.key === "Escape") {
        skipModal.classList.add("hidden");
      }

      return;
    }

    if (event.key === "ArrowRight") {
      nextSlide();
    }

    if (event.key === "ArrowLeft") {
      previousSlide();
    }
  }
);


document.addEventListener(
  "DOMContentLoaded",
  () => {
    const user = getCurrentUser();

    if (!user) {
      window.location.href =
        "login.html";

      return;
    }

    const onboardingCompleted =
      user.onboardingCompleted === true ||
      user.OnboardingCompleted === true ||
      Number(user.onboardingCompleted) === 1 ||
      Number(user.OnboardingCompleted) === 1;

    if (onboardingCompleted) {
      window.location.href =
        "user.html";

      return;
    }

    renderSlide();
  }
);