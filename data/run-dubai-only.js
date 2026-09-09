import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const dubai = { name: 'Dubai', bbox: [24.95, 55.05, 25.35, 55.45] };

function buildQuery(bbox) {
  const [south, west, north, east] = bbox;
  const bb = `(${south},${west},${north},${east})`;
  return `[out:json][timeout:90];(node["amenity"~"restaurant|cafe|fast_food|bar|pub|cinema|theatre|nightclub|ice_cream"]${bb};node["leisure"~"park|garden|sports_centre|swimming_pool|playground"]${bb};node["tourism"~"museum|gallery|attraction|viewpoint|theme_park|zoo"]${bb};node["shop"~"mall|department_store"]${bb};way["amenity"~"restaurant|cafe|cinema"]${bb};way["leisure"~"park|garden"]${bb};way["tourism"~"museum|attraction"]${bb};way["shop"="mall"]${bb};);out center tags;`;
}

async function main() {
  console.log('Fetching Dubai POIs...');
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'NearbyApp-Hackathon/1.0',
    },
    body: `data=${encodeURIComponent(buildQuery(dubai.bbox))}`,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const elements = data.elements.map(el => ({ ...el, _city: 'Dubai' }));
  
  const rawPath = path.join(__dirname, 'raw-osm.json');
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(rawPath, 'utf8')); } catch(e){}
  
  // Remove old Dubai entries if any, then append
  existing = existing.filter(e => e._city !== 'Dubai');
  existing.push(...elements);
  
  fs.writeFileSync(rawPath, JSON.stringify(existing, null, 2));
  console.log(`Saved ${elements.length} Dubai POIs.`);
}
main();
