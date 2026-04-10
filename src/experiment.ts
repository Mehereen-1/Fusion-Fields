export interface ExperimentSettings {
  depth: number;
  aggression: number;
  defense: number;
  randomness: number;
}

export type ExperimentPreset = "aggressive" | "defensive" | "balanced";

export const DEFAULT_EXPERIMENT_SETTINGS: ExperimentSettings = {
  depth: 3,
  aggression: 50,
  defense: 50,
  randomness: 8,
};

export function settingsForPreset(preset: ExperimentPreset): ExperimentSettings {
  if (preset === "aggressive") {
    return {
      depth: 4,
      aggression: 85,
      defense: 25,
      randomness: 14,
    };
  }

  if (preset === "defensive") {
    return {
      depth: 4,
      aggression: 25,
      defense: 85,
      randomness: 6,
    };
  }

  return {
    depth: 3,
    aggression: 50,
    defense: 50,
    randomness: 8,
  };
}
