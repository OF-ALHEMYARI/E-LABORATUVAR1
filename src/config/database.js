const mysql = require('mysql2/promise');

const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'e_lab'
};

let connection = null;

async function connect() {
  try {
    if (!connection) {
      connection = await mysql.createConnection(dbConfig);
      console.log('Database connected successfully');
    }
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

async function query(sql, params) {
  try {
    const conn = await connect();
    const [results] = await conn.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

module.exports = {
  connect,
  query
};
