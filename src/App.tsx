import { useEffect, useMemo, useRef, useState } from "react";

import "./App.css";
import AboutScreen from "./AboutScreen";
import { DecisionTrace } from "./decisionTrace";
import { DEFAULT_EXPERIMENT_SETTINGS, settingsForPreset } from "./experiment";
import { chooseFuzzyMove } from "./fuzzy";
import GameBoard from "./GameBoard";
import MenuScreen from "./MenuScreen";
import { chooseMinimaxMove } from "./minimax";
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
import { ActivePlayer, BoardData, Move, OpeningState, Player } from "./types";

const SIZE = 5;
const MAX_TURNS = 160;
const EFFECT_CLEAR_DELAY_MS = 500;
const DEFAULT_BLUE_AI_DELAY_MS = 650;
const RESULT_POPUP_DELAY_MS = 1100;

type ViewMode = "start" | "about" | "menu" | "game" | "result";
type Controller = "human" | "fuzzy" | "minimax";
type GameMode = "fuzzy-human" | "minimax-human" | "minimax-fuzzy";

function modeLabel(mode: GameMode): string {
  if (mode === "fuzzy-human") {
    return "Fuzzy vs Human";
  }

  if (mode === "minimax-human") {
    return "Minimax vs Human";
  }

  return "Minimax vs Fuzzy";
}

function controllerFor(mode: GameMode, player: 1 | 2): Controller {
  if (mode === "fuzzy-human") {
    return player === 1 ? "human" : "fuzzy";
  }

  if (mode === "minimax-human") {
    return player === 1 ? "human" : "minimax";
  }

  return player === 1 ? "minimax" : "fuzzy";
}

