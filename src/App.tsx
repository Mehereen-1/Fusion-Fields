import { useEffect, useMemo, useState } from "react";

import "./App.css";
import GameBoard from "./GameBoard";
import ResultScreen from "./ResultScreen";
import StartScreen from "./StartScreen";
import { BoardData, Move, Player, Scores } from "./types";

const SIZE = 5;
const EXPLOSION_THRESHOLD = 4;
const MAX_TURNS = 160;

type ViewMode = "start" | "game" | "result";

function createEmptyBoard(size: number): BoardData {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ player: 0 as Player, power: 0 })),
  );
}

function cloneBoard(board: BoardData): BoardData {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function neighbors(row: number, col: number, size: number): Move[] {
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

function keyOf(row: number, col: number): string {
  return `${row}-${col}`;
}

function getValidMoves(board: BoardData, player: Player): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < board.length; c += 1) {
      const owner = board[r][c].player;
      if (owner === 0 || owner === player) {
        moves.push({ row: r, col: c });
      }
    }
  }
  return moves;
}

function evaluate(board: BoardData): number {
  let redPower = 0;
  let bluePower = 0;
  let redCells = 0;
  let blueCells = 0;

  for (const row of board) {
    for (const cell of row) {
      if (cell.player === 1) {
        redPower += cell.power;
        redCells += 1;
      } else if (cell.player === 2) {
        bluePower += cell.power;
        blueCells += 1;
      }
    }
  }

  return redPower - bluePower + (redCells - blueCells) * 0.8;
}

function applyMoveWithEffects(board: BoardData, move: Move, player: Player) {
  const nextBoard = cloneBoard(board);
  const explodingCells: string[] = [];
  const energizedCells: string[] = [];
  const queue: Move[] = [];
  const seenEnergy = new Set<string>();

  nextBoard[move.row][move.col].player = player;
  nextBoard[move.row][move.col].power += 1;

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

  return { board: nextBoard, explodingCells, energizedCells };
}

function minimax(board: BoardData, depth: number, isMax: boolean): number {
  if (depth === 0) {
    return evaluate(board);
  }

  const player: Player = isMax ? 1 : 2;
  const moves = getValidMoves(board, player);
  if (moves.length === 0) {
    return evaluate(board);
  }

  if (isMax) {
    let best = Number.NEGATIVE_INFINITY;
    for (const move of moves) {
      const simulated = applyMoveWithEffects(board, move, player).board;
      best = Math.max(best, minimax(simulated, depth - 1, false));
    }
    return best;
  }

  let best = Number.POSITIVE_INFINITY;
  for (const move of moves) {
    const simulated = applyMoveWithEffects(board, move, player).board;
    best = Math.min(best, minimax(simulated, depth - 1, true));
  }
  return best;
}

