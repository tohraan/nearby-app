/**
 * openrouter.js — OpenRouter API client with local recommendation fallback
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 400;
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Smart local recommendation engine fallback
 */
function getSmartLocalResponse(userMessage, systemPrompt) {
  const msg = (userMessage || '').toLowerCase();
  
  // Parse places from prompt
  const placeLines = (systemPrompt || '').split('\n').filter(l => l.startsWith('- ID:'));
  let parsedPlaces = placeLines.map(l => {
    const parts = l.split('|').map(p => p.trim());
    const idMatch = parts[0]?.match(/ID:\s*([^\s]+)/);
    const nameMatch = parts[1]?.replace(/"/g, '');
    const categoryMatch = parts[2];
    return {
      id: idMatch ? idMatch[1] : null,
      name: nameMatch || '',
      category: categoryMatch || '',
    };
  }).filter(p => p.id);

  // Add default iconic fallback places to pool if pool is sparse
  const fallbackPool = [
    { id: 'fallback_jebel_jais', name: 'Jebel Jais Drive & Peak Zipline', category: 'outdoor' },
    { id: 'fallback_kite_beach', name: 'Kite Beach Sunset & Cafes', category: 'outdoor' },
    { id: 'fallback_tom_serge', name: 'Tom & Serg Specialty Coffee', category: 'cafe' },
    { id: 'fallback_al_serkal', name: 'Alserkal Avenue Art & Coffee', category: 'culture' },
    { id: 'fallback_pierchic', name: 'Pierchic Fine Dining', category: 'food' },
    { id: 'fallback_museum_future', name: 'Museum of the Future', category: 'culture' },
    { id: 'fallback_louvre_ad', name: 'Louvre Abu Dhabi', category: 'culture' },
    { id: 'fallback_burj_khalifa', name: 'Burj Khalifa', category: 'attraction' },
    { id: 'fallback_dubai_frame', name: 'Dubai Frame', category: 'attraction' }
  ];

  for (const fp of fallbackPool) {
    if (!parsedPlaces.some(p => p.id === fp.id)) {
      parsedPlaces.push(fp);
    }
  }

  let matchedPlaces = [];
  let categoryLabel = 'spots';
  let introHeader = '';

  if (msg.includes('outdoor') || msg.includes('park') || msg.includes('walk') || msg.includes('beach') || msg.includes('nature') || msg.includes('road trip') || msg.includes('trip')) {
    categoryLabel = 'outdoor & road trip spots';
    matchedPlaces = parsedPlaces.filter(p => p.category.includes('outdoor') || p.id === 'fallback_jebel_jais' || p.id === 'fallback_kite_beach' || p.name.toLowerCase().includes('park') || p.name.toLowerCase().includes('beach'));
    introHeader = "Here are iconic outdoor activities and road trip spots across the UAE!";
  } else if (msg.includes('cafe') || msg.includes('coffee') || msg.includes('espresso') || msg.includes('matcha') || msg.includes('work')) {
    categoryLabel = 'cafes & coffee shops';
    matchedPlaces = parsedPlaces.filter(p => p.category.includes('cafe') || p.id === 'fallback_tom_serge' || p.id === 'fallback_al_serkal' || p.name.toLowerCase().includes('cafe') || p.name.toLowerCase().includes('coffee'));
    introHeader = "Here are top-rated specialty coffee shops nearby with great brews and workspace vibes!";
  } else if (msg.includes('eat') || msg.includes('food') || msg.includes('restaurant') || msg.includes('taco') || msg.includes('burger') || msg.includes('dinner') || msg.includes('lunch') || msg.includes('cheap')) {
    categoryLabel = 'dining spots';
    matchedPlaces = parsedPlaces.filter(p => p.category.includes('food') || p.category.includes('restaurant') || p.id === 'fallback_pierchic' || p.name.toLowerCase().includes('restaurant') || p.name.toLowerCase().includes('bistro'));
    introHeader = "Here are top-rated dining spots and culinary gems recommended for you!";
  } else if (msg.includes('culture') || msg.includes('art') || msg.includes('museum') || msg.includes('landmark') || msg.includes('exhibition')) {
    categoryLabel = 'cultural landmarks';
    matchedPlaces = parsedPlaces.filter(p => p.category.includes('culture') || p.category.includes('attraction') || p.id === 'fallback_museum_future' || p.id === 'fallback_louvre_ad' || p.id === 'fallback_dubai_frame');
    introHeader = "Here are world-class cultural landmarks and architectural icons in the UAE!";
  } else {
    matchedPlaces = parsedPlaces.slice(0, 4);
    introHeader = "Based on your location, here are top-rated spots recommended for you right now!";
  }

  if (matchedPlaces.length === 0) {
    matchedPlaces = fallbackPool.slice(0, 3);
  }

  const selected = matchedPlaces.slice(0, 3);
  const selectedIds = selected.map(p => p.id);
  const placeNamesStr = selected.map(p => `**${p.name}**`).join(', ');

  return {
    reply: `${introHeader} Featuring ${placeNamesStr}. Tap any card below to view details or official booking options!`,
    placeIds: selectedIds,
    fallback: true
  };
}

/**
 * Call OpenRouter API with a chat prompt
 */
export async function chatWithAI(systemPrompt, userMessage) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  const FREE_MODELS = [
    'google/gemma-2-9b-it:free',
    'google/gemma-4-31b-it:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-r1:free',
    'mistralai/mistral-7b-instruct:free'
  ];

  // If no API key set, fallback to smart recommendation engine
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return getSmartLocalResponse(userMessage, systemPrompt);
  }

  const sanitizedMessage = (userMessage || '').trim().substring(0, 2000);
  if (!sanitizedMessage) {
    return { reply: "I didn't catch that — could you try asking again?", placeIds: [] };
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(INITIAL_RETRY_DELAY_MS * attempt);
      }

      const modelToUse = FREE_MODELS[attempt % FREE_MODELS.length];
      
      const res = await fetchWithTimeout(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://nearby-app.vercel.app',
          'X-Title': 'NearbyApp Guide',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: sanitizedMessage }
          ],
          temperature: 0.7,
          max_tokens: 600,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const placeIds = extractPlaceIds(content);
          return { reply: content, placeIds };
        }
      }
    } catch (err) {
      console.warn(`Attempt ${attempt + 1} failed: ${err.message}`);
    }
  }

  // If external call fails, use smart local fallback
  return getSmartLocalResponse(userMessage, systemPrompt);
}

