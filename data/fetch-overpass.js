/**
 * fetch-overpass.js
 * One-time script to pull UAE POIs from OpenStreetMap Overpass API.
 * Output: raw-osm.json
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const AREAS = [
  { name: 'Dubai', bbox: [24.95, 55.05, 25.35, 55.45] },
  { name: 'Abu Dhabi', bbox: [24.38, 54.30, 24.55, 54.72] },
  { name: 'Sharjah', bbox: [25.30, 55.33, 25.42, 55.48] },
];

function buildQuery(bbox) {
  const [south, west, north, east] = bbox;
  const bb = `(${south},${west},${north},${east})`;
  return `[out:json][timeout:60];(node["amenity"~"restaurant|cafe|fast_food|bar|pub|cinema|theatre|nightclub|ice_cream"]${bb};node["leisure"~"park|garden|sports_centre|swimming_pool|playground"]${bb};node["tourism"~"museum|gallery|attraction|viewpoint|theme_park|zoo"]${bb};node["shop"~"mall|department_store"]${bb};way["amenity"~"restaurant|cafe|cinema"]${bb};way["leisure"~"park|garden"]${bb};way["tourism"~"museum|attraction"]${bb};way["shop"="mall"]${bb};);out center tags;`;
}

async function fetchArea(area) {
  const query = buildQuery(area.bbox);
  console.log(`  Fetching ${area.name}...`);

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'NearbyApp-Hackathon/1.0 (https://github.com/tohraan/nearby-app)',
      'Accept': '*/*',
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Overpass ${res.status}: ${body.substring(0, 150)}`);
  }

  const data = await res.json();
  console.log(`  → ${data.elements.length} elements from ${area.name}`);
  return data.elements.map(el => ({ ...el, _city: area.name }));
}

async function main() {
  console.log('🗺️  Fetching UAE POIs from Overpass API...\n');

  const allElements = [];
  for (const area of AREAS) {
    try {
      const elements = await fetchArea(area);
      allElements.push(...elements);
    } catch (err) {
      console.error(`  ⚠️  Failed for ${area.name}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 5000));
  }

  const fs = await import('fs');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = join(__dirname, 'raw-osm.json');
  fs.writeFileSync(outPath, JSON.stringify(allElements, null, 2));
  console.log(`\n✅ Saved ${allElements.length} elements to raw-osm.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
