import type { DetectedEvent } from '../shared/types.ts'

interface Props {
  event: DetectedEvent;
  onAnalyse: () => void;
  onPickAnotherEvent: () => void;
  canPickAnotherEvent: boolean;
  loading?: boolean;
}

export default function EventCard({
  event,
  onAnalyse,
  onPickAnotherEvent,
  canPickAnotherEvent,
  loading = false,
}: Props) {
  return (
    <div className="iq-card">
      <p className="iq-event-card__label">Detected event</p>
      <h2 className="iq-event-card__title">{event.title}</h2>
      <p className="iq-event-card__source">{event.source}</p>
      <div className="iq-event-card__actions">
        <button className="iq-btn iq-btn--primary" onClick={onAnalyse} disabled={loading}>
          {loading ? 'Analysing...' : 'Analyse'}
        </button>
        {canPickAnotherEvent ? (
          <button className="iq-btn iq-btn--ghost" onClick={onPickAnotherEvent} disabled={loading}>
            Pick another event
          </button>
        ) : (
          <p className="iq-site-auth__notice">You are not authorized on this website.</p>
        )}
      </div>
    </div>
  );
}
