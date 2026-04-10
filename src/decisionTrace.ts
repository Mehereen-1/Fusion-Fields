import { ActivePlayer, Move } from "./types";

export interface MinimaxTraceCandidate {
  move: Move;
  score: number;
}

export interface MinimaxTraceNode {
  move: Move | null;
  player: ActivePlayer;
  depthRemaining: number;
  maximizing: boolean;
  alphaIn: number;
  betaIn: number;
  score: number;
  terminalReason?: "depth" | "no-moves" | "pass";
  prunedMoves?: Move[];
  children: MinimaxTraceNode[];
}

export interface MinimaxDecisionTrace {
  kind: "minimax";
  player: ActivePlayer;
  depth: number;
  randomnessPercentage: number;
  bestMove: Move | null;
  optimalMove: Move | null;
  selectedByRandomness: boolean;
  bestScore: number | null;
  exploredNodes: number;
  prunedBranches: number;
  candidates: MinimaxTraceCandidate[];
  tree: MinimaxTraceNode;
  generatedAt: number;
}

export interface FuzzyTraceBreakdown {
  finishingMove: number;
  aggression: number;
  safeExpansion: number;
  counterPressure: number;
  boardControl: number;
  riskPenalty: number;
}

export interface FuzzyTraceFeatures {
  chainPotential: number;
  captureSwing: number;
  powerSwing: number;
  localThreat: number;
  localSupport: number;
  centerBias: number;
  setupPotential: number;
  counterRisk: number;
  finisher: number;
}

export interface FuzzyTraceCandidate {
  move: Move;
  score: number;
  attackScore: number;
  defenseScore: number;
  randomFactor: number;
  desirability: number;
  breakdown: FuzzyTraceBreakdown;
  features: FuzzyTraceFeatures;
}

export interface FuzzyDecisionTrace {
  kind: "fuzzy";
  player: ActivePlayer;
  aggressionWeight: number;
  defenseWeight: number;
  randomnessPercentage: number;
  bestMove: Move | null;
  candidates: FuzzyTraceCandidate[];
  generatedAt: number;
}

export type DecisionTrace = MinimaxDecisionTrace | FuzzyDecisionTrace;
