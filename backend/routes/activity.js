/**
 * activity.js — Nearby activity events (live pings simulation)
 */

import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /nearby-activity?lat=&lng= — recent activity near location
router.get('/', (req, res) => {
  // For demo, return recent activity events (last 2 hours)
  // In production, would filter by lat/lng radius
  const rows = db.prepare(`
    SELECT id, device_id, place_id, created_at
    FROM activity_events
    WHERE created_at > datetime('now', '-2 hours')
    ORDER BY created_at DESC
    LIMIT 20
  `).all();
  res.json(rows);
});

// POST /activity — create activity event (for seeding/demo)
router.post('/', (req, res) => {
  const { deviceId, placeId, lat, lng } = req.body;
  if (!deviceId || !placeId) {
    return res.status(400).json({ error: 'deviceId and placeId required' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO activity_events (device_id, place_id, lat, lng) VALUES (?, ?, ?, ?)'
    ).run(deviceId, placeId, lat || null, lng || null);
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
