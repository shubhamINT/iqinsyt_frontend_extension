import { useEffect } from 'react'
import { useAppContext } from '../sidepanel/context.tsx'
import type { ExtensionMessage, DetectedEvent } from '../shared/types.ts'

export function useEventDetection() {
  const { dispatch } = useAppContext();

  useEffect(() => {
    function handleMessage(message: ExtensionMessage) {
      if (message.type === 'EVENT_DETECTED') {
        dispatch({ type: 'EVENT_DETECTED', payload: message.payload as DetectedEvent });
      } else if (message.type === 'DETECTION_FAILED') {
        dispatch({ type: 'DETECTION_FAILED' });
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [dispatch]);
}
