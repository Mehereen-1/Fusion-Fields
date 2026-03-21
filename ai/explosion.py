from collections import deque
from copy import deepcopy
from typing import Deque, Dict, List, Tuple

Cell = Dict[str, int]
Board = List[List[Cell]]


def _neighbors(row: int, col: int, size: int) -> List[Tuple[int, int]]:
    positions = []
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = row + dr, col + dc
        if 0 <= nr < size and 0 <= nc < size:
            positions.append((nr, nc))
    return positions


def resolve_explosion(board: Board, threshold: int = 4) -> Board:
    """Resolve all chain reactions and return a new board."""
    size = len(board)
    next_board = deepcopy(board)
    queue: Deque[Tuple[int, int]] = deque()

    for row in range(size):
        for col in range(size):
            if next_board[row][col]["power"] >= threshold and next_board[row][col]["player"] != 0:
                queue.append((row, col))

    while queue:
        row, col = queue.popleft()
        cell = next_board[row][col]
        if cell["player"] == 0 or cell["power"] < threshold:
            continue

        owner = cell["player"]
        cell["player"] = 0
        cell["power"] = 0

        for nr, nc in _neighbors(row, col, size):
            neighbor = next_board[nr][nc]
            neighbor["player"] = owner
            neighbor["power"] += 1
            if neighbor["power"] >= threshold:
                queue.append((nr, nc))

    return next_board