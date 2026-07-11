/**
 * Forsyth Schools Portal — background service worker.
 * Minimal MV3 worker; popup reads storage directly.
 */

chrome.runtime.onInstalled.addListener(() => {
  // Extension installed or updated — no external calls or analytics.
});
