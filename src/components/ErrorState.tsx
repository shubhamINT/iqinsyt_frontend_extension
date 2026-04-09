interface Props {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

export default function ErrorState({ message, onDismiss, onRetry }: Props) {
  return (
    <div className="iq-card iq-error">
      <div className="iq-error__icon" aria-hidden="true">!</div>
      <span className="iq-kicker">Research interrupted</span>
      <h2 className="iq-error__title">Something blocked this run</h2>
      <p className="iq-error__message">{message}</p>
      <div className="iq-error__actions">
        {onRetry && (
          <button className="iq-btn iq-btn--primary" onClick={onRetry}>
            Retry analysis
          </button>
        )}
        <button className="iq-btn iq-btn--ghost" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
