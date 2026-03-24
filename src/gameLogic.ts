import { ActivePlayer, BoardData, Move, OpeningState, Player, Scores } from "./types";

export const EXPLOSION_THRESHOLD = 4;
export const OPENING_POWER = 3;

export interface MoveEffectsResult {
  board: BoardData;
  openingState: OpeningState;
  explodingCells: string[];
  energizedCells: string[];
}

export function createOpeningState(): OpeningState {
  return { 1: false, 2: false };
}

export function createEmptyBoard(size: number): BoardData {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ player: 0 as Player, power: 0 })),
  );
}

export function cloneBoard(board: BoardData): BoardData {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function cloneOpeningState(openingState: OpeningState): OpeningState {
  return { 1: openingState[1], 2: openingState[2] };
}

function isActivePlayer(player: Player): player is ActivePlayer {
  return player === 1 || player === 2;
}

export function neighbors(row: number, col: number, size: number): Move[] {
  const positions: Move[] = [];
  const shifts: Move[] = [
    { row: 1, col: 0 },
    { row: -1, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: -1 },
  ];

  for (const shift of shifts) {
    const nextRow = row + shift.row;
    const nextCol = col + shift.col;
    if (nextRow >= 0 && nextCol >= 0 && nextRow < size && nextCol < size) {
      positions.push({ row: nextRow, col: nextCol });
    }
  }

  return positions;
}

export function keyOf(row: number, col: number): string {
  return `${row}-${col}`;
}

export function getValidMoves(board: BoardData, player: Player, openingState: OpeningState): Move[] {
  if (!isActivePlayer(player)) {
    return [];
  }

  const moves: Move[] = [];
  const isOpeningMove = !openingState[player];

  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < board.length; c += 1) {
      const owner = board[r][c].player;
      if (isOpeningMove && owner === 0) {
        moves.push({ row: r, col: c });
      } else if (!isOpeningMove && owner === player) {
        moves.push({ row: r, col: c });
      }
    }
  }

  return moves;
}

export function applyMoveWithEffects(
  board: BoardData,
  move: Move,
  player: Player,
  openingState: OpeningState,
): MoveEffectsResult {
  const nextBoard = cloneBoard(board);
  const nextOpeningState = cloneOpeningState(openingState);
  const explodingCells: string[] = [];
  const energizedCells: string[] = [];
  const queue: Move[] = [];
  const seenEnergy = new Set<string>();

  const isOpeningMove = isActivePlayer(player) && !nextOpeningState[player];
  nextBoard[move.row][move.col].player = player;
  nextBoard[move.row][move.col].power = isOpeningMove
    ? OPENING_POWER
    : nextBoard[move.row][move.col].power + 1;

  if (isOpeningMove) {
    nextOpeningState[player] = true;
  }

  for (let r = 0; r < nextBoard.length; r += 1) {
    for (let c = 0; c < nextBoard.length; c += 1) {
      if (nextBoard[r][c].player !== 0 && nextBoard[r][c].power >= EXPLOSION_THRESHOLD) {
        queue.push({ row: r, col: c });
      }
    }
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    const cell = nextBoard[current.row][current.col];
    if (cell.player === 0 || cell.power < EXPLOSION_THRESHOLD) {
      continue;
    }

    const owner = cell.player;
    explodingCells.push(keyOf(current.row, current.col));
    cell.player = 0;
    cell.power = 0;

    for (const neighbor of neighbors(current.row, current.col, nextBoard.length)) {
      const nCell = nextBoard[neighbor.row][neighbor.col];
      nCell.player = owner;
      nCell.power += 1;
      const nKey = keyOf(neighbor.row, neighbor.col);

      if (!seenEnergy.has(nKey)) {
        seenEnergy.add(nKey);
        energizedCells.push(nKey);
      }

      if (nCell.power >= EXPLOSION_THRESHOLD) {
        queue.push(neighbor);
      }
    }
  }

  return { board: nextBoard, openingState: nextOpeningState, explodingCells, energizedCells };
}

export function computeScores(board: BoardData): Scores {
  let redPower = 0;
  let bluePower = 0;
  let redCells = 0;
  let blueCells = 0;

  for (const row of board) {
    for (const cell of row) {
      if (cell.player === 1) {
        redPower += cell.power;
        redCells += 1;
      }

      if (cell.player === 2) {
        bluePower += cell.power;
        blueCells += 1;
      }
    }
  }

  return { redPower, bluePower, redCells, blueCells };
}

export function getWinner(scores: Scores): Player {
  if (scores.redPower === scores.bluePower) {
    if (scores.redCells === scores.blueCells) {
      return 0;
    }

    return scores.redCells > scores.blueCells ? 1 : 2;
  }

  return scores.redPower > scores.bluePower ? 1 : 2;
}
