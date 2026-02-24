import { CALCULATOR, SLABS } from "@/lib/constants";

export function getSlabIndex(volumeUSD: number): number {
  for (let i = SLABS.length - 1; i >= 0; i--) {
    if (volumeUSD >= SLABS[i].threshold) {
      return i;
    }
  }
  return -1;
}

export function getCurrentSlab(volumeUSD: number): {
  index: number;
  nextThresholdUSD: number | null;
} {
  const index = getSlabIndex(volumeUSD);
  const next =
    index >= 0 && index + 1 < SLABS.length ? SLABS[index + 1] : null;

  return {
    index,
    nextThresholdUSD: next ? next.threshold : null,
  };
}

export function getGapToNextSlab(totalVolumeINR: number): {
  gapINR: number | null;
  isMax: boolean;
  index: number;
} {
  const volumeUSD = totalVolumeINR / CALCULATOR.USD_RATE;
  const { index, nextThresholdUSD } = getCurrentSlab(volumeUSD);

  if (nextThresholdUSD == null) {
    return {
      gapINR: null,
      isMax: true,
      index,
    };
  }

  const nextThresholdINR = nextThresholdUSD * CALCULATOR.USD_RATE;
  const gapINR = Math.max(0, Math.round(nextThresholdINR - totalVolumeINR));

  return {
    gapINR,
    isMax: false,
    index,
  };
}

