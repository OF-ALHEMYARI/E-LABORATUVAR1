const fs = require('fs').promises;
const path = require('path');
const dbPool = require('../config/dbPool');
const { DatabaseErrorHandler } = require('./dbErrorHandler');

class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.tables = [
      'users',
      'patients',
      'emergency_contacts',
      'reference_ranges',
      'test_results',
      'audit_logs',
      'migrations'
    ];
  }

  async initBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create backup directory: ${error.message}`);
    }
  }

  async createBackup(description = '') {
    try {
      await this.initBackupDirectory();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `backup_${timestamp}.json`);
      
      const backup = {
        timestamp,
        description,
        version: '1.0',
        tables: {}
      };

      for (const table of this.tables) {
        // Get table structure
        const [structure] = await dbPool.query(`SHOW CREATE TABLE ${table}`);
        backup.tables[table] = {
          structure: structure[0]['Create Table'],
          data: []
        };

        // Get table data
        const [rows] = await dbPool.query(`SELECT * FROM ${table}`);
        backup.tables[table].data = rows;
      }

      await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
      
      // Log backup creation
      await this.logBackupOperation('create', backupPath, description);
      
      return backupPath;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'create_backup'
      });
    }
  }

  async restoreBackup(backupPath) {
    try {
      const backupContent = await fs.readFile(backupPath, 'utf8');
      const backup = JSON.parse(backupContent);

      // Start transaction
      const connection = await dbPool.getConnection();
      await connection.beginTransaction();

      try {
        // Disable foreign key checks temporarily
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Restore each table
        for (const [tableName, tableData] of Object.entries(backup.tables)) {
          // Drop and recreate table
          await connection.query(`DROP TABLE IF EXISTS ${tableName}`);
          await connection.query(tableData.structure);

          // Insert data in batches
          if (tableData.data.length > 0) {
            const batchSize = 1000;
            for (let i = 0; i < tableData.data.length; i += batchSize) {
              const batch = tableData.data.slice(i, i + batchSize);
              const columns = Object.keys(batch[0]);
              const values = batch.map(row => Object.values(row));
              
              const placeholders = values.map(() => 
                `(${columns.map(() => '?').join(',')})`
              ).join(',');

              const sql = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES ${placeholders}`;
              await connection.query(sql, values.flat());
            }
          }
        }

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        
        await connection.commit();
        
        // Log restore operation
        await this.logBackupOperation('restore', backupPath);
        
        return true;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'restore_backup'
      });
    }
  }

  async listBackups() {
    try {
      await this.initBackupDirectory();
      
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf8');
          const backup = JSON.parse(content);

          backups.push({
            filename: file,
            path: filePath,
            timestamp: backup.timestamp,
            description: backup.description,
            size: stats.size,
            created: stats.birthtime
          });
        }
      }

      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'list_backups'
      });
    }
  }

  async deleteBackup(backupPath) {
    try {
      await fs.unlink(backupPath);
      
      // Log deletion
      await this.logBackupOperation('delete', backupPath);
      
      return true;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'delete_backup'
      });
    }
  }

  async validateBackup(backupPath) {
    try {
      const content = await fs.readFile(backupPath, 'utf8');
      const backup = JSON.parse(content);

      // Validate backup structure
      if (!backup.timestamp || !backup.version || !backup.tables) {
        throw new Error('Invalid backup file structure');
      }

      // Validate each table
      for (const table of this.tables) {
        if (!backup.tables[table]) {
          throw new Error(`Missing table in backup: ${table}`);
        }
        if (!backup.tables[table].structure || !backup.tables[table].data) {
          throw new Error(`Invalid table structure in backup: ${table}`);
        }
      }

      return true;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'validate_backup'
      });
    }
  }

  async logBackupOperation(operation, backupPath, description = '') {
    try {
      await dbPool.query(`
        INSERT INTO audit_logs (
          action, table_name, old_values, new_values
        ) VALUES (?, 'database_backup', ?, ?)
      `, [
        `backup_${operation}`,
        JSON.stringify({ path: backupPath }),
        JSON.stringify({ description })
      ]);
    } catch (error) {
      console.error('Failed to log backup operation:', error);
    }
  }

  async scheduleBackup(cronPattern) {
    // Implementation for scheduled backups
    // This would typically use a job scheduler like node-cron
    // For now, we'll just create a backup
    return await this.createBackup('Scheduled backup');
  }
}

module.exports = new DatabaseBackup();
