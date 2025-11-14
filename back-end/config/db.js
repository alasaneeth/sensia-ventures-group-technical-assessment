// config/db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Optional: Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database', err.stack);
  } else {
    console.log('Database connected successfully!');
  }
  release();
});

module.exports = pool;
