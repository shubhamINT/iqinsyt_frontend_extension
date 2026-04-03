import { useEffect } from 'react'
import { useAppContext } from '../sidepanel/context.tsx'
import type { ExtensionMessage, DetectedEvent } from '../shared/types.ts'
import type { InsightResponse } from '../api/types.ts'

export function useInsightQuery() {
  const { dispatch } = useAppContext();

  // Listen for responses coming back from the background worker
  useEffect(() => {
    function handleMessage(message: ExtensionMessage) {
      if (message.type === 'ANALYSIS_RESULT') {
        dispatch({ type: 'ANALYSIS_RESULT', payload: message.payload as InsightResponse });
      } else if (message.type === 'ANALYSIS_ERROR') {
        dispatch({ type: 'SHOW_ERROR', payload: message.payload as string });
      } else if (message.type === 'AUTH_REQUIRED') {
        dispatch({ type: 'SHOW_ERROR', payload: 'Not signed in. Please sign in to continue.' });
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [dispatch]);

  // Called by components when the user triggers an analysis
  function triggerAnalysis(event: DetectedEvent) {
    dispatch({ type: 'REQUEST_ANALYSIS' });
    chrome.runtime.sendMessage({ type: 'REQUEST_ANALYSIS', payload: event }).catch(() => {});
  }

  return { triggerAnalysis };
}
