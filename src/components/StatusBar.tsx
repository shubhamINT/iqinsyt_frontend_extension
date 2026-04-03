import { useAppContext } from '../sidepanel/context.tsx'

const STATE_LABELS: Record<string, string> = {
  idle:     'Ready',
  picking:  'Waiting for selection',
  detected: 'Event selected',
  manual:   'Enter manually',
  loading:  'Analysing...',
  result:   'Done',
  error:    'Error',
};

export default function StatusBar() {
  const { state } = useAppContext();
  const { phase } = state;

  return (
    <header className="iq-status-bar">
      <span className="iq-status-bar__brand">IQinsyt</span>
      <div className="iq-status-bar__state">
        {phase === 'loading' ? (
          <span className="iq-spinner" aria-hidden="true" />
        ) : (
          <span className={`iq-dot ${phase === 'detected' || phase === 'result' ? 'iq-dot--active' : ''}`} />
        )}
        <span>{STATE_LABELS[phase]}</span>
      </div>
    </header>
  );
}
