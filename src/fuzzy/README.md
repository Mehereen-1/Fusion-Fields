# Fuzzy Blue AI

This folder keeps the Blue player's fuzzy-logic AI separate from the React UI.

## Files

- `membership.ts`: small membership helpers such as rising, falling, and triangular curves
- `features.ts`: extracts move features from the board after simulating a move
- `rules.ts`: combines the fuzzy memberships into a final desirability score
- `chooseFuzzyMove.ts`: ranks legal moves and returns the best one

## Current feature set

Each Blue move is evaluated with these inputs:

- `chainPotential`: how many explosions the move creates
- `captureSwing`: how many cells Blue gains while Red loses cells
- `powerSwing`: how much Blue's total power increases
- `localThreat`: nearby Red pressure around the target cell
- `localSupport`: nearby Blue support after the move
- `centerBias`: whether the move helps control the center
- `setupPotential`: how many Blue cells are left charged and ready to threaten explosions
- `counterRisk`: how strong Red's best reply looks after Blue commits
- `finisher`: whether the move can immediately eliminate Red

## How to tune it

1. Open `rules.ts`
2. Adjust the thresholds inside the membership calls
3. Adjust the weights in the final `desirability` formula
4. Rebuild and play a few rounds

Start by changing only one threshold or weight at a time so the behavior stays easy to understand.
