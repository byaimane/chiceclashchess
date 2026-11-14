const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500];

const RANK_TITLES = [
  'Novice',
  'Club Regular',
  'Tactician',
  'Candidate',
  'Master',
  'Grandmaster',
];

export function getLevelInfo(xp: number) {
  let level = 1;
  let currentFloor = 0;
  let nextThreshold = 200;

  if (xp >= 3500) {
    const extraLevels = Math.floor((xp - 3500) / 1500);
    level = LEVEL_THRESHOLDS.length + extraLevels;
    currentFloor = 3500 + extraLevels * 1500;
    nextThreshold = currentFloor + 1500;
  } else {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
        currentFloor = LEVEL_THRESHOLDS[i];
        nextThreshold = LEVEL_THRESHOLDS[i + 1] ?? 3500;
        break;
      }
    }
  }

  const span = Math.max(1, nextThreshold - currentFloor);
  const progressPct = Math.min(
    100,
    Math.max(0, Math.round(((xp - currentFloor) / span) * 100))
  );
  const rankTitle = RANK_TITLES[Math.min(level - 1, RANK_TITLES.length - 1)];

  return {
    level,
    rankTitle,
    currentFloor,
    nextThreshold,
    progressPct,
  };
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
