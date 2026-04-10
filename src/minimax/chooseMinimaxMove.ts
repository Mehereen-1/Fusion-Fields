import {
  applyMoveWithEffects,
  computeScores,
  getValidMoves,
} from "../gameLogic";
import { MinimaxDecisionTrace, MinimaxTraceCandidate, MinimaxTraceNode } from "../decisionTrace";
import { ActivePlayer, BoardData, Move, OpeningState } from "../types";

interface MinimaxOptions {
  depth?: number;
  randomnessPercentage?: number;
  onTrace?: (trace: MinimaxDecisionTrace) => void;
}

interface SearchStats {
  exploredNodes: number;
  prunedBranches: number;
}

interface SearchResult {
  score: number;
  node: MinimaxTraceNode;
}

function oppositePlayer(player: ActivePlayer): ActivePlayer {
  return player === 1 ? 2 : 1;
}

function evaluateBoard(board: BoardData, openingState: OpeningState, rootPlayer: ActivePlayer): number {
  const scores = computeScores(board);
  const rootPower = rootPlayer === 1 ? scores.redPower : scores.bluePower;
  const rivalPower = rootPlayer === 1 ? scores.bluePower : scores.redPower;
  const rootCells = rootPlayer === 1 ? scores.redCells : scores.blueCells;
  const rivalCells = rootPlayer === 1 ? scores.blueCells : scores.redCells;

  const rival = oppositePlayer(rootPlayer);
  const rootMobility = getValidMoves(board, rootPlayer, openingState).length;
  const rivalMobility = getValidMoves(board, rival, openingState).length;

  if (openingState[1] && openingState[2]) {
    if (rootCells > 0 && rivalCells === 0) {
      return 100000;
    }

    if (rivalCells > 0 && rootCells === 0) {
      return -100000;
    }
  }

  return (
    (rootPower - rivalPower) * 7 +
    (rootCells - rivalCells) * 16 +
    (rootMobility - rivalMobility) * 5
  );
}

function minimax(
  board: BoardData,
  openingState: OpeningState,
  currentPlayer: ActivePlayer,
  rootPlayer: ActivePlayer,
  depth: number,
  alpha: number,
  beta: number,
  stats: SearchStats,
  move: Move | null,
): SearchResult {
  stats.exploredNodes += 1;

  const node: MinimaxTraceNode = {
    move,
    player: currentPlayer,
    depthRemaining: depth,
    maximizing: currentPlayer === rootPlayer,
    alphaIn: alpha,
    betaIn: beta,
    score: 0,
    children: [],
  };

  if (depth === 0) {
    node.score = evaluateBoard(board, openingState, rootPlayer);
    node.terminalReason = "depth";
    return { score: node.score, node };
  }

  const moves = getValidMoves(board, currentPlayer, openingState);
  const rival = oppositePlayer(currentPlayer);

  if (moves.length === 0) {
    const rivalMoves = getValidMoves(board, rival, openingState);
    if (rivalMoves.length === 0) {
      node.score = evaluateBoard(board, openingState, rootPlayer);
      node.terminalReason = "no-moves";
      return { score: node.score, node };
    }

    const passed = minimax(board, openingState, rival, rootPlayer, depth - 1, alpha, beta, stats, null);
    node.children.push(passed.node);
    node.score = passed.score;
    node.terminalReason = "pass";
    return { score: node.score, node };
  }

  const maximizing = currentPlayer === rootPlayer;

  if (maximizing) {
    let best = -Infinity;

    for (let index = 0; index < moves.length; index += 1) {
      const move = moves[index];
      const next = applyMoveWithEffects(board, move, currentPlayer, openingState);
      const child = minimax(next.board, next.openingState, rival, rootPlayer, depth - 1, alpha, beta, stats, move);
      node.children.push(child.node);
      best = Math.max(best, child.score);
      alpha = Math.max(alpha, child.score);

      if (beta <= alpha) {
        stats.prunedBranches += moves.length - index - 1;
        node.prunedMoves = moves.slice(index + 1);
        break;
      }
    }

    node.score = best;
    return { score: node.score, node };
  }

  let best = Infinity;

  for (let index = 0; index < moves.length; index += 1) {
    const move = moves[index];
    const next = applyMoveWithEffects(board, move, currentPlayer, openingState);
    const child = minimax(next.board, next.openingState, rival, rootPlayer, depth - 1, alpha, beta, stats, move);
    node.children.push(child.node);
    best = Math.min(best, child.score);
    beta = Math.min(beta, child.score);

    if (beta <= alpha) {
      stats.prunedBranches += moves.length - index - 1;
      node.prunedMoves = moves.slice(index + 1);
      break;
    }
  }

  node.score = best;
  return { score: node.score, node };
}

export function chooseMinimaxMove(
  board: BoardData,
  player: ActivePlayer,
  openingState: OpeningState,
  options: MinimaxOptions = {},
): Move | null {
  const depth = Math.max(1, options.depth ?? 3);
  const randomnessPercentage = Math.max(0, Math.min(50, options.randomnessPercentage ?? 0));
  const moves = getValidMoves(board, player, openingState);

  if (moves.length === 0) {
    return null;
  }

  const rival = oppositePlayer(player);
  let bestMove = moves[0];
  let bestScore = -Infinity;
  const stats: SearchStats = { exploredNodes: 0, prunedBranches: 0 };
  const candidates: MinimaxTraceCandidate[] = [];
  const rootNode: MinimaxTraceNode = {
    move: null,
    player,
    depthRemaining: depth,
    maximizing: true,
    alphaIn: -Infinity,
    betaIn: Infinity,
    score: -Infinity,
    children: [],
  };

  for (const move of moves) {
    const next = applyMoveWithEffects(board, move, player, openingState);
    const branch = minimax(next.board, next.openingState, rival, player, depth - 1, -Infinity, Infinity, stats, move);
    const score = branch.score;
    candidates.push({ move, score });
    rootNode.children.push(branch.node);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  rootNode.score = bestScore;

  const useRandomMove = Math.random() * 100 < randomnessPercentage;
  const selectedMove = useRandomMove
    ? moves[Math.floor(Math.random() * moves.length)]
    : bestMove;

  if (options.onTrace) {
    options.onTrace({
      kind: "minimax",
      player,
      depth,
      randomnessPercentage,
      bestMove: selectedMove,
      optimalMove: bestMove,
      selectedByRandomness: useRandomMove,
      bestScore,
      exploredNodes: stats.exploredNodes,
      prunedBranches: stats.prunedBranches,
      candidates: candidates.sort((left, right) => right.score - left.score),
      tree: rootNode,
      generatedAt: Date.now(),
    });
  }

  return selectedMove;
}
