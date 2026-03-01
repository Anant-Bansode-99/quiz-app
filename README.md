# Full-Stack Online Quiz Platform

This is a premium, modern, and production-ready Quiz Application built with:
- **Frontend**: React, Vite, React Router, Vanilla CSS (Glassmorphism layout)
- **Backend**: Node.js, Express, SQLite (Out-of-the-box local capable, easily swappable)

## Features
- Clean Dark Theme with stunning glowing styling and animations.
- Custom authentication (JWT & bcrypt).
- User Dashboard with performance history.
- Dynamic Quiz Taking engine with Timer progress.
- Results visualization with circular SVG animated charts.
- Full Admin Panel to Create/Delete quizzes and add questions.

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
```

Start the backend server (runs on port `5000` by default and auto-generates a local SQLite database).
```bash
npm run dev
# OR for production
node server.js
```

**Testing as Admin**:
To make an admin user, simply use POSTMAN or modify the frontend API call temporally to specify `"role": "admin"`, OR register normally, then open `backend/database.sqlite` and change your `role` to `'admin'`.

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Start the React development server:
```bash
npm run dev
```

The frontend will start typically on `http://localhost:5173`.

## Cloud Deployment (PostgreSQL/MySQL)

To migrate from the local SQLite DB to PostgreSQL/MySQL when deploying to a cloud VM (e.g., AWS EC2, DigitalOcean):

1. Go to `backend/db.js` and swap out `sqlite3` for `pg` (PostgreSQL) or `mysql2` and provide standard connection URIs.
2. In `backend/.env`, set your connection variables (DB_HOST, DB_USER, etc.).
3. Deploy the backend using `pm2`: `pm2 start server.js --name "quiz-api"`
4. Build the frontend for production: `cd frontend && npm run build`.
5. Serve the `dist/` directory via Nginx or Apache, and configure a reverse proxy `/api` pointing to `localhost:5000`.
