require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key_backup_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Serve static frontend files from the current directory
app.use(express.static(__dirname));

// Auth Middleware helper
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Admin access required' });
  }
}

// ==========================================
// 1. PUBLIC API ROUTES
// ==========================================

// Get all notices
app.get('/api/notices', (req, res) => {
  db.all('SELECT * FROM notices ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Parse links JSON string
    const notices = rows.map(r => ({
      ...r,
      links: JSON.parse(r.links || '[]'),
      template_data: r.template_data ? JSON.parse(r.template_data) : null
    }));
    res.json(notices);
  });
});

// Get single notice
app.get('/api/notices/:id', (req, res) => {
  db.get('SELECT * FROM notices WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    row.links = JSON.parse(row.links || '[]');
    row.template_data = row.template_data ? JSON.parse(row.template_data) : null;
    res.json(row);
  });
});

// Get all events
app.get('/api/events', (req, res) => {
  db.all('SELECT * FROM events ORDER BY date DESC, time DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get Academics Drive link configuration
app.get('/api/academics/link', (req, res) => {
  const { type, scheme, semester } = req.query;
  if (!type || !scheme || !semester) {
    return res.status(400).json({ error: 'Missing parameters: type, scheme, and semester are required' });
  }

  db.get(
    'SELECT drive_link FROM academics WHERE type = ? AND scheme = ? AND semester = ?',
    [type.toLowerCase(), scheme, semester],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Google Drive configuration not found' });
      }
      if (!row.drive_link) {
        return res.status(404).json({ error: 'Google Drive link not configured yet for this selection' });
      }
      res.json({ drive_link: row.drive_link });
    }
  );
});

// ==========================================
// 2. ADMIN AUTHENTICATION API ROUTES
// ==========================================

// Login API
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const envUser = process.env.ADMIN_USERNAME || 'admin';
  const envPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === envUser && password === envPass) {
    req.session.isAdmin = true;
    res.json({ success: true, message: 'Logged in successfully' });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

// Logout API
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check auth status API
app.get('/api/admin/check', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// ==========================================
// 3. PROTECTED ADMIN CRUD API ROUTES
// ==========================================

// Get Dashboard Summary
app.get('/api/admin/summary', requireAdmin, (req, res) => {
  db.get('SELECT COUNT(*) as count FROM notices', [], (err, noticesRow) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get('SELECT COUNT(*) as count FROM events', [], (err, eventsRow) => {
      if (err) return res.status(500).json({ error: err.message });

      // Count configured (non-blank) academics links
      db.get("SELECT COUNT(*) as count FROM academics WHERE drive_link != ''", [], (err, acadRow) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          noticesCount: noticesRow.count,
          eventsCount: eventsRow.count,
          customAcademicsCount: acadRow.count
        });
      });
    });
  });
});

// NOTICES CRUD

// Add Notice
app.post('/api/admin/notices', requireAdmin, (req, res) => {
  const { title, type, semester, description, date, links, image, template_data } = req.body;

  if (!title || !type || !description || !date) {
    return res.status(400).json({ error: 'Title, type, description, and date are required' });
  }
  
  // Note: semester remains required for result/exam/toppers templates where admin selects it
  const needsSemester = ['result', 'series_exam', 'toppers'].includes(type);
  if (needsSemester && !semester) {
    return res.status(400).json({ error: 'Semester is required for this template type' });
  }

  // Links validation
  let linksStr = '[]';
  if (links) {
    try {
      const parsed = Array.isArray(links) ? links : JSON.parse(links);
      linksStr = JSON.stringify(parsed);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid links JSON format' });
    }
  }

  // Check for duplicate title
  db.get('SELECT id FROM notices WHERE title = ?', [title], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      return res.status(400).json({ error: 'A notice with this title already exists' });
    }

    db.run(
      'INSERT INTO notices (title, type, semester, description, date, links, image, template_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, type, semester || '', description, date, linksStr, image || null, template_data ? JSON.stringify(template_data) : null],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, success: true });
      }
    );
  });
});