function playerLabel(mode: GameMode, player: 1 | 2): string {
  const controller = controllerFor(mode, player);
  const color = player === 1 ? "Red" : "Blue";

  if (controller === "human") {
    return `${color} Player`;
  }

  if (controller === "minimax") {
    return `${color} Minimax AI`;
  }

  return `${color} Fuzzy AI`;
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("start");
  const [gameMode, setGameMode] = useState<GameMode>("fuzzy-human");
  const [board, setBoard] = useState<BoardData>(() => createEmptyBoard(SIZE));
  const [openingState, setOpeningState] = useState<OpeningState>(() => createOpeningState());
  const [turn, setTurn] = useState<ActivePlayer>(1);
  const [status, setStatus] = useState("Your turn: choose an empty cell");
  const [speedMs, setSpeedMs] = useState(DEFAULT_BLUE_AI_DELAY_MS);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [winner, setWinner] = useState<Player>(0);
  const [isEndingGame, setIsEndingGame] = useState(false);
  const [decisionTrace, setDecisionTrace] = useState<DecisionTrace | null>(null);
  const [experimentSettings, setExperimentSettings] = useState(DEFAULT_EXPERIMENT_SETTINGS);
  const [autoBattleConfigured, setAutoBattleConfigured] = useState(true);
  const [isAutoBattlePaused, setIsAutoBattlePaused] = useState(false);
  const [energizedCells, setEnergizedCells] = useState<string[]>([]);
  const [explodingCells, setExplodingCells] = useState<string[]>([]);
  const clearEffectsTimeoutRef = useRef<number | null>(null);
  const resultPopupTimeoutRef = useRef<number | null>(null);
  const scores = useMemo(() => computeScores(board), [board]);
  const currentController = controllerFor(gameMode, turn);
  const isAutoBattleMode =
    controllerFor(gameMode, 1) !== "human" && controllerFor(gameMode, 2) !== "human";
  const showMoveHints = viewMode === "game" && !isEndingGame && currentController === "human";
  const validMoveKeys = useMemo(
    () => getValidMoves(board, turn, openingState).map((move) => `${move.row}-${move.col}`),
    [board, turn, openingState],
  );

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

  const resetGame = (modeOverride?: GameMode) => {
    const modeForReset = modeOverride ?? gameMode;
    const hasHumanPlayer =
      controllerFor(modeForReset, 1) === "human" || controllerFor(modeForReset, 2) === "human";

    clearPendingEndGame();
    setBoard(createEmptyBoard(SIZE));
    setOpeningState(createOpeningState());
    setTurn(1);
    setStatus(
      hasHumanPlayer
        ? "Your turn: choose an empty cell"
        : "Experiment Mode ready. Adjust sliders, then press Start Simulation.",
    );
    setMoveHistory([]);
    setLastMove(null);
    setTurnCount(0);
    setWinner(0);
    setDecisionTrace(null);
    setAutoBattleConfigured(hasHumanPlayer);
    setIsAutoBattlePaused(false);
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
          ? `${playerLabel(gameMode, 1)} wins...`
          : resolvedWinner === 2
            ? `${playerLabel(gameMode, 2)} wins...`
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

  const applyCommittedMove = (move: Move, player: ActivePlayer, nextStatus: string) => {
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
    if (viewMode !== "game" || isEndingGame) {
      return;
    }

    if (isAutoBattleMode && !autoBattleConfigured) {
      return;
    }

    if (isAutoBattleMode && isAutoBattlePaused) {
      return;
    }

    const controller = controllerFor(gameMode, turn);
    if (controller === "human") {
      return;
    }

    setStatus(`${playerLabel(gameMode, turn)} is thinking...`);

    const timer = window.setTimeout(() => {
      const bestMove =
        controller === "fuzzy"
          ? chooseFuzzyMove(board, turn, openingState, {
              aggressionWeight: experimentSettings.aggression,
              defenseWeight: experimentSettings.defense,
              randomnessPercentage: experimentSettings.randomness,
              onTrace: setDecisionTrace,
            })
          : chooseMinimaxMove(board, turn, openingState, {
              depth: experimentSettings.depth,
              randomnessPercentage: experimentSettings.randomness,
              onTrace: setDecisionTrace,
            });

      if (!bestMove) {
        setWinner(getWinner(scores));
        setStatus(`${playerLabel(gameMode, turn)} found no valid moves`);
        setDecisionTrace(null);
        setViewMode("result");
        return;
      }

      const nextTurn = turn === 1 ? 2 : 1;
      const nextController = controllerFor(gameMode, nextTurn);
      const nextStatus =
        nextController === "human"
          ? "Your turn: pick one of your cells"
          : `${playerLabel(gameMode, nextTurn)} is thinking...`;

      applyCommittedMove(bestMove, turn, nextStatus);
    }, speedMs);

    return () => window.clearTimeout(timer);
  }, [
    board,
    openingState,
    scores,
    speedMs,
    turn,
    viewMode,
    isEndingGame,
    gameMode,
    experimentSettings,
    isAutoBattleMode,
    autoBattleConfigured,
    isAutoBattlePaused,
  ]);

  if (viewMode === "start") {
    return (
      <StartScreen
        onStart={() => setViewMode("menu")}
        onAbout={() => setViewMode("about")}
        onExit={() => window.close()}
      />
    );
  }

  if (viewMode === "menu") {
    return (
      <MenuScreen
        onSelectFuzzyVsHuman={() => {
          const nextMode: GameMode = "fuzzy-human";
          setGameMode(nextMode);
          resetGame(nextMode);
        }}
        onSelectMinimaxVsHuman={() => {
          const nextMode: GameMode = "minimax-human";
          setGameMode(nextMode);
          resetGame(nextMode);
        }}
        onSelectMinimaxVsFuzzy={() => {
          const nextMode: GameMode = "minimax-fuzzy";
          setGameMode(nextMode);
          resetGame(nextMode);
        }}
        onBack={() => setViewMode("start")}
      />
    );
  }

  if (viewMode === "about") {
    return <AboutScreen onBack={() => setViewMode("start")} onStart={() => setViewMode("menu")} />;
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
    <div className="app-bg">
      <div className="app-shell">
        <GameBoard
          board={board}
          status={status}
          scores={scores}
          lastMove={lastMove}
          modeLabel={modeLabel(gameMode)}
          turnLabel={playerLabel(gameMode, turn)}
          speedMs={speedMs}
          moveHistory={moveHistory}
          energizedCells={energizedCells}
          explodingCells={explodingCells}
          decisionTrace={decisionTrace}
          experimentSettings={experimentSettings}
          showMoveHints={showMoveHints}
          validMoveKeys={showMoveHints ? validMoveKeys : []}
          onExperimentChange={(field, value) => {
            setExperimentSettings((previous) => ({ ...previous, [field]: value }));
          }}
          onApplyPreset={(preset) => {
            setExperimentSettings(settingsForPreset(preset));
          }}
          isAutoBattleMode={isAutoBattleMode}
          isSimulationReady={autoBattleConfigured}
          isSimulationPaused={isAutoBattlePaused}
          onStartSimulation={() => {
            setAutoBattleConfigured(true);
            setIsAutoBattlePaused(false);
            setStatus(`${playerLabel(gameMode, turn)} is thinking...`);
          }}
          onToggleSimulationPause={() => {
            setIsAutoBattlePaused((previous) => {
              const next = !previous;
              setStatus(next ? "Simulation paused" : `${playerLabel(gameMode, turn)} is thinking...`);
              return next;
            });
          }}
          onCellClick={(row, col) => {
            if (isEndingGame || controllerFor(gameMode, turn) !== "human") {
              setStatus(`${playerLabel(gameMode, turn)} is thinking...`);
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
          onMenu={() => {
            clearPendingEndGame();
            setViewMode("menu");
          }}
          onExit={() => window.close()}
          onSpeedChange={setSpeedMs}
        />
      </div>
    </div>
  );
}