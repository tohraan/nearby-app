/**
 * api.js — API client with guardrails
 *
 * Guardrails:
 * - Request timeout (10s default, 20s for chat)
 * - Automatic retry for 5xx and network errors (3 attempts, exponential backoff)
 * - No retry for 4xx client errors
 * - Offline detection — throws clear error
 * - Response validation
 * - Device ID auto-injection
 */

import { getDeviceId } from './deviceId.js';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001');
const DEFAULT_TIMEOUT_MS = 10000;
const CHAT_TIMEOUT_MS = 20000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 300;

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Core request function with retry + timeout
 */
async function request(path, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  // Guard: Offline check
  if (!navigator.onLine) {
    throw new ApiError('You\'re offline. This action requires a connection.', 0);
  }

  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Device-Id': getDeviceId(),
    ...options.headers,
  };

  let lastError = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1)));
      }

      const res = await fetchWithTimeout(url, { ...options, headers }, timeoutMs);

      // 4xx = client error, don't retry
      if (res.status >= 400 && res.status < 500) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data);
      }

      // 5xx = server error, retry
      if (res.status >= 500) {
        throw new ApiError(`Server error (${res.status})`, res.status);
      }

      // Guard: Validate response is JSON
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
      return await res.text();

    } catch (err) {
      lastError = err;

      // Don't retry client errors
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }

      // Timeout
      if (err.name === 'AbortError') {
        lastError = new ApiError('Request timed out. Please try again.', 0);
      }

      // Network error — check if we went offline
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        lastError = new ApiError('Network error. Check your connection.', 0);
      }
    }
  }

  throw lastError || new ApiError('Request failed after retries', 0);
}

// ─── API Methods ─────────────────────────────────────────

export const api = {
  // Places (cached from static bundle)
  async getPlaces() {
    return request('/places');
  },

  // Saves
  async getSaves() {
    const deviceId = getDeviceId();
    return request(`/saves/${deviceId}`);
  },

  async savePlace(placeId) {
    return request('/saves', {
      method: 'POST',
      body: JSON.stringify({ deviceId: getDeviceId(), placeId }),
    });
  },

  async unsavePlace(placeId) {
    const deviceId = getDeviceId();
    return request(`/saves/${deviceId}/${placeId}`, { method: 'DELETE' });
  },

  // Activity
  async getNearbyActivity(lat, lng) {
    return request(`/nearby-activity?lat=${lat}&lng=${lng}`);
  },

  // Groups
  async getGroups(lat, lng) {
    const params = lat && lng ? `?lat=${lat}&lng=${lng}` : '';
    return request(`/groups${params}`);
  },

  async getGroup(id) {
    return request(`/groups/${id}`);
  },

  async createGroup(data) {
    return request('/groups', {
      method: 'POST',
      body: JSON.stringify({ ...data, creatorDeviceId: getDeviceId() }),
    });
  },

  async joinGroup(groupId) {
    return request(`/groups/${groupId}/join`, {
      method: 'POST',
      body: JSON.stringify({ deviceId: getDeviceId() }),
    });
  },

  async getGroupPosts(groupId) {
    return request(`/groups/${groupId}/posts`);
  },

  async createGroupPost(groupId, text) {
    return request(`/groups/${groupId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ deviceId: getDeviceId(), text }),
    });
  },

  // Profile
  async getProfile() {
    const deviceId = getDeviceId();
    return request(`/profile/${deviceId}`);
  },

  async updateProfile(data) {
    return request('/profile', {
      method: 'POST',
      body: JSON.stringify({ ...data, deviceId: getDeviceId() }),
    });
  },

  // Chat (longer timeout)
  async chat(message, lat, lng) {
    return request('/chat', {
      method: 'POST',
      body: JSON.stringify({
        deviceId: getDeviceId(),
        message,
        lat,
        lng,
      }),
    }, CHAT_TIMEOUT_MS);
  },

  // Health
  async health() {
    return request('/health');
  },
};

export { ApiError };
export default api;
