import { ExperimentPreset, ExperimentSettings } from "./experiment";

interface ExperimentPanelProps {
  settings: ExperimentSettings;
  onChange: (field: keyof ExperimentSettings, value: number) => void;
  onPreset: (preset: ExperimentPreset) => void;
}

interface SliderConfig {
  field: keyof ExperimentSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}

const sliders: SliderConfig[] = [
  {
    field: "depth",
    label: "Minimax Depth",
    min: 1,
    max: 5,
    step: 1,
    hint: "Search depth for minimax. Higher depth sees more future moves but costs more compute.",
  },
  {
    field: "aggression",
    label: "Fuzzy Aggression",
    min: 0,
    max: 100,
    step: 1,
    hint: "Higher values prioritize captures, chain setups, and offensive pressure.",
  },
  {
    field: "defense",
    label: "Fuzzy Defense",
    min: 0,
    max: 100,
    step: 1,
    hint: "Higher values prioritize safer expansion, support, and risk reduction.",
  },
  {
    field: "randomness",
    label: "Randomness",
    min: 0,
    max: 50,
    step: 1,
    hint: "Chance that AI deviates from deterministic best scoring move.",
  },
];

export default function ExperimentPanel({ settings, onChange, onPreset }: ExperimentPanelProps) {
  return (
    <section className="experiment-panel" aria-label="Experiment Mode controls">
      <div className="experiment-header-row">
        <p className="decision-title">Experiment Mode</p>
        <span className="experiment-badge">Live</span>
      </div>

      <p className="experiment-help">Tune AI behavior during play. Changes apply on the next AI turn.</p>

      <div className="experiment-presets" role="group" aria-label="AI style presets">
        <button className="btn btn-ghost" type="button" onClick={() => onPreset("aggressive")}>
          Aggressive AI
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => onPreset("defensive")}>
          Defensive AI
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => onPreset("balanced")}>
          Balanced AI
        </button>
      </div>

      <div className="experiment-sliders">
        {sliders.map((slider) => (
          <label key={slider.field} className="experiment-slider" title={slider.hint}>
            <span>
              {slider.label}: <strong>{settings[slider.field]}</strong>
            </span>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={settings[slider.field]}
              onChange={(event) => onChange(slider.field, Number(event.target.value))}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
