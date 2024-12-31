const dbPool = require('../config/dbPool');
const { DatabaseErrorHandler } = require('./dbErrorHandler');
const dbBackup = require('./dbBackup');

class DatabaseReplication {
  constructor() {
    this.replicationConfig = {
      master: {
        host: process.env.MASTER_DB_HOST || '127.0.0.1',
        port: process.env.MASTER_DB_PORT || 3306,
        user: process.env.MASTER_DB_USER || 'root',
        password: process.env.MASTER_DB_PASSWORD || 'root',
        database: process.env.MASTER_DB_NAME || 'e_lab'
      },
      slaves: []
    };
    
    this.replicationStatus = {
      lastSync: null,
      syncInProgress: false,
      errors: []
    };
  }

  async setupReplication(masterConfig, slaveConfigs) {
    try {
      // Configure master
      this.replicationConfig.master = {
        ...this.replicationConfig.master,
        ...masterConfig
      };

      // Configure slaves
      this.replicationConfig.slaves = slaveConfigs.map(config => ({
        host: config.host || '127.0.0.1',
        port: config.port || 3306,
        user: config.user || 'root',
        password: config.password || 'root',
        database: config.database || 'e_lab',
        status: 'disconnected'
      }));

      // Initialize replication on master
      await this.initializeMaster();

      // Setup slaves
      for (const slave of this.replicationConfig.slaves) {
        await this.initializeSlave(slave);
      }

      return true;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'setup_replication'
      });
    }
  }

  async initializeMaster() {
    try {
      // Enable binary logging
      await dbPool.query(`
        SET GLOBAL binlog_format = 'ROW';
        SET GLOBAL log_bin = 'ON';
        SET GLOBAL sync_binlog = 1;
      `);

      // Create replication user
      const replicationUser = 'repl_user';
      const replicationPassword = this.generateSecurePassword();

      await dbPool.query(`
        CREATE USER IF NOT EXISTS '${replicationUser}'@'%' 
        IDENTIFIED BY '${replicationPassword}';
        
        GRANT REPLICATION SLAVE ON *.* TO '${replicationUser}'@'%';
        FLUSH PRIVILEGES;
      `);

      return {
        user: replicationUser,
        password: replicationPassword
      };
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'initialize_master'
      });
    }
  }

  async initializeSlave(slaveConfig) {
    try {
      // Get master status
      const [masterStatus] = await dbPool.query('SHOW MASTER STATUS');

      // Connect to slave
      const slavePool = await this.connectToSlave(slaveConfig);

      // Stop slave if running
      await slavePool.query('STOP SLAVE');

      // Configure slave
      await slavePool.query(`
        CHANGE MASTER TO
          MASTER_HOST='${this.replicationConfig.master.host}',
          MASTER_PORT=${this.replicationConfig.master.port},
          MASTER_USER='${this.replicationConfig.master.user}',
          MASTER_PASSWORD='${this.replicationConfig.master.password}',
          MASTER_LOG_FILE='${masterStatus.File}',
          MASTER_LOG_POS=${masterStatus.Position};
      `);

      // Start slave
      await slavePool.query('START SLAVE');

      // Update slave status
      slaveConfig.status = 'connected';
      
      return true;
    } catch (error) {
      slaveConfig.status = 'error';
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'initialize_slave'
      });
    }
  }

  async checkReplicationStatus() {
    try {
      const status = {
        master: await this.getMasterStatus(),
        slaves: []
      };

      for (const slave of this.replicationConfig.slaves) {
        const slaveStatus = await this.getSlaveStatus(slave);
        status.slaves.push({
          host: slave.host,
          status: slaveStatus
        });
      }

      return status;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'check_replication_status'
      });
    }
  }

  async getMasterStatus() {
    try {
      const [status] = await dbPool.query('SHOW MASTER STATUS');
      return status;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_master_status'
      });
    }
  }

  async getSlaveStatus(slaveConfig) {
    try {
      const slavePool = await this.connectToSlave(slaveConfig);
      const [status] = await slavePool.query('SHOW SLAVE STATUS');
      return status;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_slave_status'
      });
    }
  }

  async syncSlaves() {
    try {
      if (this.replicationStatus.syncInProgress) {
        throw new Error('Sync already in progress');
      }

      this.replicationStatus.syncInProgress = true;
      this.replicationStatus.lastSync = new Date();

      // Create backup of master
      const backup = await dbBackup.createBackup();

      // Sync each slave
      for (const slave of this.replicationConfig.slaves) {
        await this.syncSlave(slave, backup);
      }

      this.replicationStatus.syncInProgress = false;
      return true;
    } catch (error) {
      this.replicationStatus.syncInProgress = false;
      this.replicationStatus.errors.push({
        timestamp: new Date(),
        error: error.message
      });
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'sync_slaves'
      });
    }
  }

  async syncSlave(slaveConfig, backup) {
    try {
      const slavePool = await this.connectToSlave(slaveConfig);

      // Stop slave
      await slavePool.query('STOP SLAVE');

      // Restore backup
      await this.restoreBackupToSlave(slavePool, backup);

      // Start slave
      await slavePool.query('START SLAVE');

      return true;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'sync_slave'
      });
    }
  }

  async restoreBackupToSlave(slavePool, backup) {
    try {
      // Drop all tables
      const [tables] = await slavePool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
      `);

      for (const table of tables) {
        await slavePool.query(`DROP TABLE IF EXISTS ${table.table_name}`);
      }

      // Restore backup
      const statements = backup.split(';');
      for (const statement of statements) {
        if (statement.trim()) {
          await slavePool.query(statement);
        }
      }

      return true;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'restore_backup_to_slave'
      });
    }
  }

  async addSlave(slaveConfig) {
    try {
      this.replicationConfig.slaves.push({
        host: slaveConfig.host || '127.0.0.1',
        port: slaveConfig.port || 3306,
        user: slaveConfig.user || 'root',
        password: slaveConfig.password || 'root',
        database: slaveConfig.database || 'e_lab',
        status: 'disconnected'
      });

      await this.initializeSlave(this.replicationConfig.slaves[this.replicationConfig.slaves.length - 1]);
      return true;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'add_slave'
      });
    }
  }

  async removeSlave(host) {
    try {
      const slaveIndex = this.replicationConfig.slaves.findIndex(s => s.host === host);
      if (slaveIndex === -1) {
        throw new Error(`Slave ${host} not found`);
      }

      const slave = this.replicationConfig.slaves[slaveIndex];
      const slavePool = await this.connectToSlave(slave);

      // Stop replication
      await slavePool.query('STOP SLAVE');
      await slavePool.query('RESET SLAVE ALL');

      // Remove from config
      this.replicationConfig.slaves.splice(slaveIndex, 1);

      return true;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'remove_slave'
      });
    }
  }

  generateSecurePassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  async connectToSlave(slaveConfig) {
    try {
      return await dbPool.createPool({
        host: slaveConfig.host,
        port: slaveConfig.port,
        user: slaveConfig.user,
        password: slaveConfig.password,
        database: slaveConfig.database
      });
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'connect_to_slave'
      });
    }
  }

  getReplicationStatus() {
    return {
      ...this.replicationStatus,
      master: this.replicationConfig.master,
      slaves: this.replicationConfig.slaves.map(slave => ({
        host: slave.host,
        status: slave.status
      }))
    };
  }

  clearErrorLog() {
    this.replicationStatus.errors = [];
  }
}

// Create and export singleton instance
const dbReplication = new DatabaseReplication();
module.exports = dbReplication;
