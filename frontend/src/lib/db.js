/**
 * db.js — IndexedDB wrapper for offline persistence
 * Uses 'idb' library for ergonomic IndexedDB access
 */

import { openDB } from 'idb';

const DB_NAME = 'nearby-app';
const DB_VERSION = 2;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Cached places from bundle
        if (!db.objectStoreNames.contains('places')) {
          const placeStore = db.createObjectStore('places', { keyPath: 'id' });
          placeStore.createIndex('category', 'category');
          placeStore.createIndex('city', 'city');
        }

        // Saved place IDs
        if (!db.objectStoreNames.contains('saves')) {
          db.createObjectStore('saves', { keyPath: 'placeId' });
        }

        // Visited place IDs (Trail Marker)
        if (!db.objectStoreNames.contains('visited')) {
          db.createObjectStore('visited', { keyPath: 'placeId' });
        }

        // User profile
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'key' });
        }

        // Offline action queue
        if (!db.objectStoreNames.contains('offlineQueue')) {
          db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

// ─── Places ─────────────────────────────────────────────

export async function cachePlaces(places) {
  const db = await getDB();
  const tx = db.transaction('places', 'readwrite');
  for (const place of places) {
    tx.store.put(place);
  }
  await tx.done;
}

export async function getCachedPlaces() {
  const db = await getDB();
  return db.getAll('places');
}

export async function getCachedPlaceById(id) {
  const db = await getDB();
  return db.get('places', id);
}

export async function getPlacesCount() {
  const db = await getDB();
  return db.count('places');
}

// ─── Saves ──────────────────────────────────────────────

export async function getSavedPlaceIds() {
  const db = await getDB();
  const saves = await db.getAll('saves');
  return saves.map(s => s.placeId);
}

export async function savePlaceLocally(placeId) {
  const db = await getDB();
  await db.put('saves', { placeId, savedAt: new Date().toISOString() });
}

export async function unsavePlaceLocally(placeId) {
  const db = await getDB();
  await db.delete('saves', placeId);
}

export async function isPlaceSaved(placeId) {
  const db = await getDB();
  const save = await db.get('saves', placeId);
  return !!save;
}

// ─── Visited (Trail) ────────────────────────────────────

export async function getVisitedPlaceIds() {
  const db = await getDB();
  const visited = await db.getAll('visited');
  return visited.map(v => v.placeId);
}

export async function addVisitedPlaceLocally(placeId) {
  const db = await getDB();
  await db.put('visited', { placeId, visitedAt: new Date().toISOString() });
}

export async function removeVisitedPlaceLocally(placeId) {
  const db = await getDB();
  await db.delete('visited', placeId);
}

export async function isPlaceVisited(placeId) {
  const db = await getDB();
  const visited = await db.get('visited', placeId);
  return !!visited;
}

// ─── Profile ────────────────────────────────────────────

export async function getLocalProfile() {
  const db = await getDB();
  return db.get('profile', 'user');
}

export async function saveLocalProfile(profile) {
  const db = await getDB();
  await db.put('profile', { key: 'user', ...profile });
}

// ─── Offline Queue ──────────────────────────────────────

export async function enqueueOfflineAction(action) {
  const db = await getDB();
  await db.add('offlineQueue', {
    ...action,
    timestamp: new Date().toISOString(),
  });
}

export async function getOfflineQueue() {
  const db = await getDB();
  return db.getAll('offlineQueue');
}

export async function clearOfflineQueue() {
  const db = await getDB();
  const tx = db.transaction('offlineQueue', 'readwrite');
  await tx.store.clear();
  await tx.done;
}

export async function removeFromQueue(id) {
  const db = await getDB();
  await db.delete('offlineQueue', id);
}

export default {
  cachePlaces,
  getCachedPlaces,
  getCachedPlaceById,
  getPlacesCount,
  getSavedPlaceIds,
  savePlaceLocally,
  unsavePlaceLocally,
  isPlaceSaved,
  getVisitedPlaceIds,
  addVisitedPlaceLocally,
  removeVisitedPlaceLocally,
  isPlaceVisited,
  getLocalProfile,
  saveLocalProfile,
  enqueueOfflineAction,
  getOfflineQueue,
  clearOfflineQueue,
  removeFromQueue,
};
