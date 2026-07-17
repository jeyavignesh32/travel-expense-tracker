// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/config');
const router = express.Router();

// Auto-run column alter checks on launch to ensure profile support in DB
const ensureProfileColumnsExist = async () => {
  const addColumn = async (colName, colDef) => {
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN ${colName} ${colDef}`);
      console.log(`✅ Added column ${colName} to users table.`);
    } catch (e) {
      if (!e.message.includes('Duplicate column') && !e.message.includes('already exists')) {
        console.error(`Error adding column ${colName}:`, e.message);
      }
    }
  };
  await addColumn('bio', 'TEXT');
  await addColumn('location', 'VARCHAR(255)');
  await addColumn('preferred_currency', 'VARCHAR(10) DEFAULT "INR"');
  await addColumn('travel_styles', 'TEXT');
};
ensureProfileColumnsExist();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};

// Register User
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, phone]
    );

    const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: result.insertId, name, email, phone } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ error: 'User not found' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// GET profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, bio, location, preferred_currency, travel_styles FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ GET Profile Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve profile', details: err.message });
  }
});

// PUT profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { name, phone, bio, location, preferred_currency, travel_styles } = req.body;
  try {
    await pool.query(
      `UPDATE users SET name = ?, phone = ?, bio = ?, location = ?, preferred_currency = ?, travel_styles = ? 
       WHERE id = ?`,
      [name, phone, bio || '', location || '', preferred_currency || 'INR', travel_styles || '[]', req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('❌ PUT Profile Error:', err.message);
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

// PUT password
router.put('/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = users[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedNewPassword, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('❌ PUT Password Error:', err.message);
    res.status(500).json({ error: 'Failed to update password', details: err.message });
  }
});

module.exports = router;
