const { pool } = require('./config');

async function updateSchema() {
  try {
    const connection = await pool.getConnection();
    console.log('Adding split_with column to expenses table...');
    
    // Check if column exists
    const [columns] = await connection.query(`SHOW COLUMNS FROM expenses LIKE 'split_with'`);
    if (columns.length === 0) {
      await connection.query(`ALTER TABLE expenses ADD COLUMN split_with JSON DEFAULT NULL`);
      console.log('✅ Successfully added split_with column (JSON) to expenses table.');
    } else {
      console.log('⚠️ Column split_with already exists in expenses table.');
    }
    
    connection.release();
  } catch (err) {
    console.error('❌ Failed to update schema:', err.message);
  } finally {
    process.exit(0);
  }
}

updateSchema();