// Edit Notice
app.put('/api/admin/notices/:id', requireAdmin, (req, res) => {
  const { title, type, semester, description, date, links, image, template_data } = req.body;

  if (!title || !type || !description || !date) {
    return res.status(400).json({ error: 'Title, type, description, and date are required' });
  }
  
  const needsSemester = ['result', 'series_exam', 'toppers'].includes(type);
  if (needsSemester && !semester) {
    return res.status(400).json({ error: 'Semester is required for this template type' });
  }

  let linksStr = '[]';
  if (links) {
    try {
      const parsed = Array.isArray(links) ? links : JSON.parse(links);
      linksStr = JSON.stringify(parsed);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid links JSON format' });
    }
  }

  // Check for duplicate title excluding current id
  db.get('SELECT id FROM notices WHERE title = ? AND id != ?', [title, req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      return res.status(400).json({ error: 'Another notice with this title already exists' });
    }

    // If no new image is provided, keep the existing one
    const updateFn = (imageVal) => {
      db.run(
        'UPDATE notices SET title = ?, type = ?, semester = ?, description = ?, date = ?, links = ?, image = ?, template_data = ? WHERE id = ?',
        [title, type, semester || '', description, date, linksStr, imageVal, template_data ? JSON.stringify(template_data) : null, req.params.id],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          if (this.changes === 0) return res.status(404).json({ error: 'Notice not found' });
          res.json({ success: true });
        }
      );
    };

    if (image !== undefined) {
      updateFn(image || null);
    } else {
      // Preserve existing image
      db.get('SELECT image FROM notices WHERE id = ?', [req.params.id], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        updateFn(existing ? existing.image : null);
      });
    }
  });
});

// Delete Notice
app.delete('/api/admin/notices/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM notices WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Notice not found' });
    res.json({ success: true });
  });
});

// EVENTS CRUD

// Add Event
app.post('/api/admin/events', requireAdmin, (req, res) => {
  const { title, date, time, venue, description, poster_url, registration_link } = req.body;

  if (!title || !date || !time || !venue || !description || !poster_url) {
    return res.status(400).json({ error: 'Title, date, time, venue, description, and poster image URL are required' });
  }

  db.run(
    'INSERT INTO events (title, date, time, venue, description, poster_url, registration_link) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, date, time, venue, description, poster_url, registration_link || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, success: true });
    }
  );
});

// Edit Event
app.put('/api/admin/events/:id', requireAdmin, (req, res) => {
  const { title, date, time, venue, description, poster_url, registration_link } = req.body;

  if (!title || !date || !time || !venue || !description || !poster_url) {
    return res.status(400).json({ error: 'Title, date, time, venue, description, and poster image URL are required' });
  }

  db.run(
    'UPDATE events SET title = ?, date = ?, time = ?, venue = ?, description = ?, poster_url = ?, registration_link = ? WHERE id = ?',
    [title, date, time, venue, description, poster_url, registration_link || '', req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Event not found' });
      res.json({ success: true });
    }
  );
});

// Delete Event
app.delete('/api/admin/events/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM events WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true });
  });
});

// ACADEMICS CONFIG CRUD

// Get all academic configurations
app.get('/api/admin/academics', requireAdmin, (req, res) => {
  db.all('SELECT * FROM academics ORDER BY type, scheme, semester', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update an academic configuration link
app.put('/api/admin/academics/:id', requireAdmin, (req, res) => {
  const { drive_link } = req.body;
  if (!drive_link) {
    return res.status(400).json({ error: 'Google Drive link is required' });
  }

  db.run(
    'UPDATE academics SET drive_link = ? WHERE id = ?',
    [drive_link, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Configuration not found' });
      res.json({ success: true });
    }
  );
});

// Catch-all route to serve index.html for any undefined non-API paths (helps support dynamic SPA-like behaviors if needed, though Option 1 is multi-page)
app.get('*', (req, res, next) => {
  // If it's an API request that didn't match, let it 404
  if (req.url.startsWith('/api')) {
    return next();
  }
  // Otherwise serve the file requested or fallback to index.html
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Mechanical Association Server running on http://localhost:${PORT}`);
});
