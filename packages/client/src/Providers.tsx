import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode } from "react";
import { createSyncAdapter } from "@latticexyz/store-sync/internal";
import { SyncProvider } from "@latticexyz/store-sync/react";
import { stash } from "./mud/stash";
import { wagmiConfig } from "./wagmiConfig";
import { chainId, getWorldAddress, startBlock, tables } from "./common";

const queryClient = new QueryClient();

export type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  const worldAddress = getWorldAddress();
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SyncProvider
          chainId={chainId}
          address={worldAddress}
          startBlock={startBlock}
          tableIds={Object.values(tables).map((table) => table.tableId)}
          adapter={createSyncAdapter({ stash })}
        >
          {children}
        </SyncProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
