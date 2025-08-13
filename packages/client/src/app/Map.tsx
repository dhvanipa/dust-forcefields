import { useDustClient } from "../useDustClient";
import { CRS, TileLayer as LeafletTileLayer } from "leaflet";
import { useState } from "react";
import type { Map as LMap } from "leaflet";
import { createTileLayerComponent } from "@react-leaflet/core";
import { MapContainer, type TileLayerProps } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// force map to re-render in dev
const now = Date.now();

export function Map() {
  const { data: dustClient } = useDustClient();
  const [map, setMap] = useState<LMap | null>(null);
  const [tilesUpdatedAt, setTilesUpdatedAt] = useState(0);

  return (
    <div className="flex flex-col items-center">
      <div className="max-w-screen-sm mx-auto space-y-8 p-8">
        <MapContainer
          // force map to re-render in dev
          key={now}
          ref={setMap}
          crs={CRS.Simple}
          center={world2ToPannableMapCoordinates([500, -120])}
          zoom={2}
          attributionControl={false}
          className="vw-100 vh-100"
        >
          <TileLayer
            // force tiles to reload
            key={tilesUpdatedAt}
            getTileUrl={({ x, y, z }) =>
              `http://localhost:3000/api/assets/map/surface/${x}/${y}/${z}/tile`
            }
            // TODO: load these props from map data?
            tileSize={512}
            // zoom range of tiles
            minNativeZoom={0}
            maxNativeZoom={4}
            // zoom range of map
            minZoom={-1}
            maxZoom={4}
            className="opacity-70!"
          />
        </MapContainer>
      </div>
    </div>
  );
}

type Vec2 = [number, number];

function world2ToPannableMapCoordinates(pos: Vec2): Vec2 {
  return [-pos[1], pos[0]];
}

const TileLayer = createTileLayerComponent<
  LeafletTileLayer,
  Omit<TileLayerProps, "url"> & Pick<LeafletTileLayer, "getTileUrl">
>(
  ({ getTileUrl, ...props }, context) => {
    const layer = new LeafletTileLayer("", props);
    layer.getTileUrl = getTileUrl;
    return {
      instance: layer,
      context: { ...context, layerContainer: layer },
    } as never;
  },
  (layer, props) => {
    layer.getTileUrl = props.getTileUrl;
  }
);
