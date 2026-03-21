import Cell from "./Cell";
import { BoardData, Move, Player, Scores } from "./types";

interface GameBoardProps {
  board: BoardData;
  turn: Player;
  status: string;
  scores: Scores;
  lastMove: Move | null;
  depth: number;
  speedMs: number;
  isRunning: boolean;
  moveHistory: Move[];
  energizedCells: string[];
  explodingCells: string[];
  onCellClick: (row: number, col: number) => void;
  onStartAuto: () => void;
  onPauseAuto: () => void;
  onNextStep: () => void;
  onReset: () => void;
  onDepthChange: (value: number) => void;
  onSpeedChange: (value: number) => void;
}

function playerName(player: Player): string {
  if (player === 1) {
    return "Red AI";
  }
  if (player === 2) {
    return "Blue AI";
  }
  return "None";
}

export default function GameBoard({
  board,
  turn,
  status,
  scores,
  lastMove,
  depth,
  speedMs,
  isRunning,
  moveHistory,
  energizedCells,
  explodingCells,
  onCellClick,
  onStartAuto,
  onPauseAuto,
  onNextStep,
  onReset,
  onDepthChange,
  onSpeedChange,
}: GameBoardProps) {
  return (
    <section className="arena-screen">
      <header className="arena-header glass-panel">
        <h2>Color War Arena</h2>
        <div className="arena-header__meta">
          <span className="tag">AI Tactical Mode</span>
          <span className="tag">Board {board.length}x{board.length}</span>
        </div>
      </header>

      <div className="arena-score glass-panel">
        <div className={`score-card red ${turn === 1 ? "active" : ""}`}>
          <p className="score-title">Red AI</p>
          <p className="score-value">Power {scores.redPower}</p>
          <p className="score-sub">Cells {scores.redCells}</p>
        </div>
        <div className={`score-card blue ${turn === 2 ? "active" : ""}`}>
          <p className="score-title">Blue AI</p>
          <p className="score-value">Power {scores.bluePower}</p>
          <p className="score-sub">Cells {scores.blueCells}</p>
        </div>
      </div>

      <main className="arena-main">
        <div className="board-shell glass-panel">
          <div
            className="board-grid"
            style={{ gridTemplateColumns: `repeat(${board.length}, minmax(58px, 84px))` }}
          >
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
                    waveDelayMs={waveIndex >= 0 ? waveIndex * 45 : 0}
                    onClick={onCellClick}
                  />
                );
              }),
            )}
          </div>
        </div>

        <aside className="arena-side">
          <div className="glass-panel side-block">
            <h3>AI Info</h3>
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
              <span>Search Depth</span>
              <strong>{depth}</strong>
            </p>
          </div>

          <div className="glass-panel side-block">
            <h3>Controls</h3>
            <div className="controls-row">
              <button className="btn btn-primary" onClick={onStartAuto} type="button">
                Start
              </button>
              <button className="btn btn-ghost" onClick={onPauseAuto} type="button">
                Pause
              </button>
              <button className="btn btn-ghost" onClick={onNextStep} type="button">
                Next Step
              </button>
              <button className="btn btn-danger" onClick={onReset} type="button">
                Reset
              </button>
            </div>

            <label className="range-control" htmlFor="depth">
              <span>AI Depth</span>
              <input
                id="depth"
                type="range"
                min={1}
                max={5}
                value={depth}
                onChange={(event) => onDepthChange(Number(event.target.value))}
              />
            </label>

            <label className="range-control" htmlFor="speed">
              <span>AI Speed {speedMs}ms</span>
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
            <p className="mode-pill">Mode: {isRunning ? "Autoplay" : "Step"}</p>
          </div>
        </aside>
      </main>
    </section>
  );
}
