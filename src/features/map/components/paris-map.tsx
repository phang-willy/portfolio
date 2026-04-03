"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { StyleSpecification } from "maplibre-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const PARIS_CENTER: [number, number] = [2.3522, 48.8566];

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Tuiles raster : évite les erreurs MapLibre « Expected number, found null » sur certains styles GL + MVT. */
function cartoRasterStyle(dark: boolean): StyleSpecification {
  const path = dark ? "dark_all" : "light_all";
  return {
    version: 8,
    sources: {
      carto: {
        type: "raster",
        tiles: [
          `https://a.basemaps.cartocdn.com/${path}/{z}/{x}/{y}.png`,
          `https://b.basemaps.cartocdn.com/${path}/{z}/{x}/{y}.png`,
          `https://c.basemaps.cartocdn.com/${path}/{z}/{x}/{y}.png`,
        ],
        tileSize: 256,
        attribution: CARTO_ATTRIBUTION,
      },
    },
    layers: [
      { id: "carto", type: "raster", source: "carto", minzoom: 0, maxzoom: 20 },
    ],
  };
}

const subscribeHtmlDarkClass = (onStoreChange: () => void) => {
  const root = document.documentElement;
  const observer = new MutationObserver(onStoreChange);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};

const getHtmlDarkClassSnapshot = () =>
  document.documentElement.classList.contains("dark");

const getHtmlDarkClassServerSnapshot = () => false;

const MARKER_LABEL =
  "Disponible à Paris et sa Périphérie, en France Métropolitaine ainsi que dans tous les pays membres de l'Union Européenne";

const createParisMarkerElement = () => {
  const root = document.createElement("div");
  root.className =
    "flex w-max max-w-[min(260px,85vw)] flex-col items-center pointer-events-none select-none";

  const bubble = document.createElement("div");
  bubble.className =
    "mb-1 rounded-lg border border-main bg-white/95 px-3 py-2 text-center text-xs font-semibold text-black shadow-md backdrop-blur-sm dark:bg-dark-500/95 dark:text-white sm:text-sm";
  bubble.textContent = MARKER_LABEL;

  const pin = document.createElement("div");
  pin.className = "text-main drop-shadow-md";
  pin.setAttribute("aria-hidden", "true");
  pin.innerHTML = `<svg width="32" height="40" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/><circle cx="12" cy="11" r="3.5" fill="white"/></svg>`;

  root.appendChild(bubble);
  root.appendChild(pin);
  return root;
};

export const ParisMap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = useSyncExternalStore(
    subscribeHtmlDarkClass,
    getHtmlDarkClassSnapshot,
    getHtmlDarkClassServerSnapshot,
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = new maplibregl.Map({
      container: el,
      style: cartoRasterStyle(isDark),
      center: PARIS_CENTER,
      zoom: 11,
      interactive: false,
    });

    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
    map.dragPan.disable();
    map.keyboard.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();

    const addMarker = () => {
      new maplibregl.Marker({
        element: createParisMarkerElement(),
        anchor: "bottom",
      })
        .setLngLat(PARIS_CENTER)
        .addTo(map);
    };

    if (map.isStyleLoaded()) {
      addMarker();
    } else {
      map.once("load", addMarker);
    }

    return () => {
      map.remove();
    };
  }, [isDark]);

  return (
    <div className="relative w-full">
      <article
        ref={containerRef}
        className="h-[min(50vh,420px)] w-full md:h-[min(55vh,480px)]"
        role="img"
        aria-label="Disponible dans Paris et Périphérie"
      />
    </div>
  );
};
