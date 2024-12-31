const dbPool = require('../config/dbPool');
const { DatabaseErrorHandler } = require('./dbErrorHandler');

class DatabaseMigration {
  static async initMigrationTable() {
    try {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          batch INT NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'init_migration_table'
      });
    }
  }

  static async getExecutedMigrations() {
    try {
      const result = await dbPool.query('SELECT * FROM migrations ORDER BY batch, id');
      return result;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_executed_migrations'
      });
    }
  }

  static async recordMigration(name, batch) {
    try {
      await dbPool.query(
        'INSERT INTO migrations (name, batch) VALUES (?, ?)',
        [name, batch]
      );
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'record_migration'
      });
    }
  }

  static async removeMigration(name) {
    try {
      await dbPool.query('DELETE FROM migrations WHERE name = ?', [name]);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'remove_migration'
      });
    }
  }

  static async getNextBatchNumber() {
    try {
      const [result] = await dbPool.query(
        'SELECT MAX(batch) as batch FROM migrations'
      );
      return (result.batch || 0) + 1;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_next_batch'
      });
    }
  }

  // Migration definitions
  static migrations = {
    // Initial schema
    'create_users_table': async () => {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'user') DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    },

    'create_patients_table': async () => {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS patients (
          id INT PRIMARY KEY AUTO_INCREMENT,
          patient_id VARCHAR(20) NOT NULL UNIQUE,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          date_of_birth DATE NOT NULL,
          gender ENUM('M', 'F', 'O') NOT NULL,
          contact_number VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          medical_history TEXT,
          current_medications TEXT,
          allergies TEXT,
          last_test_date TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    },

    'create_emergency_contacts_table': async () => {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS emergency_contacts (
          id INT PRIMARY KEY AUTO_INCREMENT,
          patient_id INT NOT NULL,
          name VARCHAR(100) NOT NULL,
          relationship VARCHAR(50) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          email VARCHAR(100),
          address TEXT,
          is_primary BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
      `);
    },

    'create_reference_ranges_table': async () => {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS reference_ranges (
          id INT PRIMARY KEY AUTO_INCREMENT,
          test_type ENUM('IgG', 'IgA', 'IgM', 'IgE') NOT NULL,
          min_age INT,
          max_age INT,
          gender ENUM('M', 'F', 'O'),
          min_value DECIMAL(10,2) NOT NULL,
          max_value DECIMAL(10,2) NOT NULL,
          unit VARCHAR(20) NOT NULL,
          description TEXT,
          source VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    },

    'create_test_results_table': async () => {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS test_results (
          id INT PRIMARY KEY AUTO_INCREMENT,
          patient_id INT NOT NULL,
          IgG DECIMAL(10,2),
          IgA DECIMAL(10,2),
          IgM DECIMAL(10,2),
          IgE DECIMAL(10,2),
          comments TEXT,
          status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
          created_by INT NOT NULL,
          reviewed_by INT,
          test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          review_date TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (reviewed_by) REFERENCES users(id)
        )
      `);
    },

    'add_audit_logs_table': async () => {
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT,
          action VARCHAR(50) NOT NULL,
          table_name VARCHAR(50) NOT NULL,
          record_id INT,
          old_values JSON,
          new_values JSON,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
    }
  };

  static async up() {
    await this.initMigrationTable();
    const executedMigrations = await this.getExecutedMigrations();
    const executedNames = executedMigrations.map(m => m.name);
    const pendingMigrations = Object.keys(this.migrations)
      .filter(name => !executedNames.includes(name));

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    const batch = await this.getNextBatchNumber();

    for (const migrationName of pendingMigrations) {
      try {
        await this.migrations[migrationName]();
        await this.recordMigration(migrationName, batch);
        console.log(`Executed migration: ${migrationName}`);
      } catch (error) {
        console.error(`Failed to execute migration ${migrationName}:`, error);
        throw error;
      }
    }
  }

  static async down(steps = 1) {
    const executedMigrations = await this.getExecutedMigrations();
    const migrationsToRollback = executedMigrations.slice(-steps);

    for (const migration of migrationsToRollback.reverse()) {
      try {
        if (this.migrations[`${migration.name}_down`]) {
          await this.migrations[`${migration.name}_down`]();
        } else {
          console.warn(`No down migration found for ${migration.name}`);
        }
        await this.removeMigration(migration.name);
        console.log(`Rolled back migration: ${migration.name}`);
      } catch (error) {
        console.error(`Failed to rollback migration ${migration.name}:`, error);
        throw error;
      }
    }
  }
}

module.exports = DatabaseMigration;
