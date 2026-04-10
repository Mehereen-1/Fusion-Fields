import { useEffect, useRef, useState } from "react";

import Cell from "./Cell";
import { DecisionTrace, MinimaxTraceNode } from "./decisionTrace";
import ExperimentPanel from "./ExperimentPanel";
import { ExperimentPreset, ExperimentSettings } from "./experiment";
import { BoardData, Move, Scores } from "./types";

interface ComboPopup {
  id: number;
  x: number;
  y: number;
  text: string;
  tone: "burst" | "chain";
}

interface GameBoardProps {
  board: BoardData;
  status: string;
  scores: Scores;
  lastMove: Move | null;
  modeLabel: string;
  turnLabel: string;
  speedMs: number;
  moveHistory: Move[];
  energizedCells: string[];
  explodingCells: string[];
  decisionTrace?: DecisionTrace | null;
  experimentSettings?: ExperimentSettings;
  showMoveHints: boolean;
  validMoveKeys: string[];
  onExperimentChange?: (field: keyof ExperimentSettings, value: number) => void;
  onApplyPreset?: (preset: ExperimentPreset) => void;
  isAutoBattleMode?: boolean;
  isSimulationReady?: boolean;
  isSimulationPaused?: boolean;
  onStartSimulation?: () => void;
  onToggleSimulationPause?: () => void;
  onCellClick: (row: number, col: number) => void;
  onReset: () => void;
  onMenu?: () => void;
  onExit?: () => void;
  onSpeedChange: (value: number) => void;
}

