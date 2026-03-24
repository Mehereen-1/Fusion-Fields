import { MoveFeatureSet } from "./features";
import {
  clamp01,
  fallingMembership,
  risingMembership,
  triangularMembership,
} from "./membership";

export interface FuzzyScoreBreakdown {
  finishingMove: number;
  aggression: number;
  safeExpansion: number;
  counterPressure: number;
  boardControl: number;
  riskPenalty: number;
}

export interface FuzzyScore {
  desirability: number;
  breakdown: FuzzyScoreBreakdown;
}

export function scoreFeatures(features: MoveFeatureSet): FuzzyScore {
  const finisherCertain = risingMembership(features.finisher, 0.2, 1);
  const chainHigh = risingMembership(features.chainPotential, 1, 3);
  const captureHigh = risingMembership(features.captureSwing, 1, 4);
  const captureMedium = triangularMembership(features.captureSwing, 0, 2, 5);
  const powerHigh = risingMembership(features.powerSwing, 1, 4);
  const threatHigh = risingMembership(features.localThreat, 2, 7);
  const threatLow = fallingMembership(features.localThreat, 1, 5);
  const supportHigh = risingMembership(features.localSupport, 1, 3);
  const supportLow = fallingMembership(features.localSupport, 0, 2);
  const centerGood = risingMembership(features.centerBias, 0.25, 0.85);
  const setupHigh = risingMembership(features.setupPotential, 1, 4);
  const counterRiskHigh = risingMembership(features.counterRisk, 5, 13);
  const counterRiskLow = fallingMembership(features.counterRisk, 4, 10);

  const finishingMove = Math.max(finisherCertain, Math.min(chainHigh, captureHigh));
  const aggression = Math.max(Math.min(chainHigh, captureHigh), Math.min(powerHigh, setupHigh));
  const safeExpansion = Math.max(
    Math.min(captureHigh, threatLow),
    Math.min(captureMedium, supportHigh),
    Math.min(captureHigh, counterRiskLow),
  );
  const counterPressure = Math.max(
    Math.min(threatHigh, captureHigh),
    Math.min(threatHigh, chainHigh),
    Math.min(setupHigh, supportHigh),
  );
  const boardControl = Math.max(centerGood, Math.min(captureHigh, supportHigh), Math.min(setupHigh, centerGood));
  const riskPenalty = Math.max(counterRiskHigh, threatHigh * supportLow, (1 - powerHigh) * threatHigh * 0.75);

  const desirability = clamp01(
    finishingMove * 0.38 +
      aggression * 0.24 +
      safeExpansion * 0.18 +
      counterPressure * 0.12 +
      boardControl * 0.14 -
      riskPenalty * 0.26,
  );

  return {
    desirability,
    breakdown: {
      finishingMove,
      aggression,
      safeExpansion,
      counterPressure,
      boardControl,
      riskPenalty,
    },
  };
}
