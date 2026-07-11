/**
 * Infinite Campus content script.
 * Reads ONLY the visible student display name from a single DOM element
 * and saves it locally. No other page data is accessed.
 */

(function () {
  "use strict";

  const SELECTOR = "h2.student-card__student-name";
  const MIN_NAME_LENGTH = 2;
  const FLAG = "__forsythPortalNameCaptured";

  if (window[FLAG]) {
    return;
  }

  /**
   * Trim and validate the display name before saving.
   */
  function normalizeName(raw) {
    if (!raw) return "";
    const name = raw.replace(/\s+/g, " ").trim();
    if (name.length < MIN_NAME_LENGTH) return "";
    // Ignore obvious placeholder text
    if (/^(student|name|welcome|user)$/i.test(name)) return "";
    return name;
  }

  /**
   * Save student name to local storage if it changed.
   */
  function saveName(name) {
    if (!name) return;

    chrome.storage.local.get(["studentName"], (result) => {
      if (chrome.runtime.lastError) return;
      if (result.studentName === name) return;

      chrome.storage.local.set({ studentName: name }, () => {
        window[FLAG] = true;
      });
    });
  }

  /**
   * Attempt to read the student name element once.
   */
  function tryCaptureName() {
    const el = document.querySelector(SELECTOR);
    if (!el) return false;

    const name = normalizeName(el.textContent);
    if (!name) return false;

    saveName(name);
    return true;
  }

  // Try immediately on load
  if (tryCaptureName()) {
    return;
  }

  // Lightweight observer for SPA navigation — disconnects after first success
  const observer = new MutationObserver(() => {
    if (tryCaptureName()) {
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Safety: stop observing after 30 seconds to avoid lingering observers
  setTimeout(() => observer.disconnect(), 30000);
})();
