import db from '../db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function seedPlaces({ force = false } = {}) {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM places').get();
  if (!force && existing.count > 0) {
    console.log(`📍 Places already seeded (${existing.count})`);
    return existing.count;
  }

  console.log('🌱 Seeding places into SQLite...\n');

  let places;
  try {
    const dataPath = join(__dirname, '..', '..', 'data', 'uae-places.json');
    places = JSON.parse(readFileSync(dataPath, 'utf-8'));
  } catch (err) {
    console.error('❌ Could not load uae-places.json:', err.message);
    throw err;
  }

  const insert = db.prepare(`
    INSERT OR REPLACE INTO places (
      id, name, category, sub_category, lat, lng, rating, review_count,
      address, price_info, photos, opening_hours, city, tags, last_refreshed_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
    )
  `);

  const insertMany = db.transaction((placesToInsert) => {
    for (const place of placesToInsert) {
      const photos = place.photos ? JSON.stringify(place.photos) : '[]';
      const tags = place.tags ? JSON.stringify(place.tags) : '[]';

      insert.run(
        place.id,
        place.name,
        place.category || 'other',
        place.sub_category || '',
        place.lat,
        place.lng,
        place.rating || null,
        place.reviewCount || 0,
        place.address || '',
        place.price_info || '',
        photos,
        place.opening_hours || '',
        place.city || '',
        tags
      );
    }
  });

  insertMany(places);
  console.log(`✅ Seeded ${places.length} places into SQLite.`);
  return places.length;
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) {
  try {
    seedPlaces({ force: true });
  } catch {
    process.exit(1);
  }
}
