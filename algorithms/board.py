from copy import deepcopy
from typing import Dict, List, Tuple

try:
    from .explosion import resolve_explosion
except ImportError:  # pragma: no cover - fallback for script execution
    from explosion import resolve_explosion

Cell = Dict[str, int]
Board = List[List[Cell]]


def create_board(size: int = 5) -> Board:
    """Create an empty NxN board."""
    return [[{"player": 0, "power": 0} for _ in range(size)] for _ in range(size)]


def copy_board(board: Board) -> Board:
    """Return a deep copy of the board."""
    return deepcopy(board)


def get_valid_moves(board: Board, player: int) -> List[Tuple[int, int]]:
    """A player can play on empty cells or cells they already own."""
    moves: List[Tuple[int, int]] = []
    for row_index, row in enumerate(board):
        for col_index, cell in enumerate(row):
            if cell["player"] in (0, player):
                moves.append((row_index, col_index))
    return moves


def apply_move(board: Board, row: int, col: int, player: int, threshold: int = 4) -> Board:
    """Apply a move and resolve all resulting explosions without mutating input."""
    size = len(board)
    if row < 0 or col < 0 or row >= size or col >= size:
        raise ValueError("Move is out of board bounds")

    next_board = copy_board(board)
    cell = next_board[row][col]
    if cell["player"] not in (0, player):
        raise ValueError("Invalid move: cell is owned by the opponent")

    cell["player"] = player
    cell["power"] += 1
    return resolve_explosion(next_board, threshold=threshold)