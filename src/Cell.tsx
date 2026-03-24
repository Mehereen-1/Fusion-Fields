import { CellData } from "./types";

interface CellProps {
  cell: CellData;
  row: number;
  col: number;
  isEnergized: boolean;
  isExploding: boolean;
  waveDelayStep: number;
  onClick: (row: number, col: number) => void;
}

export default function Cell({
  cell,
  row,
  col,
  isEnergized,
  isExploding,
  waveDelayStep,
  onClick,
}: CellProps) {
  const ownerClass = cell.player === 1 ? "cell-red" : cell.player === 2 ? "cell-blue" : "cell-empty";
  const waveDelayClass = `wave-delay-${Math.max(0, Math.min(24, waveDelayStep))}`;

  return (
    <button
      className={`board-cell ${ownerClass} ${isEnergized ? "energized" : ""} ${isExploding ? "exploding" : ""} ${waveDelayClass}`}
      onClick={() => onClick(row, col)}
      type="button"
      aria-label={`Row ${row + 1} Column ${col + 1}`}
    >
      {cell.power > 0 ? <span className="cell-power">{cell.power}</span> : <span className="cell-dot" />}
    </button>
  );
}
