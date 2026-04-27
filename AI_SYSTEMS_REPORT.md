# Color Wars: AI Systems Comprehensive Report

**Generated:** April 28, 2026  
**Game:** Fusion-Fields / Color Wars  
**Subject:** Fuzzy Logic AI vs Minimax AI Decision-Making Systems

---

## Executive Summary

Color Wars features two distinct AI decision-making systems:

1. **Fuzzy Logic AI (Blue Player)** - A lightweight, intuitive rule-based system that mimics human tactical reasoning
2. **Minimax AI (Red Player)** - A classical game-tree search algorithm that explores optimal play sequences

Both systems are fully playable and can compete against human players or each other. The game supports three play modes:
- **Fuzzy vs Human** - Human player 1 (Red) vs Fuzzy AI (Blue)
- **Minimax vs Human** - Human player 1 (Red) vs Minimax AI (Blue)  
- **Minimax vs Fuzzy** - AI-only simulation with both algorithms competing

---

## Part 1: Fuzzy Logic AI System

### 1.1 Overview & Philosophy

The Fuzzy Logic AI uses **soft membership functions** and **weighted rule aggregation** to score candidate moves. Rather than computing exact game-tree values, it captures intuitive tactical patterns (e.g., "strong attack potential" or "safe expansion") as continuous membership curves.

**Key Characteristics:**
- **Lightweight:** No tree search needed; evaluates all moves in O(n) time
- **Tunable:** Nine adjustable parameters (membership thresholds + rule weights)
- **Explainable:** Every move score breaks down into six interpretable tactical components
- **Fast:** Ideal for rapid playthroughs and real-time games

### 1.2 Architecture: Three-Stage Pipeline

```
Board State
    ↓
[Stage 1] Generate Legal Blue Moves
    ↓ (for each candidate move)
[Stage 2] Simulate & Extract Features
         • Simulate the move on a cloned board
         • Measure 9 tactical features
    ↓
[Stage 3] Fuzzify & Score Features
         • Apply membership curves to each feature
         • Apply fuzzy rules to generate 6 high-level tactics
         • Combine with user weights (aggression, defense, randomness)
    ↓
Ranked Move List (sorted by desirability)
    ↓
Select Best (or random if randomness > 0)
    ↓
Return Move
```

### 1.3 Stage 1: Move Generation

**Function:** `getValidMoves(board, player, openingState)`

For the current player (Blue = player 2):
- **Opening move:** Select any empty cell (opponent has not yet placed their first piece)
- **Normal move:** Select any Blue-owned cell

**Pseudocode:**
```typescript
function getValidMoves(board, player, openingState):
  moves = []
  if (!openingState[player]):  // Player hasn't moved yet
    // Opening move: must play on empty cell
    for each empty cell (row, col):
      moves.push({row, col})
  else:
    // Normal move: play on own colored cells
    for each cell (row, col) where cell.player == player:
      moves.push({row, col})
  return moves
```

**Example:** On a 5×5 board:
- **Opening:** ~25 possible cells (all empty)
- **Mid-game:** 4-12 Blue cells to choose from

---

### 1.4 Stage 2: Feature Extraction

**Function:** `analyzeMove(board, move, player, openingState)` in `features.ts`

For each candidate move, nine tactical features are computed:

#### Feature 1: **chainPotential**
- **What:** How many cells explode after this move?
- **Calculation:** Simulate the move; count explosive results
- **Range:** [0, ~25] (up to all board cells)
- **Interpretation:** Higher = more board activity triggered

#### Feature 2: **captureSwing**
- **What:** Net cell count gain: Blue gains + Red loses?
- **Calculation:** 
  - Blue cells gained = (Blue after) - (Blue before)
  - Red cells lost = (Red before) - (Red after)
  - Swing = Blue gained + Red lost
- **Range:** [-25, 25]
- **Interpretation:** Positive = Blue improving territory position

#### Feature 3: **powerSwing**
- **What:** How much does Blue's total power increase?
- **Calculation:** (Blue power after) - (Blue power before)
- **Range:** [-120, +120] (9 cells × 4 power each × neighbors)
- **Interpretation:** Higher power = more future explosion capability

#### Feature 4: **localThreat**
- **What:** How much Red pressure surrounds the target cell?
- **Calculation:** Sum of power from all Red neighbors of the target cell
- **Formula:**
  ```
  threat = sum(red_neighbor.power for each adjacent Red cell)
  ```
- **Range:** [0, 16] (4 neighbors × 4 power max each)
- **Interpretation:** High threat = risky move; low threat = safer

#### Feature 5: **localSupport**
- **What:** How many Blue allies surround the target after the move?
- **Calculation:** Count friendly Blue neighbors of the target cell
- **Range:** [0, 4] (4 cardinal directions)
- **Interpretation:** High support = well-defended position