/**
 * Extract place IDs from LLM response content
 */
function extractPlaceIds(content) {
  const placeIds = [];
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed?.placeIds)) {
        placeIds.push(...parsed.placeIds);
      } else if (Array.isArray(parsed)) {
        placeIds.push(...parsed);
      }
    } catch { /* ignore parse errors */ }
  }

  const inlineIds = content.match(/(?:osm-(?:node|way)-\d+|fallback_[a-z0-9_]+)/g);
  if (inlineIds) {
    for (const id of inlineIds) {
      if (!placeIds.includes(id)) placeIds.push(id);
    }
  }

  // Extract from entity names mentioned in text
  const contentLower = (content || '').toLowerCase();
  const knownEntities = [
    { id: 'fallback_jebel_jais', match: ['jebel jais', 'zipline'] },
    { id: 'fallback_kite_beach', match: ['kite beach', 'beach'] },
    { id: 'fallback_burj_khalifa', match: ['burj khalifa'] },
    { id: 'fallback_dubai_frame', match: ['dubai frame'] },
    { id: 'fallback_museum_future', match: ['museum of the future'] },
    { id: 'fallback_louvre_ad', match: ['louvre abu dhabi', 'louvre'] },
    { id: 'fallback_szgm', match: ['sheikh zayed grand mosque', 'grand mosque'] },
    { id: 'fallback_tom_serge', match: ['tom & serg', 'tom and serg'] },
    { id: 'fallback_pierchic', match: ['pierchic'] },
    { id: 'fallback_atlantis', match: ['aquaventure', 'atlantis'] },
    { id: 'fallback_global_village', match: ['global village'] },
    { id: 'fallback_al_serkal', match: ['alserkal', 'al serkal'] },
    { id: 'fallback_dubai_mall', match: ['dubai mall'] },
    { id: 'fallback_yas_island', match: ['yas island'] }
  ];

  for (const entity of knownEntities) {
    if (entity.match.some(m => contentLower.includes(m))) {
      if (!placeIds.includes(entity.id)) {
        placeIds.push(entity.id);
      }
    }
  }

  return placeIds.slice(0, 6);
}

export function getHealthStatus() {
  return { status: 'ok', engine: 'hybrid-ai' };
}

export default { chatWithAI, getHealthStatus };
