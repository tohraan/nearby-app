import fs from 'fs';
const data = JSON.parse(fs.readFileSync('../data/uae-places.json', 'utf8'));

console.log('Total places:', data.length);

const byCity = {};
const byCat = {};
let withImages = 0;

for (const p of data) {
  byCity[p.city] = (byCity[p.city] || 0) + 1;
  byCat[p.category] = (byCat[p.category] || 0) + 1;
  if (p.image) withImages++;
}

console.log('By City:');
Object.entries(byCity).sort((a,b) => b[1] - a[1]).forEach(c => console.log(`  - ${c[0]}: ${c[1]}`));

console.log('By Category:');
Object.entries(byCat).sort((a,b) => b[1] - a[1]).forEach(c => console.log(`  - ${c[0]}: ${c[1]}`));

console.log('With Images:', withImages);
