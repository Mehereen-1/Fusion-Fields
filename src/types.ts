export type Player = 0 | 1 | 2;

export interface CellData {
  player: Player;
  power: number;
}

export type BoardData = CellData[][];

export interface Move {
  row: number;
  col: number;
}

export interface Scores {
  redPower: number;
  bluePower: number;
  redCells: number;
  blueCells: number;
}
