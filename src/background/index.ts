// Minimal service worker — storage changes propagate automatically via
// chrome.storage.onChanged which content scripts listen to directly.

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    console.log('[YT Speed] Extension installed')
  }
})
