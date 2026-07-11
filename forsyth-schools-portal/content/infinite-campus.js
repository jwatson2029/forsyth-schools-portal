/**
 * Infinite Campus content script.
 * Reads ONLY the visible student display name from a single DOM element
 * and saves it locally. No other page data is accessed.
 *
 * Infinite Campus loads the student portal inside an iframe (#main-workspace).
 * This script runs in all matching frames (see manifest all_frames).
 */

(function () {
  "use strict";

  const SELECTOR = "h2.student-card__student-name";
  const MIN_NAME_LENGTH = 2;
  const INIT_FLAG = "__forsythPortalNameInit";
  const CAPTURED_FLAG = "__forsythPortalNameCaptured";
  const OBSERVER_TIMEOUT_MS = 180000;

  if (window[INIT_FLAG]) {
    return;
  }
  window[INIT_FLAG] = true;

  /**
   * The student name lives in the workspace iframe, not the nav-wrapper shell.
   * Skip the outer shell so we only observe frames that can contain the name.
   */
  function shouldSkipFrame() {
    if (window.self !== window.top) {
      return false;
    }

    const hasWorkspaceIframe = document.querySelector(
      'iframe#main-workspace, iframe[data-cy="workspace-frame"], iframe.iframeWorkspace'
    );

    return Boolean(hasWorkspaceIframe);
  }

  if (shouldSkipFrame()) {
    return;
  }

  /**
   * Trim and validate the display name before saving.
   */
  function normalizeName(raw) {
    if (!raw) return "";
    const name = raw.replace(/\s+/g, " ").trim();
    if (name.length < MIN_NAME_LENGTH) return "";
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
      if (result.studentName === name) {
        window[CAPTURED_FLAG] = true;
        return;
      }

      chrome.storage.local.set({ studentName: name }, () => {
        window[CAPTURED_FLAG] = true;
      });
    });
  }

  /**
   * Attempt to read the student name element once.
   */
  function tryCaptureName() {
    if (window[CAPTURED_FLAG]) return true;

    const el = document.querySelector(SELECTOR);
    if (!el) return false;

    const name = normalizeName(el.textContent);
    if (!name) return false;

    saveName(name);
    return true;
  }

  let observer = null;

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function startObserver() {
    if (observer || window[CAPTURED_FLAG]) return;

    observer = new MutationObserver(() => {
      if (tryCaptureName()) {
        stopObserver();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    setTimeout(stopObserver, OBSERVER_TIMEOUT_MS);
  }

  function attemptCapture() {
    if (tryCaptureName()) {
      stopObserver();
      return;
    }
    startObserver();
  }

  // Try immediately, then watch for Angular SPA render inside iframe
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attemptCapture, { once: true });
  } else {
    attemptCapture();
  }

  // Re-check when user returns to the tab (IC may finish rendering while backgrounded)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      attemptCapture();
    }
  });
})();
