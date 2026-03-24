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
const DEFAULT_BLUE_AI_DELAY_MS = 650;
const RESULT_POPUP_DELAY_MS = 1100;

type BluePlayerMode = "human" | "fuzzy";
const BLUE_PLAYER_MODE: BluePlayerMode = "fuzzy";

type ViewMode = "start" | "game" | "result";

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("start");
  const [board, setBoard] = useState<BoardData>(() => createEmptyBoard(SIZE));
  const [openingState, setOpeningState] = useState<OpeningState>(() => createOpeningState());
  const [turn, setTurn] = useState<Player>(1);
  const [status, setStatus] = useState("Your turn: choose an empty cell");
  const [speedMs, setSpeedMs] = useState(DEFAULT_BLUE_AI_DELAY_MS);
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
    setStatus("Your turn: choose an empty cell");
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
      setIsEndingGame(true);

      const resolvedWinner = getWinner(nextScores);
      const statusMessage =
        resolvedWinner === 1
          ? "Red player wins..."
          : resolvedWinner === 2
            ? "Blue fuzzy AI wins..."
            : "Draw...";

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
    if (viewMode !== "game" || isEndingGame || BLUE_PLAYER_MODE !== "fuzzy" || turn !== 2) {
      return;
    }

    setStatus("Blue fuzzy AI is thinking...");

    const timer = window.setTimeout(() => {
      const bestMove = chooseFuzzyMove(board, 2, openingState);

      if (!bestMove) {
        setWinner(getWinner(scores));
        setStatus("Blue fuzzy AI found no valid moves");
        setViewMode("result");
        return;
      }

      applyCommittedMove(bestMove, 2, "Your turn: pick one of your red cells");
    }, speedMs);

    return () => window.clearTimeout(timer);
  }, [board, openingState, scores, speedMs, turn, viewMode, isEndingGame]);

  const handleStart = () => {
    resetGame();
  };

  const handleSettings = () => {
    setViewMode("game");
    setStatus("You are Red. Adjust blue AI delay, then make your move.");
  };

  const handleAbout = () => {
    setViewMode("game");
    setStatus("You are Red. Blue uses fuzzy AI in this chain-reaction match.");
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
        speedMs={speedMs}
        moveHistory={moveHistory}
        energizedCells={energizedCells}
        explodingCells={explodingCells}
        onCellClick={(row, col) => {
          if (isEndingGame || (BLUE_PLAYER_MODE === "fuzzy" && turn === 2)) {
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
          applyCommittedMove(currentMove, turn, "Move played");
        }}
        onReset={resetGame}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
