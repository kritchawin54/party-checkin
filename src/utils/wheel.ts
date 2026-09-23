export const SPIN_DURATION_MS = 12300;
export const SPIN_DURATION_SECONDS = SPIN_DURATION_MS / 1000;

export function spinToIndex(count: number, currentRotation: number) {
  const index = Math.floor(Math.random() * count);
  const slice = 360 / count;
  const extra = (1800 + Math.random() * 720) * 3;
  const targetCenter = 360 - (index * slice + slice / 2);
  const current = currentRotation % 360;
  const rotation = currentRotation + extra + ((targetCenter - current + 360) % 360);
  return { index, rotation };
}
