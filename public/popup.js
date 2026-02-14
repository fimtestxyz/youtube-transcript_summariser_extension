// Popup JavaScript for YouTube Transcript Extension

document.addEventListener('DOMContentLoaded', () => {
  const openSidepanelBtn = document.getElementById('openSidepanelBtn');

  openSidepanelBtn.addEventListener('click', async () => {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        // Open the sidepanel
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
    } catch (error) {
      console.error('Error opening sidepanel:', error);
    }
  });
});
