import { skipToken, useQuery } from "@tanstack/react-query";
import { useDustClient } from "./useDustClient";

type PlayerOrientation = {
  pitch: number;
  yaw: number;
};

export function usePlayerOrientationQuery() {
  const { data: dustClient } = useDustClient();

  return useQuery<PlayerOrientation | null>({
    queryKey: ["playerOrientation"],
    queryFn: !dustClient
      ? skipToken
      : async () => {
          const orientation = await dustClient.provider.request({
            method: "getPlayerOrientation",
          });

          return {
            pitch: orientation.pitch,
            yaw: orientation.yaw,
          };
        },
    enabled: Boolean(dustClient),
    refetchIntervalInBackground: true,
    refetchInterval: 500,
  });
}