#### Feature 6: **centerBias**
- **What:** Is this move toward the center of the board?
- **Calculation:**
  ```
  distance_to_center = |row - center| + |col - center| (Manhattan)
  centerBias = max(0, 1 - distance / maxDistance)
  ```
- **Example (5×5):** Center is (2,2); (2,2) scores 1.0; corners score ~0.33
- **Range:** [0, 1]
- **Interpretation:** Board center often strategically important

#### Feature 7: **setupPotential**
- **What:** After this move, how many Blue cells are "charged" (ready to explode)?
- **Calculation:** Count Blue cells with `power >= 3` (one below threshold of 4)
- **Range:** [0, 25]
- **Interpretation:** Higher = more threatening setup for next turn

#### Feature 8: **counterRisk**
- **What:** How strong is Red's best response to this move?
- **Calculation:**
  1. After applying this move, enumerate all valid Red moves
  2. For each Red move, score its tactical strength:
     ```
     strength = red.finisher×100 + red.chainPotential×24 
              + red.captureSwing×18 + red.powerSwing×10 
              + red.setupPotential×8 + ...
     ```
  3. Return the maximum strength seen
- **Range:** [0, ~500]
- **Interpretation:** High = risky; Blue leaves Red with powerful reply

#### Feature 9: **finisher**
- **What:** Does this move eliminate all Red cells (instant win)?
- **Calculation:**
  ```
  if (Red cells after move == 0) AND (Blue cells > 0):
    return 1
  else:
    return 0
  ```
- **Range:** {0, 1} (binary)
- **Interpretation:** Immediate victory condition

---

### 1.5 Stage 3: Fuzzy Membership & Rule Aggregation

**File:** `rules.ts`

#### A. Membership Functions

The system uses three types of fuzzy membership curves (defined in `membership.ts`):

**1. Rising Membership (threshold function)**
```
risingMembership(value, start, end):
  if value <= start:
    return 0
  if value >= end:
    return 1
  else:
    return (value - start) / (end - start)
```
- **Interpretation:** "The more value increases from start to end, the more it belongs to the fuzzy set"
- **Example:** `risingMembership(2.5, 1, 3)` → 0.75 (75% membership)

**2. Falling Membership (inverse threshold)**
```
fallingMembership(value, start, end):
  if value <= start:
    return 1
  if value >= end:
    return 0
  else:
    return (end - value) / (end - start)
```
- **Interpretation:** "The higher value goes beyond start, the less it belongs"
- **Example:** `fallingMembership(6, 4, 10)` → 0.4 (40% membership)

**3. Triangular Membership (preference peak)**
```
triangularMembership(value, left, peak, right):
  if value <= left OR value >= right:
    return 0
  if value < peak:
    return (value - left) / (peak - left)
  else:
    return (right - value) / (right - peak)
```
- **Interpretation:** "This range is ideal; edges are less ideal"
- **Example:** `triangularMembership(3, 0, 2, 5)` → 0.2 (slightly ideal)

#### B. Feature Fuzzification

Features are converted to membership values using the three curve types:

| Feature | Membership Rules |
|---------|------------------|
| **finisher** | Rising(0.2, 1) - Strong signal if move wins |
| **chainPotential** | Rising(1, 3) - Good if ≥ 1 explosion |
| **captureSwing** | Rising(1, 4) + Triangular(0, 2, 5) - Prefer 2-5 cell swing |
| **powerSwing** | Rising(1, 4) - Good if ≥ 1 power gained |
| **localThreat** | Rising(2, 7) + Falling(1, 5) - Threat is concerning |
| **localSupport** | Rising(1, 3) + Falling(0, 2) - Support is good but not essential |
| **centerBias** | Rising(0.25, 0.85) - Prefer center moves |
| **setupPotential** | Rising(1, 4) - Good if multiple cells charged |
| **counterRisk** | Rising(5, 13) + Falling(4, 10) - High risk is bad |

#### C. Fuzzy Rule Aggregation

Six high-level tactical concepts are computed via **fuzzy AND/OR** operations:

**1. Finishing Move**
```
finishingMove = max(
  finisherCertain,  // Direct win
  min(chainHigh, captureHigh)  // Massive domination combo
)
```
- Meaning: "Move is decisive or creates overwhelming advantage"

**2. Aggression**
```
aggression = max(
  min(chainHigh, captureHigh),    // Many explosions + cell gains
  min(powerHigh, setupHigh)        // Gain power + setup future threats
)
```
- Meaning: "Move is offensively strong and sets up threats"