function chooseMove(board: BoardData, player: Player, depth: number): Move | null {
  const moves = getValidMoves(board, player);
  if (moves.length === 0) {
    return null;
  }

  let bestMove: Move | null = null;
  let bestValue = player === 1 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

  for (const move of moves) {
    const simulated = applyMoveWithEffects(board, move, player).board;
    const score = minimax(simulated, Math.max(0, depth - 1), player !== 1);
    if (player === 1 && score > bestValue) {
      bestValue = score;
      bestMove = move;
    }
    if (player === 2 && score < bestValue) {
      bestValue = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function computeScores(board: BoardData): Scores {
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

function getWinner(scores: Scores): Player {
  if (scores.redPower === scores.bluePower) {
    if (scores.redCells === scores.blueCells) {
      return 0;
    }
    return scores.redCells > scores.blueCells ? 1 : 2;
  }
  return scores.redPower > scores.bluePower ? 1 : 2;
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("start");
  const [board, setBoard] = useState<BoardData>(() => createEmptyBoard(SIZE));
  const [turn, setTurn] = useState<Player>(1);
  const [status, setStatus] = useState("Ready");
  const [isRunning, setIsRunning] = useState(false);
  const [depth, setDepth] = useState(3);
  const [speedMs, setSpeedMs] = useState(750);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [winner, setWinner] = useState<Player>(0);
  const [energizedCells, setEnergizedCells] = useState<string[]>([]);
  const [explodingCells, setExplodingCells] = useState<string[]>([]);

  const scores = useMemo(() => computeScores(board), [board]);

  const clearEffectsSoon = () => {
    window.setTimeout(() => {
      setEnergizedCells([]);
      setExplodingCells([]);
    }, 500);
  };

  const resetGame = () => {
    setBoard(createEmptyBoard(SIZE));
    setTurn(1);
    setStatus("Ready");
    setIsRunning(false);
    setMoveHistory([]);
    setLastMove(null);
    setTurnCount(0);
    setWinner(0);
    setEnergizedCells([]);
    setExplodingCells([]);
    setViewMode("game");
  };

  const finishGameIfNeeded = (nextBoard: BoardData, nextTurnCount: number): boolean => {
    const nextScores = computeScores(nextBoard);
    const oneSideEliminated =
      (nextScores.redCells === 0 && nextScores.blueCells > 0) ||
      (nextScores.blueCells === 0 && nextScores.redCells > 0);

    // Avoid ending immediately on the opening move before both players act.
    const canEndByElimination = nextTurnCount >= 2;

    if ((canEndByElimination && oneSideEliminated) || nextTurnCount >= MAX_TURNS) {
      setWinner(getWinner(nextScores));
      setStatus("Simulation finished");
      setIsRunning(false);
      setViewMode("result");
      return true;
    }
    return false;
  };

  const runTurn = () => {
    setStatus("Thinking...");

    const bestMove = chooseMove(board, turn, depth);
    if (!bestMove) {
      setWinner(getWinner(scores));
      setStatus("No valid moves");
      setIsRunning(false);
      setViewMode("result");
      return;
    }

    const result = applyMoveWithEffects(board, bestMove, turn);
    const nextTurn = turn === 1 ? 2 : 1;
    const nextTurnCount = turnCount + 1;

    setBoard(result.board);
    setLastMove(bestMove);
    setMoveHistory((previous) => [...previous, bestMove]);
    setEnergizedCells(result.energizedCells);
    setExplodingCells(result.explodingCells);
    setTurn(nextTurn);
    setTurnCount(nextTurnCount);
    setStatus(result.explodingCells.length > 0 ? "Chain reaction triggered" : "Running");
    clearEffectsSoon();

    finishGameIfNeeded(result.board, nextTurnCount);
  };

  useEffect(() => {
    if (!isRunning || viewMode !== "game") {
      return;
    }

    const timer = window.setTimeout(() => {
      runTurn();
    }, speedMs);

    return () => window.clearTimeout(timer);
  }, [isRunning, board, turn, speedMs, depth, viewMode]);

  const handleStart = () => {
    resetGame();
    setStatus("Running");
  };

  const handleSettings = () => {
    setViewMode("game");
    setStatus("Tune settings and press Start");
  };

  const handleAbout = () => {
    setViewMode("game");
    setStatus("Color War Arena: turn-based chain-reaction strategy");
  };

  if (viewMode === "start") {
    return <StartScreen onStart={handleStart} onSettings={handleSettings} onAbout={handleAbout} />;
  }

  if (viewMode === "result") {
    return (
      <ResultScreen
        winner={winner}
        scores={scores}
        onPlayAgain={resetGame}
        onBackHome={() => {
          setViewMode("start");
          setIsRunning(false);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <GameBoard
        board={board}
        turn={turn}
        status={status}
        scores={scores}
        lastMove={lastMove}
        depth={depth}
        speedMs={speedMs}
        isRunning={isRunning}
        moveHistory={moveHistory}
        energizedCells={energizedCells}
        explodingCells={explodingCells}
        onCellClick={(row, col) => {
          if (isRunning) {
            return;
          }
          const currentMove: Move = { row, col };
          const valid = getValidMoves(board, turn).some((move) => move.row === row && move.col === col);
          if (!valid) {
            setStatus("Invalid move: opponent-owned cell");
            return;
          }
          const result = applyMoveWithEffects(board, currentMove, turn);
          const nextTurnCount = turnCount + 1;
          setBoard(result.board);
          setLastMove(currentMove);
          setMoveHistory((previous) => [...previous, currentMove]);
          setEnergizedCells(result.energizedCells);
          setExplodingCells(result.explodingCells);
          setTurn(turn === 1 ? 2 : 1);
          setTurnCount(nextTurnCount);
          setStatus("Manual move applied");
          clearEffectsSoon();
          finishGameIfNeeded(result.board, nextTurnCount);
        }}
        onStartAuto={() => {
          setStatus("Running");
          setIsRunning(true);
        }}
        onPauseAuto={() => {
          setIsRunning(false);
          setStatus("Paused");
        }}
        onNextStep={() => {
          setIsRunning(false);
          runTurn();
        }}
        onReset={resetGame}
        onDepthChange={setDepth}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}