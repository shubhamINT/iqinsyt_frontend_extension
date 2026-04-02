import type { DetectedEvent } from '../shared/types.ts'

interface Props {
  event: DetectedEvent;
  onAnalyse: () => void;
  loading?: boolean;
}

export default function EventCard({ event, onAnalyse, loading = false }: Props) {
  return (
    <div className="iq-card">
      <p className="iq-event-card__label">Detected event</p>
      <h2 className="iq-event-card__title">{event.title}</h2>
      <p className="iq-event-card__source">{event.source}</p>
      <button
        className="iq-btn iq-btn--primary"
        onClick={onAnalyse}
        disabled={loading}
      >
        {loading ? 'Analysing...' : 'Analyse'}
      </button>
    </div>
  );
}
