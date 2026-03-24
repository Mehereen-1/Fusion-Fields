import { BoardData, Move, OpeningState, Player } from "../types";
import {
  applyMoveWithEffects,
  computeScores,
  EXPLOSION_THRESHOLD,
  getValidMoves,
  neighbors,
} from "../gameLogic";

export interface MoveFeatureSet {
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

function countChargedCells(board: BoardData, player: Player): number {
  let total = 0;

  for (const row of board) {
    for (const cell of row) {
      if (cell.player === player && cell.power >= EXPLOSION_THRESHOLD - 1) {
        total += 1;
      }
    }
  }

  return total;
}

function scoreTacticalResponse(board: BoardData, move: Move, player: Player, openingState: OpeningState): number {
  const before = computeScores(board);
  const outcome = applyMoveWithEffects(board, move, player, openingState);
  const after = computeScores(outcome.board);
  const enemy = getEnemy(player);

  const ownCellsBefore = player === 1 ? before.redCells : before.blueCells;
  const ownCellsAfter = player === 1 ? after.redCells : after.blueCells;
  const enemyCellsBefore = enemy === 1 ? before.redCells : before.blueCells;
  const enemyCellsAfter = enemy === 1 ? after.redCells : after.blueCells;
  const ownPowerBefore = player === 1 ? before.redPower : before.bluePower;
  const ownPowerAfter = player === 1 ? after.redPower : after.bluePower;
  const captureSwing = ownCellsAfter - ownCellsBefore + (enemyCellsBefore - enemyCellsAfter);
  const powerSwing = ownPowerAfter - ownPowerBefore;
  const finisher = enemyCellsAfter === 0 && ownCellsAfter > 0 ? 1 : 0;
  const setupPotential = countChargedCells(outcome.board, player);

  return (
    finisher * 30 +
    outcome.explodingCells.length * 4 +
    captureSwing * 3 +
    powerSwing * 1.5 +
    setupPotential
  );
}

function computeBestCounterRisk(board: BoardData, player: Player, openingState: OpeningState): number {
  const enemy = getEnemy(player);
  const enemyMoves = getValidMoves(board, enemy, openingState);

  if (enemyMoves.length === 0) {
    return 0;
  }

  let strongestResponse = 0;

  for (const move of enemyMoves) {
    strongestResponse = Math.max(strongestResponse, scoreTacticalResponse(board, move, enemy, openingState));
  }

  return strongestResponse;
}

export function analyzeMove(
  board: BoardData,
  move: Move,
  player: Player,
  openingState: OpeningState,
): MoveFeatureSet {
  const before = computeScores(board);
  const outcome = applyMoveWithEffects(board, move, player, openingState);
  const after = computeScores(outcome.board);
  const enemy = getEnemy(player);

  const ownCellsBefore = player === 1 ? before.redCells : before.blueCells;
  const ownCellsAfter = player === 1 ? after.redCells : after.blueCells;
  const enemyCellsBefore = enemy === 1 ? before.redCells : before.blueCells;
  const enemyCellsAfter = enemy === 1 ? after.redCells : after.blueCells;
  const ownPowerBefore = player === 1 ? before.redPower : before.bluePower;
  const ownPowerAfter = player === 1 ? after.redPower : after.bluePower;
  const finisher = enemyCellsAfter === 0 && ownCellsAfter > 0 ? 1 : 0;

  return {
    chainPotential: outcome.explodingCells.length,
    captureSwing: ownCellsAfter - ownCellsBefore + (enemyCellsBefore - enemyCellsAfter),
    powerSwing: ownPowerAfter - ownPowerBefore,
    localThreat: sumEnemyPressure(board, move.row, move.col, player),
    localSupport: countFriendlyNeighbors(outcome.board, move.row, move.col, player),
    centerBias: computeCenterBias(move.row, move.col, board.length),
    setupPotential: countChargedCells(outcome.board, player),
    counterRisk: computeBestCounterRisk(outcome.board, player, outcome.openingState),
    finisher,
  };
}
