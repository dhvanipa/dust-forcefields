import { CRS, TileLayer as LeafletTileLayer } from "leaflet";
import { useEffect, useState } from "react";
import type { Map as LMap } from "leaflet";
import { createTileLayerComponent } from "@react-leaflet/core";
import { MapContainer, type TileLayerProps } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { usePlayerPositionQuery } from "../common/usePlayerPositionQuery";
import { bounds, maxZoom, minZoom, tileSize } from "../config";
import { MapControls } from "./MapControls";
import { LocalPlayerMarker } from "./LocalPlayerMarker";
import { useSyncStatus } from "../mud/useSyncStatus";

// force map to re-render in dev
const now = Date.now();

export function Map() {
  const [map, setMap] = useState<LMap | null>(null);
  const [currentZoom, setCurrentZoom] = useState(2);
  const playerPosition = usePlayerPositionQuery();
  const syncStatus = useSyncStatus();

  useEffect(() => {
    if (!map) return;

    const handleZoom = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on("zoomend", handleZoom);
    setCurrentZoom(map.getZoom());

    return () => {
      map.off("zoomend", handleZoom);
    };
  }, [map]);

  return (
    <div className="map flex relative z-0 h-full">
      <MapContainer
        // force map to re-render in dev
        key={now}
        ref={setMap}
        crs={CRS.Simple}
        center={[0, 0, 0]}
        minZoom={minZoom}
        maxZoom={maxZoom}
        maxBoundsViscosity={0.5}
        bounds={bounds}
        maxBounds={bounds}
        zoom={2}
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer
          getTileUrl={({ x, y, z }) =>
            `https://staging.dustproject.org/api/assets/map/surface/${x}/${y}/${z}/tile`
          }
          tileSize={tileSize}
          // zoom range of tiles
          minNativeZoom={0}
          maxNativeZoom={maxZoom}
          // zoom range of map
          minZoom={minZoom}
          maxZoom={maxZoom}
        />
        {playerPosition.data ? (
          <LocalPlayerMarker map={map} playerPosition={playerPosition.data} />
        ) : null}
        {!syncStatus.isLive && (
          <div className="leaflet-top leaflet-left">
            <div className="leaflet-control bg-blue-600 text-white px-4 py-2 rounded shadow">
              Syncing ({syncStatus.percentage}%)...
            </div>
          </div>
        )}
        <MapControls
          map={map}
          currentZoom={currentZoom}
          playerPosition={playerPosition.data ?? null}
        />
      </MapContainer>
    </div>
  );
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
