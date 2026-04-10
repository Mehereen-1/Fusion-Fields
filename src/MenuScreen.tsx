interface MenuScreenProps {
  onSelectFuzzyVsHuman: () => void;
  onSelectMinimaxVsHuman: () => void;
  onSelectMinimaxVsFuzzy: () => void;
  onBack: () => void;
}

export default function MenuScreen({
  onSelectFuzzyVsHuman,
  onSelectMinimaxVsHuman,
  onSelectMinimaxVsFuzzy,
  onBack,
}: MenuScreenProps) {
  return (
    <section className="mode-menu-screen">
      <div className="mode-menu-screen__bg" />

      <div className="mode-menu-layout">
        <div className="mode-menu-head">
          <p className="eyebrow">Select Battle Mode</p>
          <h2>Choose Your Match</h2>
        </div>

        <div className="mode-menu-actions">
          <article className="mode-item wood-inset">
            <p className="mode-item__title">Fuzzy</p>
            <p className="mode-item__sub">Human vs Fuzzy AI</p>
            <button className="btn btn-primary" onClick={onSelectFuzzyVsHuman} type="button">
              Play
            </button>
          </article>

          <article className="mode-item wood-inset">
            <p className="mode-item__title">Minimax</p>
            <p className="mode-item__sub">Human vs Minimax AI</p>
            <button className="btn btn-ghost" onClick={onSelectMinimaxVsHuman} type="button">
              Play
            </button>
          </article>

          <article className="mode-item wood-inset">
            <p className="mode-item__title">Arena AI</p>
            <p className="mode-item__sub">Minimax vs Fuzzy AI</p>
            <button className="btn btn-ghost" onClick={onSelectMinimaxVsFuzzy} type="button">
              Watch
            </button>
          </article>
        </div>

        <button className="btn btn-danger mode-menu-back" onClick={onBack} type="button">
          Back
        </button>
      </div>
    </section>
  );
}
