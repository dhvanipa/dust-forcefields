import { createStash } from "@latticexyz/stash/internal";
import type { SyncFilter } from "@latticexyz/store-sync";
import dustWorldConfig from "@dust/world/mud.config";
import { worldAddress } from "../common/worldAddress";
import { syncToStash } from "@latticexyz/store-sync/internal";
import { redstone } from "./redstone";

export const tables = {
  Energy: dustWorldConfig.tables.Energy,
  Fragment: dustWorldConfig.tables.Fragment,
  EntityObjectType: dustWorldConfig.tables.EntityObjectType,
};

export const stashConfig = {
  namespaces: {
    "": {
      tables,
    },
  },
};

export const filters = [
  ...Object.values(tables).map((table) => ({
    tableId: table.tableId,
  })),
] satisfies SyncFilter[];

export const stash = createStash(stashConfig);

await syncToStash({
  address: worldAddress,
  stash,
  filters,
  internal_clientOptions: { chain: redstone },
  indexerUrl: redstone.indexerUrl,
});
