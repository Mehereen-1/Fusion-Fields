from math import inf
from typing import Dict, List, Optional, Tuple

try:
    from .board import apply_move, get_valid_moves
    from .evaluation import evaluate_board
except ImportError:  # pragma: no cover - fallback for script execution
    from board import apply_move, get_valid_moves
    from evaluation import evaluate_board

Cell = Dict[str, int]
Board = List[List[Cell]]
Move = Tuple[int, int]


def minimax(
    board: Board,
    depth: int,
    is_max: bool,
    threshold: int = 4,
    alpha: float = -inf,
    beta: float = inf,
) -> float:
    """Run minimax from Red (max) and Blue (min) perspectives."""
    if depth == 0:
        return float(evaluate_board(board))

    current_player = 1 if is_max else 2
    moves = get_valid_moves(board, current_player)
    if not moves:
        return float(evaluate_board(board))

    if is_max:
        value = -inf
        for row, col in moves:
            next_state = apply_move(board, row, col, current_player, threshold=threshold)
            value = max(value, minimax(next_state, depth - 1, False, threshold, alpha, beta))
            alpha = max(alpha, value)
            if beta <= alpha:
                break
        return value

    value = inf
    for row, col in moves:
        next_state = apply_move(board, row, col, current_player, threshold=threshold)
        value = min(value, minimax(next_state, depth - 1, True, threshold, alpha, beta))
        beta = min(beta, value)
        if beta <= alpha:
            break
    return value


def get_best_move(
    board: Board,
    player: int,
    depth: int = 3,
    threshold: int = 4,
) -> Optional[Move]:
    """Return the best move for the requested player."""
    if player not in (1, 2):
        raise ValueError("Player must be 1 (Red) or 2 (Blue)")

    moves = get_valid_moves(board, player)
    if not moves:
        return None

    is_max_player = player == 1
    best_value = -inf if is_max_player else inf
    best_move: Optional[Move] = None

    for row, col in moves:
        next_state = apply_move(board, row, col, player, threshold=threshold)
        value = minimax(
            next_state,
            depth=depth - 1,
            is_max=not is_max_player,
            threshold=threshold,
            alpha=-inf,
            beta=inf,
        )

        if is_max_player and value > best_value:
            best_value = value
            best_move = (row, col)
        elif not is_max_player and value < best_value:
            best_value = value
            best_move = (row, col)

    return best_move
