// Background service worker for YouTube Transcript Extension

// Enable sidepanel on extension install
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Transcript Extension installed');
});

// Handle messages from content script or sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SIDEPANEL') {
    // Open sidepanel when requested
    chrome.sidePanel.open({ windowId: sender.tab.windowId })
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'GET_TRANSCRIPT') {
    // Fetch transcript from storage
    chrome.storage.local.get([
      'currentTranscript',
      'currentTranscriptJson',
      'currentVideoTitle',
      'currentVideoId'
    ], (result) => {
      sendResponse(result);
    });
    return true;
  }
});

// Optional: Enable sidepanel for YouTube pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
    chrome.sidePanel.setOptions({
      tabId,
      enabled: true
    });
  }
});
