/**
 * chat.js — AI Chat endpoint
 * Receives message + location, filters nearby places, builds prompt, calls OpenRouter
 */

import { Router } from 'express';
import db from '../db.js';
import { getNearbyPlaces } from '../lib/placeContext.js';
import { chatWithAI } from '../lib/openrouter.js';

const router = Router();

// POST /chat — AI-grounded chat
router.post('/', async (req, res) => {
  const { deviceId, message, lat, lng } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message required' });
  }

  try {
    // Load user profile if exists
    const profile = deviceId
      ? db.prepare('SELECT * FROM user_profiles WHERE device_id = ?').get(deviceId)
      : null;

    // Filter nearby places (default 5km radius, max 40 places)
    const userLat = lat || 25.2048; // Default: Dubai
    const userLng = lng || 55.2708;
    const nearbyPlaces = getNearbyPlaces(userLat, userLng, 5, 40);

    // Build the place list for prompt
    const placeList = nearbyPlaces.map(p =>
      `- ID: ${p.id} | "${p.name}" | ${p.category} | Rating: ${p.rating}/5 (${p.reviewCount} reviews) | ${p.distance.toFixed(1)}km away${p.cuisine?.length ? ` | Cuisine: ${p.cuisine.join(', ')}` : ''}`
    ).join('\n');

    // Build system prompt
    const systemPrompt = `You are a friendly local guide for the UAE. You help users discover nearby places.

CRITICAL RULES:
1. ONLY recommend places from the list below. NEVER invent or hallucinate a place.
2. Return recommended place IDs in a JSON block like: \`\`\`json\n{"placeIds": ["osm-node-123", "osm-node-456"]}\n\`\`\`
3. Keep your response conversational and brief (2-4 sentences of narration).
4. If asked for combos (e.g. "coffee then movies"), pair geo-close results.
5. Consider the user's distance — prefer closer places unless they specify otherwise.

${profile ? `USER PROFILE:
- Name: ${profile.display_name || 'Anonymous'}
- Interests: ${profile.interests || 'Not specified'}
- Area: ${profile.area || 'Not specified'}` : 'No user profile available.'}

NEARBY PLACES (within 5km):
${placeList || 'No places found nearby. Suggest the user move to a more populated area.'}`;

    const { reply, placeIds } = await chatWithAI(systemPrompt, message);

    res.json({ reply, placeIds });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat service unavailable', details: err.message });
  }
});

export default router;