export default function GameBoard({
  board,
  status,
  scores,
  lastMove,
  modeLabel,
  turnLabel,
  speedMs,
  moveHistory,
  energizedCells,
  explodingCells,
  decisionTrace = null,
  experimentSettings = { depth: 3, aggression: 50, defense: 50, randomness: 0 },
  showMoveHints,
  validMoveKeys,
  onExperimentChange = () => undefined,
  onApplyPreset = () => undefined,
  isAutoBattleMode = false,
  isSimulationReady = true,
  isSimulationPaused = false,
  onStartSimulation,
  onToggleSimulationPause,
  onCellClick,
  onReset,
  onMenu,
  onExit,
  onSpeedChange,
}: GameBoardProps) {
  const toPercent = (value: number): string => `${Math.round(value * 100)}%`;
  const moveLabel = (move: Move | null): string => (move ? `(${move.row + 1}, ${move.col + 1})` : "-");
  const scoreLabel = (value: number): string => (Number.isFinite(value) ? value.toFixed(1) : value > 0 ? "+inf" : "-inf");
  const boundLabel = (value: number): string => (Number.isFinite(value) ? value.toFixed(1) : value > 0 ? "inf" : "-inf");
  const recentMoves = moveHistory.slice(-6).reverse();
  const validMoveSet = new Set(validMoveKeys);
  const [comboPopups, setComboPopups] = useState<ComboPopup[]>([]);
  const popupIdRef = useRef(0);

  const renderMinimaxTreeNode = (node: MinimaxTraceNode, path: string) => {
    const role = node.maximizing ? "MAX" : "MIN";
    const moveText = node.move ? moveLabel(node.move) : "root";

    return (
      <li key={path} className="tree-node">
        <div className="tree-line">
          <span className="tree-move">{moveText}</span>
          <span className="tree-role">{role}</span>
          <span className="tree-score">v={scoreLabel(node.score)}</span>
          <span className="tree-bounds">a={boundLabel(node.alphaIn)} b={boundLabel(node.betaIn)}</span>
          <span className="tree-depth">d={node.depthRemaining}</span>
        </div>

        {node.prunedMoves && node.prunedMoves.length > 0 ? (
          <p className="tree-pruned">
            pruned {node.prunedMoves.length}: {node.prunedMoves.map((move) => moveLabel(move)).join(", ")}
          </p>
        ) : null}

        {node.children.length > 0 ? (
          <ul className="tree-children">
            {node.children.map((child, index) => renderMinimaxTreeNode(child, `${path}-${index}`))}
          </ul>
        ) : null}
      </li>
    );
  };

  useEffect(() => {
    if (explodingCells.length === 0) {
      return;
    }

    const size = Math.max(board.length, 1);
    const points = explodingCells
      .map((key) => {
        const [rowText, colText] = key.split("-");
        const row = Number(rowText);
        const col = Number(colText);

        if (Number.isNaN(row) || Number.isNaN(col)) {
          return null;
        }

        return { row, col };
      })
      .filter((value): value is { row: number; col: number } => value !== null);

    if (points.length === 0) {
      return;
    }

    const center = points.reduce(
      (acc, point) => ({ row: acc.row + point.row, col: acc.col + point.col }),
      { row: 0, col: 0 },
    );

    const centerRow = center.row / points.length;
    const centerCol = center.col / points.length;

    const popups: ComboPopup[] = [
      {
        id: popupIdRef.current++,
        x: ((centerCol + 0.5) / size) * 100,
        y: ((centerRow + 0.5) / size) * 100,
        text: points.length > 1 ? `Combo x${points.length}` : "Burst!",
        tone: "burst",
      },
      ...points.slice(0, 3).map((point, index) => ({
        id: popupIdRef.current++,
        x: ((point.col + 0.5) / size) * 100,
        y: ((point.row + 0.5) / size) * 100,
        text: index === 0 ? "Impact" : "Chain",
        tone: "chain" as const,
      })),
    ];

    setComboPopups((previous) => [...previous, ...popups]);

    const timer = window.setTimeout(() => {
      setComboPopups((previous) => previous.filter((popup) => !popups.some((item) => item.id === popup.id)));
    }, 900);

    return () => window.clearTimeout(timer);
  }, [board.length, explodingCells]);

  return (
    <div className="game-wrapper">
      <div className="top-bar market-card">
        <div>
          <p className="chip-label">Fusion Fields</p>
          <h1>Fire the colors</h1>
        </div>
        <div className="top-actions">
          <p className="coin-pill">Gold 2450</p>
          <button className="btn btn-danger" onClick={onReset} type="button">
            New Game
          </button>
          {isAutoBattleMode && !isSimulationReady && onStartSimulation ? (
            <button className="btn btn-primary" onClick={onStartSimulation} type="button">
              Start Simulation
            </button>
          ) : null}
          {isAutoBattleMode && isSimulationReady && onToggleSimulationPause ? (
            <button className="btn btn-ghost" onClick={onToggleSimulationPause} type="button">
              {isSimulationPaused ? "Resume" : "Pause"}
            </button>
          ) : null}
          {onMenu ? (
            <button className="btn btn-ghost" onClick={onMenu} type="button">
              Menu
            </button>
          ) : null}
          {onExit ? (
            <button className="btn btn-danger" onClick={onExit} type="button">
              Exit
            </button>
          ) : null}
        </div>
      </div>

      <div className="main-area">
        <aside className="panel market-card">
          <h3>Status</h3>
          <div className="wood-inset side-inset">
            <p>
              <span>Red Cells</span>
              <strong>{scores.redCells}</strong>
            </p>
            <p>
              <span>Blue Cells</span>
              <strong>{scores.blueCells}</strong>
            </p>
            <p>
              <span>Red Power</span>
              <strong>{scores.redPower}</strong>
            </p>
            <p>
              <span>Blue Power</span>
              <strong>{scores.bluePower}</strong>
            </p>
            <p>
              <span>Turn</span>
              <strong>{turnLabel}</strong>
            </p>
            <p>
              <span>Last Move</span>
              <strong>{lastMove ? `(${lastMove.row + 1}, ${lastMove.col + 1})` : "-"}</strong>
            </p>
            <div className="fire-container">
              <div className="flame flame1"></div>
              <div className="flame flame2"></div>
              <div className="flame flame3"></div>
            </div>
          </div>

          <div className="left-experiment-slot">
            <ExperimentPanel
              settings={experimentSettings}
              onChange={onExperimentChange}
              onPreset={onApplyPreset}
            />

            {isAutoBattleMode ? (
              <div className="simulation-controls">
                {!isSimulationReady && onStartSimulation ? (
                  <button className="btn btn-primary" type="button" onClick={onStartSimulation}>
                    Start Simulation
                  </button>
                ) : null}

                {isSimulationReady && onToggleSimulationPause ? (
                  <button className="btn btn-ghost" type="button" onClick={onToggleSimulationPause}>
                    {isSimulationPaused ? "Resume Simulation" : "Pause Simulation"}
                  </button>
                ) : null}

                <p className="simulation-note">
                  {!isSimulationReady
                    ? "Configure Experiment Mode first, then start the AI-vs-AI run."
                    : isSimulationPaused
                      ? "Simulation is paused. Adjust sliders and resume when ready."
                      : "Simulation running. Parameter changes affect upcoming AI turns."}
                </p>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="board-wrapper market-card">
          <div className="board-title-row">
            <p className="chip-label">Battle Grid</p>
            <p className="chip-mode">Mode: {modeLabel}</p>
          </div>

          <div className="wood-inset board-inset">
            <div className="board-grid" data-size={board.length}>
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const key = `${r}-${c}`;
                  const waveIndex = energizedCells.indexOf(key);
                  const canPlay = validMoveSet.has(key);
                  return (
                    <Cell
                      key={key}
                      cell={cell}
                      row={r}
                      col={c}
                      isEnergized={energizedCells.includes(key)}
                      isExploding={explodingCells.includes(key)}
                      waveDelayStep={Math.max(waveIndex, 0)}
                      moveHintState={showMoveHints ? (canPlay ? "valid" : "invalid") : "none"}
                      onClick={onCellClick}
                    />
                  );
                }),
              )}

              <div className="combo-layer" aria-hidden="true">
                {comboPopups.map((popup) => (
                  <span
                    key={popup.id}
                    className={`combo-popup combo-popup--${popup.tone}`}
                    style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
                  >
                    {popup.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="panel market-card">
          <h3>Game Feed</h3>
          <div className="wood-inset side-inset">
            <p className="status-copy">{status}</p>
            <p>
              <span>Total Moves</span>
              <strong>{moveHistory.length}</strong>
            </p>

            <label className="speed-control" htmlFor="ai-speed">
              <span>AI Delay: {speedMs}ms</span>
              <input
                id="ai-speed"
                type="range"
                min={250}
                max={1400}
                step={50}
                value={speedMs}
                onChange={(event) => onSpeedChange(Number(event.target.value))}
              />
            </label>

            <ul className="recent-list">
              {recentMoves.length === 0 ? (
                <li>Waiting for first move...</li>
              ) : (
                recentMoves.map((move, index) => (
                  <li key={`${move.row}-${move.col}-${index}`}>
                    #{moveHistory.length - index} at ({move.row + 1}, {move.col + 1})
                  </li>
                ))
              )}
            </ul>

            <div className="decision-panel">
              <p className="decision-title">Decision Simulation</p>
              {!decisionTrace ? (
                <p className="decision-empty">Waiting for AI decision...</p>
              ) : decisionTrace.kind === "minimax" ? (
                <>
                  <p className="decision-meta">
                    Best {moveLabel(decisionTrace.bestMove)} | Score {decisionTrace.bestScore?.toFixed(1) ?? "0.0"}
                  </p>
                  <p className="decision-meta">
                    Depth {decisionTrace.depth} | Nodes {decisionTrace.exploredNodes} | Pruned {decisionTrace.prunedBranches}
                  </p>
                  <p className="decision-meta">
                    Randomness {decisionTrace.randomnessPercentage}%
                    {decisionTrace.selectedByRandomness
                      ? ` | Random pick: ${moveLabel(decisionTrace.bestMove)} (optimal ${moveLabel(decisionTrace.optimalMove)})`
                      : " | Deterministic best pick"}
                  </p>
                  <div className="minimax-tree-wrap">
                    <ul className="minimax-tree">
                      {renderMinimaxTreeNode(decisionTrace.tree, "root")}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <p className="decision-meta">Best {moveLabel(decisionTrace.bestMove)} from fuzzy scoring</p>
                  <p className="decision-meta">
                    Agg {decisionTrace.aggressionWeight} | Def {decisionTrace.defenseWeight} | Rnd {decisionTrace.randomnessPercentage}%
                  </p>
                  <ul className="decision-list">
                    {decisionTrace.candidates.slice(0, 4).map((candidate, index) => (
                      <li key={`${candidate.move.row}-${candidate.move.col}-${index}`}>
                        <span>{moveLabel(candidate.move)} | D {toPercent(candidate.desirability)}</span>
                        <strong>{candidate.score.toFixed(1)}</strong>
                        <em>
                          Atk {candidate.attackScore.toFixed(1)} | Def {candidate.defenseScore.toFixed(1)} | Rand {candidate.randomFactor.toFixed(1)}
                        </em>
                        <em>
                          Agg {toPercent(candidate.breakdown.aggression)} | Safe {toPercent(candidate.breakdown.safeExpansion)} | Risk {toPercent(candidate.breakdown.riskPenalty)}
                        </em>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="bottom-bar market-card">
        <p>Tip: opening move must be played on an empty cell.</p>
        </div>
    </div>
  );
}