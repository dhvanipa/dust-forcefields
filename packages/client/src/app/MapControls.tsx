import type { Map as LMap } from "leaflet";
import { maxZoom, minZoom, Vec2, worldToPannableMapCoordinates } from "./utils";
import { PlayerPosition } from "../common/usePlayerPositionQuery";

type MapControlProps = {
  map: LMap | null;
  currentZoom: number;
  playerPosition: PlayerPosition | null;
};

export function MapControls({
  map,
  currentZoom,
  playerPosition,
}: MapControlProps) {
  const centerOnPlayer = () => {
    if (map && playerPosition) {
      const playerMapPos: Vec2 = worldToPannableMapCoordinates([
        playerPosition.x,
        playerPosition.y,
        playerPosition.z,
      ]);

      map.panTo(playerMapPos);
    }
  };

  const canZoomIn = currentZoom < maxZoom;
  const canZoomOut = currentZoom > minZoom;

  return (
    <div className="leaflet-bottom leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={centerOnPlayer}
          className={`bg-white border-0 border-b border-gray-300 w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-50 text-black font-bold ${
            !playerPosition ? "text-gray-400 cursor-not-allowed" : ""
          }`}
          disabled={!playerPosition}
          title="Center on Player"
        >
          📍
        </button>
        <button
          onClick={() => canZoomIn && map?.zoomIn()}
          className={`bg-white border-0 border-b border-gray-300 w-8 h-8 flex items-center justify-center font-bold text-lg ${
            canZoomIn
              ? "cursor-pointer hover:bg-gray-50 text-black"
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!canZoomIn}
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => canZoomOut && map?.zoomOut()}
          className={`bg-white border-0 w-8 h-8 flex items-center justify-center font-bold text-lg ${
            canZoomOut
              ? "cursor-pointer hover:bg-gray-50 text-black"
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!canZoomOut}
          title="Zoom Out"
        >
          -
        </button>
      </div>
    </div>
  );
}
