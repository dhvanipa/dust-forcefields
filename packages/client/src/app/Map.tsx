import { useDustClient } from "../useDustClient";
import { CRS } from "leaflet";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { MapContainer } from "react-leaflet";
import type { Map as LMap } from "leaflet";
import { PannableMapTiles } from "./PannableMapTiles";
import { MapTileMetadata } from "./types";
import {
  pannableWorldBoundsFromData,
  world2ToPannableMapCoordinates,
} from "./utils";

const PannableMapContext = createContext<{
  map: LMap | null;
}>({ map: null });

export function Map() {
  const { data: dustClient } = useDustClient();
  const map = useRef<LMap | null>(null);
  const [tileMetadata, setTileMetadata] = useState<MapTileMetadata | null>(
    null
  );

  const fetchTileMetadata = useCallback(async () => {
    if (!dustClient) return;
    const metadata = await dustClient.provider.request({
      method: "getMapTileMetadata",
    });
    setTileMetadata(metadata);
  }, [dustClient]);

  useEffect(() => {
    fetchTileMetadata();
  }, [fetchTileMetadata]);

  const initMap = useCallback(
    (newMap: LMap) => {
      map.current = newMap;
      if (newMap && tileMetadata) {
        newMap.dragging.enable();
        newMap.zoomControl.setPosition("topright");
        const worldBounds = pannableWorldBoundsFromData(tileMetadata);
        newMap.setMaxBounds(worldBounds);
      }
    },
    [tileMetadata]
  );

  if (!tileMetadata) {
    return null;
  }

  return (
    <div className="max-w-screen-sm mx-auto space-y-8 p-8">
      <MapContainer
        center={world2ToPannableMapCoordinates([500, -120])}
        minZoom={-1}
        maxZoom={4}
        maxBoundsViscosity={0.5}
        ref={initMap}
        zoom={2}
        crs={CRS.Simple}
        attributionControl={false}
        className="vw-100 vh-100 static-map"
      >
        <PannableMapContext.Provider value={{ map: map.current }}>
          <PannableMapTiles
            mapData={tileMetadata}
            tileType="surface"
            tileFn={(xy, zoom) => {
              return dustClient?.provider.request({
                method: "getMapTileURL",
                params: {
                  tileImageTemplateURL: tileMetadata.tileImageTemplateURL,
                  versionIndex: tileMetadata.versionIndex,
                  kind: "surface",
                  pos: xy,
                  zoom: zoom,
                },
              });
            }}
          />
        </PannableMapContext.Provider>
      </MapContainer>
    </div>
  );
}
