import { useEffect, useState } from "react";
import { Rectangle, useMap } from "react-leaflet";
import { createPortal } from "react-dom";
import { useSyncStatus } from "../mud/useSyncStatus";
import { worldToMapCoordinates, type Vec2 } from "../config";
import type { Hex } from "viem";
import { stash, tables } from "../mud/stash";
import { decodePosition, objectsByName, type Vec3 } from "@dust/world/internal";
import { getOptimisticEnergy } from "../common/getOptimisticEnergy";
import { Matches } from "@latticexyz/stash/internal";

type ForceField = {
  entityId: Hex;
  energy: bigint;
  lowerCoord: Vec3;
  upperCoord: Vec3;
};

function ForceFieldRectangle({
  forceField,
  isSelected,
  onSelect,
}: {
  forceField: ForceField;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const bounds = [
    worldToMapCoordinates(forceField.lowerCoord),
    worldToMapCoordinates(forceField.upperCoord),
  ] as [Vec2, Vec2];

  return (
    <Rectangle
      bounds={bounds}
      pathOptions={{
        color: isSelected ? "#0066ff" : "#ff0000",
        weight: isSelected ? 3 : 2,
        opacity: 0.8,
        fillColor: isSelected ? "#0066ff" : "#ff0000",
        fillOpacity: 0.2,
      }}
      eventHandlers={{
        click: onSelect,
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

function ForceFieldInfo({
  forceField,
  onClose,
}: {
  forceField: ForceField | null;
  onClose: () => void;
}) {
  const map = useMap();
  const [controlElement, setControlElement] = useState<HTMLDivElement | null>(
    null
  );

  useEffect(() => {
    if (!map || !forceField) return;

    const control = new (window as any).L.Control({ position: "topright" });

    control.onAdd = function () {
      const div = (window as any).L.DomUtil.create("div", "leaflet-control");
      (window as any).L.DomEvent.disableClickPropagation(div);
      (window as any).L.DomEvent.disableScrollPropagation(div);
      setControlElement(div);
      return div;
    };

    control.addTo(map);

    return () => {
      if (controlElement) {
        setControlElement(null);
      }
      map.removeControl(control);
    };
  }, [map, forceField]);

  if (!forceField || !controlElement) return null;

  return createPortal(
    <div className="bg-white border border-gray-300 rounded shadow-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">Force Field Details</h3>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
          title="Close"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Entity ID:</span>
          <div className="font-mono text-xs break-all select-text cursor-text">
            {forceField.entityId}
          </div>
        </div>
        <div>
          <span className="font-medium">Energy:</span>
          <div className="font-mono select-text cursor-text">
            {forceField.energy.toString()}
          </div>
        </div>
        <div>
          <span className="font-medium">Lower Coord:</span>
          <div className="font-mono select-text cursor-text">
            [{forceField.lowerCoord.join(", ")}]
          </div>
        </div>
        <div>
          <span className="font-medium">Upper Coord:</span>
          <div className="font-mono select-text cursor-text">
            [{forceField.upperCoord.join(", ")}]
          </div>
        </div>
      </div>
    </div>,
    controlElement
  );
}

export function ForceFieldOverlay() {
  const syncStatus = useSyncStatus();
  const [showForceFields, setShowForceFields] = useState(true);
  const [forceFields, setForceFields] = useState<ForceField[]>([]);
  const [selectedForceField, setSelectedForceField] =
    useState<ForceField | null>(null);

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
      const machine = stash.getRecord({ table: tables.Machine, key: entity });
      if (!machine) {
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
      const lowerCoord: Vec3 = [Infinity, Infinity, Infinity];
      const upperCoord: Vec3 = [-Infinity, -Infinity, -Infinity];
      for (const fragment of Object.values(fragments.keys)) {
        const fragmentRecord = stash.getRecord({
          table: tables.Fragment,
          key: { entityId: fragment.entityId as Hex },
        });
        if (!fragmentRecord) {
          continue;
        }
        if (machine.createdAt !== fragmentRecord.forceFieldCreatedAt) {
          continue;
        }

        const fragmentPos = decodePosition(fragment.entityId as Hex);
        const [fragmentX, fragmentY, fragmentZ] = [
          fragmentPos[0] * fragmentSize,
          fragmentPos[1] * fragmentSize,
          fragmentPos[2] * fragmentSize,
        ];
        lowerCoord[0] = Math.min(lowerCoord[0], fragmentX);
        lowerCoord[1] = Math.min(lowerCoord[1], fragmentY);
        lowerCoord[2] = Math.min(lowerCoord[2], fragmentZ);
        upperCoord[0] = Math.max(upperCoord[0], fragmentX);
        upperCoord[1] = Math.max(upperCoord[1], fragmentY);
        upperCoord[2] = Math.max(upperCoord[2], fragmentZ);
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
            isSelected={selectedForceField?.entityId === forceField.entityId}
            onSelect={() => setSelectedForceField(forceField)}
          />
        ))}
      <ForceFieldMenu
        forceFieldCount={forceFields.length}
        showForceFields={showForceFields}
        onToggleVisibility={() => setShowForceFields(!showForceFields)}
      />
      <ForceFieldInfo
        forceField={selectedForceField}
        onClose={() => setSelectedForceField(null)}
      />
    </>
  );
}
