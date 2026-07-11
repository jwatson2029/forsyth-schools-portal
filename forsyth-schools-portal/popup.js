/**
 * Forsyth Schools Portal — popup dashboard logic.
 * Reads local storage, renders welcome states, and opens school resource tabs.
 */

(function () {
  "use strict";

  const MIN_LOADING_MS = 150;

  const RESOURCES = [
    {
      id: "classlink",
      title: "ClassLink",
      description: "Open your school apps",
      url: "https://classlink.forsyth.k12.ga.us/",
      iconClass: "classlink",
      highlightWhen: "classlink-signin",
    },
    {
      id: "infinite-campus",
      title: "Infinite Campus",
      description: "View grades and attendance",
      url: "https://campus.forsyth.k12.ga.us/campus/apps/portal/student/home",
      iconClass: "infinite-campus",
    },
    {
      id: "canvas",
      title: "Canvas",
      description: "Access assignments",
      url: "https://forsyth.instructure.com/",
      iconClass: "canvas",
    },
    {
      id: "resources",
      title: "School Resources",
      description: "District links and info",
      url: "https://www.forsyth.k12.ga.us/",
      iconClass: "resources",
    },
  ];

  const ICONS = {
    classlink: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    "infinite-campus": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    canvas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
    resources: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  };

  const loadingEl = document.getElementById("loading-state");
  const welcomeContentEl = document.getElementById("welcome-content");
  const welcomeHeadingEl = document.getElementById("welcome-heading");
  const welcomeMessageEl = document.getElementById("welcome-message");
  const errorEl = document.getElementById("error-state");
  const cardsGridEl = document.getElementById("cards-grid");

  let loadStartTime = Date.now();

  /**
   * Open a resource URL in a new tab.
   */
  function openResource(url) {
    chrome.tabs.create({ url });
  }

  /**
   * Render dashboard resource cards.
   */
  function renderCards(highlightId) {
    cardsGridEl.innerHTML = "";

    RESOURCES.forEach((resource) => {
      const card = document.createElement("article");
      card.className = "resource-card";
      if (resource.id === highlightId) {
        card.classList.add("highlight");
      }

      card.innerHTML = `
        <div class="card-icon ${resource.iconClass}">
          ${ICONS[resource.id]}
        </div>
        <div class="card-body">
          <h3 class="card-title">${resource.title}</h3>
          <p class="card-description">${resource.description}</p>
        </div>
        <button class="card-open-btn" data-url="${resource.url}" aria-label="Open ${resource.title}">
          Open
        </button>
      `;

      card.querySelector(".card-open-btn").addEventListener("click", () => {
        openResource(resource.url);
      });

      cardsGridEl.appendChild(card);
    });
  }

  /**
   * Determine welcome heading and message from stored data.
   */
  function getWelcomeContent(data) {
    const studentName = data.studentName || "";
    const classlinkLoggedIn = data.classlinkLoggedIn;

    // ClassLink not signed in — prompt sign-in
    if (classlinkLoggedIn === false) {
      return {
        heading: "Please sign in to ClassLink",
        message: "Sign in to ClassLink to access your school apps.",
        highlightId: "classlink",
      };
    }

    // Has student name — personalized welcome
    if (studentName) {
      return {
        heading: `Welcome, ${studentName}`,
        message: "Your school tools are ready.",
        highlightId: null,
      };
    }

    // No name yet — empty state
    return {
      heading: "Welcome!",
      message: "Open Infinite Campus to personalize your dashboard.",
      highlightId: "infinite-campus",
    };
  }

  /**
   * Update the welcome section UI.
   */
  function renderWelcome(data) {
    const { heading, message, highlightId } = getWelcomeContent(data);

    welcomeHeadingEl.textContent = heading;
    welcomeMessageEl.textContent = message;
    renderCards(highlightId);
  }

  /**
   * Show the appropriate welcome state, respecting minimum loading time.
   */
  function showWelcome(data, hasError) {
    const elapsed = Date.now() - loadStartTime;
    const delay = Math.max(0, MIN_LOADING_MS - elapsed);

    setTimeout(() => {
      loadingEl.classList.add("hidden");

      if (hasError) {
        errorEl.classList.remove("hidden");
        renderCards(null);
        return;
      }

      welcomeContentEl.classList.remove("hidden");
      renderWelcome(data);
    }, delay);
  }

  /**
   * Read storage and render dashboard.
   */
  function loadDashboard() {
    chrome.storage.local.get(
      ["studentName", "classlinkLoggedIn", "classlinkCheckedAt"],
      (result) => {
        if (chrome.runtime.lastError) {
          showWelcome({}, true);
          return;
        }
        showWelcome(result, false);
      }
    );
  }

  /**
   * Re-render welcome when storage changes (e.g. user visits IC or ClassLink).
   */
  function onStorageChanged(changes, area) {
    if (area !== "local") return;

    const relevant =
      changes.studentName ||
      changes.classlinkLoggedIn ||
      changes.classlinkCheckedAt;

    if (!relevant) return;

    chrome.storage.local.get(
      ["studentName", "classlinkLoggedIn", "classlinkCheckedAt"],
      (result) => {
        if (chrome.runtime.lastError) return;

        // If still in loading state, let loadDashboard finish
        if (!loadingEl.classList.contains("hidden")) return;

        errorEl.classList.add("hidden");
        welcomeContentEl.classList.remove("hidden");
        renderWelcome(result);
      }
    );
  }

  // Initialize
  loadStartTime = Date.now();
  chrome.storage.onChanged.addListener(onStorageChanged);
  loadDashboard();
})();
