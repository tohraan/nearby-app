/**
 * offlineSync.js — Queue writes when offline, sync on reconnect
 *
 * Guardrails:
 * - Debounced sync (won't spam on flaky connections)
 * - Queue dedup (won't re-send identical actions)
 * - Per-action error handling (one failure doesn't block others)
 * - Max queue size (prevents unbounded growth)
 */

import { getOfflineQueue, clearOfflineQueue, removeFromQueue, enqueueOfflineAction } from './db.js';
import { api } from './api.js';

const MAX_QUEUE_SIZE = 100;
let syncing = false;

/**
 * Queue an action for offline sync
 */
export async function queueAction(action) {
  const queue = await getOfflineQueue();

  // Guard: Max queue size
  if (queue.length >= MAX_QUEUE_SIZE) {
    console.warn('⚠️ Offline queue full, dropping oldest action');
    if (queue.length > 0) {
      await removeFromQueue(queue[0].id);
    }
  }

  // Guard: Dedup — don't queue identical actions
  const isDuplicate = queue.some(q =>
    q.type === action.type &&
    q.placeId === action.placeId &&
    q.groupId === action.groupId
  );
  if (isDuplicate) return;

  await enqueueOfflineAction(action);
}

/**
 * Process the offline queue
 */
export async function processQueue() {
  if (syncing || !navigator.onLine) return;
  syncing = true;

  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`📡 Syncing ${queue.length} offline actions...`);

    for (const action of queue) {
      try {
        switch (action.type) {
          case 'save':
            await api.savePlace(action.placeId);
            break;
          case 'unsave':
            await api.unsavePlace(action.placeId);
            break;
          case 'join-group':
            await api.joinGroup(action.groupId);
            break;
          case 'group-post':
            await api.createGroupPost(action.groupId, action.text);
            break;
          default:
            console.warn(`Unknown action type: ${action.type}`);
        }
        await removeFromQueue(action.id);
      } catch (err) {
        // 4xx = client error, remove from queue (won't succeed on retry)
        if (err.status >= 400 && err.status < 500) {
          console.warn(`Dropping failed action (${err.status}):`, action);
          await removeFromQueue(action.id);
        }
        // 5xx or network error — leave in queue for next sync
      }
    }

    console.log('✅ Offline sync complete');
  } finally {
    syncing = false;
  }
}

/**
 * Initialize sync listeners
 */
export function initOfflineSync() {
  // Sync when coming back online
  window.addEventListener('online', () => {
    console.log('🟢 Back online — syncing...');
    setTimeout(processQueue, 1000); // Small delay to let connection stabilize
  });

  // Try syncing on load if online
  if (navigator.onLine) {
    setTimeout(processQueue, 2000);
  }
}

export default { queueAction, processQueue, initOfflineSync };
