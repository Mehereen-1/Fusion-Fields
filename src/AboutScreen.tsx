interface AboutScreenProps {
  onBack: () => void;
  onStart: () => void;
}

export default function AboutScreen({ onBack, onStart }: AboutScreenProps) {
  return (
    <section className="about-page">
      <div className="about-page__bg" />
      <div className="about-page__overlay" />

      <div className="about-page__panel glass-panel">
        <p className="eyebrow">About This Game</p>
        <h2>Fusion Fields</h2>
        <p>
          Fusion Fields is a tactical chain-reaction battle where each orb placement changes pressure on nearby
          cells. Build your territory, force overloads, and convert enemy positions through controlled splashes.
        </p>
        <p>
          Current mode is User vs Fuzzy AI. You play red, AI plays blue, and every move can trigger bursts that
          shift momentum across the entire board.
        </p>

        <div className="about-page__actions">
          <button className="btn btn-primary" onClick={onStart} type="button">
            Start Match
          </button>
          <button className="btn btn-ghost" onClick={onBack} type="button">
            Back
          </button>
        </div>
      </div>
    </section>
  );
}
