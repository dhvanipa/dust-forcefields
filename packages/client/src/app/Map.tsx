import { useDustClient } from "../useDustClient";
import { CRS, TileLayer as LeafletTileLayer } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import type { Map as LMap } from "leaflet";
import { createTileLayerComponent } from "@react-leaflet/core";
import { MapContainer, type TileLayerProps } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { usePlayerPositionQuery } from "../common/usePlayerPositionQuery";
import { Vec3, type ReadonlyVec3 } from "@dust/world/internal";
import { Marker } from "react-leaflet";
import { divIcon } from "leaflet";

import localPlayerMarkerBig from "/player-marker-small.png";
import { usePlayerOrientationQuery } from "../common/usePlayerOrientationQuery";

// force map to re-render in dev
const now = Date.now();

export function Map() {
  const { data: dustClient } = useDustClient();
  const [map, setMap] = useState<LMap | null>(null);
  const [tilesUpdatedAt, setTilesUpdatedAt] = useState(0);
  const playerPosition = usePlayerPositionQuery();
  const playerOrientation = usePlayerOrientationQuery();
  const playerMapPos: Vec2 = playerPosition.data
    ? worldToPannableMapCoordinates([
        playerPosition.data.x,
        playerPosition.data.y,
        playerPosition.data.z,
      ])
    : [0, 0];
  const [initialPosition, setInitialPosition] = useState<Vec3 | null>(null);
  const orientation = playerOrientation.data ? -playerOrientation.data.yaw : 0;
  const icon = useMemo(
    () =>
      divIcon({
        iconSize: [24, 24],
        iconAnchor: [24 / 2, 24 / 2],
        className: "local-marker",
        html: `<div style="transform: rotate(${orientation}rad); background-image: url(${localPlayerMarkerBig})" class="local-marker-inner"></div>`,
      }),
    [orientation]
  );

  useEffect(() => {
    if (!playerPosition.data) return;
    if (initialPosition) return;

    setInitialPosition([
      playerPosition.data.x,
      playerPosition.data.y,
      playerPosition.data.z,
    ]);
  }, [playerPosition.data]);

  if (!dustClient) {
    return null;
  }

  return (
    <div className="map flex relative z-0 h-full">
      <MapContainer
        // force map to re-render in dev
        key={now}
        ref={setMap}
        crs={CRS.Simple}
        center={worldToPannableMapCoordinates(initialPosition ?? [0, 0, 0])}
        minZoom={-1}
        maxZoom={3}
        maxBoundsViscosity={0.5}
        bounds={[
          [3072, -1536],
          [-1024, 2560],
        ]}
        maxBounds={[
          [3072, -1536],
          [-1024, 2560],
        ]}
        zoom={2}
        attributionControl={false}
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
        />
        <Marker position={playerMapPos} icon={icon} zIndexOffset={100000} />;
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

type Vec2 = [x: number, y: number];

function worldToPannableMapCoordinates(pos: ReadonlyVec3): Vec2 {
  return [-pos[2], pos[0]];
}
