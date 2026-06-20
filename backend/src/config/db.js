const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root123456',
  database: process.env.DB_NAME || 'workstudy',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  timezone: '+08:00'
});

async function testConnection(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log('数据库连接成功！');
      connection.release();
      return true;
    } catch (err) {
      console.log(`数据库连接尝试 ${i + 1}/${retries} 失败: ${err.message}`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('数据库连接失败，已达到最大重试次数');
  process.exit(1);
}

module.exports = { pool, testConnection };
