import { BoardData, Move, Player } from "../types";
import { applyMoveWithEffects, computeScores, neighbors } from "../gameLogic";

export interface MoveFeatureSet {
  chainPotential: number;
  captureSwing: number;
  powerSwing: number;
  localThreat: number;
  localSupport: number;
  centerBias: number;
}

function getEnemy(player: Player): Player {
  return player === 1 ? 2 : 1;
}

function countFriendlyNeighbors(board: BoardData, row: number, col: number, player: Player): number {
  let total = 0;

  for (const neighbor of neighbors(row, col, board.length)) {
    if (board[neighbor.row][neighbor.col].player === player) {
      total += 1;
    }
  }

  return total;
}

function sumEnemyPressure(board: BoardData, row: number, col: number, player: Player): number {
  const enemy = getEnemy(player);
  let total = 0;

  for (const neighbor of neighbors(row, col, board.length)) {
    const cell = board[neighbor.row][neighbor.col];
    if (cell.player === enemy) {
      total += cell.power;
    }
  }

  return total;
}

function computeCenterBias(row: number, col: number, size: number): number {
  const center = (size - 1) / 2;
  const maxDistance = center * 2 || 1;
  const distance = Math.abs(row - center) + Math.abs(col - center);

  return Math.max(0, 1 - distance / maxDistance);
}

export function analyzeMove(board: BoardData, move: Move, player: Player): MoveFeatureSet {
  const before = computeScores(board);
  const outcome = applyMoveWithEffects(board, move, player);
  const after = computeScores(outcome.board);
  const enemy = getEnemy(player);

  const ownCellsBefore = player === 1 ? before.redCells : before.blueCells;
  const ownCellsAfter = player === 1 ? after.redCells : after.blueCells;
  const enemyCellsBefore = enemy === 1 ? before.redCells : before.blueCells;
  const enemyCellsAfter = enemy === 1 ? after.redCells : after.blueCells;
  const ownPowerBefore = player === 1 ? before.redPower : before.bluePower;
  const ownPowerAfter = player === 1 ? after.redPower : after.bluePower;

  return {
    chainPotential: outcome.explodingCells.length,
    captureSwing: ownCellsAfter - ownCellsBefore + (enemyCellsBefore - enemyCellsAfter),
    powerSwing: ownPowerAfter - ownPowerBefore,
    localThreat: sumEnemyPressure(board, move.row, move.col, player),
    localSupport: countFriendlyNeighbors(outcome.board, move.row, move.col, player),
    centerBias: computeCenterBias(move.row, move.col, board.length),
  };
}
