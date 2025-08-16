import { createStash } from "@latticexyz/stash/internal";
import type { SyncFilter } from "@latticexyz/store-sync";
import dustWorldConfig from "@dust/world/mud.config";
import dustProgramsConfig from "@dust/programs/mud.config";
import { worldAddress } from "../common/worldAddress";
import { syncToStash } from "@latticexyz/store-sync/internal";
import { redstone } from "./redstone";

const selectedDustTables = {
  Energy: dustWorldConfig.tables.Energy,
  Fragment: dustWorldConfig.tables.Fragment,
  Machine: dustWorldConfig.tables.Machine,
};

const selectedProgramTables = {
  dfprograms_1__EntityAccessGroup:
    dustProgramsConfig.tables.dfprograms_1__EntityAccessGroup,
  dfprograms_1__AccessGroupOwner:
    dustProgramsConfig.tables.dfprograms_1__AccessGroupOwner,
};

export const tables = {
  ...selectedDustTables,
  ...selectedProgramTables,
};

export const stashConfig = {
  namespaces: {
    "": {
      tables: selectedDustTables,
    },
    dfprograms_1: {
      tables: selectedProgramTables,
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
