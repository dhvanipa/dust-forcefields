import { bigIntMax } from "@latticexyz/common/utils";

export function getOptimisticEnergy(
  energy:
    | {
        lastUpdatedTime: bigint;
        drainRate: bigint;
        energy: bigint;
      }
    | undefined
) {
  if (!energy) return undefined;
  const currentTime = BigInt(Date.now());
  const lastUpdatedTime = energy.lastUpdatedTime * 1000n;
  const elapsed = (currentTime - lastUpdatedTime) / 1000n;
  const energyDrained = elapsed * energy.drainRate;
  return bigIntMax(0n, energy.energy - energyDrained);
}
