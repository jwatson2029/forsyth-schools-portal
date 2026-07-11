/**
 * Forsyth Schools Portal — popup dashboard logic.
 * Reads local storage, renders welcome states, and opens school resource tabs.
 */

(function () {
  "use strict";

  const MIN_LOADING_MS = 120;

  const RESOURCES = [
    {
      id: "classlink",
      title: "ClassLink",
      description: "School apps",
      url: "https://launchpad.classlink.com/forsyth?autosamllogin=1",
      logo: "assets/logos/classlink.svg",
    },
    {
      id: "infinite-campus",
      title: "Infinite Campus",
      description: "Grades & attendance",
      url: "https://campus.forsyth.k12.ga.us/campus/SSO/forsyth/portal/students?configID=1",
      logo: "assets/logos/infinite-campus.png",
    },
    {
      id: "canvas",
      title: "Canvas",
      description: "Assignments",
      url: "https://forsyth.instructure.com/?login_success=1",
      logo: "assets/logos/canvas.png",
    },
    {
      id: "resources",
      title: "Resources",
      description: "District info",
      url: "https://www.forsyth.k12.ga.us/",
      logo: "assets/logos/forsyth.png",
    },
  ];

  const loadingEl = document.getElementById("loading-state");
  const welcomeHeadingEl = document.getElementById("welcome-heading");
  const welcomeMessageEl = document.getElementById("welcome-message");
  const errorEl = document.getElementById("error-state");
  const cardsGridEl = document.getElementById("cards-grid");

  let loadStartTime = Date.now();

  function openResource(url) {
    chrome.tabs.create({ url });
  }

  function renderCards(highlightId) {
    cardsGridEl.innerHTML = "";

    RESOURCES.forEach((resource) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "resource-card";
      if (resource.id === highlightId) {
        card.classList.add("highlight");
      }

      card.innerHTML = `
        <img class="card-logo" src="${resource.logo}" alt="" width="36" height="36" />
        <span class="card-title">${resource.title}</span>
        <span class="card-description">${resource.description}</span>
      `;

      card.addEventListener("click", () => openResource(resource.url));

      cardsGridEl.appendChild(card);
    });
  }

  function getWelcomeContent(data) {
    const studentName = data.studentName || "";
    const classlinkLoggedIn = data.classlinkLoggedIn;

    if (classlinkLoggedIn === false) {
      return {
        heading: "Sign in to ClassLink",
        message: "Sign in to access your apps.",
        highlightId: "classlink",
      };
    }

    if (studentName) {
      return {
        heading: `Welcome, ${studentName}`,
        message: "Your tools are ready.",
        highlightId: null,
      };
    }

    return {
      heading: "Welcome!",
      message: "Visit Infinite Campus to personalize.",
      highlightId: "infinite-campus",
    };
  }

  function renderWelcome(data) {
    const { heading, message, highlightId } = getWelcomeContent(data);

    welcomeHeadingEl.textContent = heading;
    welcomeMessageEl.textContent = message;
    welcomeMessageEl.classList.remove("hidden");
    renderCards(highlightId);
  }

  function showWelcome(data, hasError) {
    const elapsed = Date.now() - loadStartTime;
    const delay = Math.max(0, MIN_LOADING_MS - elapsed);

    setTimeout(() => {
      loadingEl.classList.add("hidden");

      if (hasError) {
        welcomeHeadingEl.textContent = "Something went wrong";
        errorEl.classList.remove("hidden");
        renderCards(null);
        return;
      }

      renderWelcome(data);
    }, delay);
  }

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
        if (!loadingEl.classList.contains("hidden")) return;

        errorEl.classList.add("hidden");
        renderWelcome(result);
      }
    );
  }

  loadStartTime = Date.now();
  chrome.storage.onChanged.addListener(onStorageChanged);
  loadDashboard();
})();
