export type Player = 0 | 1 | 2;
export type ActivePlayer = 1 | 2;

export interface CellData {
  player: Player;
  power: number;
}

export type BoardData = CellData[][];

export interface Move {
  row: number;
  col: number;
}

export type OpeningState = Record<ActivePlayer, boolean>;

export interface Scores {
  redPower: number;
  bluePower: number;
  redCells: number;
  blueCells: number;
}
