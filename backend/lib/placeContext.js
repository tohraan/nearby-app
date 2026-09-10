/**
 * placeContext.js — SQLite-backed places data access
 */

import db from '../db.js';

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
 * Filter places within radius of user location using a bounding box pre-filter
 */
export function getNearbyPlaces(lat, lng, radiusKm = 5, limit = 40) {
  // Approx degrees per km
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * (Math.PI / 180)));

  const stmt = db.prepare(`
    SELECT * FROM places 
    WHERE lat BETWEEN ? AND ? 
      AND lng BETWEEN ? AND ?
  `);
  
  const candidates = stmt.all(
    lat - latDelta, lat + latDelta,
    lng - Math.abs(lngDelta), lng + Math.abs(lngDelta)
  );

  return candidates
    .map(p => {
      p.photos = JSON.parse(p.photos || '[]');
      p.tags = JSON.parse(p.tags || '[]');
      return {
        ...p,
        distance: haversineKm(lat, lng, p.lat, p.lng),
      };
    })
    .filter(p => p.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Get a place by ID
 */
export function getPlaceById(id) {
  const p = db.prepare('SELECT * FROM places WHERE id = ?').get(id);
  if (p) {
    p.photos = JSON.parse(p.photos || '[]');
    p.tags = JSON.parse(p.tags || '[]');
  }
  return p || null;
}

/**
 * Get all places (for serving to frontend)
 */
export function getAllPlaces() {
  const places = db.prepare('SELECT * FROM places').all();
  return places.map(p => {
    p.photos = JSON.parse(p.photos || '[]');
    p.tags = JSON.parse(p.tags || '[]');
    return p;
  });
}

export default { getNearbyPlaces, getPlaceById, getAllPlaces };
