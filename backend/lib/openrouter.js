/**
 * openrouter.js — OpenRouter API client with guardrails
 *
 * Guardrails:
 * - Request timeout (10s)
 * - Retry with exponential backoff (3 attempts)
 * - Circuit breaker (trips after 5 consecutive failures, resets after 60s)
 * - Graceful fallback when no API key or service is down
 * - Response validation (rejects empty/malformed responses)
 * - Token budget cap per request
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 4;
const INITIAL_RETRY_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 15000;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 60000;
const MAX_TOKENS = 800;

// Circuit breaker state
let consecutiveFailures = 0;
let circuitOpenUntil = 0;

function isCircuitOpen() {
  if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    if (Date.now() < circuitOpenUntil) {
      return true;
    }
    // Half-open: allow one attempt
    consecutiveFailures = CIRCUIT_BREAKER_THRESHOLD - 1;
  }
  return false;
}

function recordSuccess() {
  consecutiveFailures = 0;
}

function recordFailure() {
  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_RESET_MS;
    console.warn(`🔴 OpenRouter circuit breaker OPEN — will retry after ${new Date(circuitOpenUntil).toISOString()}`);
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sleep for exponential backoff
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a fallback response when AI is unavailable
 */
function getFallbackResponse(reason) {
  const fallbackMessages = [
    "I'm having trouble connecting to my brain right now! 🧠 But don't worry — browse the Nearby tab to discover great spots around you.",
    "The AI service is taking a break. 😴 In the meantime, check out the Nearby feed — there are amazing places waiting for you!",
    "Oops, I can't think straight right now! 🤖 Try exploring the map or filtering by category to find something awesome.",
  ];
  return {
    reply: fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)] +
      (reason ? `\n\n_Technical detail: ${reason}_` : ''),
    placeIds: [],
    fallback: true,
  };
}

/**
 * Validate and sanitize the user message
 */
function sanitizeMessage(message) {
  if (typeof message !== 'string') return '';
  // Trim and cap length (prevent prompt injection via extremely long messages)
  return message.trim().substring(0, 2000);
}

/**
 * Call OpenRouter API with a chat prompt
 * @param {string} systemPrompt - System instructions
 * @param {string} userMessage - User's chat message
 * @returns {Promise<{reply: string, placeIds: string[], fallback?: boolean}>}
 */
export async function chatWithAI(systemPrompt, userMessage) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  // Free models to cycle through on retry fallbacks
  const FREE_MODELS = [
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'liquid/lfm-2.5-2.6b:free'
  ];

  // Guard: No API key configured
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return getFallbackResponse('AI service not configured. Add OPENROUTER_API_KEY to .env');
  }

  // Guard: Circuit breaker is open
  if (isCircuitOpen()) {
    return getFallbackResponse('AI service temporarily unavailable (circuit breaker open)');
  }

  // Guard: Sanitize input
  const sanitizedMessage = sanitizeMessage(userMessage);
  if (!sanitizedMessage) {
    return { reply: "I didn't catch that — could you try again?", placeIds: [] };
  }

  // Retry loop with exponential backoff
  let lastError = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`  ↻ Retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
        await sleep(delay);
      }

      const modelToUse = FREE_MODELS[attempt % FREE_MODELS.length];
      
      const res = await fetchWithTimeout(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://github.com/tohraan/nearby-app',
          'X-Title': 'NearbyApp',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: sanitizedMessage },
          ],
          temperature: 0.7,
          max_tokens: MAX_TOKENS,
        }),
      }, REQUEST_TIMEOUT_MS);

      // Handle HTTP errors
      if (!res.ok) {
        const errBody = await res.text().catch(() => 'Unknown error');

        // Don't retry on 4xx client errors (except 429 rate limit)
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          recordFailure();
          console.error(`OpenRouter client error ${res.status}: ${errBody.substring(0, 200)}`);
          return getFallbackResponse(`API returned ${res.status}`);
        }

        // 429 = rate limited, 5xx = server error — retry
        throw new Error(`OpenRouter ${res.status}: ${errBody.substring(0, 150)}`);
      }

      const data = await res.json();

      // Guard: Validate response structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Malformed API response — missing choices');
      }

      const content = data.choices[0].message.content || '';

      // Guard: Empty response
      if (!content.trim()) {
        throw new Error('Empty response from API');
      }

      // Parse place IDs from response
      const placeIds = extractPlaceIds(content);

      // Clean the reply (remove JSON blocks for display)
      const reply = content.replace(/```json[\s\S]*?```/g, '').trim();

      recordSuccess();
      return { reply, placeIds };

    } catch (err) {
      lastError = err;

      // AbortError = timeout
      if (err.name === 'AbortError') {
        console.warn(`  ⏱ OpenRouter request timed out (attempt ${attempt + 1})`);
        lastError = new Error('Request timed out');
      } else {
        console.warn(`  ⚠️ OpenRouter attempt ${attempt + 1} failed: ${err.message}`);
      }
    }
  }

  // All retries exhausted
  recordFailure();
  console.error(`🔴 OpenRouter failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
  return getFallbackResponse(`Service unavailable after ${MAX_RETRIES} retries`);
}

/**
 * Extract place IDs from LLM response content
 */
function extractPlaceIds(content) {
  const placeIds = [];

  // Try JSON block first
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

  // Also extract inline OSM IDs
  const inlineIds = content.match(/osm-(?:node|way)-\d+/g);
  if (inlineIds) {
    for (const id of inlineIds) {
      if (!placeIds.includes(id)) placeIds.push(id);
    }
  }

  // Cap at 10 place IDs to prevent UI overload
  return placeIds.slice(0, 10);
}

/**
 * Health check — returns circuit breaker status
 */
export function getHealthStatus() {
  return {
    circuitOpen: isCircuitOpen(),
    consecutiveFailures,
    circuitResetsAt: circuitOpenUntil > Date.now() ? new Date(circuitOpenUntil).toISOString() : null,
  };
}

export default { chatWithAI, getHealthStatus };
