import { useEffect } from 'react'
import { useAppContext } from '../sidepanel/context.tsx'
import type { ExtensionMessage, DetectedEvent, DetectedMarket } from '../shared/types.ts'

export function useEventDetection() {
  const { dispatch } = useAppContext();

  useEffect(() => {
    function handleMessage(message: ExtensionMessage) {
      if (message.type === 'MARKETS_DETECTED') {
        dispatch({ type: 'MARKETS_DETECTED', payload: message.payload as DetectedMarket[] });
      } else if (message.type === 'EVENT_DETECTED') {
        dispatch({ type: 'EVENT_DETECTED', payload: message.payload as DetectedEvent });
      } else if (message.type === 'DETECTION_FAILED') {
        dispatch({ type: 'DETECTION_FAILED' });
      } else if (message.type === 'PICKER_CANCELLED') {
        dispatch({ type: 'PICKER_CANCELLED' });
      } else if (message.type === 'SITE_AUTH_STATUS') {
        dispatch({ type: 'SET_SITE_AUTH_STATUS', payload: Boolean(message.payload) });
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [dispatch]);
}
