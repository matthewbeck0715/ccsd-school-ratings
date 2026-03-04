import type { StarRating } from '@/types/school'

const STAR_COLORS: Record<StarRating, string> = {
  1: '#ef4444', // red
  2: '#f97316', // orange
  3: '#eab308', // yellow
  4: '#22c55e', // green
  5: '#3b82f6', // blue
}

export function getMarkerColor(starRating: StarRating): string {
  return STAR_COLORS[starRating]
}

export function createMarkerIcon(starRating: StarRating) {
  // Use require to avoid top-level import (SSR-safe when called client-side only)
  const L = require('leaflet')
  const color = getMarkerColor(starRating)
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: ${color};
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
      font-family: sans-serif;
    ">${starRating}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}
