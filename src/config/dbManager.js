const mysql = require('mysql2/promise');
const { initAuditTable } = require('./auditLogger');

class DatabaseManager {
  constructor() {
    this.config = {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'root',
      database: 'e_lab'
    };
    this.pool = null;
  }

  async initialize() {
    try {
      // Create connection pool
      this.pool = mysql.createPool({
        ...this.config,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Test connection
      await this.testConnection();

      // Initialize tables
      await this.initializeTables();

      console.log('Database initialized successfully');
      return true;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const connection = await this.pool.getConnection();
      console.log('Database connection successful');
      connection.release();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  }

  async initializeTables() {
    const connection = await this.pool.getConnection();
    try {
      // Start transaction
      await connection.beginTransaction();

      // Create Users table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
          email VARCHAR(100),
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Create Patients table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS patients (
          id INT PRIMARY KEY AUTO_INCREMENT,
          patient_id VARCHAR(50) UNIQUE NOT NULL,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          date_of_birth DATE NOT NULL,
          gender VARCHAR(20),
          contact_number VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          medical_history TEXT,
          current_medications TEXT,
          allergies TEXT,
          status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Create Emergency Contacts table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS emergency_contacts (
          id INT PRIMARY KEY AUTO_INCREMENT,
          patient_id INT NOT NULL,
          name VARCHAR(100) NOT NULL,
          relationship VARCHAR(50),
          phone VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          is_primary BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )
      `);

      // Create Reference Ranges table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS reference_ranges (
          id INT PRIMARY KEY AUTO_INCREMENT,
          test_type VARCHAR(50) NOT NULL,
          min_age INT NOT NULL,
          max_age INT NOT NULL,
          min_value DECIMAL(10,2) NOT NULL,
          max_value DECIMAL(10,2) NOT NULL,
          unit VARCHAR(20) NOT NULL,
          gender VARCHAR(20),
          description TEXT,
          source VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_range (test_type, min_age, max_age, gender)
        )
      `);

      // Create Test Results table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS test_results (
          id INT PRIMARY KEY AUTO_INCREMENT,
          patient_id INT NOT NULL,
          test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          IgG DECIMAL(10,2),
          IgA DECIMAL(10,2),
          IgM DECIMAL(10,2),
          IgE DECIMAL(10,2),
          comments TEXT,
          status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
          created_by INT,
          reviewed_by INT,
          review_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (reviewed_by) REFERENCES users(id)
        )
      `);

      // Initialize audit logging
      await initAuditTable();

      // Create default admin user if not exists
      await connection.execute(`
        INSERT IGNORE INTO users (username, password, role, email)
        VALUES ('admin', 'admin123', 'admin', 'admin@elab.com')
      `);

      // Commit transaction
      await connection.commit();
      console.log('Database tables initialized successfully');
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      console.error('Error initializing database tables:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async query(sql, params = []) {
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async getConnection() {
    return await this.pool.getConnection();
  }

  async end() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection pool closed');
    }
  }
}

// Create and export singleton instance
const dbManager = new DatabaseManager();
module.exports = dbManager;