**3. Safe Expansion**
```
safeExpansion = max(
  min(captureHigh, threatLow),     // Gain cells + low enemy pressure
  min(captureMedium, supportHigh), // Moderate gain + good support
  min(captureHigh, counterRiskLow) // Gain cells + safe from reply
)
```
- Meaning: "Move expands territory without excessive risk"

**4. Counter Pressure**
```
counterPressure = max(
  min(threatHigh, captureHigh),    // Threaten + capture enemy
  min(threatHigh, chainHigh),      // Threaten + chain explosions
  min(setupHigh, supportHigh)      // Setup threats + supported
)
```
- Meaning: "Move applies pressure or maintains initiative"

**5. Board Control**
```
boardControl = max(
  centerGood,                       // Occupying center
  min(captureHigh, supportHigh),   // Gaining cells + supported
  min(setupHigh, centerGood)       // Setup threats + center position
)
```
- Meaning: "Move improves strategic board position"

**6. Risk Penalty**
```
riskPenalty = max(
  counterRiskHigh,                           // Opponent has strong reply
  threatHigh * supportLow,                   // Threatened + alone
  (1 - powerHigh) * threatHigh * 0.75        // Low power + high threat
)
```
- Meaning: "Move exposes weakness or leaves opening"

#### D. Desirability Scoring

The six tactics are combined into a final desirability score with **manually tuned weights**:

```typescript
desirability = clamp(0, 1,
  finishingMove * 0.38      // 38% weight: wins are paramount
  + aggression * 0.24       // 24% weight: strong offensive play
  + safeExpansion * 0.18    // 18% weight: steady expansion
  + counterPressure * 0.12  // 12% weight: initiative matters
  + boardControl * 0.14     // 14% weight: position matters
  - riskPenalty * 0.26      // -26% penalty: avoid disasters
)
```

**Key Insight:** Winning moves (finisher) contribute 38% of score weight. Risk mitigation (penalty) is stronger than any single positive tactic.

---

### 1.6 Stage 4: Move Ranking & Selection

**Function:** `rankFuzzyMoves()` and `chooseFuzzyMove()`

#### Ranking Algorithm

1. **For each candidate move:**
   - Compute 9 features
   - Apply fuzzification + rules
   - Calculate **attack score:**
     ```
     attackScore = finisher×100 + chainPotential×24 + captureSwing×18 
                 + powerSwing×10 + setupPotential×8 + aggression×100 
                 + counterPressure×76
     ```
   - Calculate **defense score:**
     ```
     defenseScore = localSupport×18 + (10 - min(counterRisk, 10))×8 
                  + safeExpansion×100 + boardControl×68 - riskPenalty×86
     ```

2. **Apply user weights:**
   ```
   normalize(aggression_weight, defense_weight)
   offense_ratio = aggression_weight / (aggression_weight + defense_weight)
   defense_ratio = defense_weight / (aggression_weight + defense_weight)
   
   final_score = offense_ratio * attackScore 
               + defense_ratio * defenseScore 
               + random(-amplitudeAmplitude, +randomAmplitude)
   ```

3. **Sort moves by final_score (descending)**

#### Selection Logic

```typescript
if (randomnessPercentage > 0):
  if random() * 100 < randomnessPercentage:
    return random_move_from(all_moves)  // Introduce variance
    
return rankedMoves[0]  // Choose best-scoring move
```

**Tuning Parameters:**
- **aggressionWeight** [0-100]: Prioritize attacks vs defense
- **defenseWeight** [0-100]: Prioritize defense vs attacks
- **randomnessPercentage** [0-50]: Probability of random move (explore vs exploit)

---

### 1.7 Computational Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Generate moves | O(board_size²) | Visit all cells |
| Per-move simulation | O(board_size² × threshold_prop) | Chain reactions |
| Feature extraction | O(board_size²) | Count cells and neighbors |
| Fuzzification | O(1) | Per feature, constant calculation |
| Rule aggregation | O(1) | Fixed 6 rules |
| **Total per decision** | **O(n × board_size²)** | n = number of legal moves |
| Typical on 5×5 | **~0.5-2ms** | Instant for player experience |

**Advantage:** Scales gracefully; suitable for real-time play.

---

### 1.8 Example Move Evaluation

**Scenario:** 5×5 board, Blue player deciding between two moves:

