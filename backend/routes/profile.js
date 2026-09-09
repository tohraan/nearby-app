/**
 * profile.js — User profile (contextual, not accounts)
 */

import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /profile/:deviceId — get profile
router.get('/:deviceId', (req, res) => {
  const profile = db.prepare(
    'SELECT * FROM user_profiles WHERE device_id = ?'
  ).get(req.params.deviceId);
  res.json(profile || null);
});

// POST /profile — upsert profile
router.post('/', (req, res) => {
  const { deviceId, displayName, interests, area } = req.body;
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' });

  try {
    db.prepare(`
      INSERT INTO user_profiles (device_id, display_name, interests, area)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(device_id) DO UPDATE SET
        display_name = COALESCE(excluded.display_name, user_profiles.display_name),
        interests = COALESCE(excluded.interests, user_profiles.interests),
        area = COALESCE(excluded.area, user_profiles.area)
    `).run(
      deviceId,
      displayName || '',
      JSON.stringify(interests || []),
      area || ''
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
