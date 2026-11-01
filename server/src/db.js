
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const sslCa = process.env.MYSQL_SSL_CA;

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,

  ssl: sslCa
    ? {
        ca: sslCa.replace(/\\n/g, '\n'),
        rejectUnauthorized: true
      }
    : undefined,

  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  timezone: 'Z'
});

export async function query(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
