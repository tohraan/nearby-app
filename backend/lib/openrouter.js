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
  const parsedPlaces = placeLines.map(l => {
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

  let matchedPlaces = [];
  let categoryLabel = 'spots';
  let intro = '';

  if (msg.includes('cafe') || msg.includes('coffee') || msg.includes('espresso') || msg.includes('matcha')) {
    categoryLabel = 'cafes & coffee shops';
    matchedPlaces = parsedPlaces.filter(p => p.category.includes('cafe') || p.name.toLowerCase().includes('cafe') || p.name.toLowerCase().includes('coffee'));
    intro = "Here are top-rated local cafes nearby where you can grab a fresh brew and relax! ☕";
  } else if (msg.includes('eat') || msg.includes('food') || msg.includes('restaurant') || msg.includes('taco') || msg.includes('burger') || msg.includes('dinner') || msg.includes('lunch') || msg.includes('cheap')) {
    categoryLabel = 'dining spots';
    matchedPlaces = parsedPlaces.filter(p => p.category.includes('food') || p.category.includes('restaurant') || p.name.toLowerCase().includes('restaurant') || p.name.toLowerCase().includes('bistro'));
    intro = "Here are fantastic dining spots close to your location! 🌮🍽️";
  } else if (msg.includes('outdoor') || msg.includes('park') || msg.includes('walk') || msg.includes('beach') || msg.includes('nature')) {
    categoryLabel = 'outdoor spots';
    matchedPlaces = parsedPlaces.filter(p => p.category.includes('outdoor') || p.name.toLowerCase().includes('park') || p.name.toLowerCase().includes('beach'));
    intro = "Enjoy the fresh air! Here are awesome outdoor parks and scenic places nearby. 🌿🏃";
  } else if (msg.includes('sport') || msg.includes('match') || msg.includes('football') || msg.includes('basketball') || msg.includes('gym')) {
    categoryLabel = 'sports & fitness venues';
    matchedPlaces = parsedPlaces.filter(p => p.category.includes('sports') || p.name.toLowerCase().includes('arena') || p.name.toLowerCase().includes('court'));
    intro = "Ready to move? Check out these sports facilities and recreation grounds near you! ⚽🏀";
  } else if (msg.includes('night') || msg.includes('bar') || msg.includes('drink') || msg.includes('club') || msg.includes('loung')) {
    categoryLabel = 'nightlife spots';
    matchedPlaces = parsedPlaces.filter(p => p.category.includes('nightlife') || p.name.toLowerCase().includes('lounge') || p.name.toLowerCase().includes('bar'));
    intro = "Looking for evening vibes? Here are top nightlife and social spots close by! 🍸✨";
  } else {
    matchedPlaces = parsedPlaces.slice(0, 4);
    intro = "Based on your location, here are great spots recommended for you right now! ✨";
  }

  if (matchedPlaces.length === 0) {
    matchedPlaces = parsedPlaces.slice(0, 4);
  }

  const selectedIds = matchedPlaces.slice(0, 4).map(p => p.id);

  return {
    reply: `${intro}\n\nI've highlighted ${selectedIds.length} recommended ${categoryLabel} for you below. Tap any spot to view details or directions!`,
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

  const inlineIds = content.match(/osm-(?:node|way)-\d+/g);
  if (inlineIds) {
    for (const id of inlineIds) {
      if (!placeIds.includes(id)) placeIds.push(id);
    }
  }

  return placeIds.slice(0, 8);
}

export function getHealthStatus() {
  return { status: 'ok', engine: 'hybrid-ai' };
}

export default { chatWithAI, getHealthStatus };
