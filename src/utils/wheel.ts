export const SPIN_DURATION_MS = 12300;
export const SPIN_DURATION_SECONDS = SPIN_DURATION_MS / 1000;

const POINTER_DEG = 270;

export function spinToChosenIndex(count: number, currentRotation: number, index: number, fullTurns: number) {
  const slice = 360 / count;
  const extra = fullTurns * 360;
  const center = index * slice + slice / 2;
  const landed = (POINTER_DEG - center + 360) % 360;
  const current = ((currentRotation % 360) + 360) % 360;
  const rotation = currentRotation + extra + ((landed - current + 360) % 360);
  return { index, rotation };
}

export function spinToIndex(count: number, currentRotation: number) {
  const index = Math.floor(Math.random() * count);
  const fullTurns = 15 + Math.floor(Math.random() * 7);
  return spinToChosenIndex(count, currentRotation, index, fullTurns);
}
