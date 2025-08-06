import { useClient } from "wagmi";
import { chainId, getWorldAddress } from "../common";
import {
  Account,
  Chain,
  Client,
  GetContractReturnType,
  Transport,
  getContract,
} from "viem";
import { useQuery } from "@tanstack/react-query";
import { useSessionClient } from "@latticexyz/entrykit/internal";
import worldAbi from "@dust/world/out/IWorld.sol/IWorld.abi";

export function useWorldContract():
  | GetContractReturnType<
      typeof worldAbi,
      {
        public: Client<Transport, Chain>;
        wallet: Client<Transport, Chain, Account>;
      }
    >
  | undefined {
  const client = useClient({ chainId });
  const { data: sessionClient } = useSessionClient();

  const { data: worldContract } = useQuery({
    queryKey: ["worldContract", client?.uid, sessionClient?.uid],
    queryFn: () => {
      if (!client || !sessionClient) {
        throw new Error("Not connected.");
      }

      return getContract({
        abi: worldAbi,
        address: getWorldAddress(),
        client: {
          public: client,
          wallet: sessionClient,
        },
      });
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return worldContract;
}
