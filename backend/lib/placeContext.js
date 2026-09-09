/**
 * placeContext.js — Radius-filter cached places for LLM prompt context
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load places once at startup
let places = [];
try {
  const dataPath = join(__dirname, '..', '..', 'data', 'uae-places.json');
  places = JSON.parse(readFileSync(dataPath, 'utf-8'));
  console.log(`📍 Loaded ${places.length} places for context`);
} catch {
  console.warn('⚠️  Could not load uae-places.json');
}

/**
 * Haversine distance in km
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Filter places within radius of user location
 * @param {number} lat - user latitude
 * @param {number} lng - user longitude
 * @param {number} radiusKm - search radius in km (default 5)
 * @param {number} limit - max places to return (default 40)
 */
export function getNearbyPlaces(lat, lng, radiusKm = 5, limit = 40) {
  return places
    .map(p => ({
      ...p,
      distance: haversineKm(lat, lng, p.lat, p.lng),
    }))
    .filter(p => p.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Get a place by ID
 */
export function getPlaceById(id) {
  return places.find(p => p.id === id) || null;
}

/**
 * Get all places (for serving to frontend)
 */
export function getAllPlaces() {
  return places;
}

export default { getNearbyPlaces, getPlaceById, getAllPlaces };
