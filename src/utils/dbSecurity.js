const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const dbPool = require('../config/dbPool');
const { DatabaseErrorHandler } = require('./dbErrorHandler');

class DatabaseSecurity {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.DB_ENCRYPTION_KEY || crypto.randomBytes(32);
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.saltRounds = 10;
  }

  async hashPassword(password) {
    try {
      const salt = await crypto.randomBytes(16);
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
          if (err) reject(err);
          resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
        });
      });
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'hash_password'
      });
    }
  }

  async verifyPassword(password, hash) {
    try {
      const [salt, key] = hash.split(':');
      const saltBuffer = Buffer.from(salt, 'hex');
      
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, saltBuffer, 100000, 64, 'sha512', (err, derivedKey) => {
          if (err) reject(err);
          resolve(derivedKey.toString('hex') === key);
        });
      });
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'verify_password'
      });
    }
  }

  encryptData(data) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'encrypt_data'
      });
    }
  }

  decryptData(encryptedData, iv, authTag) {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.secretKey,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'decrypt_data'
      });
    }
  }

  generateToken(userId, role, expiresIn = '24h') {
    try {
      return jwt.sign(
        { 
          userId,
          role,
          timestamp: Date.now()
        },
        this.jwtSecret,
        { expiresIn }
      );
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'generate_token'
      });
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'verify_token'
      });
    }
  }

  async createUser(username, password, role) {
    try {
      const hashedPassword = await this.hashPassword(password);
      
      const sql = `
        INSERT INTO users (username, password_hash, role, created_at)
        VALUES (?, ?, ?, NOW())
      `;
      
      return await dbPool.query(sql, [username, hashedPassword, role]);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'create_user'
      });
    }
  }

  async validateUserAccess(userId, requiredRole) {
    try {
      const sql = `
        SELECT role, is_active
        FROM users
        WHERE id = ?
      `;
      
      const [user] = await dbPool.query(sql, [userId]);
      
      if (!user || !user.is_active) {
        return false;
      }

      const roles = {
        admin: 3,
        doctor: 2,
        nurse: 1,
        patient: 0
      };

      return roles[user.role] >= roles[requiredRole];
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'validate_user_access'
      });
    }
  }

  async logSecurityEvent(userId, action, details) {
    try {
      const sql = `
        INSERT INTO security_logs (
          user_id,
          action,
          details,
          ip_address,
          user_agent,
          created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `;
      
      return await dbPool.query(sql, [
        userId,
        action,
        JSON.stringify(details),
        details.ipAddress || null,
        details.userAgent || null
      ]);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'log_security_event'
      });
    }
  }

  async getSecurityLogs(filters = {}) {
    try {
      let sql = `
        SELECT 
          sl.*,
          u.username
        FROM security_logs sl
        LEFT JOIN users u ON sl.user_id = u.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filters.userId) {
        sql += ' AND sl.user_id = ?';
        params.push(filters.userId);
      }
      
      if (filters.action) {
        sql += ' AND sl.action = ?';
        params.push(filters.action);
      }
      
      if (filters.startDate) {
        sql += ' AND sl.created_at >= ?';
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        sql += ' AND sl.created_at <= ?';
        params.push(filters.endDate);
      }
      
      sql += ' ORDER BY sl.created_at DESC';
      
      if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
      }
      
      return await dbPool.query(sql, params);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_security_logs'
      });
    }
  }

  async revokeUserSessions(userId) {
    try {
      const sql = `
        UPDATE user_sessions
        SET revoked_at = NOW()
        WHERE user_id = ? AND revoked_at IS NULL
      `;
      
      return await dbPool.query(sql, [userId]);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'revoke_user_sessions'
      });
    }
  }

  generateSecurePassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  async rotateEncryptionKey() {
    try {
      const newKey = crypto.randomBytes(32);
      const oldKey = this.secretKey;
      
      // Re-encrypt sensitive data with new key
      const tables = ['patient_data', 'test_results', 'medical_history'];
      
      for (const table of tables) {
        const records = await dbPool.query(`SELECT * FROM ${table}`);
        
        for (const record of records) {
          // Decrypt with old key
          const decryptedData = this.decryptData(
            record.encrypted_data,
            record.iv,
            record.auth_tag
          );
          
          // Encrypt with new key
          this.secretKey = newKey;
          const {
            iv,
            encryptedData,
            authTag
          } = this.encryptData(decryptedData);
          
          // Update record
          await dbPool.query(
            `UPDATE ${table} 
            SET encrypted_data = ?, iv = ?, auth_tag = ?
            WHERE id = ?`,
            [encryptedData, iv, authTag, record.id]
          );
        }
      }
      
      this.secretKey = newKey;
      return true;
    } catch (error) {
      this.secretKey = oldKey;
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'rotate_encryption_key'
      });
    }
  }
}

// Create and export singleton instance
const dbSecurity = new DatabaseSecurity();
module.exports = dbSecurity;
