const dbPool = require('../config/dbPool');
const { DatabaseErrorHandler } = require('./dbErrorHandler');

class TransactionManager {
  static async executeTransaction(operations) {
    const connection = await dbPool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const operation of operations) {
        const result = await operation(connection);
        results.push(result);
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'transaction_execution'
      });
    } finally {
      connection.release();
    }
  }

  // Patient registration transaction
  static async registerPatient(patientData, emergencyContact) {
    return await this.executeTransaction([
      async (connection) => {
        // Insert patient
        const [patientResult] = await connection.execute(`
          INSERT INTO patients (
            patient_id, first_name, last_name, date_of_birth,
            gender, contact_number, email, address,
            medical_history, current_medications, allergies
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          patientData.patient_id,
          patientData.first_name,
          patientData.last_name,
          patientData.date_of_birth,
          patientData.gender,
          patientData.contact_number,
          patientData.email,
          patientData.address,
          patientData.medical_history,
          patientData.current_medications,
          patientData.allergies
        ]);

        // Insert emergency contact if provided
        if (emergencyContact) {
          await connection.execute(`
            INSERT INTO emergency_contacts (
              patient_id, name, relationship, phone,
              email, address, is_primary
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            patientResult.insertId,
            emergencyContact.name,
            emergencyContact.relationship,
            emergencyContact.phone,
            emergencyContact.email,
            emergencyContact.address,
            emergencyContact.is_primary || true
          ]);
        }

        return patientResult.insertId;
      }
    ]);
  }

  // Test result submission transaction
  static async submitTestResult(testData) {
    return await this.executeTransaction([
      async (connection) => {
        // Insert test result
        const [resultInsert] = await connection.execute(`
          INSERT INTO test_results (
            patient_id, IgG, IgA, IgM, IgE,
            comments, created_by, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          testData.patient_id,
          testData.IgG,
          testData.IgA,
          testData.IgM,
          testData.IgE,
          testData.comments,
          testData.created_by,
          'pending'
        ]);

        // Update patient's last test date
        await connection.execute(`
          UPDATE patients 
          SET last_test_date = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [testData.patient_id]);

        return resultInsert.insertId;
      }
    ]);
  }

  // Reference range update transaction
  static async updateReferenceRanges(ranges) {
    return await this.executeTransaction([
      async (connection) => {
        // Deactivate old ranges
        await connection.execute(`
          UPDATE reference_ranges 
          SET is_active = FALSE 
          WHERE test_type = ? AND gender = ?
        `, [ranges[0].test_type, ranges[0].gender]);

        // Insert new ranges
        for (const range of ranges) {
          await connection.execute(`
            INSERT INTO reference_ranges (
              test_type, min_age, max_age,
              min_value, max_value, unit,
              gender, description, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            range.test_type,
            range.min_age,
            range.max_age,
            range.min_value,
            range.max_value,
            range.unit,
            range.gender,
            range.description,
            range.source
          ]);
        }
      }
    ]);
  }

  // Patient update transaction
  static async updatePatient(patientId, patientData, emergencyContact) {
    return await this.executeTransaction([
      async (connection) => {
        // Update patient information
        await connection.execute(`
          UPDATE patients 
          SET 
            first_name = ?,
            last_name = ?,
            date_of_birth = ?,
            gender = ?,
            contact_number = ?,
            email = ?,
            address = ?,
            medical_history = ?,
            current_medications = ?,
            allergies = ?
          WHERE id = ?
        `, [
          patientData.first_name,
          patientData.last_name,
          patientData.date_of_birth,
          patientData.gender,
          patientData.contact_number,
          patientData.email,
          patientData.address,
          patientData.medical_history,
          patientData.current_medications,
          patientData.allergies,
          patientId
        ]);

        // Update or insert emergency contact
        if (emergencyContact) {
          await connection.execute(`
            INSERT INTO emergency_contacts (
              patient_id, name, relationship, phone,
              email, address, is_primary
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              relationship = VALUES(relationship),
              phone = VALUES(phone),
              email = VALUES(email),
              address = VALUES(address),
              is_primary = VALUES(is_primary)
          `, [
            patientId,
            emergencyContact.name,
            emergencyContact.relationship,
            emergencyContact.phone,
            emergencyContact.email,
            emergencyContact.address,
            emergencyContact.is_primary || true
          ]);
        }
      }
    ]);
  }
}

module.exports = TransactionManager;
