export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function risingMembership(value: number, start: number, end: number): number {
  if (value <= start) {
    return 0;
  }

  if (value >= end) {
    return 1;
  }

  return clamp01((value - start) / (end - start));
}

export function fallingMembership(value: number, start: number, end: number): number {
  if (value <= start) {
    return 1;
  }

  if (value >= end) {
    return 0;
  }

  return clamp01((end - value) / (end - start));
}

export function triangularMembership(value: number, left: number, peak: number, right: number): number {
  if (value <= left || value >= right) {
    return 0;
  }

  if (value === peak) {
    return 1;
  }

  if (value < peak) {
    return clamp01((value - left) / (peak - left));
  }

  return clamp01((right - value) / (right - peak));
}
