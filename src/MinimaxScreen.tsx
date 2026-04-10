import { useEffect, useMemo, useRef, useState } from "react";

import GameBoard from "./GameBoard";
import {
  applyMoveWithEffects,
  computeScores,
  createEmptyBoard,
  createOpeningState,
  getValidMoves,
  getWinner,
} from "./gameLogic";
import { BoardData, Move, OpeningState, Player } from "./types";

const SIZE = 5;
const EFFECT_CLEAR_DELAY_MS = 500;
const DEFAULT_AI_DELAY_MS = 650;
const RESULT_POPUP_DELAY_MS = 1100;
const EXPLOSION_THRESHOLD = 4;

export default function MinimaxScreen() {
  useEffect(() => {
    console.log("MinimaxScreen mounted");
    return () => console.log("MinimaxScreen unmounted");
  }, []);

  const [board, setBoard] = useState<BoardData>(() => createEmptyBoard(SIZE));
  const [openingState, setOpeningState] = useState<OpeningState>(() => createOpeningState());
  const [turn, setTurn] = useState<Player>(1);
  const [status, setStatus] = useState("Your turn: choose an empty cell");
  const [speedMs, setSpeedMs] = useState(DEFAULT_AI_DELAY_MS);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [turnCount, setTurnCount] = useState(0);
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
    }, EFFECT_CLEAR_DELAY_MS) as unknown as number;
  };

  const resetGame = () => {
    if (resultPopupTimeoutRef.current !== null) {
      window.clearTimeout(resultPopupTimeoutRef.current);
      resultPopupTimeoutRef.current = null;
    }

    if (clearEffectsTimeoutRef.current !== null) {
      window.clearTimeout(clearEffectsTimeoutRef.current);
      clearEffectsTimeoutRef.current = null;
    }

    setBoard(createEmptyBoard(SIZE));
    setOpeningState(createOpeningState());
    setTurn(1);
    setStatus("Your turn: choose an empty cell");
    setMoveHistory([]);
    setLastMove(null);
    setTurnCount(0);
    setEnergizedCells([]);
    setExplodingCells([]);
    setIsEndingGame(false);
  };

  const finishGameIfNeeded = (nextBoard: BoardData, nextOpeningState: OpeningState, nextTurnCount: number) => {
    const nextScores = computeScores(nextBoard);
    const oneSideEliminated =
      (nextScores.redCells === 0 && nextScores.blueCells > 0) ||
      (nextScores.blueCells === 0 && nextScores.redCells > 0);

    const canEndByElimination = nextOpeningState[1] && nextOpeningState[2];

    if ((canEndByElimination && oneSideEliminated) || nextTurnCount >= 160) {
      setIsEndingGame(true);
      const resolvedWinner = getWinner(nextScores);
      setStatus(resolvedWinner === 1 ? "Red player wins..." : resolvedWinner === 2 ? "Blue minimax wins..." : "Draw...");

      if (resultPopupTimeoutRef.current !== null) {
        window.clearTimeout(resultPopupTimeoutRef.current);
      }

      resultPopupTimeoutRef.current = window.setTimeout(() => {
        setStatus("Simulation finished");
        setIsEndingGame(false);
        resultPopupTimeoutRef.current = null;
      }, RESULT_POPUP_DELAY_MS) as unknown as number;

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
    if (isEndingGame || turn !== 2) {
      return;
    }

    setStatus("Blue minimax AI is thinking...");

    const timer = window.setTimeout(() => {
      (async () => {
        try {
          const resp = await fetch("http://127.0.0.1:8000/ai-move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ board, player: 2, depth: 3, threshold: EXPLOSION_THRESHOLD }),
          });

          if (!resp.ok) {
            throw new Error(`AI backend error: ${resp.status}`);
          }

          const data = await resp.json();
          const { row, col } = data as { row: number | null; col: number | null };

          if (row === null || col === null) {
            const winner = getWinner(scores);
            setStatus(
              winner === 1
                ? "Blue minimax found no valid moves. Red player wins..."
                : winner === 2
                  ? "Blue minimax found no valid moves. Blue minimax wins..."
                  : "Blue minimax found no valid moves. Draw...",
            );
            return;
          }

          applyCommittedMove({ row, col }, 2, "Your turn: pick one of your red cells");
        } catch (err) {
          setStatus("Minimax AI error: " + (err as Error).message);
        }
      })();
    }, speedMs);

    return () => window.clearTimeout(timer);
  }, [board, openingState, scores, speedMs, turn, isEndingGame]);

  return (
    <div className="minimax-shell">
      <div style={{ padding: 12, background: "rgba(255,255,255,0.03)", marginBottom: 8 }}>
        <strong>Minimax Screen</strong>
        <div style={{ marginTop: 6 }}>
          <button className="btn btn-ghost" onClick={() => window.location.reload()} type="button">
            Back Home
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "#ddd" }}>Debug: board size {board.length}x{board.length}</div>
      </div>

      <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <h2>Minimax vs Player</h2>
        <button onClick={resetGame} className="btn btn-ghost">
          Reset
        </button>
        <div style={{ marginLeft: "auto" }}>
          <label style={{ marginRight: 6 }}>AI delay</label>
          <input
            type="range"
            min={100}
            max={1500}
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
          />
        </div>
      </header>

      <GameBoard
        board={board}
        status={status}
        scores={scores}
        lastMove={lastMove}
        modeLabel="Minimax vs Human"
        turnLabel={turn === 1 ? "Red Player" : "Blue Minimax AI"}
        speedMs={speedMs}
        moveHistory={moveHistory}
        energizedCells={energizedCells}
        explodingCells={explodingCells}
        showMoveHints={!isEndingGame && turn === 1}
        validMoveKeys={
          !isEndingGame && turn === 1
            ? getValidMoves(board, 1, openingState).map((move) => `${move.row}-${move.col}`)
            : []
        }
        onCellClick={(row, col) => {
          if (isEndingGame || turn !== 1) {
            return;
          }

          const currentPlayerHasOpened = openingState[1];
          const currentMove: Move = { row, col };
          const valid = getValidMoves(board, 1, openingState).some(
            (move) => move.row === row && move.col === col,
          );
          if (!valid) {
            setStatus(
              currentPlayerHasOpened ? "Invalid move: play on one of your colored cells" : "Invalid move: opening move must be on an empty cell",
            );
            return;
          }
          applyCommittedMove(currentMove, 1, "Move played");
        }}
        onReset={resetGame}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
