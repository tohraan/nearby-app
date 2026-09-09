/**
 * groups.js — Hangout Groups CRUD, join, and posts
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();

// GET /groups?lat=&lng= — list groups (all for now, could filter by proximity)
router.get('/', (req, res) => {
  const groups = db.prepare(`
    SELECT g.*, COUNT(gm.device_id) as member_count
    FROM groups g
    LEFT JOIN group_members gm ON g.id = gm.group_id
    GROUP BY g.id
    ORDER BY g.created_at DESC
    LIMIT 50
  `).all();
  res.json(groups);
});

// GET /groups/:id — single group detail
router.get('/:id', (req, res) => {
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const members = db.prepare(
    'SELECT device_id, display_name, joined_at FROM group_members WHERE group_id = ?'
  ).all(req.params.id);

  res.json({ ...group, members });
});

// POST /groups — create a new group
router.post('/', (req, res) => {
  const { name, placeId, creatorDeviceId, description, startsAt, category, activityType, lat, lng, maxPeople, cost, image } = req.body;
  if (!name || !creatorDeviceId) {
    return res.status(400).json({ error: 'name and creatorDeviceId required' });
  }

  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO groups (id, name, place_id, creator_device_id, description, starts_at, category, activity_type, lat, lng, max_people, cost, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, placeId || null, creatorDeviceId, description || '', startsAt || null, category || 'outdoor', activityType || '', lat || null, lng || null, maxPeople || 0, cost || 0, image || '');

    // Auto-join creator
    const profile = db.prepare('SELECT display_name FROM user_profiles WHERE device_id = ?').get(creatorDeviceId);
    db.prepare(
      'INSERT INTO group_members (group_id, device_id, display_name) VALUES (?, ?, ?)'
    ).run(id, creatorDeviceId, profile?.display_name || 'Anonymous');

    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /groups/:id/join — join a group
router.post('/:id/join', (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' });

  try {
    const profile = db.prepare('SELECT display_name FROM user_profiles WHERE device_id = ?').get(deviceId);
    db.prepare(
      'INSERT OR IGNORE INTO group_members (group_id, device_id, display_name) VALUES (?, ?, ?)'
    ).run(req.params.id, deviceId, profile?.display_name || 'Anonymous');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /groups/:id/posts — list group posts
router.get('/:id/posts', (req, res) => {
  const posts = db.prepare(`
    SELECT gp.*, up.display_name
    FROM group_posts gp
    LEFT JOIN user_profiles up ON gp.device_id = up.device_id
    WHERE gp.group_id = ?
    ORDER BY gp.created_at ASC
    LIMIT 100
  `).all(req.params.id);
  res.json(posts);
});

// POST /groups/:id/posts — create a post in a group
router.post('/:id/posts', (req, res) => {
  const { deviceId, text } = req.body;
  if (!deviceId || !text) {
    return res.status(400).json({ error: 'deviceId and text required' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO group_posts (group_id, device_id, text) VALUES (?, ?, ?)'
    ).run(req.params.id, deviceId, text);
    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
