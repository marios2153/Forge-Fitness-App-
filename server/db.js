// Accounts, and all per-account app data (workouts, goals, calendar, coach history, etc.),
// persist in a SQLite database on disk instead of the browser's localStorage, so they
// survive a page reload, a new browser, or a different device — the whole point of having
// a server-backed account.
const fs = require('fs');
const path = require('path');
// Node's own SQLite binding (stable since Node 22.5) — no native module to compile, so it
// works out of the box on any Node version that has it, unlike better-sqlite3.
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'forge.db');
const LEGACY_USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0,
    verification_token_hash TEXT,
    verification_token_expires INTEGER,
    reset_token_hash TEXT,
    reset_token_expires INTEGER,
    profile TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_data (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, key)
  );
`);

// Adds reset_token_hash/reset_token_expires to a users table created before password reset
// existed (CREATE TABLE IF NOT EXISTS above only applies to brand-new databases). Safe to
// run every startup — it's a no-op once the columns exist.
(function addResetTokenColumnsIfMissing() {
  const columns = db.prepare('PRAGMA table_info(users)').all().map((column) => column.name);
  if (!columns.includes('reset_token_hash')) db.exec('ALTER TABLE users ADD COLUMN reset_token_hash TEXT');
  if (!columns.includes('reset_token_expires')) db.exec('ALTER TABLE users ADD COLUMN reset_token_expires INTEGER');
}());

// One-time migration from the old JSON-file store this server used before SQLite. Only
// runs while the users table is still empty, so it can never clobber real SQLite data —
// safe to leave in place even long after everyone's migrated.
(function migrateLegacyUsersFile() {
  if (!fs.existsSync(LEGACY_USERS_FILE)) return;
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (count > 0) return;

  let legacyUsers;
  try {
    legacyUsers = JSON.parse(fs.readFileSync(LEGACY_USERS_FILE, 'utf8'));
  } catch (error) {
    console.error('[db] Could not read legacy users.json for migration:', error);
    return;
  }
  if (!Array.isArray(legacyUsers) || !legacyUsers.length) return;

  const insert = db.prepare(`
    INSERT INTO users (id, email, password_hash, verified, verification_token_hash, verification_token_expires, profile, created_at)
    VALUES (@id, @email, @passwordHash, @verified, @verificationTokenHash, @verificationTokenExpires, @profile, @createdAt)
  `);
  db.exec('BEGIN');
  try {
    legacyUsers.forEach((user) => insert.run({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      verified: user.verified ? 1 : 0,
      verificationTokenHash: user.verificationTokenHash || null,
      verificationTokenExpires: user.verificationTokenExpires || null,
      profile: JSON.stringify(user.profile || {}),
      createdAt: user.createdAt || new Date().toISOString(),
    }));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  fs.renameSync(LEGACY_USERS_FILE, `${LEGACY_USERS_FILE}.migrated`);
  console.log(`[db] Migrated ${legacyUsers.length} account(s) from users.json into SQLite.`);
}());

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    verified: !!row.verified,
    verificationTokenHash: row.verification_token_hash,
    verificationTokenExpires: row.verification_token_expires,
    resetTokenHash: row.reset_token_hash,
    resetTokenExpires: row.reset_token_expires,
    profile: JSON.parse(row.profile),
    createdAt: row.created_at,
  };
}

const statements = {
  findByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  findById: db.prepare('SELECT * FROM users WHERE id = ?'),
  insertUser: db.prepare(`
    INSERT INTO users (id, email, password_hash, verified, verification_token_hash, verification_token_expires, profile, created_at)
    VALUES (@id, @email, @passwordHash, @verified, @verificationTokenHash, @verificationTokenExpires, @profile, @createdAt)
  `),
  updateUser: db.prepare(`
    UPDATE users SET email = @email, password_hash = @passwordHash, verified = @verified,
      verification_token_hash = @verificationTokenHash, verification_token_expires = @verificationTokenExpires,
      reset_token_hash = @resetTokenHash, reset_token_expires = @resetTokenExpires, profile = @profile
    WHERE id = @id
  `),
  getUserData: db.prepare('SELECT key, value FROM user_data WHERE user_id = ?'),
  upsertUserData: db.prepare(`
    INSERT INTO user_data (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `),
  deleteUserData: db.prepare('DELETE FROM user_data WHERE user_id = ? AND key = ?'),
};

function findByEmail(email) {
  return rowToUser(statements.findByEmail.get(String(email).toLowerCase()));
}

function findById(id) {
  return rowToUser(statements.findById.get(id));
}

async function insertUser(user) {
  statements.insertUser.run({
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    verified: user.verified ? 1 : 0,
    verificationTokenHash: user.verificationTokenHash || null,
    verificationTokenExpires: user.verificationTokenExpires || null,
    profile: JSON.stringify(user.profile),
    createdAt: user.createdAt,
  });
  return user;
}

async function updateUser(id, changes) {
  const existing = findById(id);
  if (!existing) return null;
  const merged = { ...existing, ...changes };
  statements.updateUser.run({
    id,
    email: merged.email,
    passwordHash: merged.passwordHash,
    verified: merged.verified ? 1 : 0,
    verificationTokenHash: merged.verificationTokenHash || null,
    verificationTokenExpires: merged.verificationTokenExpires || null,
    resetTokenHash: merged.resetTokenHash || null,
    resetTokenExpires: merged.resetTokenExpires || null,
    profile: JSON.stringify(merged.profile),
  });
  return findById(id);
}

// ---- Per-account app data (workouts, goals, calendar, coach history, theme, ...) ----
// Stored as an opaque key -> string blob per user, mirroring exactly what the client used
// to keep in localStorage. Keeping it generic (rather than one table per data type) means
// new client-side data categories don't need a server migration to start persisting.

function getUserData(userId) {
  const result = {};
  statements.getUserData.all(userId).forEach((row) => { result[row.key] = row.value; });
  return result;
}

function setUserDataBulk(userId, values) {
  const now = new Date().toISOString();
  db.exec('BEGIN');
  try {
    Object.entries(values).forEach(([key, value]) => {
      if (value === null) statements.deleteUserData.run(userId, key);
      else statements.upsertUserData.run(userId, key, value, now);
    });
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

module.exports = { findByEmail, findById, insertUser, updateUser, getUserData, setUserDataBulk };
