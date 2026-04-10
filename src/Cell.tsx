import { CSSProperties } from "react";

import { CellData } from "./types";

interface CellProps {
  cell: CellData;
  row: number;
  col: number;
  isEnergized: boolean;
  isExploding: boolean;
  waveDelayStep: number;
  moveHintState: "valid" | "invalid" | "none";
  onClick: (row: number, col: number) => void;
}

export default function Cell({
  cell,
  row,
  col,
  isEnergized,
  isExploding,
  waveDelayStep,
  moveHintState,
  onClick,
}: CellProps) {
  const ownerClass = cell.player === 1 ? "cell-red" : cell.player === 2 ? "cell-blue" : "cell-empty";
  const orbCount = Math.max(0, Math.min(cell.power, 3));
  const safeWaveDelay = Math.max(0, Math.min(24, waveDelayStep));

  return (
    <button
      className={`board-cell ${ownerClass} ${moveHintState === "valid" ? "move-valid" : ""} ${moveHintState === "invalid" ? "move-invalid" : ""} ${isEnergized ? "energized" : ""} ${isExploding ? "exploding" : ""}`}
      onClick={() => onClick(row, col)}
      style={{ "--wave-delay": `${safeWaveDelay * 45}ms` } as CSSProperties}
      type="button"
      aria-label={`Row ${row + 1} Column ${col + 1} Power ${cell.power}`}
    >
      {orbCount > 0 ? (
        <div className={`cell-orbs cell-orbs--${orbCount}`} key={`${cell.player}-${cell.power}`}>
          {Array.from({ length: orbCount }, (_, index) => (
            <span className="cell-orb" key={index} />
          ))}
        </div>
      ) : null}
    </button>
  );
}