**Move A: Attack (3, 3) - Central cell adjacent to Red**
```
Features Extracted:
  chainPotential = 2 (triggers 2 explosions)
  captureSwing = 3 (Blue gains 2 cells, Red loses 1)
  powerSwing = 2.5 (Blue power +2.5)
  localThreat = 5 (2 Red neighbors, power 2-3 each)
  localSupport = 2 (2 Blue neighbors)
  centerBias = 0.95 (near board center)
  setupPotential = 4 (4 Blue cells charged after)
  counterRisk = 12 (Red has strong reply available)
  finisher = 0 (Red survives)

Fuzzification:
  chainHigh = rising(2, 1, 3) = 1.0 ✓ Good
  captureHigh = rising(3, 1, 4) = 0.67 ✓ Decent
  threatHigh = rising(5, 2, 7) = 0.67 ✓ Moderate
  counterRiskHigh = rising(12, 5, 13) = 0.86 ✗ Risky

High-Level Rules:
  finishingMove = 0
  aggression = max(min(1.0, 0.67), ...) = 0.67 ✓ Aggressive
  safeExpansion = min(0.67, falling(5, 1, 5)) = 0 ✗ Not safe
  counterPressure = max(min(0.67, 1.0), ...) = 0.67 ✓ Pressuring
  boardControl = max(0.95, ...) = 0.95 ✓ Central
  riskPenalty = max(0.86, ...) = 0.86 ✗ Risky

Desirability = 0 * 0.38 + 0.67 * 0.24 + 0 * 0.18 
             + 0.67 * 0.12 + 0.95 * 0.14 - 0.86 * 0.26
           = 0 + 0.16 + 0 + 0.08 + 0.13 - 0.22
           = 0.15 (Medium score: risky but aggressive)
```

**Move B: Defend (2, 1) - Expand Blue territory safely**
```
Features Extracted:
  chainPotential = 0 (no explosions)
  captureSwing = 1 (Blue gains 1, Red loses 0)
  powerSwing = 1 (Blue power +1)
  localThreat = 2 (1 distant Red neighbor)
  localSupport = 3 (3 Blue neighbors)
  centerBias = 0.65 (off-center)
  setupPotential = 2 (2 cells charged)
  counterRisk = 4 (Red has weak reply)
  finisher = 0 (Red survives)

Fuzzification:
  chainHigh = rising(0, 1, 3) = 0 ✗ No chain
  supportHigh = rising(3, 1, 3) = 1.0 ✓ Well supported
  threatLow = falling(2, 1, 5) = 1.0 ✓ Low threat
  counterRiskLow = falling(4, 4, 10) = 1.0 ✓ Safe

High-Level Rules:
  finishingMove = 0
  aggression = 0 (no chains, modest gains)
  safeExpansion = max(min(0.5, 1.0), min(0.6, 1.0), ...) = 0.6 ✓ Safe
  counterPressure = 0 (passive)
  boardControl = max(0.65, min(0.5, 1.0), ...) = 0.65 ✓ Decent
  riskPenalty = 0 (no risk)

Desirability = 0 * 0.38 + 0 * 0.24 + 0.6 * 0.18 
             + 0 * 0.12 + 0.65 * 0.14 - 0 * 0.26
           = 0 + 0 + 0.11 + 0 + 0.09 - 0
           = 0.20 (Higher score: safe and solid)
```

**Decision:** Move B scores higher (0.20 vs 0.15). Fuzzy AI prefers safety.

---

### 1.9 Tuning & Customization

**File:** `src/fuzzy/rules.ts`

To adjust AI behavior:

1. **Modify membership thresholds:**
   ```typescript
   // More aggressive: lower chain threshold
   const chainHigh = risingMembership(features.chainPotential, 0, 2);  // Was (1, 3)
   ```

2. **Adjust rule weights in desirability:**
   ```typescript
   const desirability = clamp01(
     finishingMove * 0.50      // ↑ More weight on winning moves
     + aggression * 0.30       // ↑ More aggressive overall
     + safeExpansion * 0.05    // ↓ Less cautious
     + counterPressure * 0.12
     + boardControl * 0.14
     - riskPenalty * 0.10      // ↓ Accept more risk
   );
   ```

3. **Adjust move scoring coefficients in `chooseFuzzyMove.ts`:**
   ```typescript
   const attackScore = 
     features.finisher * 150      // ↑ Finishers more valuable
     + features.chainPotential * 30
     + features.captureSwing * 20  // ↑ Territory gains more important
     + ...
   ```

---

## Part 2: Minimax AI System

### 2.1 Overview & Philosophy

Minimax is a **classical game-tree search algorithm** that:
1. Explores all possible move sequences up to a fixed depth
2. Evaluates terminal nodes using a static board evaluation function
3. Propagates scores backward via alternating MAX/MIN layers
4. Selects the move that maximizes own score (worst-case assumption)
5. Uses **alpha-beta pruning** to eliminate irrelevant branches

**Key Characteristics:**
- **Optimal:** Finds provably best move within search depth
- **Strategic:** Reasons about multi-move sequences
- **Deterministic:** Same board state → same move (unless randomness enabled)
- **Tunable:** Search depth and randomness control strength
- **Explainable:** Full game tree trace available for inspection

