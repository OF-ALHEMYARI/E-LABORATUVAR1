const { query } = require('../config/database');

class DatabaseError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }
}

class DatabaseErrorHandler {
  static async initErrorLogging() {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS error_logs (
          id INT PRIMARY KEY AUTO_INCREMENT,
          error_code VARCHAR(50),
          error_message TEXT,
          error_details JSON,
          stack_trace TEXT,
          user_id INT,
          ip_address VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
    } catch (error) {
      console.error('Failed to initialize error logging:', error);
    }
  }

  static async logError(error, context = {}) {
    try {
      const errorDetails = {
        code: error.code || 'UNKNOWN',
        message: error.message,
        details: error.details || {},
        context,
        stack: error.stack
      };

      const sql = `
        INSERT INTO error_logs (
          error_code,
          error_message,
          error_details,
          stack_trace,
          user_id,
          ip_address
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      await query(sql, [
        errorDetails.code,
        errorDetails.message,
        JSON.stringify(errorDetails.details),
        errorDetails.stack,
        context.userId || null,
        context.ipAddress || null
      ]);

      return true;
    } catch (logError) {
      console.error('Failed to log error:', logError);
      return false;
    }
  }

  static handleDatabaseError(error, context = {}) {
    let dbError;

    switch (error.code) {
      case 'ER_DUP_ENTRY':
        dbError = new DatabaseError(
          'Duplicate entry found',
          'DUPLICATE_ENTRY',
          { field: this.extractDuplicateField(error.message) }
        );
        break;

      case 'ER_NO_REFERENCED_ROW':
      case 'ER_NO_REFERENCED_ROW_2':
        dbError = new DatabaseError(
          'Referenced record not found',
          'FOREIGN_KEY_VIOLATION',
          { details: error.message }
        );
        break;

      case 'ER_DATA_TOO_LONG':
        dbError = new DatabaseError(
          'Data too long for column',
          'DATA_TOO_LONG',
          { field: this.extractFieldName(error.message) }
        );
        break;

      case 'ER_ACCESS_DENIED_ERROR':
        dbError = new DatabaseError(
          'Database access denied',
          'ACCESS_DENIED',
          { user: context.user }
        );
        break;

      case 'ER_LOCK_DEADLOCK':
        dbError = new DatabaseError(
          'Database deadlock detected',
          'DEADLOCK',
          { transaction: context.transaction }
        );
        break;

      case 'ER_LOCK_WAIT_TIMEOUT':
        dbError = new DatabaseError(
          'Lock wait timeout exceeded',
          'LOCK_TIMEOUT',
          { transaction: context.transaction }
        );
        break;

      default:
        dbError = new DatabaseError(
          'Database error occurred',
          'UNKNOWN_ERROR',
          { originalError: error.message }
        );
    }

    this.logError(dbError, context);
    return dbError;
  }

  static extractDuplicateField(errorMessage) {
    const match = errorMessage.match(/Duplicate entry .+ for key '(.+)'/);
    return match ? match[1] : 'unknown';
  }

  static extractFieldName(errorMessage) {
    const match = errorMessage.match(/Data too long for column '(.+)'/);
    return match ? match[1] : 'unknown';
  }

  static async getErrorStats(startDate = null, endDate = null) {
    try {
      let sql = `
        SELECT 
          error_code,
          COUNT(*) as error_count,
          MIN(created_at) as first_occurrence,
          MAX(created_at) as last_occurrence
        FROM error_logs
      `;

      const params = [];
      if (startDate || endDate) {
        sql += ' WHERE ';
        if (startDate) {
          sql += 'created_at >= ?';
          params.push(startDate);
        }
        if (startDate && endDate) {
          sql += ' AND ';
        }
        if (endDate) {
          sql += 'created_at <= ?';
          params.push(endDate);
        }
      }

      sql += ' GROUP BY error_code ORDER BY error_count DESC';
      return await query(sql, params);
    } catch (error) {
      console.error('Failed to get error statistics:', error);
      throw error;
    }
  }

  static async cleanupOldErrors(days = 30) {
    try {
      const sql = `
        DELETE FROM error_logs
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      return await query(sql, [days]);
    } catch (error) {
      console.error('Failed to cleanup old errors:', error);
      throw error;
    }
  }

  static async getRecentErrors(limit = 50) {
    try {
      const sql = `
        SELECT *
        FROM error_logs
        ORDER BY created_at DESC
        LIMIT ?
      `;
      return await query(sql, [limit]);
    } catch (error) {
      console.error('Failed to get recent errors:', error);
      throw error;
    }
  }
}

module.exports = {
  DatabaseError,
  DatabaseErrorHandler
};
