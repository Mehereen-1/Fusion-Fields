from typing import Dict, List, Optional

from fastapi import Body, FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from .board import apply_move
    from .minimax import get_best_move
except ImportError:  # pragma: no cover - fallback for script execution
    from board import apply_move
    from minimax import get_best_move

Cell = Dict[str, int]
Board = List[List[Cell]]

app = FastAPI(title="Color War AI Backend")


class MoveModel(BaseModel):
    row: int = Field(ge=0)
    col: int = Field(ge=0)


class AIMoveRequest(BaseModel):
    board: Board
    player: int = Field(ge=1, le=2)
    depth: int = Field(default=3, ge=1, le=8)
    threshold: int = Field(default=4, ge=2)


class ApplyMoveRequest(BaseModel):
    board: Board
    move: MoveModel
    player: int = Field(ge=1, le=2)
    threshold: int = Field(default=4, ge=2)


@app.get("/ai-move")
def ai_move(payload: AIMoveRequest = Body(...)) -> Dict[str, Optional[int]]:
    """Return the best move for the given board and player."""
    try:
        best = get_best_move(
            board=payload.board,
            player=payload.player,
            depth=payload.depth,
            threshold=payload.threshold,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if best is None:
        return {"row": None, "col": None}

    return {"row": best[0], "col": best[1]}


@app.post("/apply-move")
def apply_move_endpoint(payload: ApplyMoveRequest) -> Dict[str, Board]:
    """Apply one move and return the board after all chain reactions."""
    try:
        updated = apply_move(
            board=payload.board,
            row=payload.move.row,
            col=payload.move.col,
            player=payload.player,
            threshold=payload.threshold,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"board": updated}