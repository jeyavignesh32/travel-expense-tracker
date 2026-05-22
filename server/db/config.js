// server/db/config.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Health check state
let dbConnected = false;

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Connected Successfully');
    dbConnected = true;
    connection.release();
  } catch (err) {
    console.error('❌ MySQL Connection Failed:', err.message);
    dbConnected = false;
  }
};

testConnection();

module.exports = {
  pool,
  isHealthy: () => dbConnected
};
