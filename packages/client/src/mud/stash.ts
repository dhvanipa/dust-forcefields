import { createStash } from "@latticexyz/stash/internal";
import mudConfig from "@dust/world/mud.config";

export const tables = {
  Energy: mudConfig.tables.Energy,
};

export const stashConfig = {
  namespaces: {
    "": {
      tables,
    },
  },
};

export const stash = createStash(stashConfig);
