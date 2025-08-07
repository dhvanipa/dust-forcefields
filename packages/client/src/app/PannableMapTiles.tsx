import { GridLayer as LGridLayer } from "leaflet";
import React from "react";
import CustomURLTileLayer, {
  CustomURLTileLayerProps,
} from "./CustomURLTileLayer";
import { MapTileMetadata, TileType } from "./types";
import { pannableWorldBoundsFromData, Vec2 } from "./utils";
import "leaflet/dist/leaflet.css";

function monkeyPatchGridLayerForHairline() {
  if ((LGridLayer.prototype as any).__hasPatchedHairline === true) {
    return;
  }

  /*
    HACK: fix hairline fractures in leaflet tiles
    this works by adding an epsilon to tile size that should leave scaling untouched
    combined with a CSS trick

    .leaflet-tile-container img {
      will-change: transform;
      outline: 1px solid transparent;
    }
  */
  (LGridLayer.prototype as any).__hasPatchedHairline = true;
  const originalInitTile = (LGridLayer.prototype as any)._initTile;
  LGridLayer.include({
    _initTile: function (tile: any) {
      originalInitTile.call(this, tile);

      const tileSize = this.getTileSize();

      tile.style.width = tileSize.x + 0.5 + "px";

      tile.style.height = tileSize.y + 0.5 + "px";
    },
  });
}

export const PannableMapTiles: React.FunctionComponent<{
  mapData: MapTileMetadata;
  tileFn: (xy: Vec2, zoom: number) => string;
  tileType?: TileType;
}> = React.memo(({ mapData, tileFn, tileType = "fog" }) => {
  monkeyPatchGridLayerForHairline();
  const layerProps: CustomURLTileLayerProps = {
    bounds: pannableWorldBoundsFromData(mapData),
    url: mapData.tileImageTemplateURL,
    tileFn,
  };
  if (typeof window !== "undefined" && window.devicePixelRatio > 1.0) {
    // Workaround for retina displays - request tiles at the next zoom level and pretend half size
    layerProps.tileSize = mapData.tileSize / 2.0;
    layerProps.minNativeZoom = mapData.tileMinZoomLevel;
    layerProps.maxNativeZoom = mapData.tileMaxZoomLevel - 1;
    layerProps.zoomOffset = 1;
    layerProps.minZoom = -10;
  } else {
    layerProps.tileSize = mapData.tileSize;
    layerProps.minNativeZoom = mapData.tileMinZoomLevel;
    layerProps.maxNativeZoom = mapData.tileMaxZoomLevel;
    layerProps.minZoom = -10;
  }

  return <CustomURLTileLayer {...layerProps} />;
});
