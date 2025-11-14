const express = require('express');
const pool = require('./config/db');
const authRoutes = require('./routes/auth');  // <-- ADD THIS LINE

const app = express();

app.use(express.json());

app.locals.pool = pool;  

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the API! Use /api/auth or /test-db');
});


// Test DB route
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
