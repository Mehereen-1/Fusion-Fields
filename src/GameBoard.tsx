import Cell from "./Cell";
import { BoardData, Move, Player, Scores } from "./types";

interface GameBoardProps {
  board: BoardData;
  turn: Player;
  status: string;
  scores: Scores;
  lastMove: Move | null;
  speedMs: number;
  moveHistory: Move[];
  energizedCells: string[];
  explodingCells: string[];
  onCellClick: (row: number, col: number) => void;
  onReset: () => void;
  onSpeedChange: (value: number) => void;
}

function playerName(player: Player): string {
  if (player === 1) {
    return "Red Player";
  }
  if (player === 2) {
    return "Blue Fuzzy AI";
  }
  return "None";
}

export default function GameBoard({
  board,
  turn,
  status,
  scores,
  lastMove,
  speedMs,
  moveHistory,
  energizedCells,
  explodingCells,
  onCellClick,
  onReset,
  onSpeedChange,
}: GameBoardProps) {
  return (
    <section className="arena-screen">
      <header className="arena-header glass-panel">
        <h2>Color War Arena</h2>
        <div className="arena-header__meta">
          <span className="tag">User vs Fuzzy AI</span>
          <span className="tag">Board {board.length}x{board.length}</span>
        </div>
      </header>

      <div className="arena-score glass-panel">
        <div className={`score-card red ${turn === 1 ? "active" : ""}`}>
          <p className="score-title">Red Player</p>
          <p className="score-value">Power {scores.redPower}</p>
          <p className="score-sub">Cells {scores.redCells}</p>
        </div>
        <div className={`score-card blue ${turn === 2 ? "active" : ""}`}>
          <p className="score-title">Blue Fuzzy AI</p>
          <p className="score-value">Power {scores.bluePower}</p>
          <p className="score-sub">Cells {scores.blueCells}</p>
        </div>
      </div>

      <main className="arena-main">
        <div className="board-shell glass-panel">
          <div className="board-grid" data-size={board.length}>
            {board.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r}-${c}`;
                const waveIndex = energizedCells.indexOf(key);
                return (
                  <Cell
                    key={key}
                    cell={cell}
                    row={r}
                    col={c}
                    isEnergized={energizedCells.includes(key)}
                    isExploding={explodingCells.includes(key)}
                    waveDelayStep={Math.max(waveIndex, 0)}
                    onClick={onCellClick}
                  />
                );
              }),
            )}
          </div>
        </div>

        <aside className="arena-side">
          <div className="glass-panel side-block">
            <h3>Match Info</h3>
            <p>
              <span>Turn</span>
              <strong>{playerName(turn)}</strong>
            </p>
            <p>
              <span>Status</span>
              <strong>{status}</strong>
            </p>
            <p>
              <span>Last Move</span>
              <strong>{lastMove ? `(${lastMove.row}, ${lastMove.col})` : "-"}</strong>
            </p>
            <p>
              <span>Blue AI Delay</span>
              <strong>{speedMs}ms</strong>
            </p>
          </div>

          <div className="glass-panel side-block">
            <h3>Controls</h3>
            <div className="controls-row">
              <button className="btn btn-danger" onClick={onReset} type="button">
                New Game
              </button>
            </div>

            <label className="range-control" htmlFor="speed">
              <span>Blue AI Delay {speedMs}ms</span>
              <input
                id="speed"
                type="range"
                min={250}
                max={1400}
                step={50}
                value={speedMs}
                onChange={(event) => onSpeedChange(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="glass-panel side-block history">
            <h3>Move History</h3>
            <ul>
              {moveHistory.length === 0 ? (
                <li>Waiting for first move...</li>
              ) : (
                moveHistory.slice(-8).map((move, idx) => (
                  <li key={`${move.row}-${move.col}-${idx}`}>
                    #{moveHistory.length - Math.min(8, moveHistory.length) + idx + 1} at ({move.row}, {move.col})
                  </li>
                ))
              )}
            </ul>
            <p className="mode-pill">Mode: Red Player vs Blue Fuzzy AI</p>
          </div>
        </aside>
      </main>
    </section>
  );
}
