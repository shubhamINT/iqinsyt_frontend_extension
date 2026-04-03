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
    <div className="iq-card">
      <p className="iq-manual__heading">No event detected</p>
      <p className="iq-manual__sub">
        Navigate to a sports or event information page, or enter the event name below.
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
          Analyse
        </button>
      </form>
    </div>
  );
}
