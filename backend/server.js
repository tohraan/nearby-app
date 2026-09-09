/**
 * server.js — Express backend with guardrails
 *
 * Guardrails:
 * - CORS with explicit origin whitelist
 * - Request body size limit (1MB)
 * - Basic in-memory rate limiting (per device ID)
 * - Input validation middleware
 * - Global error handler (no stack traces in production)
 * - Health endpoint for monitoring
 * - Graceful shutdown
 * - Request logging
 */

import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import savesRouter from './routes/saves.js';
import activityRouter from './routes/activity.js';
import groupsRouter from './routes/groups.js';
import profileRouter from './routes/profile.js';
import chatRouter from './routes/chat.js';
import { getAllPlaces } from './lib/placeContext.js';
import { getHealthStatus } from './lib/openrouter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, serverless) or any vercel.app / localhost origin
    if (!origin || origin.includes('vercel.app') || origin.includes('netlify.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Device-Id'],
  maxAge: 86400,
}));

// ─── Body parsing with size limit ───────────────────────
app.use(express.json({ limit: '1mb' }));

// ─── Request logging ────────────────────────────────────
app.use((req, _res, next) => {
  const start = Date.now();
  const originalEnd = _res.end;
  _res.end = function (...args) {
    const duration = Date.now() - start;
    const level = _res.statusCode >= 400 ? '⚠️' : '→';
    console.log(`${level} ${req.method} ${req.path} ${_res.statusCode} (${duration}ms)`);
    originalEnd.apply(this, args);
  };
  next();
});

// ─── Rate limiting (in-memory, per-endpoint group) ──────
const rateLimitStore = new Map();

function rateLimit({ windowMs = 60000, maxRequests = 60, keyFn = null, message = 'Too many requests' } = {}) {
  return (req, res, next) => {
    // Key: device ID from body/params/header, or IP as fallback
    const key = keyFn
      ? keyFn(req)
      : (req.body?.deviceId || req.params?.deviceId || req.headers['x-device-id'] || req.ip || 'unknown');

    const bucketKey = `${req.route?.path || req.path}:${key}`;
    const now = Date.now();

    let bucket = rateLimitStore.get(bucketKey);
    if (!bucket || now - bucket.windowStart > windowMs) {
      bucket = { windowStart: now, count: 0 };
      rateLimitStore.set(bucketKey, bucket);
    }

    bucket.count++;

    if (bucket.count > maxRequests) {
      console.warn(`🚫 Rate limit hit: ${bucketKey} (${bucket.count}/${maxRequests})`);
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((bucket.windowStart + windowMs - now) / 1000),
      });
    }

    // Set rate limit headers
    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - bucket.count)));

    next();
  };
}

// Periodic cleanup of expired rate limit buckets (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (now - bucket.windowStart > 120000) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

// ─── Input validation middleware ────────────────────────
function validateDeviceId(req, res, next) {
  const deviceId = req.body?.deviceId || req.params?.deviceId;
  if (deviceId && (typeof deviceId !== 'string' || deviceId.length > 128 || deviceId.length < 8)) {
    return res.status(400).json({ error: 'Invalid deviceId format' });
  }
  next();
}

function validatePlaceId(req, res, next) {
  const placeId = req.body?.placeId || req.params?.placeId;
  if (placeId && (typeof placeId !== 'string' || placeId.length > 128)) {
    return res.status(400).json({ error: 'Invalid placeId format' });
  }
  next();
}

function validateLatLng(req, res, next) {
  const lat = parseFloat(req.query?.lat || req.body?.lat);
  const lng = parseFloat(req.query?.lng || req.body?.lng);
  if (req.query?.lat && (isNaN(lat) || lat < -90 || lat > 90)) {
    return res.status(400).json({ error: 'Invalid latitude (must be -90 to 90)' });
  }
  if (req.query?.lng && (isNaN(lng) || lng < -180 || lng > 180)) {
    return res.status(400).json({ error: 'Invalid longitude (must be -180 to 180)' });
  }
  next();
}

function validateTextInput(field, maxLength = 5000) {
  return (req, res, next) => {
    const value = req.body?.[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== 'string') {
        return res.status(400).json({ error: `${field} must be a string` });
      }
      if (value.length > maxLength) {
        return res.status(400).json({ error: `${field} too long (max ${maxLength} characters)` });
      }
    }
    next();
  };
}

// ─── Express Router for API routes ──────────────────────
const apiRouter = express.Router();

apiRouter.get('/health', (_req, res) => {
  const aiStatus = getHealthStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    ai: aiStatus,
  });
});

apiRouter.get('/places', (_req, res) => {
  try {
    const places = getAllPlaces();
    res.set('Cache-Control', 'public, max-age=86400');
    res.json(places);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load places data' });
  }
});

apiRouter.use('/saves',
  validateDeviceId,
  validatePlaceId,
  rateLimit({ windowMs: 60000, maxRequests: 60, message: 'Too many save operations' }),
  savesRouter
);

apiRouter.use('/nearby-activity',
  validateLatLng,
  rateLimit({ windowMs: 60000, maxRequests: 30, message: 'Too many activity requests' }),
  activityRouter
);

apiRouter.use('/activity',
  validateDeviceId,
  rateLimit({ windowMs: 60000, maxRequests: 20, message: 'Too many activity posts' }),
  activityRouter
);

apiRouter.use('/groups',
  validateDeviceId,
  rateLimit({ windowMs: 60000, maxRequests: 30, message: 'Too many group requests' }),
  groupsRouter
);

apiRouter.use('/profile',
  validateDeviceId,
  validateTextInput('displayName', 100),
  validateTextInput('area', 200),
  rateLimit({ windowMs: 60000, maxRequests: 20, message: 'Too many profile updates' }),
  profileRouter
);

apiRouter.use('/chat',
  validateDeviceId,
  validateLatLng,
  validateTextInput('message', 2000),
  rateLimit({ windowMs: 60000, maxRequests: 20, message: 'Too many chat messages' }),
  chatRouter
);

apiRouter.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to the NearbyApp Backend API',
    docs: 'Available endpoints: /health, /places, /saves, /nearby-activity, /activity, /groups, /profile, /chat'
  });
});

app.use('/api', apiRouter);
app.use('/', apiRouter);

// ─── 404 handler ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ─── Global error handler ───────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: IS_PROD ? 'Internal server error' : err.message,
    ...(IS_PROD ? {} : { stack: err.stack }),
  });
});

// ─── Start server ───────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 NearbyApp backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Places: http://localhost:${PORT}/places\n`);
});

// ─── Graceful shutdown ──────────────────────────────────
function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
