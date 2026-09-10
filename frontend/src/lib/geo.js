/**
 * geo.js — Geolocation utilities and real venue imagery mapping
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
  all: '✨',
  meetups: '🏐',
  movies: '🎬',
  food: '🍽️',
  cafe: '☕',
  nightlife: '🍸',
  entertainment: '🎭',
  outdoor: '🌿',
  sports: '⚽',
  culture: '🏛️',
  attraction: '⭐',
  shopping: '🛍️',
  community: '👥',
  other: '📍',
};

export const CATEGORY_LABELS = {
  all: 'All',
  meetups: 'Meetups',
  movies: 'Movies',
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

// Category group helpers — used by PlaceDetail for conditional booking panels
export const FOOD_RESERVATION_CATEGORIES = new Set(['food', 'cafe', 'nightlife']);
export const TICKET_CATEGORIES = new Set(['attraction', 'culture', 'entertainment']);
export const DIRECTIONS_CATEGORIES = new Set(['outdoor', 'sports', 'beach', 'landmark', 'community']);

// ─── Top-Level Vertical "Worlds" ───
export const TOP_LEVEL_VERTICALS = [
  { key: 'all', label: 'All Spots', icon: '✨', subCategories: ['all'] },
  { key: 'eat_drink', label: 'Eat & Drink', icon: '🍽️', subCategories: ['food', 'cafe', 'nightlife'] },
  { key: 'attractions', label: 'Attractions', icon: '🎟️', subCategories: ['attraction', 'culture', 'outdoor', 'shopping', 'entertainment'] },
  { key: 'sports_meetups', label: 'Sports & Meetups', icon: '🏐', subCategories: ['meetups', 'sports'] },
  { key: 'movies', label: 'Movies', icon: '🎬', subCategories: ['movies'] },
  { key: 'outings', label: 'Outings', icon: '🌆', subCategories: ['outdoor', 'entertainment'] },
];

export function getVerticalForCategory(cat) {
  if (cat === 'meetups') return 'sports_meetups';
  if (cat === 'movies') return 'movies';
  if (['food', 'cafe', 'nightlife'].includes(cat)) return 'eat_drink';
  if (['attraction', 'culture', 'outdoor', 'shopping', 'entertainment'].includes(cat)) return 'attractions';
  return 'attractions';
}

export function formatPriceDisplay(place) {
  if (!place || place.isFree) return null;
  if (place.category === 'meetups') return null; // Meetups are strictly free/social
  if (['food', 'cafe', 'nightlife'].includes(place.category)) return null; // Dining uses priceRange signal ($$)
  if (place.price !== undefined && place.price !== null) {
    const currency = place.currency || 'AED';
    return `${currency} ${place.price}`;
  }
  return null;
}

export function getPriceRangeSignal(place) {
  if (!place) return '';
  if (['food', 'cafe', 'nightlife', 'shopping'].includes(place.category) && place.priceRange) {
    return ` · ${place.priceRange}`;
  }
  return '';
}

// Real venue photography matching specific venue names & landmarks
const VENUE_REAL_IMAGES = {
  'burj khalifa': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80',
  'burj al arab': 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&auto=format&fit=crop&q=80',
  'museum of the future': 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&auto=format&fit=crop&q=80',
  'dubai frame': 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&auto=format&fit=crop&q=80',
  'kite beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  'jumeirah beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  'mamzar beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  'dubai mall': 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80',
  'mall of the emirates': 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80',
  'jebel jais': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
  'alserkal': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
  'khor fakkan': 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80',
  'arabica': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
  'salt': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80',
  'ras al khor': 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&auto=format&fit=crop&q=80',
  'louvre': 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&auto=format&fit=crop&q=80',
  'sheikh zayed': 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
  'global village': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
  'atlantis': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80',
  'yas island': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
  'tom & serg': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
  'pierchic': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
};

// High resolution Unsplash category imagery fallback — diverse per slot
const CATEGORY_IMAGES = {
  cafe: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
  ],
  food: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&auto=format&fit=crop&q=80',
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&auto=format&fit=crop&q=80',
  ],
  outdoor: [
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80',
  ],
  sports: [
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&auto=format&fit=crop&q=80',
  ],
  culture: [
    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
  ],
  shopping: [
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&auto=format&fit=crop&q=80',
  ],
  attraction: [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
  ],
  community: [
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800&auto=format&fit=crop&q=80',
  ],
};

export function hasRealImage(place) {
  if (place?.image && typeof place.image === 'string' && place.image.startsWith('http')) {
    return true;
  }
  if (Array.isArray(place?.photos) && place.photos.length > 0) {
    return true;
  }
  const nameLower = String(place?.name || place?.id || '').toLowerCase();
  for (const key of Object.keys(VENUE_REAL_IMAGES)) {
    if (nameLower.includes(key)) {
      return true;
    }
  }
  return false;
}

export function getPlaceImage(place) {
  if (place?.image && typeof place.image === 'string' && place.image.startsWith('http')) {
    return place.image;
  }
  if (Array.isArray(place?.photos) && place.photos.length > 0 && place.photos[0]) {
    return place.photos[0];
  }

  const nameLower = String(place?.name || place?.id || '').toLowerCase();
  for (const [key, url] of Object.entries(VENUE_REAL_IMAGES)) {
    if (nameLower.includes(key)) {
      return url;
    }
  }

  // Return null when no real venue photo exists — signals VenueImage component to render honest vertical-tint placeholder
  return null;
}

/**
 * Resolves the primary actionable external URL for a place or event.
 * Priority order: actionUrl -> website -> Google Maps search fallback.
 */
export function getActionableUrl(place) {
  if (place?.actionUrl && typeof place.actionUrl === 'string' && place.actionUrl.trim().length > 0) {
    return place.actionUrl.trim();
  }
  if (place?.website && typeof place.website === 'string' && place.website.trim().length > 0) {
    return place.website.trim();
  }
  const queryName = encodeURIComponent((place?.name || '') + (place?.city ? ` ${place.city}` : ''));
  return `https://www.google.com/maps/search/?api=1&query=${queryName}`;
}

export function getActionLabel(place) {
  const category = (place?.category || place?.actionType || '').toLowerCase();
  
  if (category === 'cafe' || category === 'food' || category === 'nightlife') {
    return 'Reserve table';
  }
  if (category === 'attraction' || category === 'culture' || category === 'entertainment' || category === 'shopping') {
    return 'Book tickets';
  }
  if (category === 'outdoor' || category === 'sports' || category === 'beach' || category === 'landmark') {
    return 'Get directions';
  }
  
  // Fallback check on place name
  const nameLower = (place?.name || '').toLowerCase();
  if (nameLower.includes('beach') || nameLower.includes('park') || nameLower.includes('mountain') || nameLower.includes('trail')) {
    return 'Get directions';
  }
  if (nameLower.includes('museum') || nameLower.includes('frame') || nameLower.includes('view') || nameLower.includes('pass')) {
    return 'Book tickets';
  }

  return 'Get directions';
}

