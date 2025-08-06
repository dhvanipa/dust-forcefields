import { Chain, http } from "viem";
import { redstone } from "@latticexyz/common/chains";
import { createConfig } from "wagmi";

export const chains = [
  {
    ...redstone,
    rpcUrls: {
      ...redstone.rpcUrls,
      bundler: redstone.rpcUrls.default,
    },
  },
] as const satisfies Chain[];

export const transports = {
  [redstone.id]: http(),
} as const;

export const wagmiConfig = createConfig({
  chains,
  transports,
  pollingInterval: {
    [redstone.id]: 2000,
  },
});
