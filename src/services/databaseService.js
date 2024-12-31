const { query } = require('../config/database');

class DatabaseService {
  // User operations
  static async createUser(username, password, role = 'user') {
    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    return await query(sql, [username, password, role]);
  }

  static async getUserByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const results = await query(sql, [username]);
    return results[0];
  }

  // Patient operations
  static async createPatient(patientData) {
    const {
      patient_id,
      first_name,
      last_name,
      date_of_birth,
      gender,
      contact_number,
      email,
      address,
      medical_history,
      current_medications,
      allergies
    } = patientData;

    const sql = `
      INSERT INTO patients (
        patient_id, first_name, last_name, date_of_birth, gender,
        contact_number, email, address, medical_history,
        current_medications, allergies
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      patient_id,
      first_name,
      last_name,
      date_of_birth,
      gender,
      contact_number,
      email,
      address,
      medical_history,
      current_medications,
      allergies
    ]);

    return result.insertId;
  }

  static async createEmergencyContact(patientId, contactData) {
    const sql = `
      INSERT INTO emergency_contacts (patient_id, name, relationship, phone)
      VALUES (?, ?, ?, ?)
    `;
    return await query(sql, [
      patientId,
      contactData.name,
      contactData.relationship,
      contactData.phone
    ]);
  }

  static async getPatientById(patientId) {
    const sql = `
      SELECT p.*, ec.name as emergency_contact_name,
             ec.relationship as emergency_contact_relationship,
             ec.phone as emergency_contact_phone
      FROM patients p
      LEFT JOIN emergency_contacts ec ON p.id = ec.patient_id
      WHERE p.patient_id = ?
    `;
    const results = await query(sql, [patientId]);
    return results[0];
  }

  // Test Results operations
  static async createTestResult(testData) {
    const sql = `
      INSERT INTO test_results (
        patient_id, IgG, IgA, IgM, IgE, comments, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    return await query(sql, [
      testData.patientId,
      testData.IgG,
      testData.IgA,
      testData.IgM,
      testData.IgE,
      testData.comments,
      testData.createdBy
    ]);
  }

  static async getTestResults(patientId) {
    const sql = `
      SELECT tr.*, p.first_name, p.last_name, p.date_of_birth
      FROM test_results tr
      JOIN patients p ON tr.patient_id = p.id
      WHERE p.id = ?
      ORDER BY tr.test_date DESC
    `;
    return await query(sql, [patientId]);
  }

  // Reference Range operations
  static async createReferenceRange(rangeData) {
    const sql = `
      INSERT INTO reference_ranges (
        test_type, min_age, max_age, min_value, max_value,
        unit, gender, description, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await query(sql, [
      rangeData.testType,
      rangeData.minAge,
      rangeData.maxAge,
      rangeData.minValue,
      rangeData.maxValue,
      rangeData.unit,
      rangeData.gender,
      rangeData.description,
      rangeData.source
    ]);
  }

  static async getReferenceRanges() {
    const sql = 'SELECT * FROM reference_ranges ORDER BY test_type, min_age';
    return await query(sql);
  }

  static async getReferenceRangeForPatient(testType, age, gender) {
    const sql = `
      SELECT *
      FROM reference_ranges
      WHERE test_type = ?
        AND ? BETWEEN min_age AND max_age
        AND (gender IS NULL OR gender = ?)
      LIMIT 1
    `;
    const results = await query(sql, [testType, age, gender]);
    return results[0];
  }
}

module.exports = DatabaseService;
