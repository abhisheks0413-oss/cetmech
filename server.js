require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('./db');
// Runtime check for required environment variables
if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
  console.warn('⚠️ Missing ADMIN_USERNAME, ADMIN_PASSWORD, or JWT_SECRET environment variables. Admin login may fail.');
}
const app = express();
app.get('/api/test', (req, res) => {
    res.json({ success: true });
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

function normalizeLinks(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

function normalizeTemplateData(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }
  return null;
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookies = Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map(part => part.trim())
      .filter(Boolean)
      .map(cookie => {
        const index = cookie.indexOf('=');
        if (index === -1) return null;
        return [cookie.slice(0, index), cookie.slice(index + 1)];
      })
      .filter(Boolean)
  );
  const sessionToken = token || cookies.admin_token;

  if (!sessionToken) {
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }

  try {
    const payload = jwt.verify(sessionToken, process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-jwt-secret-change-me');
    req.admin = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    db.ensureSchema().catch(() => {}).then(() => next());
    return;
  }
  next();
});

// Serve all static frontend files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/notices', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notices ORDER BY id DESC');
    const notices = result.rows.map(row => ({
      ...row,
      links: normalizeLinks(row.links),
      template_data: normalizeTemplateData(row.template_data)
    }));
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notices/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notices WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Notice not found' });

    res.json({
      ...row,
      links: normalizeLinks(row.links),
      template_data: normalizeTemplateData(row.template_data)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM events ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/academics/link', async (req, res) => {
  const { type, scheme, semester } = req.query;
  if (!type || !scheme || !semester) {
    return res.status(400).json({ error: 'Missing parameters: type, scheme, and semester are required' });
  }

  try {
    const result = await db.query('SELECT drive_link FROM academics WHERE type = $1 AND scheme = $2 AND semester = $3', [String(type).toLowerCase(), String(scheme), String(semester)]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Google Drive configuration not found' });
    if (!row.drive_link) return res.status(404).json({ error: 'Google Drive link not configured yet for this selection' });
    res.json({ drive_link: row.drive_link });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const envUser = process.env.ADMIN_USERNAME || 'admin';
  const envPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === envUser && password === envPass) {
    const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-jwt-secret-change-me', { expiresIn: '24h' });
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    return res.json({ success: true, message: 'Logged in successfully' });
  }

  res.status(401).json({ error: 'Invalid username or password' });
});

app.post('/api/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', `admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/admin/check', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookies = Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map(part => part.trim())
      .filter(Boolean)
      .map(cookie => {
        const index = cookie.indexOf('=');
        if (index === -1) return null;
        return [cookie.slice(0, index), cookie.slice(index + 1)];
      })
      .filter(Boolean)
  );
  const sessionToken = token || cookies.admin_token;

  if (!sessionToken) return res.json({ authenticated: false });

  try {
    jwt.verify(sessionToken, process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-jwt-secret-change-me');
    res.json({ authenticated: true });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

app.get('/api/admin/summary', requireAdmin, async (req, res) => {
  try {
    const noticesResult = await db.query('SELECT COUNT(*) AS count FROM notices');
    const eventsResult = await db.query('SELECT COUNT(*) AS count FROM events');
    const academicsResult = await db.query("SELECT COUNT(*) AS count FROM academics WHERE drive_link <> ''");

    res.json({
      noticesCount: noticesResult.rows[0].count,
      eventsCount: eventsResult.rows[0].count,
      customAcademicsCount: academicsResult.rows[0].count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/notices', requireAdmin, async (req, res) => {
  const { title, type, semester, description, date, links, image, template_data } = req.body;

  if (!title || !type || !description || !date) {
    return res.status(400).json({ error: 'Title, type, description, and date are required' });
  }

  const needsSemester = ['result', 'series_exam', 'toppers'].includes(type);
  if (needsSemester && !semester) {
    return res.status(400).json({ error: 'Semester is required for this template type' });
  }

  try {
    const duplicateResult = await db.query('SELECT id FROM notices WHERE title = $1', [title]);
    if (duplicateResult.rowCount > 0) {
      return res.status(400).json({ error: 'A notice with this title already exists' });
    }

    const insertResult = await db.query(
      'INSERT INTO notices (title, type, semester, description, date, links, image, template_data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [title, type, semester || '', description, date, JSON.stringify(normalizeLinks(links)), image || null, JSON.stringify(normalizeTemplateData(template_data))]
    );

    res.status(201).json({ id: insertResult.insertId, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/notices/:id', requireAdmin, async (req, res) => {
  const { title, type, semester, description, date, links, image, template_data } = req.body;

  if (!title || !type || !description || !date) {
    return res.status(400).json({ error: 'Title, type, description, and date are required' });
  }

  const needsSemester = ['result', 'series_exam', 'toppers'].includes(type);
  if (needsSemester && !semester) {
    return res.status(400).json({ error: 'Semester is required for this template type' });
  }

  try {
    const duplicateResult = await db.query('SELECT id FROM notices WHERE title = $1 AND id != $2', [title, req.params.id]);
    if (duplicateResult.rowCount > 0) {
      return res.status(400).json({ error: 'Another notice with this title already exists' });
    }

    let imageValue = image;
    if (image === undefined) {
      const existingResult = await db.query('SELECT image FROM notices WHERE id = $1', [req.params.id]);
      imageValue = existingResult.rows[0]?.image ?? null;
    }

    const updateResult = await db.query(
      'UPDATE notices SET title = $1, type = $2, semester = $3, description = $4, date = $5, links = $6, image = $7, template_data = $8 WHERE id = $9',
      [title, type, semester || '', description, date, JSON.stringify(normalizeLinks(links)), imageValue || null, JSON.stringify(normalizeTemplateData(template_data)), req.params.id]
    );

    if (updateResult.rowCount === 0) return res.status(404).json({ error: 'Notice not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/notices/:id', requireAdmin, async (req, res) => {
  try {
    const deleteResult = await db.query('DELETE FROM notices WHERE id = $1', [req.params.id]);
    if (deleteResult.rowCount === 0) return res.status(404).json({ error: 'Notice not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/events', requireAdmin, async (req, res) => {
  const { title, date, venue, description, poster_url, registration_link, instagram_link } = req.body;
  if (!title || !date || !venue || !description || !poster_url) {
    return res.status(400).json({ error: 'Title, date, venue, description, and poster image URL are required' });
  }

  try {
    const insertResult = await db.query(
      'INSERT INTO events (title, date, venue, description, poster_url, registration_link, instagram_link) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [title, date, venue, description, poster_url, registration_link || '', instagram_link || '']
    );
    res.status(201).json({ id: insertResult.insertId, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/events/:id', requireAdmin, async (req, res) => {
  const { title, date, venue, description, poster_url, registration_link, instagram_link } = req.body;
  if (!title || !date || !venue || !description || !poster_url) {
    return res.status(400).json({ error: 'Title, date, venue, description, and poster image URL are required' });
  }

  try {
    const updateResult = await db.query(
      'UPDATE events SET title = $1, date = $2, venue = $3, description = $4, poster_url = $5, registration_link = $6, instagram_link = $7 WHERE id = $8',
      [title, date, venue, description, poster_url, registration_link || '', instagram_link || '', req.params.id]
    );
    if (updateResult.rowCount === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/events/:id', requireAdmin, async (req, res) => {
  try {
    const deleteResult = await db.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    if (deleteResult.rowCount === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/academics', requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM academics ORDER BY type, scheme, semester');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/academics/:id', requireAdmin, async (req, res) => {
  const { drive_link } = req.body;
  if (!drive_link) {
    return res.status(400).json({ error: 'Google Drive link is required' });
  }

  try {
    const updateResult = await db.query('UPDATE academics SET drive_link = $1 WHERE id = $2', [drive_link, req.params.id]);
    if (updateResult.rowCount === 0) return res.status(404).json({ error: 'Configuration not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Global error handling – always return JSON
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });

  const cleanPath = req.path === '/' ? 'index.html' : req.path.replace(/^\/+/, '');
  const allowedHtmlFiles = new Set(['index.html', 'about.html', 'academics.html', 'events.html', 'help.html', 'notices.html', 'admin.html']);
  const directFile = path.join(__dirname, 'public', cleanPath);
  const htmlFileName = `${cleanPath}.html`;
  const htmlFile = path.join(__dirname, 'public', htmlFileName);

  if (allowedHtmlFiles.has(cleanPath) && fs.existsSync(directFile) && fs.statSync(directFile).isFile()) {
    return res.sendFile(directFile);
  }

  if (allowedHtmlFiles.has(htmlFileName) && fs.existsSync(htmlFile) && fs.statSync(htmlFile).isFile()) {
    return res.sendFile(htmlFile);
  }

  if (cleanPath.includes('.')) {
    return res.status(404).send('Not found');
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
// The End