const mysql = require('mysql2/promise');
const { DatabaseErrorHandler } = require('../utils/dbErrorHandler');

class DatabasePool {
  constructor() {
    this.pool = null;
    this.config = {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'root',
      database: 'e_lab',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    };
  }

  async initialize() {
    try {
      if (!this.pool) {
        this.pool = mysql.createPool(this.config);
        console.log('Database pool initialized successfully');
        
        // Test connection
        await this.testConnection();
        
        // Setup ping interval to keep connections alive
        this.setupPing();
      }
      return this.pool;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'pool_initialization'
      });
    }
  }

  async testConnection() {
    try {
      const connection = await this.pool.getConnection();
      console.log('Database connection test successful');
      connection.release();
      return true;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'connection_test'
      });
    }
  }

  setupPing() {
    // Ping database every 30 seconds to keep connections alive
    setInterval(async () => {
      try {
        const connection = await this.pool.getConnection();
        await connection.ping();
        connection.release();
      } catch (error) {
        console.error('Ping error:', error);
      }
    }, 30000);
  }

  async getConnection() {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_connection'
      });
    }
  }

  async query(sql, params = []) {
    let connection;
    try {
      connection = await this.getConnection();
      const [results] = await connection.execute(sql, params);
      return results;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'query_execution',
        sql,
        params
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async transaction(callback) {
    let connection;
    try {
      connection = await this.getConnection();
      await connection.beginTransaction();
      
      const result = await callback(connection);
      
      await connection.commit();
      return result;
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'transaction'
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async end() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database pool closed');
    }
  }

  // Pool statistics
  async getPoolStatistics() {
    if (!this.pool) return null;
    
    return {
      threadId: this.pool.threadId,
      connectionLimit: this.config.connectionLimit,
      queueLimit: this.config.queueLimit,
      activeConnections: this.pool._allConnections.length,
      idleConnections: this.pool._freeConnections.length,
      waitingRequests: this.pool._connectionQueue.length
    };
  }
}

// Create and export singleton instance
const dbPool = new DatabasePool();
module.exports = dbPool;
