import { useEffect, useMemo, useRef, useState } from "react";

import "./App.css";
import { chooseFuzzyMove } from "./fuzzy";
import GameBoard from "./GameBoard";
import {
  applyMoveWithEffects,
  computeScores,
  createEmptyBoard,
  createOpeningState,
  getValidMoves,
  getWinner,
} from "./gameLogic";
import ResultScreen from "./ResultScreen";
import StartScreen from "./StartScreen";
import { BoardData, Move, OpeningState, Player } from "./types";

const SIZE = 5;
const MAX_TURNS = 160;
const EFFECT_CLEAR_DELAY_MS = 500;
const BLUE_AI_DELAY_MS = 650;
const RESULT_POPUP_DELAY_MS = 1100;

type BluePlayerMode = "human" | "fuzzy";
const BLUE_PLAYER_MODE: BluePlayerMode = "fuzzy";

type ViewMode = "start" | "game" | "result";

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

function minimax(board: BoardData, openingState: OpeningState, depth: number, isMax: boolean): number {
  if (depth === 0) {
    return evaluate(board);
  }

  const player: Player = isMax ? 1 : 2;
  const moves = getValidMoves(board, player, openingState);
  if (moves.length === 0) {
    return evaluate(board);
  }

  if (isMax) {
    let best = Number.NEGATIVE_INFINITY;
    for (const move of moves) {
      const simulated = applyMoveWithEffects(board, move, player, openingState);
      best = Math.max(best, minimax(simulated.board, simulated.openingState, depth - 1, false));
    }
    return best;
  }

  let best = Number.POSITIVE_INFINITY;
  for (const move of moves) {
    const simulated = applyMoveWithEffects(board, move, player, openingState);
    best = Math.min(best, minimax(simulated.board, simulated.openingState, depth - 1, true));
  }
  return best;
}

