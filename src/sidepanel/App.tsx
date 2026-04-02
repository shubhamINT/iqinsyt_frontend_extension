import { useReducer } from 'react'
import { AppContext, useAppContext } from './context.tsx'
import type { AppState, AppAction, DetectedEvent } from '../shared/types.ts'
import { useAuth } from '../hooks/useAuth.ts'
import { useEventDetection } from '../hooks/useEventDetection.ts'
import { useInsightQuery } from '../hooks/useInsightQuery.ts'
import StatusBar from '../components/StatusBar.tsx'
import EventCard from '../components/EventCard.tsx'
import ManualInput from '../components/ManualInput.tsx'
import ResearchOutput from '../components/ResearchOutput.tsx'
import ErrorState from '../components/ErrorState.tsx'

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: AppState = {
  phase: 'idle',
  detectedEvent: null,
  result: null,
  error: null,
  user: { isAuthenticated: false, plan: null },
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'EVENT_DETECTED':
      return { ...state, phase: 'detected', detectedEvent: action.payload, error: null };

    case 'DETECTION_FAILED':
      return { ...state, phase: 'manual' };

    case 'REQUEST_ANALYSIS':
      return { ...state, phase: 'loading', error: null };

    case 'ANALYSIS_RESULT':
      return { ...state, phase: 'result', result: action.payload, error: null };

    case 'SHOW_ERROR':
      return { ...state, phase: 'error', error: action.payload };

    case 'DISMISS_ERROR':
      return { ...state, phase: 'idle', error: null };

    case 'AUTH_REQUIRED':
      return { ...initialState };

    case 'SET_USER':
      return { ...state, user: action.payload };
  }
}

// ─── Panel Content ────────────────────────────────────────────────────────────
// Separate component so hooks can consume the context provided by App below.

function PanelContent() {
  const { state, dispatch } = useAppContext();
  const { triggerAnalysis } = useInsightQuery();
  useEventDetection();
  useAuth();

  const { phase, detectedEvent, result, error } = state;

  function handleAnalyse() {
    if (detectedEvent) triggerAnalysis(detectedEvent);
  }

  function handleManualSubmit(title: string) {
    const event: DetectedEvent = { title, source: 'manual' };
    dispatch({ type: 'EVENT_DETECTED', payload: event });
    triggerAnalysis(event);
  }

  function handleRerun() {
    if (detectedEvent) triggerAnalysis(detectedEvent);
  }

  function handleDismiss() {
    dispatch({ type: 'DISMISS_ERROR' });
  }

  return (
    <div className="iq-panel">
      <StatusBar />
      <div className="iq-content">

        {phase === 'idle' && (
          <div className="iq-idle">
            <p className="iq-idle__title">Watching for events</p>
            <p className="iq-idle__sub">
              Navigate to a sports or prediction market page and IQinsyt will detect the event automatically.
            </p>
          </div>
        )}

        {phase === 'manual' && (
          <ManualInput onSubmit={handleManualSubmit} />
        )}

        {phase === 'detected' && detectedEvent && (
          <EventCard event={detectedEvent} onAnalyse={handleAnalyse} />
        )}

        {phase === 'loading' && (
          <div className="iq-loading">
            <div className="iq-loading__spinner" />
            <p className="iq-loading__text">Analysing event data...</p>
          </div>
        )}

        {phase === 'result' && result && detectedEvent && (
          <>
            <EventCard event={detectedEvent} onAnalyse={handleRerun} />
            <ResearchOutput response={result} onRerun={handleRerun} />
          </>
        )}

        {phase === 'error' && error && (
          <ErrorState message={error} onDismiss={handleDismiss} />
        )}

      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <PanelContent />
    </AppContext.Provider>
  );
}
