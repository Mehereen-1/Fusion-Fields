import { CellData } from "./types";

interface CellProps {
  cell: CellData;
  row: number;
  col: number;
  isEnergized: boolean;
  isExploding: boolean;
  waveStep: number;
  onClick: (row: number, col: number) => void;
}

export default function Cell({
  cell,
  row,
  col,
  isEnergized,
  isExploding,
  waveStep,
  onClick,
}: CellProps) {
  const ownerClass = cell.player === 1 ? "cell-red" : cell.player === 2 ? "cell-blue" : "cell-empty";
  const orbCount = Math.min(cell.power, 3);
  const delayClassName = `wave-delay-${Math.max(0, Math.min(24, waveStep))}`;

  return (
    <button
      className={`board-cell ${ownerClass} ${delayClassName} ${isEnergized ? "energized" : ""} ${isExploding ? "exploding" : ""}`}
      onClick={() => onClick(row, col)}
      type="button"
      aria-label={`Row ${row + 1} Column ${col + 1} Power ${cell.power}`}
    >
      {orbCount > 0 ? (
        <div className={`cell-orbs cell-orbs--${orbCount}`} key={`${cell.player}-${cell.power}`}>
          {Array.from({ length: orbCount }, (_, index) => (
            <span className="cell-orb" key={index} />
          ))}
        </div>
      ) : (
        <span className="cell-empty-dot" />
      )}
    </button>
  );
}
