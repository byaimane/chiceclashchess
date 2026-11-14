export const POINTS_PER_WIN = 100;
export const POINTS_PER_DRAW = 40;
export const POINTS_PER_LOSS = 15;

// 100 points = $0.10 (10 cents); minimum redemption = 500 points ($0.50)
export const MIN_REDEEM_POINTS = 500;
export const POINTS_PER_CENT = 10;

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500];

export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      if (i === LEVEL_THRESHOLDS.length - 1) {
        return LEVEL_THRESHOLDS.length + Math.floor((xp - 3500) / 1500);
      }
      return i + 1;
    }
  }
  return 1;
}

export function pointsToCents(points: number): number {
  return Math.floor(points / POINTS_PER_CENT);
}