function chooseMove(board: BoardData, openingState: OpeningState, player: Player, depth: number): Move | null {
  const moves = getValidMoves(board, player, openingState);
  if (moves.length === 0) {
    return null;
  }

  let bestMove: Move | null = null;
  let bestValue = player === 1 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

  for (const move of moves) {
    const simulated = applyMoveWithEffects(board, move, player, openingState);
    const score = minimax(simulated.board, simulated.openingState, Math.max(0, depth - 1), player !== 1);
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

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("start");
  const [board, setBoard] = useState<BoardData>(() => createEmptyBoard(SIZE));
  const [openingState, setOpeningState] = useState<OpeningState>(() => createOpeningState());
  const [turn, setTurn] = useState<Player>(1);
  const [status, setStatus] = useState("Ready");
  const [isRunning, setIsRunning] = useState(false);
  const [depth, setDepth] = useState(3);
  const [speedMs, setSpeedMs] = useState(750);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [winner, setWinner] = useState<Player>(0);
  const [isEndingGame, setIsEndingGame] = useState(false);
  const [energizedCells, setEnergizedCells] = useState<string[]>([]);
  const [explodingCells, setExplodingCells] = useState<string[]>([]);
  const clearEffectsTimeoutRef = useRef<number | null>(null);
  const resultPopupTimeoutRef = useRef<number | null>(null);

  const scores = useMemo(() => computeScores(board), [board]);

  const clearEffectsSoon = () => {
    if (clearEffectsTimeoutRef.current !== null) {
      window.clearTimeout(clearEffectsTimeoutRef.current);
    }

    clearEffectsTimeoutRef.current = window.setTimeout(() => {
      setEnergizedCells([]);
      setExplodingCells([]);
      clearEffectsTimeoutRef.current = null;
    }, EFFECT_CLEAR_DELAY_MS);
  };

  const clearPendingEndGame = () => {
    if (resultPopupTimeoutRef.current !== null) {
      window.clearTimeout(resultPopupTimeoutRef.current);
      resultPopupTimeoutRef.current = null;
    }
    setIsEndingGame(false);
  };

  const resetGame = () => {
    clearPendingEndGame();
    setBoard(createEmptyBoard(SIZE));
    setOpeningState(createOpeningState());
    setTurn(1);
    setStatus("Ready");
    setIsRunning(false);
    setMoveHistory([]);
    setLastMove(null);
    setTurnCount(0);
    setWinner(0);
    setEnergizedCells([]);
    setExplodingCells([]);
    if (clearEffectsTimeoutRef.current !== null) {
      window.clearTimeout(clearEffectsTimeoutRef.current);
      clearEffectsTimeoutRef.current = null;
    }
    setViewMode("game");
  };

  const finishGameIfNeeded = (
    nextBoard: BoardData,
    nextOpeningState: OpeningState,
    nextTurnCount: number,
  ): boolean => {
    const nextScores = computeScores(nextBoard);
    const oneSideEliminated =
      (nextScores.redCells === 0 && nextScores.blueCells > 0) ||
      (nextScores.blueCells === 0 && nextScores.redCells > 0);

    const canEndByElimination = nextOpeningState[1] && nextOpeningState[2];

    if ((canEndByElimination && oneSideEliminated) || nextTurnCount >= MAX_TURNS) {
      setIsRunning(false);
      setIsEndingGame(true);

      const resolvedWinner = getWinner(nextScores);
      const statusMessage =
        resolvedWinner === 1 ? "Red wins..." : resolvedWinner === 2 ? "Blue wins..." : "Draw...";

      setWinner(resolvedWinner);
      setStatus(statusMessage);

      if (resultPopupTimeoutRef.current !== null) {
        window.clearTimeout(resultPopupTimeoutRef.current);
      }

      resultPopupTimeoutRef.current = window.setTimeout(() => {
        setStatus("Simulation finished");
        setIsEndingGame(false);
        setViewMode("result");
        resultPopupTimeoutRef.current = null;
      }, RESULT_POPUP_DELAY_MS);

      return true;
    }
    return false;
  };

  const applyCommittedMove = (move: Move, player: Player, nextStatus: string) => {
    const result = applyMoveWithEffects(board, move, player, openingState);
    const nextTurn = player === 1 ? 2 : 1;
    const nextTurnCount = turnCount + 1;

    setBoard(result.board);
    setOpeningState(result.openingState);
    setLastMove(move);
    setMoveHistory((previous) => [...previous, move]);
    setEnergizedCells(result.energizedCells);
    setExplodingCells(result.explodingCells);
    setTurn(nextTurn);
    setTurnCount(nextTurnCount);
    setStatus(result.explodingCells.length > 0 ? "Chain reaction triggered" : nextStatus);
    clearEffectsSoon();

    finishGameIfNeeded(result.board, result.openingState, nextTurnCount);
  };

  const chooseAutomatedMove = (currentBoard: BoardData, currentOpeningState: OpeningState, player: Player) => {
    if (player === 2 && BLUE_PLAYER_MODE === "fuzzy") {
      return chooseFuzzyMove(currentBoard, player, currentOpeningState);
    }

    return chooseMove(currentBoard, currentOpeningState, player, depth);
  };

  const runTurn = () => {
    setStatus("Thinking...");

    const bestMove = chooseAutomatedMove(board, openingState, turn);
    if (!bestMove) {
      setWinner(getWinner(scores));
      setStatus("No valid moves");
      setIsRunning(false);
      setViewMode("result");
      return;
    }

    applyCommittedMove(bestMove, turn, "Running");
  };

  useEffect(() => {
    if (!isRunning || viewMode !== "game" || isEndingGame) {
      return;
    }

    const timer = window.setTimeout(() => {
      runTurn();
    }, speedMs);

    return () => window.clearTimeout(timer);
  }, [isRunning, board, openingState, turn, speedMs, depth, viewMode, isEndingGame]);

  useEffect(() => {
    return () => {
      if (clearEffectsTimeoutRef.current !== null) {
        window.clearTimeout(clearEffectsTimeoutRef.current);
      }

      if (resultPopupTimeoutRef.current !== null) {
        window.clearTimeout(resultPopupTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (viewMode !== "game" || isRunning || isEndingGame || BLUE_PLAYER_MODE !== "fuzzy" || turn !== 2) {
      return;
    }

    setStatus("Blue fuzzy AI is thinking...");

    const timer = window.setTimeout(() => {
      const bestMove = chooseFuzzyMove(board, 2, openingState);

      if (!bestMove) {
        setWinner(getWinner(scores));
        setStatus("Blue AI found no valid moves");
        setViewMode("result");
        return;
      }

      applyCommittedMove(bestMove, 2, "Blue fuzzy AI moved");
    }, BLUE_AI_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [board, openingState, isRunning, scores, turn, viewMode, isEndingGame]);

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
            clearPendingEndGame();
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
          if (isRunning || isEndingGame || (BLUE_PLAYER_MODE === "fuzzy" && turn === 2)) {
            if (BLUE_PLAYER_MODE === "fuzzy" && turn === 2) {
              setStatus("Blue fuzzy AI is thinking...");
            }
            return;
          }

          const currentPlayerHasOpened = turn === 1 || turn === 2 ? openingState[turn] : false;
          const currentMove: Move = { row, col };
          const valid = getValidMoves(board, turn, openingState).some(
            (move) => move.row === row && move.col === col,
          );
          if (!valid) {
            setStatus(
              currentPlayerHasOpened
                ? "Invalid move: play on one of your colored cells"
                : "Invalid move: opening move must be on an empty cell",
            );
            return;
          }
          applyCommittedMove(currentMove, turn, "Manual move applied");
        }}
        onStartAuto={() => {
          if (isEndingGame) {
            return;
          }
          setStatus("Running");
          setIsRunning(true);
        }}
        onPauseAuto={() => {
          setIsRunning(false);
          setStatus("Paused");
        }}
        onNextStep={() => {
          if (isEndingGame) {
            return;
          }
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
