import { ReactNode } from "react";
import { DecisionTrace, MinimaxTraceNode } from "./decisionTrace";
import "./TraceModal.css";

interface TraceModalProps {
  trace: DecisionTrace | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TraceModal({ trace, isOpen, onClose }: TraceModalProps) {
  if (!isOpen || !trace) return null;

  const moveLabel = (move: any): string => (move ? `(${move.row + 1}, ${move.col + 1})` : "-");
  const scoreLabel = (value: number): string =>
    Number.isFinite(value) ? value.toFixed(1) : value > 0 ? "+inf" : "-inf";
  const boundLabel = (value: number): string =>
    Number.isFinite(value) ? value.toFixed(1) : value > 0 ? "inf" : "-inf";
  const toPercent = (value: number): string => `${Math.round(value * 100)}%`;

  const renderMinimaxTreeNode = (node: MinimaxTraceNode, path: string, depth: number = 0): ReactNode => {
    const role = node.maximizing ? "MAX" : "MIN";
    const moveText = node.move ? moveLabel(node.move) : "root";
    const isCollapsible = node.children.length > 0;

    return (
      <div key={path} className={`modal-tree-node depth-${depth}`}>
        <div className="modal-tree-line">
          <span className="modal-tree-move">{moveText}</span>
          <span className={`modal-tree-role ${role.toLowerCase()}`}>{role}</span>
          <span className="modal-tree-score">v={scoreLabel(node.score)}</span>
          <span className="modal-tree-bounds">
            a={boundLabel(node.alphaIn)} b={boundLabel(node.betaIn)}
          </span>
          <span className="modal-tree-depth">d={node.depthRemaining}</span>
          {node.prunedMoves && node.prunedMoves.length > 0 && (
            <span className="modal-tree-pruned">🔪 {node.prunedMoves.length}</span>
          )}
        </div>

        {node.prunedMoves && node.prunedMoves.length > 0 && (
          <div className="modal-tree-pruned-detail">
            pruned {node.prunedMoves.length}: {node.prunedMoves.map((move) => moveLabel(move)).join(", ")}
          </div>
        )}

        {isCollapsible && (
          <div className="modal-tree-children">
            {node.children.map((child, index) =>
              renderMinimaxTreeNode(child, `${path}-${index}`, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="trace-modal-overlay" onClick={onClose}>
      <div className="trace-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="trace-modal-header">
          <h2>
            {trace.kind === "minimax"
              ? `🎮 Minimax Decision Tree (Depth: ${(trace as any).depth})`
              : `🌀 Fuzzy Decision Logic`}
          </h2>
          <button className="trace-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="trace-modal-body">
          {trace.kind === "minimax" ? (
            <div className="modal-minimax">
              <div className="modal-stats">
                <div className="stat-item">
                  <span className="stat-label">Best Move:</span>
                  <span className="stat-value">{moveLabel((trace as any).bestMove)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Best Score:</span>
                  <span className="stat-value">{scoreLabel((trace as any).bestScore)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Explored Nodes:</span>
                  <span className="stat-value">{(trace as any).exploredNodes.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Pruned Branches:</span>
                  <span className="stat-value">{(trace as any).prunedBranches.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Pruning Efficiency:</span>
                  <span className="stat-value">
                    {(
                      ((trace as any).prunedBranches /
                        ((trace as any).exploredNodes + (trace as any).prunedBranches)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Randomness:</span>
                  <span className="stat-value">{(trace as any).randomnessPercentage}%</span>
                </div>
              </div>

              <div className="modal-tree-container">
                <h3>Game Tree</h3>
                <div className="modal-tree">
                  {renderMinimaxTreeNode((trace as any).tree, "root")}
                </div>
              </div>

              <div className="modal-candidates">
                <h3>Top Candidates</h3>
                <table className="candidates-table">
                  <thead>
                    <tr>
                      <th>Move</th>
                      <th>Score</th>
                      <th>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(trace as any).candidates.map((cand: any, idx: number) => (
                      <tr key={`${cand.move.row}-${cand.move.col}`}>
                        <td>{moveLabel(cand.move)}</td>
                        <td>{scoreLabel(cand.score)}</td>
                        <td>#{idx + 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="modal-fuzzy">
              <div className="modal-stats">
                <div className="stat-item">
                  <span className="stat-label">Best Move:</span>
                  <span className="stat-value">{moveLabel((trace as any).bestMove)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Aggression:</span>
                  <span className="stat-value">{(trace as any).aggressionWeight}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Defense:</span>
                  <span className="stat-value">{(trace as any).defenseWeight}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Randomness:</span>
                  <span className="stat-value">{(trace as any).randomnessPercentage}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Candidates:</span>
                  <span className="stat-value">{(trace as any).candidates.length}</span>
                </div>
              </div>

              <div className="modal-candidates">
                <h3>All Evaluated Moves</h3>
                <div className="fuzzy-candidates-grid">
                  {(trace as any).candidates.map((candidate: any, idx: number) => (
                    <div
                      key={`${candidate.move.row}-${candidate.move.col}`}
                      className={`fuzzy-candidate-card ${idx === 0 ? "best" : ""}`}
                    >
                      <div className="card-header">
                        <h4>{moveLabel(candidate.move)}</h4>
                        <span className="card-rank">#{idx + 1}</span>
                      </div>

                      <div className="card-scores">
                        <div className="score-bar">
                          <span className="score-label">Desirability:</span>
                          <div className="score-fill" style={{ width: `${candidate.desirability * 100}%` }}>
                            {(candidate.desirability * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="score-detail">
                          <span>Attack: {candidate.attackScore.toFixed(1)}</span>
                          <span>Defense: {candidate.defenseScore.toFixed(1)}</span>
                          <span>Random: {candidate.randomFactor.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="card-breakdown">
                        <h5>Tactical Breakdown</h5>
                        <div className="breakdown-grid">
                          <div className="breakdown-item">
                            <span className="breakdown-label">Finisher:</span>
                            <span className={`breakdown-value ${candidate.breakdown.finishingMove > 0.5 ? "high" : ""}`}>
                              {toPercent(candidate.breakdown.finishingMove)}
                            </span>
                          </div>
                          <div className="breakdown-item">
                            <span className="breakdown-label">Aggression:</span>
                            <span>{toPercent(candidate.breakdown.aggression)}</span>
                          </div>
                          <div className="breakdown-item">
                            <span className="breakdown-label">Safe:</span>
                            <span>{toPercent(candidate.breakdown.safeExpansion)}</span>
                          </div>
                          <div className="breakdown-item">
                            <span className="breakdown-label">Pressure:</span>
                            <span>{toPercent(candidate.breakdown.counterPressure)}</span>
                          </div>
                          <div className="breakdown-item">
                            <span className="breakdown-label">Control:</span>
                            <span>{toPercent(candidate.breakdown.boardControl)}</span>
                          </div>
                          <div className="breakdown-item">
                            <span className="breakdown-label">Risk:</span>
                            <span className={`breakdown-value ${candidate.breakdown.riskPenalty > 0.5 ? "high" : ""}`}>
                              {toPercent(candidate.breakdown.riskPenalty)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="card-features">
                        <h5>Features</h5>
                        <div className="features-grid">
                          <div className="feature-item">
                            <span className="feature-label">Chain:</span>
                            <span className="feature-value">{candidate.features.chainPotential.toFixed(0)}</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-label">Capture:</span>
                            <span className="feature-value">{candidate.features.captureSwing.toFixed(0)}</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-label">Power:</span>
                            <span className="feature-value">{candidate.features.powerSwing.toFixed(1)}</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-label">Threat:</span>
                            <span className="feature-value">{candidate.features.localThreat.toFixed(1)}</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-label">Support:</span>
                            <span className="feature-value">{candidate.features.localSupport}</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-label">Center:</span>
                            <span className="feature-value">{candidate.features.centerBias.toFixed(2)}</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-label">Setup:</span>
                            <span className="feature-value">{candidate.features.setupPotential}</span>
                          </div>
                          <div className="feature-item">
                            <span className="feature-label">Counter:</span>
                            <span className="feature-value">{candidate.features.counterRisk.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
