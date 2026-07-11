/**
 * Forsyth Schools Portal — background service worker.
 * Re-injects the Infinite Campus name script into all frames when IC tabs finish
 * loading, as a fallback for dynamically created workspace iframes.
 */

const IC_URL_PATTERN = /^https:\/\/campus\.forsyth\.k12\.ga\.us\//;

chrome.runtime.onInstalled.addListener(() => {
  // Extension installed or updated — no external calls or analytics.
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url || !IC_URL_PATTERN.test(tab.url)) return;

  chrome.scripting
    .executeScript({
      target: { tabId, allFrames: true },
      files: ["content/infinite-campus.js"],
    })
    .catch(() => {
      // Tab may not be injectable (chrome://, unloaded, etc.)
    });
});
