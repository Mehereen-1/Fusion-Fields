import { FuzzyDecisionTrace } from "../decisionTrace";
import { ActivePlayer, BoardData, Move, OpeningState } from "../types";
import { getValidMoves } from "../gameLogic";
import { analyzeMove, MoveFeatureSet } from "./features";
import { scoreFeatures } from "./rules";

export interface RankedFuzzyMove {
  move: Move;
  score: number;
  attackScore: number;
  defenseScore: number;
  randomFactor: number;
  desirability: number;
  breakdown: FuzzyDecisionTrace["candidates"][number]["breakdown"];
  features: MoveFeatureSet;
}

interface FuzzyOptions {
  aggressionWeight?: number;
  defenseWeight?: number;
  randomnessPercentage?: number;
  onTrace?: (trace: FuzzyDecisionTrace) => void;
}

function normalizeWeight(weight: number): number {
  return Math.max(0, Math.min(100, weight)) / 100;
}

export function rankFuzzyMoves(
  board: BoardData,
  player: ActivePlayer,
  openingState: OpeningState,
  options: Omit<FuzzyOptions, "onTrace"> = {},
): RankedFuzzyMove[] {
  const aggressionWeight = normalizeWeight(options.aggressionWeight ?? 50);
  const defenseWeight = normalizeWeight(options.defenseWeight ?? 50);
  const totalWeight = aggressionWeight + defenseWeight;
  const offense = totalWeight === 0 ? 0.5 : aggressionWeight / totalWeight;
  const defense = totalWeight === 0 ? 0.5 : defenseWeight / totalWeight;
  const randomnessPercentage = Math.max(0, Math.min(50, options.randomnessPercentage ?? 0));
  const randomAmplitude = randomnessPercentage / 2;

  return getValidMoves(board, player, openingState)
    .map((move) => {
      const features = analyzeMove(board, move, player, openingState);
      const fuzzy = scoreFeatures(features);
      const attackScore =
        features.finisher * 100 +
        features.chainPotential * 24 +
        features.captureSwing * 18 +
        features.powerSwing * 10 +
        features.setupPotential * 8 +
        fuzzy.breakdown.aggression * 100 +
        fuzzy.breakdown.counterPressure * 76;
      const defenseScore =
        features.localSupport * 18 +
        (10 - Math.min(features.counterRisk, 10)) * 8 +
        fuzzy.breakdown.safeExpansion * 100 +
        fuzzy.breakdown.boardControl * 68 -
        fuzzy.breakdown.riskPenalty * 86;
      const randomFactor = (Math.random() * 2 - 1) * randomAmplitude;

      return {
        move,
        score: offense * attackScore + defense * defenseScore + randomFactor,
        attackScore,
        defenseScore,
        randomFactor,
        desirability: fuzzy.desirability,
        breakdown: fuzzy.breakdown,
        features,
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function chooseFuzzyMove(
  board: BoardData,
  player: ActivePlayer,
  openingState: OpeningState,
  options: FuzzyOptions = {},
): Move | null {
  const aggressionWeight = Math.max(0, Math.min(100, options.aggressionWeight ?? 50));
  const defenseWeight = Math.max(0, Math.min(100, options.defenseWeight ?? 50));
  const randomnessPercentage = Math.max(0, Math.min(50, options.randomnessPercentage ?? 0));
  const rankedMoves = rankFuzzyMoves(board, player, openingState, {
    aggressionWeight,
    defenseWeight,
    randomnessPercentage,
  });

  if (rankedMoves.length === 0) {
    return null;
  }

  const useRandomMove = Math.random() * 100 < randomnessPercentage;
  const chosenMove = useRandomMove
    ? rankedMoves[Math.floor(Math.random() * rankedMoves.length)]
    : rankedMoves[0];

  if (options.onTrace) {
    options.onTrace({
      kind: "fuzzy",
      player,
      aggressionWeight,
      defenseWeight,
      randomnessPercentage,
      bestMove: chosenMove.move,
      candidates: rankedMoves.slice(0, 5).map((move) => ({
        move: move.move,
        score: move.score,
        attackScore: move.attackScore,
        defenseScore: move.defenseScore,
        randomFactor: move.randomFactor,
        desirability: move.desirability,
        breakdown: move.breakdown,
        features: move.features,
      })),
      generatedAt: Date.now(),
    });
  }

  return chosenMove.move;
}
