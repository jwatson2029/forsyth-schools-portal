/**
 * ClassLink content script.
 * Detects login session state from visible page UI only.
 * Does NOT access credentials, cookies, or attempt authentication bypass.
 */

(function () {
  "use strict";

  const DEBOUNCE_MS = 500;
  let debounceTimer = null;
  let lastKnownState = null;

  /**
   * Detect whether the user appears logged into ClassLink.
   * Uses visible DOM signals only — no credential access.
   */
  function detectLoginState() {
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    // Login page URL patterns
    if (
      pathname.includes("/login") ||
      pathname.includes("/signin") ||
      pathname.includes("/authenticate")
    ) {
      return false;
    }

    // Visible login form signals
    const passwordField = document.querySelector(
      'input[type="password"], input[name="password"], input[id*="password" i]'
    );
    const usernameField = document.querySelector(
      'input[type="text"][name*="user" i], input[name="username"], input[id*="username" i], input[type="email"]'
    );
    const signInButton = document.querySelector(
      'button[type="submit"], input[type="submit"], button[id*="signin" i], button[id*="login" i]'
    );

    if (passwordField && usernameField && signInButton) {
      const form = passwordField.closest("form");
      if (form && form.offsetParent !== null) {
        return false;
      }
    }

    // Logged-in signals: app launcher / dashboard elements
    const launcherSelectors = [
      "#cl-app-list",
      ".cl-app-list",
      "[data-testid='app-list']",
      ".launchpad-apps",
      "#launchpad",
      ".my-apps",
      "[class*='app-launcher']",
      "[class*='launchpad']",
      "[id*='launchpad']",
    ];

    for (const selector of launcherSelectors) {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null) {
        return true;
      }
    }

    // User profile / account element on post-login pages
    const profileSelectors = [
      "[class*='user-profile']",
      "[class*='user-name']",
      "[class*='username']",
      "[id*='user-profile']",
      "[aria-label*='account' i]",
      "[aria-label*='profile' i]",
    ];

    for (const selector of profileSelectors) {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null && el.textContent.trim().length > 0) {
        return true;
      }
    }

    // On ClassLink domain but no login form visible — likely logged in
    if (!passwordField && url.includes("classlink.forsyth.k12.ga.us")) {
      return true;
    }

    return false;
  }

  /**
   * Persist login state to local storage when it changes.
   */
  function updateStorage(loggedIn) {
    if (lastKnownState === loggedIn) return;
    lastKnownState = loggedIn;

    chrome.storage.local.set({
      classlinkLoggedIn: loggedIn,
      classlinkCheckedAt: Date.now(),
    });
  }

  function checkAndUpdate() {
    updateStorage(detectLoginState());
  }

  function debouncedCheck() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(checkAndUpdate, DEBOUNCE_MS);
  }

  // Initial check
  checkAndUpdate();

  // Re-check when tab becomes visible (user returns to ClassLink tab)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      debouncedCheck();
    }
  });
})();
