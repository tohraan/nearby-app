/**
 * normalize.js
 * Transform raw OSM data → clean Place schema.
 * Generates synthetic ratings/reviews (OSM doesn't have them).
 * Output: uae-places.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Seeded random for deterministic synthetic data
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Category mapping from OSM tags
function categorize(tags) {
  if (!tags) return 'other';

  const amenity = tags.amenity || '';
  const leisure = tags.leisure || '';
  const tourism = tags.tourism || '';
  const shop = tags.shop || '';
  const cuisine = tags.cuisine || '';

  if (['restaurant', 'fast_food', 'food_court'].includes(amenity)) return 'food';
  if (['cafe', 'ice_cream', 'juice_bar'].includes(amenity)) return 'cafe';
  if (['bar', 'pub', 'nightclub'].includes(amenity)) return 'nightlife';
  if (['cinema', 'theatre'].includes(amenity)) return 'entertainment';
  if (amenity === 'community_centre') return 'community';
  if (['park', 'garden', 'playground'].includes(leisure)) return 'outdoor';
  if (['sports_centre', 'swimming_pool', 'beach_resort'].includes(leisure)) return 'sports';
  if (['museum', 'gallery'].includes(tourism)) return 'culture';
  if (['attraction', 'viewpoint', 'theme_park', 'zoo'].includes(tourism)) return 'attraction';
  if (['mall', 'department_store'].includes(shop)) return 'shopping';

  return 'other';
}

// Extract a readable name
function extractName(tags) {
  if (!tags) return null;
  return tags['name:en'] || tags.name || tags.brand || null;
}

// Extract address
function extractAddress(tags) {
  if (!tags) return '';
  const parts = [
    tags['addr:street'],
    tags['addr:city'] || tags['addr:suburb'],
    tags['addr:postcode'],
  ].filter(Boolean);
  return parts.join(', ');
}

// Get cuisine tags as array
function extractCuisine(tags) {
  if (!tags || !tags.cuisine) return [];
  return tags.cuisine.split(';').map(c => c.trim()).filter(Boolean);
}

function main() {
  const rawPath = join(__dirname, 'raw-osm.json');
  let rawData;
  try {
    rawData = JSON.parse(readFileSync(rawPath, 'utf-8'));
  } catch {
    console.error('❌ raw-osm.json not found. Run fetch-overpass.js first.');
    process.exit(1);
  }

  console.log(`📦 Normalizing ${rawData.length} raw OSM elements...\n`);

  const seen = new Set();
  const places = [];

  for (const el of rawData) {
    // Get coordinates (nodes have lat/lng directly, ways have center)
    const lat = el.lat || el.center?.lat;
    const lng = el.lon || el.center?.lon;
    if (!lat || !lng) continue;

    const name = extractName(el.tags);
    if (!name) continue; // Skip unnamed POIs

    const id = `osm-${el.type}-${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const category = categorize(el.tags);
    if (category === 'other') continue; // Skip uncategorizable

    // Generate synthetic ratings using place ID as seed
    const rng = seededRandom(el.id);
    const rating = Math.round((3.2 + rng() * 1.8) * 10) / 10; // 3.2 – 5.0
    const reviewCount = Math.floor(5 + rng() * 495); // 5 – 500
    const daysAgo = Math.floor(rng() * 90); // 0 – 90 days ago
    const lastReviewAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

    places.push({
      id,
      name,
      category,
      lat: Math.round(lat * 1000000) / 1000000,
      lng: Math.round(lng * 1000000) / 1000000,
      rating,
      reviewCount,
      lastReviewAt,
      address: extractAddress(el.tags),
      cuisine: extractCuisine(el.tags),
      city: el._city || 'UAE',
      tags: [
        category,
        ...(el.tags?.['opening_hours'] ? ['open-now'] : []),
        ...(el.tags?.wifi === 'yes' ? ['wifi'] : []),
        ...(el.tags?.outdoor_seating === 'yes' ? ['outdoor-seating'] : []),
        ...(el.tags?.takeaway === 'yes' ? ['takeaway'] : []),
      ],
    });
  }

  // Sort by review recency (differentiator)
  places.sort((a, b) => new Date(b.lastReviewAt) - new Date(a.lastReviewAt));

  const outPath = join(__dirname, 'uae-places.json');
  writeFileSync(outPath, JSON.stringify(places, null, 2));
  console.log(`✅ Normalized ${places.length} places → uae-places.json`);

  // Stats
  const categories = {};
  for (const p of places) {
    categories[p.category] = (categories[p.category] || 0) + 1;
  }
  console.log('\nCategory breakdown:');
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }
}

main();
