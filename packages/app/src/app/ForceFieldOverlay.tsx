import { useState } from "react";
import { Rectangle } from "react-leaflet";
import { useSyncStatus } from "../mud/useSyncStatus";

const forceFields = [
  {
    entityId: "0x",
    energy: 10n,
    lowerCoord: [400, 1000],
    upperCoord: [500, 1500],
  },
];

function ForceFieldRectangle({
  forceField,
}: {
  forceField: (typeof forceFields)[0];
}) {
  const bounds = [
    [forceField.lowerCoord[1], forceField.lowerCoord[0]],
    [forceField.upperCoord[1], forceField.upperCoord[0]],
  ] as [[number, number], [number, number]];

  return (
    <Rectangle
      bounds={bounds}
      pathOptions={{
        color: "#ff0000",
        weight: 2,
        opacity: 0.8,
        fillColor: "#ff0000",
        fillOpacity: 0.2,
      }}
    />
  );
}

function ForceFieldMenu({
  forceFieldCount,
  showForceFields,
  onToggleVisibility,
}: {
  forceFieldCount: number;
  showForceFields: boolean;
  onToggleVisibility: () => void;
}) {
  const syncStatus = useSyncStatus();

  if (!syncStatus.isLive) {
    return (
      <div className="leaflet-top leaflet-left">
        <div className="leaflet-control bg-yellow-300 text-gray-700 px-4 py-2 rounded shadow">
          Syncing ({syncStatus.percentage}%)...
        </div>
      </div>
    );
  }

  return (
    <div className="leaflet-top leaflet-left">
      <div className="leaflet-control leaflet-bar bg-white flex items-center">
        <div className="px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-300">
          Force Fields: {forceFieldCount}
        </div>
        <button
          onClick={onToggleVisibility}
          className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-50"
          title={showForceFields ? "Hide Force Fields" : "Show Force Fields"}
        >
          {showForceFields ? "👁️" : "🙈"}
        </button>
      </div>
    </div>
  );
}

export function ForceFieldOverlay() {
  const [showForceFields, setShowForceFields] = useState(true);

  return (
    <>
      {showForceFields &&
        forceFields.map((forceField, index) => (
          <ForceFieldRectangle
            key={forceField.entityId || index}
            forceField={forceField}
          />
        ))}
      <ForceFieldMenu
        forceFieldCount={forceFields.length}
        showForceFields={showForceFields}
        onToggleVisibility={() => setShowForceFields(!showForceFields)}
      />
    </>
  );
}
