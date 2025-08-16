import { useEffect, useState } from "react";
import { Rectangle, useMap } from "react-leaflet";
import { createPortal } from "react-dom";
import { useSyncStatus } from "../mud/useSyncStatus";
import { worldToMapCoordinates, type Vec2 } from "../config";
import type { Hex } from "viem";
import { stash, tables } from "../mud/stash";
import {
  decodeEntityType,
  decodePlayer,
  decodePosition,
  EntityTypes,
  objectsByName,
  type Vec3,
} from "@dust/world/internal";
import { getOptimisticEnergy } from "../common/getOptimisticEnergy";
import { Matches } from "@latticexyz/stash/internal";
import { useDustClient } from "../common/useDustClient";
import { AccountName } from "../common/AccountName";
import { TruncatedHex } from "../common/TruncatedHex";

type ForceField = {
  entityId: Hex;
  energy: bigint;
  fragments: Vec3[];
  owner?: Hex;
};

function ForceFieldRectangles({
  forceField,
  isSelected,
  onSelect,
  maxY,
}: {
  forceField: ForceField;
  isSelected: boolean;
  onSelect: () => void;
  maxY: number;
}) {
  const fragmentSize = 8;

  return (
    <>
      {forceField.fragments
        .filter((fragment) => fragment[1] <= maxY)
        .map((fragment, index) => {
          const lowerCoord = fragment;
          const upperCoord: Vec3 = [
            fragment[0] + fragmentSize,
            fragment[1] + fragmentSize,
            fragment[2] + fragmentSize,
          ];
          const bounds = [
            worldToMapCoordinates(lowerCoord),
            worldToMapCoordinates(upperCoord),
          ] as [Vec2, Vec2];

          return (
            <Rectangle
              key={`${forceField.entityId}-${index}`}
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
        })}
    </>
  );
}

function ForceFieldMenu({
  forceFieldCount,
  showForceFields,
  onToggleVisibility,
  maxY,
  onMaxYChange,
  showSettings,
  onToggleSettings,
}: {
  forceFieldCount: number;
  showForceFields: boolean;
  onToggleVisibility: () => void;
  maxY: number;
  onMaxYChange: (y: number) => void;
  showSettings: boolean;
  onToggleSettings: () => void;
}) {
  const map = useMap();
  const [controlElement, setControlElement] = useState<HTMLDivElement | null>(
    null
  );
  const worldLowerY = -64;
  const worldUpperY = 320;

  useEffect(() => {
    if (!map) return;

    const control = new (window as any).L.Control({ position: "topleft" });

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
  }, [map]);

  if (!controlElement) return null;

  return createPortal(
    <div className="leaflet-bar bg-white">
      <div className="flex items-center">
        <div className="px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-300">
          Force Fields: {forceFieldCount}
        </div>
        <button
          onClick={onToggleVisibility}
          className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-50 border-r border-gray-300"
          title={showForceFields ? "Hide Force Fields" : "Show Force Fields"}
        >
          {showForceFields ? "👁️" : "🙈"}
        </button>
        <button
          onClick={onToggleSettings}
          className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-50"
          title={showSettings ? "Hide Settings" : "Show Settings"}
        >
          ⚙️
        </button>
      </div>
      {showSettings && (
        <div className="px-3 py-2 border-t border-gray-300">
          <div className="text-xs font-medium text-gray-700 mb-1">
            Max Y: {maxY}
          </div>
          <input
            type="range"
            min={worldLowerY}
            max={worldUpperY}
            value={maxY}
            onChange={(e) => onMaxYChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((maxY - worldLowerY) / (worldUpperY - worldLowerY)) * 100}%, #e5e7eb ${((maxY - worldLowerY) / (worldUpperY - worldLowerY)) * 100}%, #e5e7eb 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{worldLowerY}</span>
            <span>{worldUpperY}</span>
          </div>
        </div>
      )}
    </div>,
    controlElement
  );
}

function ForceFieldInfo({
  forceField,
  onClose,
}: {
  forceField: ForceField | null;
  onClose: () => void;
}) {
  const { data: dustClient } = useDustClient();
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

  const ownerEntityType = forceField.owner
    ? decodeEntityType(forceField.owner)
    : null;

  return createPortal(
    <div className="bg-white border border-gray-300 rounded shadow-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold mr-1" style={{ fontSize: "1rem" }}>
          <img
            src={`https://alpha.dustproject.org/api/assets/objects/${objectsByName.ForceField.id}/icon`}
            alt="Force Field"
            className="inline-block w-8 h-8"
          />{" "}
          <span
            className={`cursor-pointer ${dustClient ? "hover:text-blue-600" : ""}`}
            onClick={() => {
              if (!dustClient) {
                return;
              }

              dustClient.provider.request({
                method: "setWaypoint",
                params: {
                  entity: forceField.entityId,
                  label: "Force Field",
                },
              });
            }}
          >
            ({decodePosition(forceField.entityId).join(", ")})
          </span>
        </h3>
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
          <span className="font-medium">Entity Id:</span>
          <div className="font-mono text-xs break-all select-text cursor-text">
            <TruncatedHex hex={forceField.entityId} />
          </div>
        </div>
        <div>
          <span className="font-medium">Owner:</span>
          <div className="font-mono text-xs break-all select-text cursor-text">
            {forceField.owner && ownerEntityType === EntityTypes.Player ? (
              <AccountName address={decodePlayer(forceField.owner)} />
            ) : (
              forceField.owner ?? "Unknown"
            )}
          </div>
        </div>
        <div>
          <span className="font-medium">Energy:</span>
          <div className="font-mono select-text cursor-text">
            {(forceField.energy / BigInt(10 ** 14)).toLocaleString()}
            {/* {forceField.energy.toString()}) */}
          </div>
        </div>
        <div>
          <span className="font-medium">Fragments:</span>
          <div className="font-mono select-text cursor-text">
            {forceField.fragments.length} fragments
          </div>
        </div>
        {/* <div>
          <span className="font-medium">Fragment Positions:</span>
          <div className="font-mono text-xs select-text cursor-text max-h-32 overflow-y-auto">
            {forceField.fragments.map((fragment, index) => (
              <div key={index}>[{fragment.join(", ")}]</div>
            ))}
          </div>
        </div> */}
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
  const [maxY, setMaxY] = useState(320);
  const [showSettings, setShowSettings] = useState(false);

  const updateForceFields = () => {
    const energyEntities = stash.getKeys({ table: tables.Energy });
    const newForceFields: ForceField[] = [];
    for (const entity of Object.values(energyEntities)) {
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
      const fragmentPositions: Vec3[] = [];

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
        const fragmentCoords: Vec3 = [
          fragmentPos[0] * fragmentSize,
          fragmentPos[1] * fragmentSize,
          fragmentPos[2] * fragmentSize,
        ];
        fragmentPositions.push(fragmentCoords);
      }

      let owner: Hex | undefined = undefined;
      const accessGroupRecord = stash.getRecord({
        table: tables.dfprograms_1__EntityAccessGroup,
        key: { entityId: entityId },
      });
      if (accessGroupRecord?.groupId) {
        const accessGroupOwner = stash.getRecord({
          table: tables.dfprograms_1__AccessGroupOwner,
          key: { groupId: accessGroupRecord.groupId },
        });
        owner = accessGroupOwner?.owner;
      }

      if (fragmentPositions.length > 0) {
        newForceFields.push({
          entityId: entityId,
          energy: getOptimisticEnergy(energy) ?? 0n,
          fragments: fragmentPositions,
          owner: owner,
        });
      }
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
          Loading ({syncStatus.percentage}%)...
        </div>
      </div>
    );
  }

  return (
    <>
      {showForceFields &&
        forceFields.map((forceField, index) => (
          <ForceFieldRectangles
            key={forceField.entityId || index}
            forceField={forceField}
            isSelected={selectedForceField?.entityId === forceField.entityId}
            onSelect={() => setSelectedForceField(forceField)}
            maxY={maxY}
          />
        ))}
      <ForceFieldMenu
        forceFieldCount={forceFields.length}
        showForceFields={showForceFields}
        onToggleVisibility={() => setShowForceFields(!showForceFields)}
        maxY={maxY}
        onMaxYChange={setMaxY}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />
      <ForceFieldInfo
        forceField={selectedForceField}
        onClose={() => setSelectedForceField(null)}
      />
    </>
  );
}
