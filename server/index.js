// Forge backend: persistent accounts, login sessions, and signup email verification.
// Also serves the frontend itself (index.html, app.js, ...) so the whole app runs from
// one process — no CORS setup needed, `/api/...` and the static files share an origin.
//
// Setup:
//   cd server
//   npm install
//   copy .env.example to .env and fill it in (see comments in that file)
//   npm start
// Then open http://localhost:8788 (or whatever PORT you set).

require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./mailer');

const PORT = process.env.PORT || 8788;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const NODE_ENV = process.env.NODE_ENV || 'development';

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  JWT_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn('[server] JWT_SECRET is not set in .env — using a random one for this run. Everyone gets signed out on restart. Set JWT_SECRET in server/.env to keep sessions stable.');
}

const SESSION_COOKIE = 'forge_session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days: sign in once, stay in.

const app = express();
// Default 100kb body limit is too small once account data (workout history, reports, ...)
// syncs through here — see /api/data/bulk below.
app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());

// The exact set of account-data categories the client is allowed to sync (see the matching
// SYNCED_ACCOUNT_KEYS/SYNCED_GLOBAL_KEYS lists in app.js). Anything else is silently dropped
// rather than accepted, so a compromised or buggy client can't stuff arbitrary rows in.
const ALLOWED_DATA_KEYS = new Set([
  'avatar', 'badges', 'calendar', 'coach', 'coach-usage', 'friends', 'goals', 'prs', 'reports', 'requests', 'workouts',
  'billing', 'premium', 'subscription', 'theme', 'language', 'tracking', 'nutrition-goal', 'reminders', 'reminder-settings', 'last-invite',
]);
const MAX_DATA_VALUE_LENGTH = 2 * 1024 * 1024; // 2MB per key — generous for workout/report history, blocks abuse

// ---- tiny in-memory rate limiter (same pattern as coach-server-example.js's quota map) ----
const attempts = new Map();
function tooManyAttempts(key, limit, windowMs) {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.start > windowMs) {
    attempts.set(key, { start: now, count: 1 });
    return false;
  }
  record.count += 1;
  return record.count > limit;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function publicUser(user) {
  return { id: user.id, email: user.email, verified: user.verified, profile: user.profile };
}

function signSession(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' });
}

function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_MS,
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: 'Not signed in.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Not signed in.' });
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

async function issueVerificationEmail(user) {
  const token = crypto.randomBytes(32).toString('hex');
  await db.updateUser(user.id, {
    verificationTokenHash: hashToken(token),
    verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
  });
  const verifyUrl = `${PUBLIC_BASE_URL}/api/auth/verify?token=${token}&email=${encodeURIComponent(user.email)}`;
  await sendVerificationEmail({ to: user.email, name: user.profile.name, verifyUrl });
}

async function issuePasswordReset(user) {
  const token = crypto.randomBytes(32).toString('hex');
  await db.updateUser(user.id, {
    resetTokenHash: hashToken(token),
    // Shorter-lived than the email-verification link (24h) since a leaked reset link
    // hands over the account outright, not just an unverified-email nag.
    resetTokenExpires: Date.now() + 60 * 60 * 1000,
  });
  // Points at the app itself (not a server API route) with the token in the query string,
  // so the frontend can show a "choose a new password" form — see handlePasswordResetRedirect
  // in app.js. Mirrors how the verify link instead hits a server route directly, since that
  // one doesn't need to collect any input first.
  const resetUrl = `${PUBLIC_BASE_URL}/?reset=${token}&email=${encodeURIComponent(user.email)}`;
  await sendPasswordResetEmail({ to: user.email, name: user.profile.name, resetUrl });
}

