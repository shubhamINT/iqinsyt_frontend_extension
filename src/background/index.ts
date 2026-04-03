import { fetchInsight, AuthError, SubscriptionError } from '../api/client.ts'
import type { ExtensionMessage, DetectedEvent } from '../shared/types.ts'

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  switch (message.type) {
    case 'MARKETS_DETECTED':
    case 'EVENT_DETECTED':
    case 'DETECTION_FAILED':
    case 'PICKER_CANCELLED':
      // Relay from content script to side panel
      chrome.runtime.sendMessage(message).catch(() => {
        // Side panel not open — ignore
      });
      break;

    case 'START_PICKER':
      // Forward to the active tab's content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId != null) {
          chrome.tabs.sendMessage(tabId, { type: 'START_PICKER' }).catch(() => {});
        }
      });
      break;

    case 'REQUEST_ANALYSIS':
      handleAnalysis(message.payload as DetectedEvent);
      break;
  }
});

async function handleAnalysis(event: DetectedEvent): Promise<void> {
  try {
    const result = await fetchInsight(event);
    chrome.runtime.sendMessage({ type: 'ANALYSIS_RESULT', payload: result }).catch(() => {});
  } catch (err) {
    if (err instanceof AuthError) {
      chrome.runtime.sendMessage({ type: 'AUTH_REQUIRED' }).catch(() => {});
    } else {
      const message = err instanceof SubscriptionError
        ? 'Update your plan to continue.'
        : 'Something went wrong. Try again.';
      chrome.runtime.sendMessage({ type: 'ANALYSIS_ERROR', payload: message }).catch(() => {});
    }
  }
}
