import { BoardData, Move, Player } from "../types";
import { getValidMoves } from "../gameLogic";
import { analyzeMove } from "./features";
import { scoreFeatures } from "./rules";

export interface RankedFuzzyMove {
  move: Move;
  score: number;
}

export function rankFuzzyMoves(board: BoardData, player: Player): RankedFuzzyMove[] {
  return getValidMoves(board, player)
    .map((move) => {
      const features = analyzeMove(board, move, player);
      const fuzzy = scoreFeatures(features);

      return {
        move,
        score:
          fuzzy.desirability * 100 +
          features.chainPotential * 4 +
          features.captureSwing * 2 +
          features.powerSwing * 1.5,
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function chooseFuzzyMove(board: BoardData, player: Player): Move | null {
  const rankedMoves = rankFuzzyMoves(board, player);
  return rankedMoves[0]?.move ?? null;
}
