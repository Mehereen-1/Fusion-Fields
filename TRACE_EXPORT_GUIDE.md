# Decision Trace Export Guide

## Overview

The game now has built-in **export functionality** for both Minimax and Fuzzy AI decision traces. This allows you to:
- Download traces as JSON files for analysis
- Copy traces to clipboard for sharing
- Process trace data in external tools (Python, Excel, etc.)
- Build datasets for research or machine learning

---

## How to Export Traces

### 1. **Download as JSON File**

When an AI makes a decision:

1. Look at the **Decision Simulation** panel on the right side
2. Once a trace appears, click the **📥 Download JSON** button
3. A file will be saved to your Downloads folder with format:
   ```
   minimax-trace-2026-04-28T14-32-15.json
   fuzzy-trace-2026-04-28T14-32-18.json
   ```

### 2. **Copy to Clipboard**

To copy the trace data:

1. Click the **📋 Copy JSON** button on the Decision Simulation panel
2. You'll see a confirmation: "Trace copied to clipboard!"
3. Paste anywhere with `Ctrl+V` (Windows) or `Cmd+V` (Mac)

---

## What's in the Exported Data

### Minimax Trace Structure

```json
{
  "kind": "minimax",
  "player": 1,
  "depth": 3,
  "randomnessPercentage": 0,
  "bestMove": { "row": 2, "col": 2 },
  "optimalMove": { "row": 2, "col": 2 },
  "bestScore": 42.5,
  "selectedByRandomness": false,
  "exploredNodes": 1247,
  "prunedBranches": 5832,
  "candidates": [
    {
      "move": { "row": 2, "col": 2 },
      "score": 42.5
    },
    {
      "move": { "row": 1, "col": 3 },
      "score": 35.2
    }
  ],
  "tree": {
    "move": null,
    "player": 1,
    "depthRemaining": 3,
    "maximizing": true,
    "alphaIn": -Infinity,
    "betaIn": Infinity,
    "score": 42.5,
    "prunedMoves": [],
    "children": [
      {
        "move": { "row": 2, "col": 2 },
        "player": 2,
        "depthRemaining": 2,
        "score": 42.5,
        "children": [...]
      }
    ]
  },
  "generatedAt": 1714347915234
}
```

**Key Fields:**
- **`exploredNodes`** - How many board positions evaluated
- **`prunedBranches`** - How many branches cut off by alpha-beta pruning
- **`tree`** - Full game tree showing all evaluated moves
- **`candidates`** - Top moves considered, sorted by score

---

### Fuzzy Trace Structure

```json
{
  "kind": "fuzzy",
  "player": 1,
  "aggressionWeight": 60,
  "defenseWeight": 40,
  "randomnessPercentage": 5,
  "bestMove": { "row": 2, "col": 2 },
  "candidates": [
    {
      "move": { "row": 2, "col": 2 },
      "score": 42.8,
      "desirability": 0.428,
      "attackScore": 156.2,
      "defenseScore": 89.4,
      "randomFactor": 0.0,
      "features": {
        "finisher": 0,
        "chainPotential": 2,
        "captureSwing": 3,
        "powerSwing": 2.5,
        "localThreat": 5,
        "localSupport": 2,
        "centerBias": 0.95,
        "setupPotential": 4,
        "counterRisk": 12
      },
      "breakdown": {
        "finishingMove": 0.0,
        "aggression": 0.67,
        "safeExpansion": 0.0,
        "counterPressure": 0.67,
        "boardControl": 0.95,
        "riskPenalty": 0.86
      }
    }
  ],
  "generatedAt": 1714347918456
}
```

**Key Fields:**
- **`features`** - 9 tactical metrics computed for each move
- **`breakdown`** - 6 high-level tactical categories (finishingMove, aggression, etc.)
- **`desirability`** - Final score [0-1] used to rank moves

---

## Programmatic Access

### Using the Export Utilities (TypeScript)

