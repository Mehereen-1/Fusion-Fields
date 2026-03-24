import { BoardData, Move, OpeningState, Player } from "../types";
import { getValidMoves } from "../gameLogic";
import { analyzeMove } from "./features";
import { scoreFeatures } from "./rules";

export interface RankedFuzzyMove {
  move: Move;
  score: number;
}

export function rankFuzzyMoves(board: BoardData, player: Player, openingState: OpeningState): RankedFuzzyMove[] {
  return getValidMoves(board, player, openingState)
    .map((move) => {
      const features = analyzeMove(board, move, player, openingState);
      const fuzzy = scoreFeatures(features);

      return {
        move,
        score:
          features.finisher * 1000 +
          fuzzy.desirability * 140 +
          features.chainPotential * 8 +
          features.captureSwing * 6 +
          features.powerSwing * 2.5 +
          features.setupPotential * 3 +
          features.localSupport * 1.5 +
          features.centerBias * 2 -
          features.counterRisk * 5,
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function chooseFuzzyMove(board: BoardData, player: Player, openingState: OpeningState): Move | null {
  const rankedMoves = rankFuzzyMoves(board, player, openingState);
  return rankedMoves[0]?.move ?? null;
}
