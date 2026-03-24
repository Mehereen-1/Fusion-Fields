import { MoveFeatureSet } from "./features";
import {
  clamp01,
  fallingMembership,
  risingMembership,
  triangularMembership,
} from "./membership";

export interface FuzzyScoreBreakdown {
  chainFocus: number;
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
  const chainHigh = risingMembership(features.chainPotential, 0, 3);
  const captureHigh = risingMembership(features.captureSwing, 0, 4);
  const captureMedium = triangularMembership(features.captureSwing, 1, 2, 4);
  const powerHigh = risingMembership(features.powerSwing, 0, 4);
  const threatHigh = risingMembership(features.localThreat, 2, 7);
  const threatLow = fallingMembership(features.localThreat, 1, 5);
  const supportHigh = risingMembership(features.localSupport, 1, 3);
  const supportLow = fallingMembership(features.localSupport, 0, 2);
  const centerGood = risingMembership(features.centerBias, 0.2, 0.8);

  const chainFocus = Math.max(chainHigh, Math.min(chainHigh, powerHigh));
  const safeExpansion = Math.max(Math.min(captureHigh, threatLow), Math.min(captureMedium, supportHigh));
  const counterPressure = Math.min(threatHigh, Math.max(chainHigh, supportHigh));
  const boardControl = Math.max(centerGood, Math.min(captureHigh, supportHigh));
  const riskPenalty = Math.max(threatHigh * supportLow, (1 - powerHigh) * threatHigh * 0.75);

  const desirability = clamp01(
    chainFocus * 0.34 +
      safeExpansion * 0.28 +
      counterPressure * 0.18 +
      boardControl * 0.2 -
      riskPenalty * 0.22,
  );

  return {
    desirability,
    breakdown: {
      chainFocus,
      safeExpansion,
      counterPressure,
      boardControl,
      riskPenalty,
    },
  };
}
