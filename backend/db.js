const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const initializeDB = async () => {
  try {
    console.log('Connected to the PostgreSQL database.');
    
    // Users Table
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      google_id TEXT,
      name TEXT
    )`);

    // Quizzes Table
    await pool.query(`CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      time_limit INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      image_url TEXT,
      bg_image_url TEXT
    )`);

    // Questions Table
    await pool.query(`CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer INTEGER NOT NULL
    )`);

    // Results Table
    await pool.query(`CREATE TABLE IF NOT EXISTS results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      quiz_id INTEGER NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      answers TEXT NOT NULL,
      time_taken INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
};

// Run initialization
if (process.env.DATABASE_URL) {
    initializeDB();
} else {
    console.warn('DATABASE_URL is not set. Skipping DB initialization.');
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
