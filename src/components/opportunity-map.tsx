"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DemoParcel } from "@/lib/domain";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { Layers, LocateFixed } from "lucide-react";

type Props = { parcels: DemoParcel[]; selectedId?: string; onSelect: (parcel: DemoParcel) => void; compact?: boolean };

export default function OpportunityMap({ parcels, selectedId, onSelect, compact = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const [mapReady, setMapReady] = useState(false);
  const [layerOpen, setLayerOpen] = useState(false);
  const [layers, setLayers] = useState({ opportunity: true, transit: false, housing: false });
  const parcelsById = useMemo(() => new Map(parcels.map((parcel) => [parcel.id, parcel])), [parcels]);
  const parcelsByIdRef = useRef(parcelsById);
  const geojson = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: parcels.map((parcel) => {
      const lngStep = 0.0016;
      const latStep = 0.0011;
      return {
        type: "Feature" as const,
        id: parcel.id,
        properties: { id: parcel.id, score: parcel.score, transit: parcel.transit, housingNeed: parcel.housingNeed, category: parcel.category },
        geometry: {
          type: "Polygon" as const,
          coordinates: [[
            [parcel.lng - lngStep, parcel.lat - latStep],
            [parcel.lng + lngStep, parcel.lat - latStep],
            [parcel.lng + lngStep, parcel.lat + latStep],
            [parcel.lng - lngStep, parcel.lat + latStep],
            [parcel.lng - lngStep, parcel.lat - latStep],
          ]],
        },
      };
    }),
  }), [parcels]);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { parcelsByIdRef.current = parcelsById; }, [parcelsById]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    void import("maplibre-gl").then((maplibre) => {
      if (cancelled || !containerRef.current) return;
      const map = new maplibre.Map({
        container: containerRef.current,
        center: [-118.24, 34.03],
        zoom: compact ? 9 : 9.25,
        minZoom: 7,
        maxZoom: 17,
        attributionControl: false,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-saturation": -0.42, "raster-contrast": -0.08, "raster-brightness-max": 0.96 } }],
        },
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-left");
      map.on("load", () => {
        map.addSource("demo-parcels", { type: "geojson", data: geojson, promoteId: "id" });
        map.addLayer({ id: "demo-parcels-fill", type: "fill", source: "demo-parcels", paint: { "fill-color": ["case", [">=", ["get", "score"], 80], "#087b70", [">=", ["get", "score"], 65], "#14a697", "#7fd0c5"], "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.78, 0.52] } });
        map.addLayer({ id: "demo-parcels-line", type: "line", source: "demo-parcels", paint: { "line-color": ["case", ["boolean", ["feature-state", "selected"], false], "#075c55", "#ffffff"], "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2.6, 1.25] } });
        map.addLayer({ id: "demo-transit-context", type: "circle", source: "demo-parcels", paint: { "circle-color": "#5c82bd", "circle-radius": ["interpolate", ["linear"], ["get", "transit"], 25, 3, 100, 8], "circle-opacity": 0.32, "circle-stroke-color": "#ffffff", "circle-stroke-width": 1 } });
        map.addLayer({ id: "demo-housing-need", type: "circle", source: "demo-parcels", paint: { "circle-color": "#cc864a", "circle-radius": ["interpolate", ["linear"], ["get", "housingNeed"], 25, 3, 100, 8], "circle-opacity": 0.28, "circle-stroke-color": "#ffffff", "circle-stroke-width": 1 } });
        map.setLayoutProperty("demo-transit-context", "visibility", "none");
        map.setLayoutProperty("demo-housing-need", "visibility", "none");
        map.on("click", "demo-parcels-fill", (event) => {
          const id = event.features?.[0]?.properties?.id;
          const parcel = typeof id === "string" ? parcelsByIdRef.current.get(id) : undefined;
          if (parcel) onSelectRef.current(parcel);
        });
        map.on("mouseenter", "demo-parcels-fill", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "demo-parcels-fill", () => { map.getCanvas().style.cursor = ""; });
        setMapReady(true);
      });
    }).catch(() => setMapReady(false));
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // The map is created once; data and callback changes are applied in the effects below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("demo-parcels") as GeoJSONSource | undefined;
    source?.setData(geojson);
  }, [geojson, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    for (const parcel of parcels) map.setFeatureState({ source: "demo-parcels", id: parcel.id }, { selected: parcel.id === selectedId });
  }, [mapReady, parcels, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer("demo-parcels-fill")) map.setLayoutProperty("demo-parcels-fill", "visibility", layers.opportunity ? "visible" : "none");
    if (map.getLayer("demo-parcels-line")) map.setLayoutProperty("demo-parcels-line", "visibility", layers.opportunity ? "visible" : "none");
    if (map.getLayer("demo-transit-context")) map.setLayoutProperty("demo-transit-context", "visibility", layers.transit ? "visible" : "none");
    if (map.getLayer("demo-housing-need")) map.setLayoutProperty("demo-housing-need", "visibility", layers.housing ? "visible" : "none");
  }, [layers, mapReady]);

  return (
    <div className={`map-wrap ${compact ? "map-wrap-compact" : ""}`}>
      <div ref={containerRef} className="map-canvas" aria-label="Demonstration housing opportunity map" />
      {!mapReady && <div className="map-loading"><div className="spinner" /><span>Loading demonstration map…</span></div>}
      <div className="map-search-chip"><span className="map-search-dot" /><span>Los Angeles County</span><span className="chip-divider" />{parcels.length} demo sites</div>
      <button className="map-layer-button" onClick={() => setLayerOpen((open) => !open)} aria-label="Map layers"><Layers size={16} /></button>
      {layerOpen && <div className="map-layer-popover"><strong>Map layers</strong><label><input type="checkbox" checked={layers.opportunity} onChange={(e) => setLayers((value) => ({ ...value, opportunity: e.target.checked }))} /> Opportunity score</label><label><input type="checkbox" checked={layers.transit} onChange={(e) => setLayers((value) => ({ ...value, transit: e.target.checked }))} /> Transit context</label><label><input type="checkbox" checked={layers.housing} onChange={(e) => setLayers((value) => ({ ...value, housing: e.target.checked }))} /> Housing need</label><p>Layer values are synthetic demo indicators.</p></div>}
      <button className="map-locate-button" onClick={() => mapRef.current?.flyTo({ center: [-118.24, 34.03], zoom: 9.25 })} aria-label="Reset map"><LocateFixed size={15} /></button>
      <div className="map-legend"><span className="legend-bar" /><span>Lower potential</span><span className="legend-bar legend-bar-high" /><span>Higher potential</span></div>
    </div>
  );
}
