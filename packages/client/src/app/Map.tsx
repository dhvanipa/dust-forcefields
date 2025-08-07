import { useDustClient } from "../useDustClient";
import { CRS } from "leaflet";
import { useCallback, useRef } from "react";
import { MapContainer } from "react-leaflet";
import type { Map as LMap } from "leaflet";

function world2ToPannableMapCoordinates(
  pos: [x: number, y: number]
): [x: number, y: number] {
  return [-pos[1], pos[0]];
}

export function Map() {
  const { data: dustClient } = useDustClient();
  const map = useRef<LMap | null>(null);

  const initMap = useCallback(
    (newMap: LMap) => {
      map.current = newMap;
      if (newMap) {
        newMap.dragging.enable();
        newMap.zoomControl.setPosition("topright");
        const worldBounds = [
          [2048, -2048],
          [-2048, 2048],
        ];
        newMap.setMaxBounds(worldBounds);
        // setVersion(version + 1);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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
        {/* <PannableMapContext.Provider value={{ map: map.current }}>
          <PannableMapTiles mapData={tileMetadata} tileType="surface" />
          {landmarks.data && (
            <PannableMapLandmarkLabels landmarks={landmarks.data} />
          )}
          {children}

          {markers.map((marker) => (
            <StaticMapMarker
              key={marker.id}
              position={marker.position}
              label={marker.label}
              id={marker.id}
              selected={selectedMarkerId === marker.id}
              onClick={handleMarkerSelect}
            />
          ))}
        </PannableMapContext.Provider> */}
      </MapContainer>
    </div>
  );
}