app.post('/api/auth/signup', async (req, res) => {
  console.log('[server] Received a signup request.');
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!isValidEmail(email)) {
      console.log(`[server] Signup rejected: "${email}" failed email validation.`);
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (password.length < 6) {
      console.log('[server] Signup rejected: password too short.');
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (db.findByEmail(email)) {
      console.log(`[server] Signup rejected: ${email} already has an account.`);
      return res.status(409).json({ error: 'That email already has an account. Sign in instead.' });
    }

    const profile = {
      name: String(req.body.name || '').trim() || 'Athlete',
      height: Number(req.body.height) || 178,
      weight: Number(req.body.weight) || 76,
      gender: req.body.gender || 'Other',
      focus: req.body.focus || 'Strength',
      target: Number(req.body.target) || 4,
      joined: new Date().toISOString(),
    };

    const user = {
      id: crypto.randomUUID(),
      email,
      passwordHash: await bcrypt.hash(password, 10),
      verified: false,
      verificationTokenHash: null,
      verificationTokenExpires: null,
      profile,
      createdAt: new Date().toISOString(),
    };
    await db.insertUser(user);
    console.log(`[server] New account created: ${email}. Sending verification email...`);

    // Don't make the new account wait on email delivery — sign them in immediately and
    // let verification happen in the background.
    issueVerificationEmail(user)
      .then(() => console.log(`[server] Verification email sent to ${email}.`))
      .catch((error) => console.error(`[server] Failed to send verification email to ${email}:`, error));

    setSessionCookie(res, signSession(user));
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not create the account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (tooManyAttempts(`login:${req.ip}:${email}`, 8, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  }

  const user = db.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'No matching account. Check your details or create one.' });
  }

  setSessionCookie(res, signSession(user));
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (tooManyAttempts(`forgot:${req.ip}:${email}`, 4, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  }

  const user = email ? db.findByEmail(email) : null;
  if (user) {
    issuePasswordReset(user).catch((error) => console.error(`[server] Failed to send password reset email to ${email}:`, error));
  }
  // Same response whether or not the account exists — otherwise this endpoint becomes a way
  // to check which emails have accounts.
  res.json({ ok: true });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');

  if (tooManyAttempts(`reset:${req.ip}`, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const user = email ? db.findByEmail(email) : null;
  const valid = user && token
    && user.resetTokenHash === hashToken(token)
    && user.resetTokenExpires
    && user.resetTokenExpires > Date.now();
  if (!valid) return res.status(400).json({ error: 'That reset link is invalid or has expired.' });

  const updated = await db.updateUser(user.id, {
    passwordHash: await bcrypt.hash(password, 10),
    resetTokenHash: null,
    resetTokenExpires: null,
  });

  // A successful reset is as good as a login — sign them straight in rather than making
  // them turn around and log in again with the password they just set.
  setSessionCookie(res, signSession(updated));
  res.json({ user: publicUser(updated) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.put('/api/auth/profile', requireAuth, async (req, res) => {
  const allowed = ['name', 'height', 'weight', 'gender', 'focus', 'target'];
  const updates = {};
  allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
  const updated = await db.updateUser(req.user.id, { profile: { ...req.user.profile, ...updates } });
  res.json({ user: publicUser(updated) });
});

app.post('/api/auth/resend-verification', requireAuth, async (req, res) => {
  if (req.user.verified) return res.json({ ok: true, alreadyVerified: true });
  if (tooManyAttempts(`resend:${req.user.id}`, 3, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Please wait a few minutes before requesting another email.' });
  }
  try {
    await issueVerificationEmail(req.user);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not send the verification email.' });
  }
});

// ---- Account data (workouts, goals, calendar, coach history, theme, ...) ----
// Generic key/value sync so the client's existing localStorage-shaped data can round-trip
// through the account without a bespoke endpoint per data type. See app.js's
// hydrateFromServer()/queueServerSync() for the client side of this.

app.get('/api/data', requireAuth, (req, res) => {
  res.json({ values: db.getUserData(req.user.id) });
});

app.put('/api/data/bulk', requireAuth, (req, res) => {
  if (tooManyAttempts(`data-sync:${req.user.id}`, 60, 60 * 1000)) {
    return res.status(429).json({ error: 'Too many updates — slow down.' });
  }
  const incoming = req.body && req.body.values;
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return res.status(400).json({ error: 'Missing values.' });
  }

  const values = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (!ALLOWED_DATA_KEYS.has(key)) continue;
    if (value === null) { values[key] = null; continue; }
    const stringValue = String(value);
    if (stringValue.length > MAX_DATA_VALUE_LENGTH) {
      return res.status(413).json({ error: `"${key}" is too large to save.` });
    }
    values[key] = stringValue;
  }

  db.setUserDataBulk(req.user.id, values);
  res.json({ ok: true });
});

app.get('/api/auth/verify', async (req, res) => {
  const { token, email } = req.query;
  const user = email ? db.findByEmail(String(email)) : null;
  const valid = user && token
    && user.verificationTokenHash === hashToken(String(token))
    && user.verificationTokenExpires
    && user.verificationTokenExpires > Date.now();

  if (!valid) return res.redirect('/?verify=expired');

  await db.updateUser(user.id, { verified: true, verificationTokenHash: null, verificationTokenExpires: null });
  res.redirect('/?verify=success');
});

// Static site (index.html, app.js, styles.css, manifest.json, logo.svg, preview.html)
// lives one directory up from server/. That directory also contains server/ itself, so
// block that prefix first — otherwise express.static would happily serve our own source
// files and, worse, server/data/users.json (password hashes, verification tokens) to
// anyone who requests it.
app.use('/server', (req, res) => res.status(404).end());
app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, () => console.log(`Forge server listening on ${PUBLIC_BASE_URL}`));
