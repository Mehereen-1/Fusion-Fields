interface StartScreenProps {
  onStart: () => void;
  onSettings: () => void;
  onAbout: () => void;
}

export default function StartScreen({ onStart, onSettings, onAbout }: StartScreenProps) {
  return (
    <section className="start-screen">
      <div className="start-screen__bg" />
      <div className="start-screen__particles" />
      <div className="start-screen__content">
        <p className="eyebrow">Desktop Tactical Simulation</p>
        <h1>Color War Arena</h1>
        <p className="subtitle">Red Player vs Blue Fuzzy AI</p>

        <div className="start-actions">
          <button className="btn btn-primary" onClick={onStart} type="button">
            Play as Red
          </button>
          <button className="btn btn-ghost" onClick={onSettings} type="button">
            Settings
          </button>
          <button className="btn btn-ghost" onClick={onAbout} type="button">
            About
          </button>
        </div>
      </div>
    </section>
  );
}
