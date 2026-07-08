require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const migrationDir = path.join(__dirname, 'migrations');
const sqlitePath = path.join(__dirname, 'database.db');
let pool;
let sqliteDb;
let initialized = false;

function hasMysqlConfig() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!pool) {
    if (!hasMysqlConfig()) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    let dbUrlStr = process.env.DATABASE_URL.trim();
    if (dbUrlStr.startsWith('DATABASE_URL=')) {
      dbUrlStr = dbUrlStr.substring('DATABASE_URL='.length).trim();
    }
    if ((dbUrlStr.startsWith('"') && dbUrlStr.endsWith('"')) || (dbUrlStr.startsWith("'") && dbUrlStr.endsWith("'"))) {
      dbUrlStr = dbUrlStr.substring(1, dbUrlStr.length - 1).trim();
    }

    const databaseUrl = new URL(dbUrlStr);
    const sslMode = databaseUrl.searchParams.get('ssl-mode') || databaseUrl.searchParams.get('sslmode');
    const sslEnabled = process.env.DATABASE_SSL === 'true' || /^(required|require|verify_ca|verify_identity)$/i.test(sslMode || '');

    pool = mysql.createPool({
      uri: dbUrlStr,
      connectionLimit: 5,
      timezone: 'Z',
      ssl: { rejectUnauthorized: false }
    });
  }

  return pool;
}

function getSqliteDb() {
  if (!sqliteDb) {
    // Ensure the SQLite file exists; if not, it will be created automatically by DatabaseSync
    const { DatabaseSync } = require('node:sqlite');
    sqliteDb = new DatabaseSync(sqlitePath);
  }

  return sqliteDb;
}

function normalizeQueryText(text) {
  return text.replace(/\$\d+/g, '?');
}

function normalizeSqliteValue(value) {
  return typeof value === 'bigint' ? Number(value) : value;
}

function normalizeSqliteRows(rows) {
  return rows.map(row => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, normalizeSqliteValue(value)])
  ));
}

async function query(text, params = []) {
  if (!hasMysqlConfig()) {
    try {
      const statement = getSqliteDb().prepare(normalizeQueryText(text));
      const isSelect = /^\s*select\b/i.test(text);

      if (isSelect) {
        const rows = normalizeSqliteRows(statement.all(...params));
        return { rows, rowCount: rows.length };
      }

      const result = statement.run(...params);
      return {
        rows: [],
        rowCount: result.changes,
        insertId: normalizeSqliteValue(result.lastInsertRowid),
        affectedRows: result.changes
      };
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  try {
    const connection = await getPool().getConnection();
    try {
      const mysqlText = normalizeQueryText(text);
      const [result] = await connection.query(mysqlText, params);
      const rows = Array.isArray(result) ? result : [];

      return {
        rows,
        rowCount: Array.isArray(result) ? result.length : result.affectedRows,
        insertId: Array.isArray(result) ? undefined : result.insertId,
        affectedRows: Array.isArray(result) ? undefined : result.affectedRows
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
}

async function ensureSchema() {
  if (initialized) return;

  // SQLite fallback – run migrations directly when no MySQL config
  if (!hasMysqlConfig()) {
    // Ensure DB file exists
    getSqliteDb();
    try {
      const migrationFiles = fs.readdirSync(migrationDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
      for (const file of migrationFiles) {
        const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
        const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
        for (const stmt of statements) {
          try {
            sqliteDb.exec(stmt);
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('SQLite migration ignored error:', e.message);
            }
          }
        }
      }
      initialized = true;
    } catch (e) {
      console.warn('SQLite migration failed:', e.message);
    }
    return;
  }

  try {
    const connection = await getPool().getConnection();
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          name VARCHAR(255) PRIMARY KEY
        )
      `);

      const files = fs.readdirSync(migrationDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of files) {
        const [existingRows] = await connection.query('SELECT 1 FROM schema_migrations WHERE name = ?', [file]);
        if (existingRows.length > 0) continue;

        const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
        const statements = sql.split(/;\s*\n/).map(statement => statement.trim()).filter(Boolean);

        for (const statement of statements) {
          await connection.query(statement);
        }

        await connection.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      }

      initialized = true;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Database initialization skipped:', error.message);
    }
  }
}

async function seedDatabase() {
  await ensureSchema();
}

module.exports = {
  query,
  ensureSchema,
  seedDatabase,
  getPool
};