```typescript
import { 
  downloadTrace,
  copyTraceToClipboard,
  exportMinimaxTrace,
  exportFuzzyTrace,
  traceToText,
  exportTraceBatch
} from "./traceExporter";

// Download a trace
downloadTrace(decisionTrace);

// Download with custom filename
downloadTrace(decisionTrace, "my-important-trace.json");

// Copy to clipboard
const success = copyTraceToClipboard(decisionTrace);

// Get formatted summary (Minimax)
const summary = exportMinimaxTrace(trace);
console.log(`Explored: ${summary.statistics.exploredNodes} nodes`);
console.log(`Pruning efficiency: ${summary.statistics.pruningEfficiency}`);

// Get formatted summary (Fuzzy)
const summary = exportFuzzyTrace(trace);
console.log(`Finisher weight: ${summary.topCandidates[0].breakdown.finishingMove}`);

// Convert to human-readable text
const text = traceToText(trace);
console.log(text);

// Export multiple traces at once
exportTraceBatch([trace1, trace2, trace3]);
```

---

## Processing Exported Data

### Python Analysis Example

```python
import json
from pathlib import Path

# Load exported trace
with open("minimax-trace-2026-04-28T14-32-15.json") as f:
    trace = json.load(f)

# Analyze exploration efficiency
explored = trace["exploredNodes"]
pruned = trace["prunedBranches"]
total = explored + pruned
pruning_ratio = pruned / total

print(f"Pruning reduced search by {pruning_ratio*100:.1f}%")
print(f"Alpha-beta pruning saved {pruned} node evaluations")

# Analyze move scores
candidates = sorted(trace["candidates"], key=lambda x: x["score"], reverse=True)
top_move = candidates[0]
runner_up = candidates[1] if len(candidates) > 1 else None

print(f"Best move: ({top_move['move']['row']}, {top_move['move']['col']}) with score {top_move['score']:.2f}")
if runner_up:
    print(f"Close second: ({runner_up['move']['row']}, {runner_up['move']['col']}) with score {runner_up['score']:.2f}")
    print(f"Score gap: {top_move['score'] - runner_up['score']:.2f}")
```

### Excel/CSV Analysis

1. Download a trace JSON file
2. Open in Python or Node.js to convert to CSV:
   ```python
   import json, csv
   
   with open("minimax-trace.json") as f:
       trace = json.load(f)
   
   with open("candidates.csv", "w") as f:
       writer = csv.DictWriter(f, fieldnames=["row", "col", "score"])
       writer.writeheader()
       for cand in trace["candidates"]:
           writer.writerow({
               "row": cand["move"]["row"],
               "col": cand["move"]["col"],
               "score": cand["score"]
           })
   ```

---

## Advanced Use Cases

### 1. Building Training Data

Export traces from many games, then:
- Analyze AI decision patterns
- Identify common move types
- Train machine learning models on AI strategy
- Compare human moves vs AI moves

### 2. AI Behavior Comparison

Export traces from:
- **Minimax depth=1** vs **Minimax depth=4** - See how depth affects decisions
- **Fuzzy (aggression=100)** vs **Fuzzy (defense=100)** - See how parameters change behavior
- **Fuzzy vs Minimax** - Compare strategic approaches

### 3. Performance Profiling

```python
# Analyze computation cost
traces = [json.load(open(f)) for f in exported_files]

for trace in traces:
    efficiency = trace["prunedBranches"] / (trace["exploredNodes"] + trace["prunedBranches"])
    print(f"Depth {trace['depth']}: {efficiency*100:.0f}% pruned")
```

### 4. Visualization

Convert trace tree to Graphviz or Mermaid diagram for visualization.

---

## Batch Export (Multiple Traces)

Use the programmatic API to batch export:

```typescript
const allTraces: DecisionTrace[] = [];

// Collect traces during gameplay
gameBoard.onCellClick = (trace) => {
  allTraces.push(trace);
};

// After game, export all at once
exportTraceBatch(allTraces);
// Generates: trace-batch-2026-04-28T14-32-15.json
```

---

## File Locations

Downloaded traces appear in your browser's default **Downloads folder**:
- macOS: `~/Downloads/`
- Windows: `C:\Users\YourUsername\Downloads\`
- Linux: `~/Downloads/`

---

## Troubleshooting

**Button doesn't appear?**
- Make sure an AI is playing (Human mode shows traces)
- Wait for first AI decision to complete

**Download not working?**
- Check browser privacy/permissions settings
- Try copy-to-clipboard instead
- Check your Downloads folder

**File is empty or truncated?**
- Trace wasn't fully generated when exported
- Wait for next AI decision
- Try downloading again

---

## Next Steps

- **Analyze patterns** across multiple games
- **Build datasets** for research
- **Compare strategies** (Minimax vs Fuzzy)
- **Optimize parameters** based on trace data
- **Visualize decision trees** using the exported structure

