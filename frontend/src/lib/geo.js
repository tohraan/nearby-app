/**
 * geo.js — Geolocation utilities
 */

/**
 * Haversine distance between two coordinates (km)
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
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
 * Format distance for display
 */
export function formatDistance(km) {
  if (km < 0.1) return '<100m';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/**
 * Sort places by distance from user
 */
export function sortByDistance(places, userLat, userLng) {
  return places
    .map(p => ({
      ...p,
      distance: haversineKm(userLat, userLng, p.lat, p.lng),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Filter places within radius
 */
export function filterByRadius(places, userLat, userLng, radiusKm = 10) {
  return sortByDistance(places, userLat, userLng).filter(p => p.distance <= radiusKm);
}

// Default location: Dubai (Burj Khalifa area)
export const DEFAULT_LAT = 25.1972;
export const DEFAULT_LNG = 55.2744;

// Category emoji mapping
export const CATEGORY_EMOJI = {
  food: '🍽️',
  cafe: '☕',
  nightlife: '🍸',
  entertainment: '🎬',
  outdoor: '🌿',
  sports: '⚽',
  culture: '🏛️',
  attraction: '⭐',
  shopping: '🛍️',
  community: '👥',
  other: '📍',
};

export const CATEGORY_LABELS = {
  food: 'Food',
  cafe: 'Cafe',
  nightlife: 'Nightlife',
  entertainment: 'Entertainment',
  outdoor: 'Outdoor',
  sports: 'Sports',
  culture: 'Culture',
  attraction: 'Attraction',
  shopping: 'Shopping',
  community: 'Community',
};
