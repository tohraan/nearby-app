/**
 * seed.js — Seed demo data for live activity simulation
 * Creates realistic activity events showing "someone nearby found X"
 */

import db from '../db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function main() {
  console.log('🌱 Seeding demo data...\n');

  // Load places
  let places;
  try {
    const dataPath = join(__dirname, '..', '..', 'data', 'uae-places.json');
    places = JSON.parse(readFileSync(dataPath, 'utf-8'));
  } catch {
    console.error('❌ uae-places.json not found. Run the data pipeline first.');
    process.exit(1);
  }

  // Generate anonymous device IDs for simulation
  const fakeDevices = Array.from({ length: 20 }, (_, i) =>
    `anon-${String(i + 1).padStart(3, '0')}***`
  );

  // Seed activity events (last 2 hours, spread out)
  const now = Date.now();
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const eventsToCreate = 30;

  const insertEvent = db.prepare(`
    INSERT INTO activity_events (device_id, place_id, lat, lng, created_at)
    VALUES (?, ?, ?, ?, datetime(?, 'unixepoch'))
  `);

  const insertMany = db.transaction(() => {
    for (let i = 0; i < eventsToCreate; i++) {
      const place = places[Math.floor(Math.random() * Math.min(places.length, 200))];
      const device = fakeDevices[Math.floor(Math.random() * fakeDevices.length)];
      const timestamp = Math.floor((now - Math.random() * twoHoursMs) / 1000);

      insertEvent.run(device, place.id, place.lat, place.lng, timestamp);
    }
  });

  insertMany();
  console.log(`  ✅ Created ${eventsToCreate} activity events`);

  // Seed a few demo groups
  const demoGroups = [
    {
      id: 'demo-group-1',
      name: 'Friday Brunch Crew 🥐',
      placeId: places.find(p => p.category === 'food')?.id || places[0].id,
      description: 'Weekly brunch exploration — trying a new spot every Friday!',
      startsAt: new Date(now + 3 * 86400000).toISOString(),
    },
    {
      id: 'demo-group-2',
      name: 'Sunset Walkers 🌅',
      placeId: places.find(p => p.category === 'outdoor')?.id || places[1].id,
      description: 'Evening walks and park hangs. All welcome!',
      startsAt: new Date(now + 86400000).toISOString(),
    },
    {
      id: 'demo-group-3',
      name: 'Coffee Connoisseurs ☕',
      placeId: places.find(p => p.category === 'cafe')?.id || places[2].id,
      description: 'Discovering the best specialty coffee spots in the city.',
      startsAt: null,
    },
  ];

  const insertGroup = db.prepare(`
    INSERT OR IGNORE INTO groups (id, name, place_id, creator_device_id, description, starts_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMember = db.prepare(`
    INSERT OR IGNORE INTO group_members (group_id, device_id, display_name)
    VALUES (?, ?, ?)
  `);

  const insertPost = db.prepare(`
    INSERT INTO group_posts (group_id, device_id, text)
    VALUES (?, ?, ?)
  `);

  for (const g of demoGroups) {
    insertGroup.run(g.id, g.name, g.placeId, 'anon-001***', g.description, g.startsAt);

    // Add some members
    const memberCount = 2 + Math.floor(Math.random() * 5);
    for (let i = 0; i < memberCount; i++) {
      const names = ['Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Taylor'];
      insertMember.run(g.id, fakeDevices[i], names[i % names.length]);
    }

    // Add some posts
    const samplePosts = [
      'Anyone tried the new spot on Sheikh Zayed Road?',
      'This place is amazing! Highly recommend 🔥',
      'See you all there this weekend!',
      'Just arrived — grab a spot near the entrance',
      'The outdoor seating here is perfect right now',
    ];
    for (let i = 0; i < 3; i++) {
      insertPost.run(g.id, fakeDevices[i], samplePosts[i]);
    }
  }

  console.log(`  ✅ Created ${demoGroups.length} demo groups with members and posts`);
  console.log('\n🎉 Seeding complete!');
}

main();