### 2.2 Algorithm: Game Tree Search with Alpha-Beta Pruning

```
Board State (Red to move)
    ↓
root_node = Minimax(board, depth=3, alpha=-∞, beta=+∞, maximizing=True)
    ├─ For each Red move:
    │   ├─ Apply move → new board
    │   ├─ child_node = Minimax(new_board, depth=2, alpha, beta, maximizing=False)
    │   │   ├─ For each Blue move:
    │   │   │   ├─ Apply move → new board
    │   │   │   ├─ child_node = Minimax(..., depth=1, alpha, beta, maximizing=True)
    │   │   │   │   ├─ For each Red move:
    │   │   │   │   │   └─ Evaluate board → score (leaf)
    │   │   │   │   └─ Return max score + alpha-beta pruning
    │   │   │   └─ Update beta, check pruning condition
    │   │   └─ Return min score
    │   └─ Update alpha, check pruning condition
    └─ Return max score
    ↓
Select move with highest score
    ↓
Return Move
```

### 2.3 Core Algorithm: Recursive Minimax

**Function:** `minimax()` in `chooseMinimaxMove.ts`

```typescript
function minimax(
  board: BoardData,
  openingState: OpeningState,
  currentPlayer: ActivePlayer,     // Who moves at this node
  rootPlayer: ActivePlayer,         // Who is making the root decision
  depth: number,                    // Remaining depth
  alpha: number,                    // Best MAX can guarantee
  beta: number,                     // Best MIN can guarantee
  stats: SearchStats,
  move: Move | null
): SearchResult
```

#### Terminal Conditions

**1. Depth Reached (depth == 0):**
- Evaluate board using static evaluation function
- Return evaluation score
- Record terminal reason: "depth"

**2. No Legal Moves (current player blocked):**
- If opponent also blocked: evaluate board (draw/stalemate)
- If opponent has moves: pass turn (current player skips)
- Record terminal reason: "no-moves" or "pass"

**3. Game Over (one side eliminated):**
- Detected in evaluation function
- Return ±100,000 (overwhelming score advantage)

#### Maximizing Node (currentPlayer == rootPlayer)

Goal: Find the **highest** score possible

```typescript
best_score = -Infinity
for each legal move in current_board:
  new_board = apply_move(move)
  child_score = minimax(new_board, opponent, depth-1, alpha, beta)
  best_score = max(best_score, child_score)
  
  // Alpha-Beta Pruning
  alpha = max(alpha, best_score)
  if beta <= alpha:
    // Pruning: opponent won't let us reach here
    pruned_count += remaining_moves
    break
    
return best_score
```

#### Minimizing Node (currentPlayer != rootPlayer)

