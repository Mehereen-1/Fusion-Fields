import { DecisionTrace, MinimaxDecisionTrace, FuzzyDecisionTrace } from "./decisionTrace";

/**
 * Export a decision trace as a formatted JSON file and trigger download
 */
export function downloadTrace(trace: DecisionTrace, filename?: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const traceType = trace.kind === "minimax" ? "minimax" : "fuzzy";
  const defaultFilename = filename || `${traceType}-trace-${timestamp}.json`;

  const jsonString = JSON.stringify(trace, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = defaultFilename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Copy trace to clipboard as JSON string
 */
export function copyTraceToClipboard(trace: DecisionTrace): boolean {
  try {
    const jsonString = JSON.stringify(trace, null, 2);
    navigator.clipboard.writeText(jsonString);
    return true;
  } catch (error) {
    console.error("Failed to copy trace to clipboard:", error);
    return false;
  }
}

/**
 * Export minimax trace with enhanced readability
 */
export function exportMinimaxTrace(trace: MinimaxDecisionTrace) {
  const summary = {
    kind: trace.kind,
    timestamp: new Date(trace.generatedAt).toISOString(),
    player: trace.player === 1 ? "Red" : "Blue",
    depth: trace.depth,
    randomnessPercentage: trace.randomnessPercentage,
    decision: {
      bestMove: trace.bestMove ? `(${trace.bestMove.row}, ${trace.bestMove.col})` : null,
      bestScore: trace.bestScore?.toFixed(2),
      optimalMove: trace.optimalMove ? `(${trace.optimalMove.row}, ${trace.optimalMove.col})` : null,
      selectedByRandomness: trace.selectedByRandomness,
    },
    statistics: {
      exploredNodes: trace.exploredNodes,
      prunedBranches: trace.prunedBranches,
      totalNodes: trace.exploredNodes + trace.prunedBranches,
      pruningEfficiency: `${((trace.prunedBranches / (trace.exploredNodes + trace.prunedBranches)) * 100).toFixed(1)}%`,
    },
    candidates: trace.candidates.map((c) => ({
      move: `(${c.move.row}, ${c.move.col})`,
      score: c.score.toFixed(2),
    })),
    fullTrace: trace,
  };

  return summary;
}

/**
 * Export fuzzy trace with feature breakdown
 */
export function exportFuzzyTrace(trace: FuzzyDecisionTrace) {
  const summary = {
    kind: trace.kind,
    timestamp: new Date(trace.generatedAt).toISOString(),
    player: trace.player === 1 ? "Red" : "Blue",
    parameters: {
      aggressionWeight: trace.aggressionWeight,
      defenseWeight: trace.defenseWeight,
      randomnessPercentage: trace.randomnessPercentage,
    },
    decision: {
      bestMove: trace.bestMove ? `(${trace.bestMove.row}, ${trace.bestMove.col})` : null,
    },
    topCandidates: trace.candidates.slice(0, 5).map((c) => ({
      move: `(${c.move.row}, ${c.move.col})`,
      desirability: c.desirability.toFixed(3),
      features: {
        finisher: c.features.finisher,
        chainPotential: c.features.chainPotential.toFixed(2),
        captureSwing: c.features.captureSwing.toFixed(2),
        powerSwing: c.features.powerSwing.toFixed(2),
        localThreat: c.features.localThreat.toFixed(2),
        localSupport: c.features.localSupport,
        centerBias: c.features.centerBias.toFixed(3),
        setupPotential: c.features.setupPotential,
        counterRisk: c.features.counterRisk.toFixed(2),
      },
      breakdown: {
        finishingMove: c.breakdown.finishingMove.toFixed(3),
        aggression: c.breakdown.aggression.toFixed(3),
        safeExpansion: c.breakdown.safeExpansion.toFixed(3),
        counterPressure: c.breakdown.counterPressure.toFixed(3),
        boardControl: c.breakdown.boardControl.toFixed(3),
        riskPenalty: c.breakdown.riskPenalty.toFixed(3),
      },
    })),
    allCandidates: trace.candidates.length,
    fullTrace: trace,
  };

  return summary;
}

/**
 * Export trace as human-readable text format
 */
export function traceToText(trace: DecisionTrace): string {
  let text = "";

  if (trace.kind === "minimax") {
    const t = trace as MinimaxDecisionTrace;
    text += `=== MINIMAX DECISION TRACE ===\n`;
    text += `Timestamp: ${new Date(t.generatedAt).toISOString()}\n`;
    text += `Player: ${t.player === 1 ? "Red" : "Blue"}\n`;
    text += `Depth: ${t.depth}\n`;
    text += `Randomness: ${t.randomnessPercentage}%\n\n`;

    text += `DECISION:\n`;
    text += `  Best Move: ${t.bestMove ? `(${t.bestMove.row}, ${t.bestMove.col})` : "None"}\n`;
    text += `  Best Score: ${t.bestScore?.toFixed(2) ?? "N/A"}\n`;
    text += `  Optimal Move: ${t.optimalMove ? `(${t.optimalMove.row}, ${t.optimalMove.col})` : "None"}\n`;
    text += `  Selected by Randomness: ${t.selectedByRandomness ? "Yes" : "No"}\n\n`;

    text += `STATISTICS:\n`;
    text += `  Explored Nodes: ${t.exploredNodes}\n`;
    text += `  Pruned Branches: ${t.prunedBranches}\n`;
    text += `  Total Nodes: ${t.exploredNodes + t.prunedBranches}\n`;
    text += `  Pruning Efficiency: ${((t.prunedBranches / (t.exploredNodes + t.prunedBranches)) * 100).toFixed(1)}%\n\n`;

    text += `TOP CANDIDATES:\n`;
    t.candidates.slice(0, 5).forEach((c, i) => {
      text += `  ${i + 1}. Move (${c.move.row}, ${c.move.col}): ${c.score.toFixed(2)}\n`;
    });
  } else {
    const t = trace as FuzzyDecisionTrace;
    text += `=== FUZZY DECISION TRACE ===\n`;
    text += `Timestamp: ${new Date(t.generatedAt).toISOString()}\n`;
    text += `Player: ${t.player === 1 ? "Red" : "Blue"}\n`;
    text += `Aggression: ${t.aggressionWeight}, Defense: ${t.defenseWeight}, Randomness: ${t.randomnessPercentage}%\n\n`;

    text += `DECISION:\n`;
    text += `  Best Move: ${t.bestMove ? `(${t.bestMove.row}, ${t.bestMove.col})` : "None"}\n\n`;

    text += `TOP CANDIDATES:\n`;
    t.candidates.slice(0, 5).forEach((c, i) => {
      text += `  ${i + 1}. Move (${c.move.row}, ${c.move.col}): ${c.desirability.toFixed(3)}\n`;
      text += `     Finisher: ${c.breakdown.finishingMove.toFixed(2)}, Aggression: ${c.breakdown.aggression.toFixed(2)}, Safe: ${c.breakdown.safeExpansion.toFixed(2)}\n`;
      text += `     Features: Chain=${c.features.chainPotential.toFixed(0)}, Capture=${c.features.captureSwing.toFixed(0)}, Threat=${c.features.localThreat.toFixed(1)}\n`;
    });
  }

  return text;
}

/**
 * Create a batch export with multiple traces
 */
export function exportTraceBatch(traces: DecisionTrace[]) {
  const batch = {
    exportedAt: new Date().toISOString(),
    traceCount: traces.length,
    traces: traces.map((t) => (t.kind === "minimax" ? exportMinimaxTrace(t as MinimaxDecisionTrace) : exportFuzzyTrace(t as FuzzyDecisionTrace))),
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const filename = `trace-batch-${timestamp}.json`;

  const jsonString = JSON.stringify(batch, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Parse and analyze exported trace JSON
 */
export function analyzeTraceJSON(jsonString: string): { trace: DecisionTrace; stats: any } | null {
  try {
    const trace = JSON.parse(jsonString) as DecisionTrace;

    if (trace.kind === "minimax") {
      const t = trace as MinimaxDecisionTrace;
      return {
        trace,
        stats: {
          type: "minimax",
          depth: t.depth,
          exploredNodes: t.exploredNodes,
          prunedBranches: t.prunedBranches,
          pruningRatio: (t.prunedBranches / (t.exploredNodes + t.prunedBranches)).toFixed(2),
          bestScore: t.bestScore?.toFixed(2),
          candidates: t.candidates.length,
        },
      };
    } else {
      const t = trace as FuzzyDecisionTrace;
      return {
        trace,
        stats: {
          type: "fuzzy",
          aggression: t.aggressionWeight,
          defense: t.defenseWeight,
          randomness: t.randomnessPercentage,
          candidates: t.candidates.length,
          topScore: t.candidates[0]?.desirability.toFixed(3),
        },
      };
    }
  } catch (error) {
    console.error("Failed to analyze trace JSON:", error);
    return null;
  }
}
