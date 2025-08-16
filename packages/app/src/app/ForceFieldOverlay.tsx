import { useEffect, useState } from "react";
import { Rectangle } from "react-leaflet";
import { useSyncStatus } from "../mud/useSyncStatus";
import type { Vec2 } from "../config";
import type { Hex } from "viem";
import { stash, tables } from "../mud/stash";
import { decodePosition, objectsByName } from "@dust/world/internal";
import { getOptimisticEnergy } from "../common/getOptimisticEnergy";
import { Matches } from "@latticexyz/stash/internal";

type ForceField = {
  entityId: Hex;
  energy: bigint;
  lowerCoord: Vec2;
  upperCoord: Vec2;
};

function ForceFieldRectangle({ forceField }: { forceField: ForceField }) {
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
  const syncStatus = useSyncStatus();
  const [showForceFields, setShowForceFields] = useState(true);
  const [forceFields, setForceFields] = useState<ForceField[]>([]);

  const updateForceFields = () => {
    const energyEntities = stash.getKeys({ table: tables.Energy });
    const newForceFields: ForceField[] = [];
    for (const entity of Object.values(energyEntities)) {
      const objectType = stash.getRecord({
        table: tables.EntityObjectType,
        key: entity,
      });
      if (objectType?.objectType !== objectsByName.ForceField.id) {
        continue;
      }

      const energy = stash.getRecord({ table: tables.Energy, key: entity });
      if (!energy?.energy) {
        continue;
      }
      const entityId = energy.entityId;
      const fragments = stash.runQuery({
        query: [Matches(tables.Fragment, { forceField: entityId })],
      });
      const fragmentSize = 8;
      const lowerCoord: Vec2 = [Infinity, Infinity];
      const upperCoord: Vec2 = [-Infinity, -Infinity];
      for (const fragment of Object.values(fragments.keys)) {
        const fragmentPos = decodePosition(fragment.entityId as Hex);
        const [fragmentX, fragmentY, fragmentZ] = [
          fragmentPos[0] * fragmentSize,
          fragmentPos[1] * fragmentSize,
          fragmentPos[2] * fragmentSize,
        ];
        lowerCoord[0] = Math.min(lowerCoord[0], fragmentX);
        lowerCoord[1] = Math.min(lowerCoord[1], fragmentZ);
        upperCoord[0] = Math.max(upperCoord[0], fragmentX);
        upperCoord[1] = Math.max(upperCoord[1], fragmentZ);
      }

      newForceFields.push({
        entityId: entityId,
        energy: getOptimisticEnergy(energy) ?? 0n,
        lowerCoord: lowerCoord,
        upperCoord: upperCoord,
      });
    }

    setForceFields(newForceFields);
  };

  useEffect(() => {
    if (!syncStatus.isLive) return;

    updateForceFields();
  }, [syncStatus]);

  // const forceFields: ForceField[] = [
  //   {
  //     entityId: "0x",
  //     energy: 10n,
  //     lowerCoord: [400, 1000],
  //     upperCoord: [500, 1500],
  //   },
  // ];

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
