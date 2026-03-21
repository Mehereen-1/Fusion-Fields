from typing import Dict, List

Cell = Dict[str, int]
Board = List[List[Cell]]


def evaluate_board(board: Board) -> int:
    """Heuristic score from Red perspective: higher is better for Red."""
    red_power = 0
    blue_power = 0

    for row in board:
        for cell in row:
            if cell["player"] == 1:
                red_power += cell["power"]
            elif cell["player"] == 2:
                blue_power += cell["power"]

    return red_power - blue_power
