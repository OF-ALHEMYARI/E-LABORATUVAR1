const { query } = require('./database');

// Create audit_logs table if it doesn't exist
async function initAuditTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT,
      action VARCHAR(100) NOT NULL,
      details TEXT,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

class AuditLogger {
  static async log(userId, action, details, ipAddress = null) {
    try {
      const sql = `
        INSERT INTO audit_logs (user_id, action, details, ip_address)
        VALUES (?, ?, ?, ?)
      `;
      await query(sql, [userId, action, JSON.stringify(details), ipAddress]);
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  static async getUserActivity(userId, startDate = null, endDate = null) {
    let sql = 'SELECT * FROM audit_logs WHERE user_id = ?';
    const params = [userId];

    if (startDate) {
      sql += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND created_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY created_at DESC';
    return await query(sql, params);
  }

  static async getActivityByType(action, startDate = null, endDate = null) {
    let sql = 'SELECT * FROM audit_logs WHERE action = ?';
    const params = [action];

    if (startDate) {
      sql += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND created_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY created_at DESC';
    return await query(sql, params);
  }

  static async getRecentActivity(limit = 100) {
    const sql = `
      SELECT al.*, u.username 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `;
    return await query(sql, [limit]);
  }
}

module.exports = {
  initAuditTable,
  AuditLogger
};
