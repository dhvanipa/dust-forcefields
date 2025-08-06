import { ReactNode } from "react";
import { useSyncStatus } from "./useSyncStatus";
import { TableRecord } from "@latticexyz/stash/internal";
import { SyncProgress } from "@latticexyz/store-sync/internal";

export type Props = {
  children: ReactNode;
  fallback?: (props: TableRecord<typeof SyncProgress>) => ReactNode;
};

export function Synced({ children, fallback }: Props) {
  const status = useSyncStatus();
  return status.latestBlockNumber > 0n &&
    status.lastBlockNumberProcessed >= status.latestBlockNumber - 4n
    ? children
    : fallback?.(status);
}
