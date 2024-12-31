const dbPool = require('../config/dbPool');
const { DatabaseErrorHandler } = require('./dbErrorHandler');

class DatabaseAuditLogger {
  static async logAction(userId, action, tableName, recordId, oldValues = null, newValues = null, context = {}) {
    try {
      const sql = `
        INSERT INTO audit_logs (
          user_id,
          action,
          table_name,
          record_id,
          old_values,
          new_values,
          ip_address,
          user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await dbPool.query(sql, [
        userId,
        action,
        tableName,
        recordId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        context.ipAddress || null,
        context.userAgent || null
      ]);
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }

  static async getAuditTrail(options = {}) {
    try {
      let sql = `
        SELECT 
          al.*,
          u.username as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;

      const params = [];

      if (options.userId) {
        sql += ' AND al.user_id = ?';
        params.push(options.userId);
      }

      if (options.action) {
        sql += ' AND al.action = ?';
        params.push(options.action);
      }

      if (options.tableName) {
        sql += ' AND al.table_name = ?';
        params.push(options.tableName);
      }

      if (options.recordId) {
        sql += ' AND al.record_id = ?';
        params.push(options.recordId);
      }

      if (options.startDate) {
        sql += ' AND al.created_at >= ?';
        params.push(options.startDate);
      }

      if (options.endDate) {
        sql += ' AND al.created_at <= ?';
        params.push(options.endDate);
      }

      sql += ' ORDER BY al.created_at DESC';

      if (options.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
      }

      return await dbPool.query(sql, params);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_audit_trail'
      });
    }
  }

  static async getRecordHistory(tableName, recordId) {
    try {
      const sql = `
        SELECT 
          al.*,
          u.username as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.table_name = ?
        AND al.record_id = ?
        ORDER BY al.created_at DESC
      `;

      return await dbPool.query(sql, [tableName, recordId]);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_record_history'
      });
    }
  }

  static async getUserActions(userId, startDate = null, endDate = null) {
    try {
      let sql = `
        SELECT 
          al.*,
          u.username as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.user_id = ?
      `;

      const params = [userId];

      if (startDate) {
        sql += ' AND al.created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        sql += ' AND al.created_at <= ?';
        params.push(endDate);
      }

      sql += ' ORDER BY al.created_at DESC';

      return await dbPool.query(sql, params);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_user_actions'
      });
    }
  }

  static async getActionSummary(startDate = null, endDate = null) {
    try {
      let sql = `
        SELECT 
          action,
          table_name,
          COUNT(*) as action_count,
          COUNT(DISTINCT user_id) as unique_users,
          MIN(created_at) as first_occurrence,
          MAX(created_at) as last_occurrence
        FROM audit_logs
        WHERE 1=1
      `;

      const params = [];

      if (startDate) {
        sql += ' AND created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        sql += ' AND created_at <= ?';
        params.push(endDate);
      }

      sql += ' GROUP BY action, table_name ORDER BY action_count DESC';

      return await dbPool.query(sql, params);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_action_summary'
      });
    }
  }

  static async getIpAddressActivity(ipAddress, startDate = null, endDate = null) {
    try {
      let sql = `
        SELECT 
          al.*,
          u.username as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.ip_address = ?
      `;

      const params = [ipAddress];

      if (startDate) {
        sql += ' AND al.created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        sql += ' AND al.created_at <= ?';
        params.push(endDate);
      }

      sql += ' ORDER BY al.created_at DESC';

      return await dbPool.query(sql, params);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_ip_address_activity'
      });
    }
  }

  static async cleanupOldLogs(days = 90) {
    try {
      const sql = `
        DELETE FROM audit_logs
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;

      return await dbPool.query(sql, [days]);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'cleanup_old_logs'
      });
    }
  }

  static async getAuditLogSize() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_logs,
          SUM(LENGTH(old_values) + LENGTH(new_values)) as total_data_size,
          MIN(created_at) as oldest_log,
          MAX(created_at) as newest_log
        FROM audit_logs
      `;

      return await dbPool.query(sql);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_audit_log_size'
      });
    }
  }
}

module.exports = DatabaseAuditLogger;