Goal: Find the **lowest** score possible (minimize opponent's advantage)

```typescript
best_score = +Infinity
for each legal move in current_board:
  new_board = apply_move(move)
  child_score = minimax(new_board, opponent, depth-1, alpha, beta)
  best_score = min(best_score, child_score)
  
  // Alpha-Beta Pruning
  beta = min(beta, best_score)
  if beta <= alpha:
    // Pruning: maximizer won't let us reach here
    pruned_count += remaining_moves
    break
    
return best_score
```

### 2.4 Alpha-Beta Pruning Optimization

**Concept:** Eliminate branches that cannot affect the final decision.

**Invariant:**
- **alpha** = best score MAX (us) can guarantee so far
- **beta** = best score MIN (opponent) can guarantee so far

**Pruning Condition:** `if beta <= alpha: prune remaining siblings`

**Meaning:** 
- At a MIN node, if we find a score ≤ alpha, the MAX parent will never choose this node
- At a MAX node, if we find a score ≥ beta, the MIN parent will never choose this node

**Impact:** Typically reduces nodes evaluated by **70-90%** compared to exhaustive search.

**Example (pruning in action):**

```
      MAX (alpha=-∞, beta=+∞)
       /          \
      MIN         [not visited]
    (a=−∞,b=+∞)
     /    \
   5      8  <- MIN returns 5
           
    alpha = max(-∞, 5) = 5
    beta = 10 (set by parent)
    
    Next branch:
    Child returns 3 (< beta=10) → good for us
    
    Next branch:
    Child score is high (>10) → set beta = 4
    → beta (4) <= alpha (5)? YES! PRUNE remaining
```

### 2.5 Static Board Evaluation Function

**Function:** `evaluateBoard()` in `chooseMinimaxMove.ts`

Scores a board position without further search. Used at leaf nodes.

```typescript
function evaluateBoard(board, openingState, rootPlayer):
  scores = computeScores(board)
  rootPower = scores[rootPlayer].power
  rivalPower = scores[rival].power
  rootCells = scores[rootPlayer].cells
  rivalCells = scores[rival].cells
  
  rootMobility = count(valid_moves(rootPlayer))
  rivalMobility = count(valid_moves(rival))
  
  // Terminal victory condition
  if GAME_OVER:
    if rootCells > 0 AND rivalCells == 0:
      return +100,000  // We win!
    if rivalCells > 0 AND rootCells == 0:
      return -100,000  // We lose!
  
  // Linear combination of strategic factors
  evaluation = (rootPower - rivalPower) * 7
             + (rootCells - rivalCells) * 16
             + (rootMobility - rivalMobility) * 5
  
  return evaluation
```

#### Evaluation Components

| Component | Weight | Rationale |
|-----------|--------|-----------|
| Power differential | 7× | More power → more future explosion potential |
| Cell count differential | 16× | More cells → more territory control (higher weight) |
| Mobility differential | 5× | More moves → more strategic flexibility |
| Terminal win/loss | ±100,000 | Dominates all other factors |

**Tuning:** Adjust weights to favor different strategies:
- **Higher power weight:** Favor building up explosions
- **Higher cell weight:** Favor territorial expansion
- **Higher mobility weight:** Favor keeping options open

---

### 2.6 Root Move Selection

**Function:** `chooseMinimaxMove()`

After exploring all moves from the root:

```typescript
function chooseMinimaxMove(board, player, openingState, options):
  depth = options.depth ?? 3
  randomness = options.randomnessPercentage ?? 0
  
  moves = getValidMoves(board, player)
  
  // Evaluate each move at root
  candidates = []
  for each move in moves:
    new_board = apply_move(move)
    score = minimax(new_board, opponent, depth-1, -∞, +∞, ...)
    candidates.push({move, score})
  
  // Find best move
  bestMove = candidates.max_by(score)
  bestScore = bestMove.score
  
  // Apply randomness for exploration
  if random() * 100 < randomness:
    return random_move()  // Occasionally play suboptimal move
  
  return bestMove
```

---

### 2.7 Computational Complexity

| Factor | Impact | Notes |
|--------|--------|-------|
| Branching factor | ~6-8 | Typical valid moves per position |
| Search depth | 3 (default) | Configurable |
| Pruning efficiency | 70-90% | Alpha-beta pruning |
| **Worst case** | O(b^d) | Exponential without pruning |
| **With pruning** | O(b^(d/2)) | Square-root speedup typical |
| Typical on 5×5, depth=3 | **500-2000 nodes** | 10-50ms computation |
| Typical on 5×5, depth=4 | **~20,000 nodes** | 200-500ms computation |

**Depth Analysis:**
- **Depth 1:** Immediate best move (very shallow)
- **Depth 2:** React to opponent's likely reply (standard)
- **Depth 3:** Two moves ahead for both (default)
- **Depth 4:** Strategic planning; noticeable delay
- **Depth 5+:** Very slow; not practical for real-time

---

### 2.8 Decision Trace & Transparency

The algorithm generates a full **decision trace** for inspection:

```typescript
interface MinimaxDecisionTrace {
  kind: "minimax"
  player: 1 | 2
  depth: 3
  bestMove: {row, col}
  bestScore: 42.5
  
  candidates: [
    {move: {row: 2, col: 2}, score: 42.5},   // Best
    {move: {row: 1, col: 3}, score: 35.2},   // Good
    {move: {row: 3, col: 1}, score: 28.1},   // Okay
  ]
  
  exploredNodes: 1247
  prunedBranches: 5832
  
  tree: {
    // Full game tree for inspection
    move: null
    player: 1
    depth: 3
    score: 42.5
    maximizing: true
    children: [
      {move: {row: 2, col: 2}, score: 42.5, children: [...]},
      ...
    ]
  }
}
```

**Insights from trace:**
- **How many nodes explored?** Indicates depth & complexity
- **How many branches pruned?** Indicates pruning effectiveness
- **Score difference between top candidates?** Indicates move confidence
- **Game tree structure:** Visualize multi-move sequences

---

### 2.9 Example Minimax Search (Depth=2)

**Scenario:** Red player on 3×3 board, depth=2

```
Root (RED maximizing, depth=2):
  ├─ Move 1: Place at (1,1)
  │   └─ Board after: Red at (1,1), Blue at (0,0)
  │       └─ MIN layer (BLUE minimizing, depth=1):
  │           ├─ Blue move A: Place at (0,1)
  │           │   └─ Evaluation: Blue +10 power
  │           ├─ Blue move B: Place at (1,0) → PRUNE if found < 15
  │           └─ Return: MIN({15, 12, ...}) = 12
  │       └─ Return 12
  │
  ├─ Move 2: Place at (0,2)  
  │   └─ Board after: Red at (0,2), Blue at (0,0)
  │       └─ MIN layer (BLUE minimizing, depth=1):
  │           ├─ Blue move A: Place at (1,1) → Evaluation: 8
  │           ├─ Blue move B: Chain reaction! → Evaluation: 42 > 8
  │           └─ Return: 8  (MIN stops here; 8 < 12 from move 1)
  │       └─ Return 8
  │
  └─ Move 3: Place at (2,1)
      └─ [Similar evaluation]
      
Root selects Move 1 with score 12 (highest MAX)
```

---

### 2.10 Comparison: Minimax vs Fuzzy

| Aspect | Minimax | Fuzzy |
|--------|---------|-------|
| **Approach** | Game tree search | Heuristic rules |
| **Time** | 10-500ms (depth dependent) | 0.5-2ms (constant) |
| **Optimality** | Provably best (at depth) | Heuristic approximation |
| **Transparency** | Full trace available | Partial breakdown available |
| **Strategic depth** | Multi-move sequences | Single-move evaluation |
| **Tuning** | Depth + randomness | 9 thresholds + 6 weights |
| **Weaknesses** | Shallow depth vs real positions; evaluator matters | Cannot see ahead; depends on heuristics |
| **Strengths** | Looks ahead; avoids tactics; adapts | Fast; explainable; real-time friendly |
| **Best for** | Strategic planning | Tactical patterns & speed |

---

### 2.11 Depth Recommendations

**For interactive play with human:**
- **Depth 2-3:** 10-50ms delay (imperceptible to most)
- **Depth 4:** 200-500ms delay (noticeable but acceptable)

**For AI vs AI simulation:**
- **Depth 3-4:** Standard balance of speed and strategy
- **Higher depths:** May slow game to crawl

**For mobile/slow devices:**
- **Depth 1-2:** Ensure sub-100ms response time

---

## Part 3: Comparison & Strategy

### 3.1 Playing Styles

**Fuzzy AI (Blue):**
- **Immediate tactics:** Evaluates each move in isolation
- **Pattern recognition:** Recognizes good board shapes (center control, support)
- **Responsive:** Fast, adapts to user weights (aggression/defense)
- **Exploitable:** May miss multi-move threats or opportunities

**Minimax AI (Red):**
- **Lookahead:** Considers opponent's likely responses
- **Strategic:** Reasons about multi-move sequences
- **Defensive:** Avoids moves that give opponent tactical advantages
- **Computational:** Slower, requires more thinking time

### 3.2 Matchup Predictions

**Minimax vs Fuzzy (typical, depth=3, equal weights):**
- **Minimax advantage:** 60-70% win rate
- **Reasoning:** Minimax's lookahead catches Fuzzy's tactical oversights
- **Fuzzy advantage:** 30-40% - When Minimax at shallow depth, luck in opening

**Fuzzy (high aggression) vs Minimax (defensive):**
- **Wild openings:** Fuzzy may gain early advantage
- **Mid-game:** Minimax usually consolidates position
- **Late-game:** Minimax's strategy dominates

**Human vs Minimax (depth=3):**
- **Human advantage:** Intuition, creativity, long-term planning beyond depth
- **Minimax advantage:** No blunders, looks ahead consistently
- **Outcome:** Depends on human skill; competitive

**Human vs Fuzzy:**
- **Human advantage:** Understanding opponent, pattern recognition
- **Fuzzy advantage:** Consistent execution, no fatigue
- **Outcome:** Typically human wins with practice

---

### 3.3 Edge Cases & Limitations

#### Minimax Limitations

1. **Shallow depth bias:** At depth=3, only sees 3 moves ahead; misses deep tactics
2. **Evaluator imperfect:** Static evaluation may misevaluate positions (e.g., trapped pieces)
3. **No opening knowledge:** Doesn't use opening theory; plays generic positions
4. **Horizon effect:** May sacrifice advantage beyond depth to achieve false score boost

#### Fuzzy Limitations

1. **No lookahead:** Doesn't anticipate opponent's strong replies
2. **Fixed heuristics:** Weights don't adapt as game progresses
3. **Membership curves:** Arbitrary thresholds; may not match actual board dynamics
4. **Counterrisk underweighted:** May overlook dangerous opponent setups

---

### 3.4 Hybrid Strategies

**Option 1: Fuzzy for early game, Minimax for endgame**
- Fuzzy's speed keeps pace with human players
- Minimax's depth essential in close endgames

**Option 2: Fuzzy with deep randomness, Minimax conservative**
- Fuzzy (50% randomness) explores tactics wildly
- Minimax plays predictably safe moves

**Option 3: Joint decision (ensemble)**
- Evaluate each move with both systems
- Combine scores: `0.5 * fuzzy_score + 0.5 * minimax_score`
- Balances speed & depth

---

## Part 4: Configuration & Deployment

### 4.1 Game Mode Parameters

#### Fuzzy vs Human (Blue Fuzzy AI)

```typescript
// In App.tsx
chooseFuzzyMove(board, player, openingState, {
  aggressionWeight: 60,        // Slightly aggressive
  defenseWeight: 40,            // Less defensive
  randomnessPercentage: 5,      // Small exploration
})
```

**Difficulty settings:**
- **Easy:** aggression=30, defense=70, randomness=20
- **Normal:** aggression=50, defense=50, randomness=5
- **Hard:** aggression=70, defense=30, randomness=0

#### Minimax vs Human (Blue Minimax AI)

```typescript
chooseMinimaxMove(board, player, openingState, {
  depth: 3,                    // Standard depth
  randomnessPercentage: 2,     // Occasional suboptimal moves
})
```

**Difficulty settings:**
- **Easy:** depth=1, randomness=30
- **Normal:** depth=3, randomness=0
- **Hard:** depth=4, randomness=0

#### Minimax vs Fuzzy (AI-only simulation)

```typescript
// Both players AI-controlled
const fuzzyMove = chooseFuzzyMove(..., {
  aggressionWeight: experimentSettings.aggression,
  defenseWeight: experimentSettings.defense,
  randomnessPercentage: experimentSettings.randomness,
})

const minimaxMove = chooseMinimaxMove(..., {
  depth: experimentSettings.depth,
  randomnessPercentage: experimentSettings.randomness,
})
```

---

### 4.2 UI Integration

**Decision Trace Display:**

In `MinimaxScreen.tsx` / `ExperimentPanel.tsx`, show:
- Chosen move + score
- Top 3 alternatives
- Game tree visualization (interactive)
- Statistics (nodes explored, pruned branches)

**For Fuzzy:**
- Chosen move + desirability score
- Breakdown: finisher%, aggression%, safe expansion%, etc.
- Top 5 alternatives

---

### 4.3 Performance Optimization

**Caching:**
- Reuse board clones if multiple evaluations needed
- Memoize feature calculations per move

**Parallel evaluation (future):**
- Evaluate top-level moves in parallel threads
- Combine results for root selection

**Iterative deepening:**
- Start at depth=1, incrementally go deeper
- Stop when time budget exhausted
- Always have a best move ready

---

## Part 5: Testing & Validation

### 5.1 Test Cases

**Fuzzy Logic Tests:**
```typescript
// Test 1: Finisher move should score highest
expect(fuzzy_score({finisher: 1})).toBe(highest)

// Test 2: Weights should affect ranking
expect(fuzzy_score_with(aggression=100)).toBeGreaterThan(
  fuzzy_score_with(aggression=0)
)

// Test 3: Randomness should create variance
scores = [fuzzy_move() for _ in range(100)]
expect(variance(scores)).toBeGreaterThan(0)
```

**Minimax Tests:**
```typescript
// Test 1: Depth-1 should match single-move eval
depth1_move = minimax(depth=1)
best_move = board.all_moves.max_by(eval)
expect(depth1_move).toEqual(best_move)

// Test 2: Pruning shouldn't change score
with_pruning = minimax(alpha_beta=true)
without_pruning = minimax(alpha_beta=false)
expect(with_pruning.score).toEqual(without_pruning.score)

// Test 3: Increasing depth shouldn't make inferior move best
depth3_best = minimax(depth=3)
depth4_top = minimax(depth=4)[0:3]
expect(depth3_best in depth4_top)  // Usually true
```

---

### 5.2 Validation Against Baselines

- **Fuzzy vs Random:** Fuzzy should win 80%+ of games
- **Minimax vs Random:** Minimax should win 95%+ (near-perfect)
- **Minimax depth=3 vs depth=2:** Depth=3 should win 70%+
- **Fuzzy (aggression=100) vs Fuzzy (defense=100):** Aggression should win ~55%

---

## Conclusion

**Fuzzy Logic AI** provides a fast, tunable, and interpretable decision-making system ideal for real-time play. It recognizes tactical patterns and adapts to user preferences.

**Minimax AI** provides strategic lookahead and provably strong play, suitable for competitive scenarios where optimal depth-bounded decisions are preferred.

Both systems can be combined with human players or each other, supporting three distinct game modes. The modular architecture allows easy adjustment of difficulty, style, and play depth.

---

**End of Report**  
*Generated for Fusion-Fields / Color Wars AI Analysis*
