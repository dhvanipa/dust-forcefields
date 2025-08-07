import { useQuery } from "@tanstack/react-query";
import { connectDustClient } from "dustkit/internal";

export function useDustClient() {
  return useQuery({
    queryKey: ["dust-client"],
    queryFn: async () => {
      const dustClient = await connectDustClient();
      console.log("app connected", dustClient);
      return dustClient;
    },
  });
}
