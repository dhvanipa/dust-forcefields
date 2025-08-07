import { ClientRpcSchema } from "dustkit/internal";

export type MapTileMetadata = Extract<
  ClientRpcSchema,
  {
    Request: { method: "getMapTileMetadata" };
  }
>["ReturnType"];

export type TileType = "surface" | "fog";
