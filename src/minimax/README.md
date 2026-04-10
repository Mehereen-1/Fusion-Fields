# Minimax Module

This folder contains local Minimax AI logic used by the React game runtime.

## Files

- `chooseMinimaxMove.ts`: alpha-beta Minimax move selection.
- `index.ts`: module export barrel.

## Notes

- Uses existing game simulation helpers from `gameLogic.ts`.
- Supports opening rules through `OpeningState`.
- Current default search depth in app flow: `3`.
