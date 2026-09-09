/**
 * geo.js — Geolocation utilities and real place imagery mapping
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

// High resolution Unsplash real place imagery mapped deterministically per category
const CATEGORY_IMAGES = {
  cafe: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&auto=format&fit=crop&q=80'
  ],
  food: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&auto=format&fit=crop&q=80'
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&auto=format&fit=crop&q=80'
  ],
  outdoor: [
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop&q=80'
  ],
  sports: [
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=800&auto=format&fit=crop&q=80'
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&auto=format&fit=crop&q=80'
  ],
  culture: [
    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&auto=format&fit=crop&q=80'
  ],
  shopping: [
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80'
  ],
  attraction: [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&auto=format&fit=crop&q=80'
  ]
};

export function getPlaceImage(place) {
  if (place?.image && typeof place.image === 'string' && place.image.startsWith('http')) {
    return place.image;
  }
  const category = place?.category || 'outdoor';
  const list = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.outdoor;
  const key = String(place?.id || place?.name || '0');
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % list.length;
  return list[index];
}
