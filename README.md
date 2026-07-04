# Mechanical Engineering Association — CET

Official website for the **Mechanical Engineering Association**, College of Engineering Trivandrum (CET).

Built with Node.js + Express + MySQL. Features a fully dynamic admin portal for managing notices, events, and academic resources. A bundled SQLite database is used automatically for local development when `DATABASE_URL` is not set.

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
| Database | MySQL (via `mysql2`) |
| Sessions | JWT-based auth via `jsonwebtoken` |
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
# Edit .env and set your DATABASE_URL, JWT_SECRET, and ADMIN credentials

# 4. Start the server locally
npm start
```

The site will be available at **http://localhost:3000**

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string from your hosting provider | optional locally |
| `JWT_SECRET` | Secret for signing admin JWTs — **change this in production** | — |
| `SESSION_SECRET` | Optional fallback for compatibility | — |
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
├── db.js              # MySQL connection + local SQLite fallback
├── api/index.js       # Vercel serverless entry point
├── vercel.json        # Vercel routing config
├── migrations/        # SQL schema and seed migrations
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

- This project is now compatible with **Vercel** and **MySQL**.
- Deploy by connecting the repository to Vercel and setting the environment variables above.
- For local development, `npm start` runs the Express server directly. If `DATABASE_URL` is not set, the bundled `database.db` file is used.
- For Vercel-style local testing, install/use the Vercel CLI and run `npm run vercel:dev`.

---

## License

ISC © Mechanical Engineering Association, CET
