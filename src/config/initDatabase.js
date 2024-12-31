const { connect } = require('./database');

async function initializeDatabase() {
  const connection = await connect();

  try {
    // Create Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    console.log('Database schema initialized successfully');

    // Insert default admin user if not exists
    await connection.execute(`
      INSERT IGNORE INTO users (username, password, role)
      VALUES ('admin', 'admin123', 'admin')
    `);

    console.log('Default admin user created');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = initializeDatabase;
