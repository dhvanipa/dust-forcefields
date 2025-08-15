import { divIcon } from "leaflet";
import type { Map as LMap } from "leaflet";

import localPlayerMarkerBig from "/player-marker-small.png";
import { usePlayerOrientationQuery } from "../common/usePlayerOrientationQuery";
import { useEffect, useMemo } from "react";
import { Marker } from "react-leaflet";
import { PlayerPosition } from "../common/usePlayerPositionQuery";
import { Vec2, worldToMapCoordinates } from "./utils";

type LocalPlayerMarkerProps = {
  map: LMap | null;
  playerPosition: PlayerPosition;
};

export function LocalPlayerMarker({
  map,
  playerPosition,
}: LocalPlayerMarkerProps) {
  const playerMapPos: Vec2 = worldToMapCoordinates([
    playerPosition.x,
    playerPosition.y,
    playerPosition.z,
  ]);
  const playerOrientation = usePlayerOrientationQuery();

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
    if (!map) return;

    map.setView(playerMapPos, 2);
  }, [map]);

  return <Marker position={playerMapPos} icon={icon} zIndexOffset={100000} />;
}
