/**
 * saves.js — Save/unsave places for a device
 */

import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /saves/:deviceId — list saved place IDs
router.get('/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const rows = db.prepare(
    'SELECT place_id, saved_at FROM saves WHERE device_id = ? ORDER BY saved_at DESC'
  ).all(deviceId);
  res.json(rows);
});

// POST /saves — save a place
router.post('/', (req, res) => {
  const { deviceId, placeId } = req.body;
  if (!deviceId || !placeId) {
    return res.status(400).json({ error: 'deviceId and placeId required' });
  }

  try {
    db.prepare(
      'INSERT OR IGNORE INTO saves (device_id, place_id) VALUES (?, ?)'
    ).run(deviceId, placeId);

    // Also create an activity event (someone saved a place — this powers the live feed)
    db.prepare(
      'INSERT INTO activity_events (device_id, place_id) VALUES (?, ?)'
    ).run(deviceId.substring(0, 8) + '***', placeId); // Anonymize device ID

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /saves/:deviceId/:placeId — unsave
router.delete('/:deviceId/:placeId', (req, res) => {
  const { deviceId, placeId } = req.params;
  db.prepare(
    'DELETE FROM saves WHERE device_id = ? AND place_id = ?'
  ).run(deviceId, placeId);
  res.json({ ok: true });
});

export default router;
