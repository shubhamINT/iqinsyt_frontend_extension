import type { DetectedEvent } from '../shared/types.ts'

export function startDetection(): void {
  // Try immediate parse — page may already be loaded
  const event = extractEventFromDOM();
  if (event) {
    sendToBackground(event);
    return;
  }

  // Watch for DOM changes (SPAs load content after initial render)
  const observer = new MutationObserver(() => {
    const detected = extractEventFromDOM();
    if (detected) {
      observer.disconnect();
      sendToBackground(detected);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // After 5 seconds, give up and let the user enter manually
  setTimeout(() => {
    observer.disconnect();
    if (!extractEventFromDOM()) {
      chrome.runtime.sendMessage({ type: 'DETECTION_FAILED' }).catch(() => {});
    }
  }, 5_000);
}

function extractEventFromDOM(): DetectedEvent | null {
  // 1. Headings containing vs / v / @ patterns
  const headings = document.querySelectorAll('h1, h2, h3');
  for (const h of headings) {
    const text = h.textContent?.trim();
    if (text && /\bvs\.?\b|\bv\b|@/i.test(text)) {
      return { title: text, source: window.location.hostname };
    }
  }

  // 2. Elements with event-specific data attributes
  const dataEl = document.querySelector('[data-event], [data-match], [data-fixture]');
  if (dataEl?.textContent?.trim()) {
    return { title: dataEl.textContent.trim(), source: window.location.hostname };
  }

  // 3. Page title fallback
  const titleMatch = document.title.match(/(.+?\s+vs\.?\s+.+?)(\s*[-|]|$)/i);
  if (titleMatch) {
    return { title: titleMatch[1].trim(), source: window.location.hostname };
  }

  return null;
}

function sendToBackground(event: DetectedEvent): void {
  chrome.runtime.sendMessage({ type: 'EVENT_DETECTED', payload: event }).catch(() => {});
}
