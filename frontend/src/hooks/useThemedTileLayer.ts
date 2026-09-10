import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';

const cartoKey = import.meta.env.VITE_CARTO_API_KEY ? `?key=${import.meta.env.VITE_CARTO_API_KEY}` : '';
export const DARK_TILES = `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png${cartoKey}`;
export const LIGHT_TILES = `https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png${cartoKey}`;

export interface UseThemedTileLayerOptions extends L.TileLayerOptions {
  customDarkUrl?: string;
  customLightUrl?: string;
}

/**
 * Shared hook for Leaflet maps to provide theme-aware tile layer switching.
 * Seamlessly swaps between dark and light CARTO tile layers via setUrl()
 * on theme change without destroying or re-mounting the map instance.
 */
export function useThemedTileLayer() {
  const { theme } = useApp();
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const initThemedTileLayer = (map: L.Map, options?: UseThemedTileLayerOptions): L.TileLayer => {
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }

    const darkUrl = options?.customDarkUrl || DARK_TILES;
    const lightUrl = options?.customLightUrl || LIGHT_TILES;
    const initialUrl = theme === 'dark' ? darkUrl : lightUrl;

    const tileLayer = L.tileLayer(initialUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      ...options
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    return tileLayer;
  };

  // React to theme changes without recreating the map or re-centering bounds
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(theme === 'dark' ? DARK_TILES : LIGHT_TILES);
    }
  }, [theme]);

  return {
    theme,
    tileLayerRef,
    initThemedTileLayer,
    DARK_TILES,
    LIGHT_TILES
  };
}
