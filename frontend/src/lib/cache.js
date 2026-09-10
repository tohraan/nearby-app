import { openDB } from 'idb';

const DB_NAME = 'NearbyAppCache';
const STORE_NAME = 'apiResponses';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

/**
 * Cache an API response with the current timestamp
 */
export async function setCachedResponse(key, data) {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, {
      data,
      timestamp: Date.now(),
    }, key);
  } catch (err) {
    console.warn('Failed to write to IndexedDB cache:', err);
  }
}

/**
 * Get a cached response. Returns { data, isStale } or null.
 * isStale is true if the cache is older than CACHE_TTL_MS (30 mins).
 */
export async function getCachedResponse(key) {
  try {
    const db = await getDB();
    const cached = await db.get(STORE_NAME, key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_TTL_MS) {
      return { data: cached.data, isStale: true };
    }
    
    return { data: cached.data, isStale: false };
  } catch (err) {
    console.warn('Failed to read from IndexedDB cache:', err);
    return null;
  }
}
