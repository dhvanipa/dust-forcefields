import { createLayerComponent } from "@react-leaflet/core";
import type { Coords } from "leaflet";
import { TileLayer } from "leaflet";
import type { PropsWithChildren } from "react";
import type { TileLayerProps } from "react-leaflet";
import { Vec2 } from "./utils";

export interface CustomURLTileLayerProps
  extends PropsWithChildren<TileLayerProps> {
  tileFn: (xy: Vec2, zoom: number) => string;
}

class CustomURLTileLayerImpl extends TileLayer {
  public tileFn?: CustomURLTileLayerProps["tileFn"];
  getTileUrl(coords: Coords) {
    const ret =
      this.tileFn?.(
        [coords.x, coords.y],
        coords.z + (this.options.zoomOffset ?? 0)
      ) ?? super.getTileUrl(coords);
    return ret;
  }
}

const createCustomURLTileLayer = (
  props: CustomURLTileLayerProps,
  context: any
) => {
  const instance = new CustomURLTileLayerImpl(props.url ?? "placeholder", {
    ...props,
  });
  instance.tileFn = props.tileFn;
  return { instance, context };
};

const updateCustomURLTileLayers = (
  instance: CustomURLTileLayerImpl,
  props: CustomURLTileLayerProps,
  prevProps: CustomURLTileLayerProps
) => {
  if (prevProps.tileFn !== props.tileFn) {
    instance.tileFn = props.tileFn;
  }
};

const CustomURLTileLayer = createLayerComponent(
  createCustomURLTileLayer,
  updateCustomURLTileLayers
);
export default CustomURLTileLayer;
