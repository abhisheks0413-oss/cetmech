# Mechanical Engineering Association — CET

Official website for the **Mechanical Engineering Association**, College of Engineering Trivandrum (CET).

Built with Node.js + Express + SQLite. Features a fully dynamic admin portal for managing notices, events, and academic resources — no CMS required.

---

## Features

- 📢 **Dynamic Notices & Announcements** — with image support, 6 built-in templates (Series Exam, Hackathon, Placement Perspective, Toppers, Call for Team, Workshop), and image lightbox zoom viewer
- 📅 **Events & Achievements** — clickable event cards with detail modals, poster image zoom lightbox, registration & Instagram links
- 📚 **Academic Resources** — semester-wise syllabus and resource links (8 semesters × 2 schemes)
- 🔐 **Admin Portal** — password-protected dashboard at `/admin.html` for full CRUD on all content, with calendar/clock date-time pickers (Flatpickr)
- 📱 **Responsive Design** — mobile-friendly layout across all pages

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 |
| Server | Express.js |
| Database | SQLite3 (via `sqlite3` npm package) |
| Sessions | `express-session` |
| Frontend | Vanilla HTML, CSS, JavaScript |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and set your own SESSION_SECRET and ADMIN_PASSWORD

# 4. Start the server
npm start
```

The site will be available at **http://localhost:3000**

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the server listens on | `3000` |
| `SESSION_SECRET` | Secret for signing session cookies — **change this in production** | — |
| `ADMIN_USERNAME` | Admin panel username | `admin` |
| `ADMIN_PASSWORD` | Admin panel password — **change this in production** | — |

> ⚠️ **Never commit your `.env` file.** It is already excluded by `.gitignore`.

---

## Admin Portal

Navigate to `/admin.html` and log in with your configured credentials.

From the admin dashboard you can:
- **Add / Edit / Delete Notices** using free-form entry or one of 6 pre-built templates
- **Add / Edit / Delete Events** with poster images, dates, venues, and registration links
- **Edit Academic Resource Links** — syllabus and resources for all 8 semesters under 2 KTU schemes

---

## Project Structure

```
├── server.js          # Express server + all API routes
├── db.js              # SQLite schema setup and seeding
├── package.json
├── .env.example       # Environment variable template
├── .gitignore
│
├── index.html         # Home page
├── about.html         # About the association
├── notices.html       # Announcements page
├── events.html      # Events & Achievements page
├── academics.html     # Academic Resources page
├── admin.html         # Admin portal (password protected)
│
├── css/               # Stylesheets
├── js/
│   └── app.js         # Frontend logic (notices, events, lightbox, modals)
└── images/            # Static images (association, notices, toppers)
```

---

## Deployment Notes

- The SQLite `database.db` file is **not tracked in git** — it is created automatically when the server starts for the first time.
- For production deployments, use a process manager like [PM2](https://pm2.keymetrics.io/) to keep the server running:
  ```bash
  npm install -g pm2
  pm2 start server.js --name "mech-association"
  pm2 save
  ```
- For cloud hosting, platforms like **Railway**, **Render**, or a VPS with Nginx reverse proxy work well with this stack.

---

## License

ISC © Mechanical Engineering Association, CET
