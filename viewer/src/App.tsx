import type { DeckProps } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { COGLayer, proj } from "@developmentseed/deck.gl-geotiff";
import { toProj4 } from "geotiff-geokeys-to-proj4";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRef, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { Map as MaplibreMap, useControl } from "react-map-gl/maplibre";

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

async function geoKeysParser(
  geoKeys: Record<string, any>,
): Promise<proj.ProjectionInfo> {
  const projDefinition = toProj4(geoKeys as any);

  return {
    def: projDefinition.proj4,
    parsed: proj.parseCrs(projDefinition.proj4),
    coordinatesUnits: projDefinition.coordinatesUnits as proj.SupportedCrsUnit,
  };
}

const COG_URL =
  "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/18/T/WL/2026/1/S2B_18TWL_20260101_0_L2A/TCI.tif";

export default function App() {
  const mapRef = useRef<MapRef>(null);
  const [debug, setDebug] = useState(false);
  const [debugOpacity, setDebugOpacity] = useState(0.25);

  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const urlParam = params.get("url");
  const iframe = params.get("iframe");
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const cog_layer = new COGLayer({
    id: "cog-layer",
    geotiff: urlParam || COG_URL,
    debug,
    debugOpacity,
    geoKeysParser,
    onGeoTIFFLoad: (tiff, options) => {
      (window as any).tiff = tiff;
      const { west, south, east, north } = options.geographicBounds;
      mapRef.current?.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        {
          padding: 40,
          duration: 0,
        },
      );
    }
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MaplibreMap
        ref={mapRef}
        initialViewState={{
          longitude: 0,
          latitude: 0,
          zoom: 3,
          pitch: 0,
          bearing: 0,
        }}
        mapStyle={`https://api.protomaps.com/styles/v5/${isDark ? "black" : "white"}/en.json?key=8ef48a1582087b3d`}
      >
        <DeckGLOverlay layers={[cog_layer]} interleaved />
      </MaplibreMap>
    </div>
  );
}
