// server/db/init.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true, // IMPORTANT: Allows running the entire schema.sql at once
  });

  console.log('🏗️  Creating database if not exists...');
  await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
  await connection.query(`USE ${process.env.DB_NAME}`);

  console.log('🗄️  Running schema.sql...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  try {
    await connection.query(schema);
  } catch (err) {
    console.error(`❌ Error executing schema: ${err.message}`);
  }

  console.log('✅ Database Initialization Complete!');

  console.log('🌱 Seeding initial data...');
  try {
    // 1. Create a default test user
    const [user] = await connection.query('INSERT IGNORE INTO users (id, name, email, password_hash) VALUES (1, "Test User", "test@example.com", "$2a$10$XLo.d5W7jE.H6/K.VpW3pOG7.L.R.v.V.V.V.V.V.V.V.V.V.V")');
    
    // 2. Create a default trip
    await connection.query('INSERT IGNORE INTO trips (id, name, destination, start_date, end_date, budget_total, trip_type, creator_id) VALUES (1, "Goa Adventure", "Goa", "2026-04-01", "2026-04-07", 25000.00, "Adventure", 1)');
    
    // 3. Add user to trip member
    await connection.query('INSERT IGNORE INTO trip_members (trip_id, user_id, role) VALUES (1, 1, "admin")');
    
    // 4. Seed some sample itinerary items
    await connection.query('INSERT IGNORE INTO itinerary_items (trip_id, name, type, image_url, status) VALUES (1, "Baga Beach", "Beach", "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800", "selected"), (1, "Fort Aguada", "Historic", "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800", "suggested")');

    console.log('✨ Seeding successful!');
  } catch (err) {
    console.warn(`⚠️ Warning seeding data: ${err.message}`);
  }
  await connection.end();
}

initDB().catch(err => {
  console.error('❌ Database Initialization Failed:', err.stack);
  process.exit(1);
});
