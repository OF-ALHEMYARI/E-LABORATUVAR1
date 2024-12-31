const { query } = require('../config/database');

class DatabaseUtils {
  // Backup utilities
  static async backupDatabase() {
    const tables = ['users', 'patients', 'emergency_contacts', 'reference_ranges', 'test_results'];
    const backup = {};

    try {
      for (const table of tables) {
        const results = await query(`SELECT * FROM ${table}`);
        backup[table] = results;
      }

      return backup;
    } catch (error) {
      console.error('Backup error:', error);
      throw error;
    }
  }

  // Search utilities
  static async searchPatients(searchTerm) {
    const sql = `
      SELECT p.*, ec.name as emergency_contact_name
      FROM patients p
      LEFT JOIN emergency_contacts ec ON p.id = ec.patient_id
      WHERE p.patient_id LIKE ?
         OR p.first_name LIKE ?
         OR p.last_name LIKE ?
         OR p.contact_number LIKE ?
         OR p.email LIKE ?
      ORDER BY p.last_name, p.first_name
    `;
    const searchPattern = `%${searchTerm}%`;
    return await query(sql, Array(5).fill(searchPattern));
  }

  // Statistics utilities
  static async getTestStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total_tests,
        AVG(IgG) as avg_IgG,
        AVG(IgA) as avg_IgA,
        AVG(IgM) as avg_IgM,
        AVG(IgE) as avg_IgE,
        MIN(test_date) as first_test,
        MAX(test_date) as last_test
      FROM test_results
    `;
    const results = await query(sql);
    return results[0];
  }

  static async getAgeGroupStatistics() {
    const sql = `
      SELECT 
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 2 THEN '0-2'
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 5 THEN '2-5'
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 12 THEN '5-12'
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18 THEN '12-18'
          ELSE '18+'
        END as age_group,
        COUNT(*) as patient_count,
        AVG(CASE WHEN tr.IgG IS NOT NULL THEN tr.IgG END) as avg_IgG,
        AVG(CASE WHEN tr.IgA IS NOT NULL THEN tr.IgA END) as avg_IgA,
        AVG(CASE WHEN tr.IgM IS NOT NULL THEN tr.IgM END) as avg_IgM,
        AVG(CASE WHEN tr.IgE IS NOT NULL THEN tr.IgE END) as avg_IgE
      FROM patients p
      LEFT JOIN test_results tr ON p.id = tr.patient_id
      GROUP BY age_group
      ORDER BY age_group
    `;
    return await query(sql);
  }

  // Data validation utilities
  static async validatePatientData(patientData) {
    const errors = [];

    // Check for required fields
    const requiredFields = ['patient_id', 'first_name', 'last_name', 'date_of_birth'];
    for (const field of requiredFields) {
      if (!patientData[field]) {
        errors.push(`${field} is required`);
      }
    }

    // Check for duplicate patient ID
    if (patientData.patient_id) {
      const existingPatient = await this.getPatientById(patientData.patient_id);
      if (existingPatient) {
        errors.push('Patient ID already exists');
      }
    }

    // Validate email format
    if (patientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientData.email)) {
      errors.push('Invalid email format');
    }

    // Validate phone number format
    if (patientData.contact_number && !/^\+?[\d\s-]{10,}$/.test(patientData.contact_number)) {
      errors.push('Invalid phone number format');
    }

    return errors;
  }

  // Data cleanup utilities
  static async cleanupOldRecords(months = 60) {
    const sql = `
      DELETE FROM test_results 
      WHERE test_date < DATE_SUB(NOW(), INTERVAL ? MONTH)
    `;
    return await query(sql, [months]);
  }

  // Audit utilities
  static async addAuditLog(userId, action, details) {
    const sql = `
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, ?, ?)
    `;
    return await query(sql, [userId, action, JSON.stringify(details)]);
  }

  // Reference range utilities
  static async getReferenceRangesByAgeGroup(ageGroup) {
    const sql = `
      SELECT *
      FROM reference_ranges
      WHERE ? BETWEEN min_age AND max_age
      ORDER BY test_type
    `;
    return await query(sql, [ageGroup]);
  }

  // Test result analysis
  static async analyzeTestResults(patientId) {
    const sql = `
      SELECT 
        tr.*,
        LAG(IgG) OVER (ORDER BY test_date) as prev_IgG,
        LAG(IgA) OVER (ORDER BY test_date) as prev_IgA,
        LAG(IgM) OVER (ORDER BY test_date) as prev_IgM,
        LAG(IgE) OVER (ORDER BY test_date) as prev_IgE,
        LAG(test_date) OVER (ORDER BY test_date) as prev_test_date
      FROM test_results tr
      WHERE patient_id = ?
      ORDER BY test_date DESC
      LIMIT 10
    `;
    return await query(sql, [patientId]);
  }
}

module.exports = DatabaseUtils;
