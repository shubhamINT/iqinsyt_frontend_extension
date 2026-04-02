interface Props {
  message: string;
  onDismiss: () => void;
}

export default function ErrorState({ message, onDismiss }: Props) {
  return (
    <div className="iq-error">
      <div className="iq-error__icon" aria-hidden="true">⚠</div>
      <p className="iq-error__message">{message}</p>
      <button className="iq-btn iq-btn--ghost" style={{ maxWidth: 160, margin: '0 auto' }} onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
