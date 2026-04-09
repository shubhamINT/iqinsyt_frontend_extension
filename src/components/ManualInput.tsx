import { useState } from 'react'

interface Props {
  onSubmit: (title: string) => void;
}

export default function ManualInput({ onSubmit }: Props) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <div className="iq-card iq-card--feature">
      <span className="iq-kicker">Manual research</span>
      <p className="iq-manual__heading">No event detected yet</p>
      <p className="iq-manual__sub">
        Enter the market or event name directly when the page does not expose a selectable card.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          className="iq-input"
          type="text"
          placeholder="e.g. Manchester City vs Arsenal"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
        />
        <button
          className="iq-btn iq-btn--primary"
          type="submit"
          disabled={!value.trim()}
        >
          Generate research
        </button>
      </form>
    </div>
  );
}
