const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        semester TEXT,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        links TEXT NOT NULL,
        image TEXT,
        template_data TEXT
      )
    `, () => {
      // Dynamic migration: add template_data column if table was already created
      db.all("PRAGMA table_info(notices)", [], (err, cols) => {
        if (cols && !cols.some(c => c.name === 'template_data')) {
          db.run("ALTER TABLE notices ADD COLUMN template_data TEXT");
        }
      });
    });

    // 2. Events Table
    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        venue TEXT NOT NULL,
        description TEXT NOT NULL,
        poster_url TEXT NOT NULL,
        registration_link TEXT,
        instagram_link TEXT
      )
    `);

    // Add instagram_link to events if missing (for existing databases)
    db.run('ALTER TABLE events ADD COLUMN instagram_link TEXT', (err) => {
      // Ignore error — column already exists
    });

    // 3. Academics Configurations Table
    db.run(`
      CREATE TABLE IF NOT EXISTS academics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        scheme TEXT NOT NULL,
        semester TEXT NOT NULL,
        drive_link TEXT NOT NULL,
        UNIQUE(type, scheme, semester)
      )
    `, () => {
      // Run seeding if requested
      if (process.argv.includes('--seed')) {
        seedDatabase();
      }
    });
  });
}

function seedDatabase() {
  console.log('Seeding database...');
  
  // Seed Notices
  db.all('SELECT COUNT(*) as count FROM notices', [], (err, rows) => {
    if (err) return console.error(err);
    if (rows[0].count === 0) {
      const defaultNotices = [
        {
          title: 'Semester S6 Results Published',
          type: 'result',
          semester: 'Semester 6',
          description: 'The results for Semester 6 have been published. Students are requested to sign in to the KTU Student Portal and download their scorecards.',
          date: 'JUN 28',
          links: JSON.stringify([
            { name: 'KTU Student Portal', url: 'https://app.ktu.edu.in/login.htm' },
            { name: 'Announcements', url: 'https://www.instagram.com/me_association.cet?igsh=MWpldDB6czlwd2J2dA==' }
          ])
        },
        {
          title: 'Semester S2 Results Published',
          type: 'result',
          semester: 'Semester 2',
          description: 'The results for Semester 2 have been published. Students are requested to sign in to the KTU Student Portal and download their scorecards.',
          date: 'JUN 29',
          links: JSON.stringify([
            { name: 'KTU Student Portal', url: 'https://app.ktu.edu.in/login.htm' },
            { name: 'Announcements', url: 'https://www.instagram.com/me_association.cet?igsh=MWpldDB6czlwd2J2dA==' }
          ])
        },
        {
          title: 'Classroom Details & Room Numbers',
          type: 'general',
          semester: '',
          description: 'Access complete classroom allocation, room numbers, and laboratory space assignments for all semesters. Check the detailed allocation list for your batch and semester. Click to open details.',
          date: 'INFO',
          links: JSON.stringify([
            { name: 'Classroom Details Plan', url: 'images/notices/odd_class_details.png' }
          ])
        },
        {
          title: 'Semester Exam Time Table for S2 & S4',
          type: 'general',
          semester: '',
          description: 'KTU Semester exam timetables for Mechanical S2 and S4 batches have been officially compiled and released.',
          date: 'JUN 15',
          links: JSON.stringify([])
        },
        {
          title: 'Robotics Design & Fabrication Colloquium',
          type: 'general',
          semester: '',
          description: 'An official technical gathering focusing on mechanical frame integration, spatial optimization metrics, and dynamic structural simulation approaches.',
          date: 'JUN 20',
          links: JSON.stringify([])
        },
        {
          title: 'Symposium on Modern Industrial Manufacturing',
          type: 'general',
          semester: '',
          description: 'A comprehensive session analyzing optimized quality control protocols, iterative management approaches, and robust structural analysis workflows.',
          date: 'JUN 22',
          links: JSON.stringify([])
        }
      ];

      const stmt = db.prepare('INSERT INTO notices (title, type, semester, description, date, links, image, template_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      defaultNotices.forEach(n => {
        stmt.run(n.title, n.type, n.semester, n.description, n.date, n.links, null, null);
      });
      stmt.finalize();
      console.log('Notices seeded!');
    }
  });

  // Seed Events
  db.all('SELECT COUNT(*) as count FROM events', [], (err, rows) => {
    if (err) return console.error(err);
    if (rows[0].count === 0) {
      const defaultEvents = [
        {
          title: 'Robotics & Fabrication Hub',
          date: '2026-07-15',
          time: '10:00 AM',
          venue: 'Robotics Lab, CET',
          description: 'Hands-on workshop on structural assembly, Arduino path planning, and sensor calibration metrics.',
          poster_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
          registration_link: 'https://forms.gle/nMktE7vQFdovGtQ67'
        },
        {
          title: 'Advanced Manufacturing Expo',
          date: '2026-07-22',
          time: '09:30 AM',
          venue: 'Mechanical Seminar Hall',
          description: 'Exhibition showcasing advanced precision machining tools, CNC coding models, and 3D printing structures.',
          poster_url: 'https://images.unsplash.com/photo-1537462715879-360eeb61a0bc?auto=format&fit=crop&w=400&q=80',
          registration_link: ''
        },
        {
          title: 'Annual Technical Symposium',
          date: '2026-08-05',
          time: '09:00 AM',
          venue: 'Main Auditorium, CET',
          description: 'Paper presentations, design competitions, and talks by industrial experts in mechanical engineering systems.',
          poster_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80',
          registration_link: 'https://forms.gle/nMktE7vQFdovGtQ67'
        },
        {
          title: 'Automotive Simulation Track',
          date: '2026-08-12',
          time: '01:30 PM',
          venue: 'CAD Lab, CET',
          description: 'Designing and simulating aerodynamics, structural stress points, and engine thermodynamics for FSAE models.',
          poster_url: 'https://images.unsplash.com/photo-1535551951406-a19940280397?auto=format&fit=crop&w=400&q=80',
          registration_link: ''
        }
      ];

      const stmt = db.prepare('INSERT INTO events (title, date, time, venue, description, poster_url, registration_link) VALUES (?, ?, ?, ?, ?, ?, ?)');
      defaultEvents.forEach(e => {
        stmt.run(e.title, e.date, e.time, e.venue, e.description, e.poster_url, e.registration_link);
      });
      stmt.finalize();
      console.log('Events seeded!');
    }
  });

  // Seed Academics (32 mappings)
  db.all('SELECT COUNT(*) as count FROM academics', [], (err, rows) => {
    if (err) return console.error(err);
    if (rows[0].count === 0) {
      const types = ['syllabus', 'resources'];
      const schemes = ['2024', '2019'];
      const semesters = [
        'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
        'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
      ];

      db.serialize(() => {
        const stmt = db.prepare('INSERT OR IGNORE INTO academics (type, scheme, semester, drive_link) VALUES (?, ?, ?, ?)');
        for (const type of types) {
          for (const scheme of schemes) {
            for (const sem of semesters) {
              stmt.run(type, scheme, sem, "");
            }
          }
        }
        stmt.finalize();
        console.log('Academics configurations seeded (32 blank records)!');
      });
    }
  });
}

// Initialize database when db.js is loaded
initDatabase();

module.exports = db;
